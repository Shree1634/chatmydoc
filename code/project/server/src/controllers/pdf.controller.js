import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PDF from '../models/pdf.model.js';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import { extractTextFromPDF, cleanText, smartTruncate, extractTablesFromPDF, extractImagesFromPDF } from '../utils/pdfPreprocessor.js';

// ─── Initialize Gemini AI (Lazy Load) ──────────────────────────────────
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing in .env');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });
};

const callGeminiWithRetry = async (prompt, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const model = getModel();
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      if (err.message.includes('503') && i < retries - 1) {
        console.log(`[Gemini] Retrying in ${(i+1)*2}s...`)
        await new Promise(r => setTimeout(r, (i+1) * 2000))
        continue
      }
      throw err
    }
  }
}

// ─── Upload PDF ───────────────────────────────────────────────────────────────
export const uploadPDF = async (req, res) => {
  console.log('[uploadPDF] Step 1: Request received');
  console.log('[uploadPDF] Step 2: req.file =', req.file);
  console.log('[uploadPDF] Step 3: req.user =', req.user?._id);
  console.log('[uploadPDF] Step 4: req.body =', req.body);
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      })
    }

    if (!req.user?._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      })
    }

    // Extract text from uploaded PDF
    let textContent = ''
    try {
      const rawText = await extractTextFromPDF(req.file.path)
      textContent = cleanText(rawText)
    } catch (extractErr) {
      console.warn('[uploadPDF] Text extraction failed:', extractErr.message)
      // Continue without text — don't fail the upload
    }

    const pdf = await PDF.create({
      user: req.user._id,          // ✅ Use authenticated user
      title: req.body.title || req.file.originalname,
      originalFilename: req.file.originalname,
      url: req.file.path,
      size: req.file.size || req.file.bytes || 0,
      textContent: textContent || ''
    })

    console.log('[uploadPDF] PDF created successfully:', pdf._id)
    return res.status(201).json({ success: true, data: pdf })
  } catch (error) {
    console.error('[uploadPDF] Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to upload PDF', 
      error: error.message 
    })
  }
}

// ─── Get all PDFs ─────────────────────────────────────────────────────────────
export const getAllPDFs = async (req, res) => {
    try {
        // Security fix: use req.user._id
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const pdfs = await PDF.find({ user: req.user._id }).select('-textContent').sort('-uploadedAt');
        res.status(200).json({ success: true, count: pdfs.length, data: pdfs });
    } catch (error) {
        console.error('[getAllPDFs] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve PDFs', error: error.message });
    }
};

// ─── Get PDF by ID ────────────────────────────────────────────────────────────
export const getPDFById = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });

        // Security fix: use req.user._id
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).populate('chats');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });

        res.status(200).json({ success: true, data: pdf });
    } catch (error) {
        console.error('[getPDFById] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve PDF', error: error.message });
    }
};

// ─── Get User PDFs with chat counts ──────────────────────────────────────────
export const getUserPDFs = async (req, res) => {
    try {
        // Security fix: use req.user._id
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const pdfs = await PDF.find({ user: req.user._id })
            .select('-textContent')
            .populate({ path: 'chats', select: 'question response createdAt' })
            .sort('-uploadedAt');

        res.status(200).json({
            success: true,
            count: pdfs.length,
            data: pdfs.map(pdf => ({ ...pdf.toObject(), chatCount: pdf.chats.length }))
        });
    } catch (error) {
        console.error('[getUserPDFs] Error:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching PDFs', error: error.message });
    }
};

// ─── Delete PDF ───────────────────────────────────────────────────────────────
export const deletePDF = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });

        await Chat.deleteMany({ pdfId: pdf._id });
        res.status(200).json({ success: true, message: 'PDF deleted successfully' });
    } catch (error) {
        console.error('[deletePDF] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete PDF', error: error.message });
    }
};

// ─── Summarize PDF ────────────────────────────────────────────────────────────
export const summarizePDF = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });
        if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No content to summarize' });

        const context = smartTruncate(cleanText(pdf.textContent));
        const prompt = `Please provide a concise and comprehensive summary of the following document:\n\n${context}`;

        const summary = await callGeminiWithRetry(prompt);

        pdf.summary = summary;
        await pdf.save();

        res.status(200).json({ success: true, data: { summary } });
    } catch (error) {
        console.error('[summarizePDF] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to summarize PDF', error: error.message });
    }
};

// ─── Ask Question on PDF ──────────────────────────────────────────────────────
export const askQuestion = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const { question } = req.body;
        if (!question) return res.status(400).json({ success: false, message: 'Question required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });
        if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No text in PDF' });

        const context = smartTruncate(cleanText(pdf.textContent));
        const prompt = `Based on the following document content, answer the question below. If the answer is not in the document, say so.\n\nDocument Context:\n${context}\n\nQuestion: ${question}`;

        const response = await callGeminiWithRetry(prompt);

        const chat = await Chat.create({ pdfId: pdf._id, userId: req.user._id, question, response });
        await pdf.addChat(chat._id);

        res.status(200).json({ success: true, data: chat });
    } catch (error) {
        console.error('[askQuestion] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to process question', error: error.message });
    }
};

// ─── Generate PDF Flow ────────────────────────────────────────────────────────
export const generatePDFFlow = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });
        if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No text in PDF' });

        const context = smartTruncate(cleanText(pdf.textContent));
        const prompt = `Generate a structured, step-by-step flow or outline of key concepts from the following text:\n\n${context}`;

        const flow = await callGeminiWithRetry(prompt);

        res.status(200).json({ success: true, data: { flow } });
    } catch (error) {
        console.error('[generatePDFFlow] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate flow', error: error.message });
    }
};

// ─── Extract Tables ───────────────────────────────────────────────────────────
export const extractTables = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent');
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });

        // Return cached tables unless force refresh requested
        if (!req.query.force && pdf.tables && pdf.tables.length > 0) {
            console.log('[extractTables] Returning cached tables:', pdf.tables.length);
            return res.status(200).json({ success: true, data: { tables: pdf.tables, source: 'cache' } });
        }

        // Extract tables from the PDF URL
        let tables = [];
        try {
            tables = await extractTablesFromPDF(pdf.url, pdf.textContent);
        } catch (extractErr) {
            console.error('[extractTables] Extraction error:', extractErr.message);
            // Fall back to AI-based table extraction if local extraction fails
            if (pdf.textContent) {
                const context = smartTruncate(cleanText(pdf.textContent));
                const prompt = `Extract all tables from the following text. Return a JSON array where each element is an object with:
- "headers": array of column header strings
- "rows": 2D array of cell values
If no tables exist, return an empty array [].

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.

Text:
${context}`;

                const rawResponse = await callGeminiWithRetry(prompt);
                const responseText = rawResponse.trim();

                try {
                    // Strip possible markdown code fences
                    const jsonStr = responseText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
                    tables = JSON.parse(jsonStr);
                    if (!Array.isArray(tables)) tables = [];
                } catch {
                    tables = [];
                }
            }
        }

        console.log('[extractTables] Tables found:', tables.length);
        if (tables.length > 0) {
            console.log('[extractTables] Sample:', JSON.stringify(tables[0]).substring(0, 150));
        }

        // Cache the result
        pdf.tables = tables;
        await pdf.save();

        res.status(200).json({ success: true, data: { tables } });
    } catch (error) {
        console.error('[extractTables] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to extract tables', error: error.message });
    }
};

// ─── Extract Images ───────────────────────────────────────────────────────────
export const extractImages = async (req, res) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' });
        if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' });

        const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id });
        if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' });

        // Return cached images unless force refresh requested
        if (!req.query.force && pdf.images && pdf.images.length > 0) {
            console.log('[extractImages] Returning cached images:', pdf.images.length);
            return res.status(200).json({ success: true, data: { images: pdf.images, source: 'cache' } });
        }

        // Extract images from the PDF URL
        let imageUrls = [];
        try {
            imageUrls = await extractImagesFromPDF(pdf.url, pdf._id.toString());
        } catch (extractErr) {
            console.error('[extractImages] Extraction error:', extractErr.message);
            // Return empty array if extraction fails — images are binary and can't fallback to AI
            imageUrls = [];
        }

        // Cache the result
        pdf.images = imageUrls;
        await pdf.save();

        res.status(200).json({ success: true, data: { images: imageUrls } });
    } catch (error) {
        console.error('[extractImages] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to extract images', error: error.message });
    }
};
