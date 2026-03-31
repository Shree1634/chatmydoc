import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Try every possible model alias
const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-001',
  'gemini-1.5-flash',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-8b-001',
  'gemini-1.5-pro',
  'gemini-1.5-pro-001',
  'gemini-1.5-pro-002',
  'gemini-1.0-pro',
  'gemini-1.0-pro-001',
  'gemma-3-4b-it',
  'gemma-3-12b-it',
  'gemma-3-27b-it',
]

let workingModel = null

async function runTest() {
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent('Reply with just the word OK')
      const text = result.response.text().trim()
      console.log(`✅ WORKS: ${modelName} -> "${text}"`)
      if (!workingModel) workingModel = modelName
    } catch (err) {
      const code = err.message.match(/\[(\d{3})/)?.[1] || 'ERR'
      console.log(`❌ ${code}: ${modelName}`)
    }
  }

  console.log('\n=============================')
  console.log('WORKING MODEL:', workingModel || 'NONE FOUND')
  console.log('=============================')
}

runTest();
