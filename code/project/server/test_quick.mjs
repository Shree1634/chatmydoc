import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
config()

console.log('GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY)
console.log('Key prefix:', process.env.GEMINI_API_KEY?.substring(0, 8))

const models = [
  'gemma-3-4b-it',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemma-3-12b-it'
]

for (const m of models) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: m })
    const r = await model.generateContent('Say OK')
    console.log(`✅ ${m}: ${r.response.text().trim()}`)
    break
  } catch(e) {
    // Print FULL error message
    console.log(`❌ ${m}: ${e.message}`)
  }
}
