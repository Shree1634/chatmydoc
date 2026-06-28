import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
config()

console.log('API Key:', process.env.GEMINI_API_KEY?.substring(0,15) + '...')
console.log('Key length:', process.env.GEMINI_API_KEY?.length)
console.log('')

// First check which models are available for this key
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
)
const data = await res.json()

if (data.error) {
  console.log('KEY ERROR:', data.error.code, data.error.message)
  process.exit(1)
}

const availableModels = data.models
  ?.filter(m => m.supportedGenerationMethods
    ?.includes('generateContent'))
  ?.map(m => m.name.replace('models/', ''))

console.log('Available models:', availableModels)
console.log('')

// Test first 5 available models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
let workingModel = null

for (const modelName of (availableModels || []).slice(0, 5)) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent('Say OK')
    const text = result.response.text().trim()
    console.log(`✅ WORKS: ${modelName} → "${text}"`)
    if (!workingModel) workingModel = modelName
    break
  } catch (err) {
    console.log(`❌ FAIL: ${modelName} → ${err.message.substring(0,100)}`)
  }
}

console.log('')
console.log('USE THIS MODEL:', workingModel || 'NONE - GET NEW KEY')
