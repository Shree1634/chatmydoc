import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Provide standard fonts for pdfjs
const STANDARD_FONT_DATA_URL = 'node_modules/pdfjs-dist/standard_fonts/';

async function test() {
  try {
    const pdfBytes = fs.readFileSync('C:/Users/shree/Downloads/sample.pdf'); // I don't have a sample, let me fetch from DB
  } catch(e) {
    console.error(e);
  }
}
test();
