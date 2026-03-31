import express from 'express'
import { uploadPDF } from '../config/cloudinary.js'
import {
  uploadPDF as uploadPDFController,
  getAllPDFs,
  getPDFById,
  deletePDF,
  summarizePDF,
  generatePDFFlow,
  getUserPDFs,
  askQuestion,
  extractTables,
  extractImages
} from '../controllers/pdf.controller.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()
router.use(authMiddleware)

// Upload with multer error handling wrapper
router.post('/upload', (req, res, next) => {
  uploadPDF(req, res, (err) => {
    if (err) {
      console.error('[Upload Route] Multer error:', err)
      return res.status(400).json({ 
        success: false, 
        message: err.message || err.toString() || 'Unknown Multer Error',
        rawError: err
      })
    }
    next()
  })
}, uploadPDFController)

router.get('/my', getUserPDFs)
router.get('/', getAllPDFs)
router.get('/:id', getPDFById)
router.delete('/:id', deletePDF)
router.post('/:id/summarize', summarizePDF)
router.post('/:id/ask', askQuestion)
router.get('/:id/flow', generatePDFFlow)
router.get('/:id/tables', extractTables)
router.get('/:id/images', extractImages)

export default router