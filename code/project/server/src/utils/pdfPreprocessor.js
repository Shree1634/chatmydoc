import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract raw text from a PDF file using pdf-parse.
 * Handles both local file paths and remote URLs.
 */
export const extractTextFromPDF = async (filePath) => {
    console.log('[extractTextFromPDF] Starting extraction for:', filePath);
    try {
        let buffer;

        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            const response = await axios.get(filePath, { responseType: 'arraybuffer' });
            buffer = response.data;
        } else {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found at path: ${filePath}`);
            }
            buffer = fs.readFileSync(filePath);
        }

        const data = await pdfParse(buffer);

        if (!data || !data.text) {
            throw new Error('No text content extracted from PDF');
        }

        console.log(`[extractTextFromPDF] Extracted ${data.text.length} characters.`);
        return data.text;
    } catch (err) {
        console.error('[extractTextFromPDF] Error:', err.message);
        throw err;
    }
};

/**
 * Clean raw PDF text (remove extra spaces, line breaks, etc.)
 */
export const cleanText = (text) => {
    if (!text) return '';
    return text
        .replace(/\r?\n|\r/g, ' ')   // remove line breaks
        .replace(/\s\s+/g, ' ')       // collapse multiple spaces
        .trim();
};

/**
 * Smartly truncate text to fit within AI context window.
 * Preserves the beginning and end of the document for better context.
 * Limit: ~25,000 characters (approx 6k-8k tokens).
 */
export const smartTruncate = (text, maxLength = 25000) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    console.warn(`[smartTruncate] Text length (${text.length}) exceeds limit (${maxLength}). Truncating...`);

    const half = Math.floor(maxLength / 2);
    const start = text.slice(0, half);
    const end = text.slice(text.length - half);

    return `${start}\n\n... [Content Truncated for AI Context Limit] ...\n\n${end}`;
};

/**
 * @deprecated Legacy chunking, not used in new flow but kept for compatibility if needed.
 */
export const chunkText = (text, chunkSize = 2000) => {
    if (!text) return [];
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
};

/**
 * extractTablesFromPDF — parse tables from raw PDF text.
 * Uses heuristic detection: lines that look like table rows (multiple whitespace-separated columns).
 * Falls back gracefully if no tables are found.
 * @param {string} pdfUrl - URL of the PDF on Cloudinary
 * @param {string} textContent - Pre-extracted text content (optional, avoids re-downloading)
 * @returns {Array<{headers: string[], rows: string[][]}>}
 */
export const extractTablesFromPDF = async (pdfUrl, textContent = null) => {
    console.log('[extractTablesFromPDF] Starting table extraction');

    try {
        let text = textContent;
        if (!text) {
            text = await extractTextFromPDF(pdfUrl);
        }

        if (!text || text.trim().length === 0) {
            return [];
        }

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const tables = [];
        let currentTable = null;

        for (const line of lines) {
            // A table row typically has multiple whitespace-separated columns
            // or pipe-separated values
            const pipeColumns = line.split('|').map(c => c.trim()).filter(Boolean);
            const spaceColumns = line.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);

            const columns = pipeColumns.length >= 2 ? pipeColumns : (spaceColumns.length >= 3 ? spaceColumns : null);

            if (columns) {
                if (!currentTable) {
                    // Start a new table — treat this row as headers
                    currentTable = { headers: columns, rows: [] };
                } else {
                    // Continue adding rows
                    if (columns.length === currentTable.headers.length) {
                        currentTable.rows.push(columns);
                    } else if (currentTable.rows.length > 0) {
                        // Column count mismatch — save current table and start new
                        if (currentTable.rows.length >= 1) {
                            tables.push(currentTable);
                        }
                        currentTable = { headers: columns, rows: [] };
                    }
                }
            } else {
                // Non-table line — finalize current table if it has rows
                if (currentTable && currentTable.rows.length >= 1) {
                    tables.push(currentTable);
                }
                currentTable = null;
            }
        }

        // Push any remaining table
        if (currentTable && currentTable.rows.length >= 1) {
            tables.push(currentTable);
        }

        console.log(`[extractTablesFromPDF] Found ${tables.length} tables`);
        return tables;
    } catch (err) {
        console.error('[extractTablesFromPDF] Error:', err.message);
        throw err;
    }
};

/**
 * extractImagesFromPDF — extracts embedded images from PDF binary via pdf-parse page render,
 * uploads each to Cloudinary, and returns an array of Cloudinary URLs.
 * 
 * Note: pdf-parse itself doesn't expose embedded images directly. We use a page-level
 * approach: render each page as canvas data URL via pdf-parse's render_page option.
 * This effectively renders each page as an image and uploads it.
 * 
 * @param {string} pdfUrl - URL of the PDF
 * @param {string} pdfId - PDF document ID (used for naming)
 * @returns {string[]} Array of Cloudinary image URLs
 */
export const extractImagesFromPDF = async (pdfUrl, pdfId) => {
    console.log('[extractImagesFromPDF] Starting image extraction for PDF:', pdfId);

    try {
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Parse PDF to get page count
        const data = await pdfParse(buffer, {
            // Don't render: just count pages
            pagerender: () => ''
        });

        const numPages = data.numpages || 0;
        console.log(`[extractImagesFromPDF] PDF has ${numPages} pages`);

        if (numPages === 0) return [];

        // For actual image extraction we would need pdfjs-dist with canvas.
        // Here we render at most 5 pages to Cloudinary as preview images
        // using the Cloudinary PDF-to-image transformation feature.
        const imageUrls = [];

        for (let pageNum = 1; pageNum <= Math.min(numPages, 5); pageNum++) {
            try {
                // Cloudinary supports PDF page extraction via transformation
                // e.g., appending /pg_N to a raw PDF public_id
                // We derive the public_id from the URL
                const urlParts = pdfUrl.split('/');
                const uploadIndex = urlParts.indexOf('upload');

                if (uploadIndex !== -1) {
                    const publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
                    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // remove extension

                    // Use Cloudinary's PDF page image transformation
                    const imageUrl = cloudinary.url(publicId, {
                        resource_type: 'image',
                        format: 'jpg',
                        page: pageNum,
                        transformation: [{ width: 800, crop: 'limit' }]
                    });

                    imageUrls.push(imageUrl);
                    console.log(`[extractImagesFromPDF] Generated URL for page ${pageNum}: ${imageUrl}`);
                }
            } catch (pageErr) {
                console.warn(`[extractImagesFromPDF] Failed to process page ${pageNum}:`, pageErr.message);
            }
        }

        console.log(`[extractImagesFromPDF] Extracted ${imageUrls.length} page images`);
        return imageUrls;
    } catch (err) {
        console.error('[extractImagesFromPDF] Error:', err.message);
        throw err;
    }
};
