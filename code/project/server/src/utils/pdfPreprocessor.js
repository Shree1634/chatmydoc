import fs from "fs";
import { PDFDocument } from "pdf-lib";

/**
 * Extract raw text from a PDF file.
 * Note: pdf-lib doesn't provide built-in text extraction, so this
 * simply loads pages and marks them. For full text extraction, 
 * you'd integrate OCR (like Tesseract).
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(buffer);

    let text = "";
    const pages = pdfDoc.getPages();

    // pdf-lib itself cannot extract text content directly
    // but we at least return page placeholders for now
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      text += `\n--- Page ${index + 1} (${width}x${height}) ---\n`;
    });

    return text || "No extractable text found (pdf-lib limitation)";
  } catch (err) {
    console.error("[extractTextFromPDF] Error:", err.message);
    return "";
  }
};

/**
 * Clean raw PDF text (remove extra spaces, line breaks, etc.)
 */
export const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r?\n|\r/g, " ")   // remove line breaks
    .replace(/\s\s+/g, " ")      // collapse multiple spaces
    .trim();
};

/**
 * Break large text into smaller chunks for AI (e.g., 2000 characters each).
 */
export const chunkText = (text, chunkSize = 2000) => {
  if (!text) return [];
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
};
