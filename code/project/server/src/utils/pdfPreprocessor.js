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

import { pdf } from 'pdf-to-img';

/**
 * extractImagesFromPDF — generates Cloudinary page image URLs for each PDF page.
 *
 * Downloads the raw PDF bytes from Cloudinary, renders up to 5 pages locally using
 * pdf-to-img, and uploads the resulting PNG buffers to Cloudinary as actual image resources.
 *
 * @param {string} pdfUrl - Cloudinary raw URL of the PDF
 * @param {string} pdfId  - PDF document ID (for logging)
 * @returns {string[]} Array of image URLs (one per page, up to 5)
 */
export const extractImagesFromPDF = async (pdfUrl, pdfId) => {
  try {
    console.log('[extractImages] Downloading PDF for rendering...')
    const response = await axios.get(pdfUrl, { 
      responseType: 'arraybuffer' 
    })
    const pdfBuffer = Buffer.from(response.data)

    console.log('[extractImages] Rendering pages locally...')
    const document = await pdf(pdfBuffer, { scale: 2 })

    const imageUrls = []
    let pageNum = 0

    for await (const pngBuffer of document) {
      pageNum++
      if (pageNum > 5) break

      const base64 = Buffer.from(pngBuffer).toString('base64')

      const uploadResult = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64}`,
        {
          resource_type: 'image',
          folder: 'chatmydoc/page-renders',
          public_id: `render_${pdfId}_pg${pageNum}`,
          overwrite: true
        }
      )
      imageUrls.push(uploadResult.secure_url)
      console.log(`[extractImages] Page ${pageNum} uploaded: ${uploadResult.secure_url}`)
    }

    console.log(`[extractImages] Complete — ${imageUrls.length} page(s) rendered`)
    return imageUrls
  } catch (err) {
    console.error('[extractImages] Render failed:', err.message)
    return []
  }
};
