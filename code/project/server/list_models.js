import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log('ApiKey available:', !!key);
    // Since ListModels is typically done through REST conceptually or manually:
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    import('fs').then(fs => fs.writeFileSync('gemini_models.txt', JSON.stringify(data.models.map(m => m.name), null, 2)));
    console.log('Saved models list to gemini_models.txt');
  } catch(e) {
    console.error('ListModels error:', e.message);
  }
}
listModels();
