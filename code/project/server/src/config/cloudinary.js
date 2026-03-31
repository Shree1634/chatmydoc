import dotenv from 'dotenv'
dotenv.config()

import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

// Validate credentials on startup
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

console.log('[Cloudinary] Credentials check:', {
  cloud_name: CLOUD_NAME ? '✅ set' : '❌ MISSING',
  api_key: API_KEY ? '✅ set' : '❌ MISSING',
  api_secret: API_SECRET ? '✅ set' : '❌ MISSING'
})

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'chatmydoc/pdfs',
    resource_type: 'raw',
    format: 'pdf',
    public_id: `pdf_${Date.now()}_${file.originalname.replace(/\\s/g, '_')}`
  })
})

export const uploadPDF = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('[Multer] File received:', file.originalname, file.mimetype)
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error(`Only PDF files allowed. Got: ${file.mimetype}`), false)
    }
  }
}).single('pdf')

export const uploadPDFToCloudinary = cloudinary
export { cloudinary }