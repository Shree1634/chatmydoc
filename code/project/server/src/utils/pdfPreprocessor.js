import fs from "fs";
import { createRequire } from "module";
import axios from "axios";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extract raw text from a PDF file using pdf-parse.
 * Handles both local file paths and remote URLs.
 */
export const extractTextFromPDF = async (filePath) => {
  console.log("[extractTextFromPDF] Starting extraction for:", filePath);
  try {
    let buffer;

    // Check if filePath is a URL
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
      throw new Error("No text content extracted from PDF");
    }

    console.log(`[extractTextFromPDF] Extracted ${data.text.length} characters.`);
    return data.text;
  } catch (err) {
    console.error("[extractTextFromPDF] Error:", err.message);
    throw err;
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
 * Smartly truncate text to fit within AI context window.
 * Preserves the beginning and end of the document for better context.
 * Limit: ~25,000 characters (approx 6k-8k tokens).
 */
export const smartTruncate = (text, maxLength = 25000) => {
  if (!text) return "";
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
