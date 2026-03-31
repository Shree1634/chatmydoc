import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const models = [
  'gemini-2.5-flash',
  'gemini-flash-latest', 
  'gemma-3-4b-it',
  'gemini-2.5-pro'
]

console.log('Testing API key:', process.env.GEMINI_API_KEY?.substring(0,10) + '...')
console.log('---')

for (const modelName of models) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent('Say the word OK')
    const text = result.response.text().trim()
    console.log(`✅ WORKS: ${modelName} -> "${text}"`)
  } catch (err) {
    const msg = err.message.substring(0, 120)
    console.log(`❌ FAIL:  ${modelName} -> ${msg}`)
  }
}
