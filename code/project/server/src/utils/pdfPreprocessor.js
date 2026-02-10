import fs from "fs";
import { createRequire } from "module";
import axios from "axios";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extract raw text from a PDF file using pdf-parse.
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    let buffer;

    // Check if filePath is a URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      const response = await axios.get(filePath, { responseType: 'arraybuffer' });
      buffer = response.data;
    } else {
      buffer = fs.readFileSync(filePath);
    }

    const data = await pdfParse(buffer);

    if (!data || !data.text) {
      throw new Error("No text content extracted");
    }

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
