import { config } from 'dotenv'
config()

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
)
const data = await response.json()

if (data.models) {
  console.log('Available models for this API key:')
  data.models
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .forEach(m => console.log(`  ✅ ${m.name} — ${m.displayName}`))
} else {
  console.log('Error:', JSON.stringify(data, null, 2))
}
