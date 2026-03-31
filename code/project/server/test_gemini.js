import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log('ApiKey available:', !!key);
    const genAI = new GoogleGenerativeAI(key);
    
    // Testing the model string specified by user:
    console.log('Testing gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    console.log('Result:', result.response.text());
  } catch(e) {
    import('fs').then(fs => fs.writeFileSync('gemini_err.txt', e.message));
  }
}
testGemini();
