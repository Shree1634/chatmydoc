import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash', 
  'gemini-1.0-pro',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-exp'
];

async function runTests() {
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say OK in one word');
      import('fs').then(fs => fs.appendFileSync('test_errs2.txt', `✅ ${modelName}: ${result.response.text().trim()}\n`));
      break;
    } catch (err) {
      import('fs').then(fs => fs.appendFileSync('test_errs2.txt', `❌ ${modelName}: ${err.message}\n`));
    }
  }
}

runTests();
