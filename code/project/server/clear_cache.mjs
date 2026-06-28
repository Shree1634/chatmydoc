import { config } from 'dotenv'
config()
import mongoose from 'mongoose'

await mongoose.connect(process.env.MONGODB_URL)
const result = await mongoose.connection.collection('pdfs').updateMany(
  {},
  { $set: { images: [], tables: [] } }
)
console.log(`Cleared images+tables cache on ${result.modifiedCount} PDF(s)`)
await mongoose.disconnect()
