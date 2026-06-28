import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
config();

async function run() {
  const context = readFileSync('temp_text.txt', 'utf8').substring(0, 25000);
  const prompt = `You are analyzing a document to create a study-guide 
style highlight set. From the following text, identify the 
MOST IMPORTANT complete sentences and definitions a student or 
reader should focus on.

STRICT REQUIREMENTS:
- Each item must be a COMPLETE sentence or definition copied 
  EXACTLY verbatim from the source text — minimum 8 words long. 
  Never return a bare word, function name, label, or sentence 
  fragment shorter than 8 words.
- Prioritize, in this order: (1) explicit definitions or 
  explanations of what something IS or DOES, (2) key facts, 
  numbers, dates, or requirements, (3) conclusions or summary 
  statements, (4) important warnings or critical steps.
- Skip purely structural text like headings, bullet labels, 
  code identifiers, file names, or table headers UNLESS they 
  are part of a full explanatory sentence.
- Return between 20 and 40 items if the document has enough 
  substantive content — be generous, this is meant to help 
  someone quickly review the whole document, not just a 
  handful of highlights.
- If the document is short, return fewer items, but still 
  prioritize coverage across the whole document rather than 
  clustering all picks in one section.

Return ONLY a JSON array of exact verbatim strings from the 
source text. No markdown, no explanation, no numbering.

Text:
${context}`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('--- OUTPUT ---');
  console.log(text);
}
run().catch(console.error);
