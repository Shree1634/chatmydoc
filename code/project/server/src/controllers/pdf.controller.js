import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PDF from '../models/pdf.model.js';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import { extractTextFromPDF, cleanText, smartTruncate, extractTablesFromPDF, renderPDFPages } from '../utils/pdfPreprocessor.js';

// ─── Gemini multi-model fallback ───────────────────────────────────────────
// gemini-2.5-flash confirmed working. Others are fallbacks in priority order.
const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

const callGeminiWithRetry = async (prompt, retries = 3) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS_TO_TRY) {
    for (let i = 0; i < retries; i++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`[Gemini] Success with model: ${modelName}`);
        return text;
      } catch (err) {
        const msg = err.message;

        // Skip this model entirely on 404 / 403 / not found
        if (msg.includes('404') || msg.includes('403') || msg.includes('not found')) {
          console.log(`[Gemini] Model ${modelName} not available, trying next`);
          break;
        }

        // Retry on rate-limit or server error
        if ((msg.includes('429') || msg.includes('503') || msg.includes('500')) && i < retries - 1) {
          const delay = (i + 1) * 3000;
          console.log(`[Gemini] ${modelName} rate-limited, retry in ${delay / 1000}s (attempt ${i + 1}/${retries})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        // Any other error — log and try next model
        console.log(`[Gemini] ${modelName} failed: ${msg.substring(0, 80)}`);
        break;
      }
    }
  }

  throw new Error('All AI models unavailable. Please check your Gemini API key.');
};

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
        const prompt = `Analyze the following document and produce a structured outline of its key concepts and flow.

FORMAT RULES (follow exactly):
- Use numbered steps for main sections: "1. Section Title"
- Use bullet points for sub-points under each step: "- detail here"
- Use **bold** for important terms inside bullet points
- Each numbered step must have at least one bullet point
- Do NOT write long paragraphs — keep each bullet to one sentence
- Do NOT add any preamble or conclusion — output the outline only

DOCUMENT:
${context}`;

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

        if (!pdf.textContent) {
            return res.status(200).json({ success: true, data: { tables: [] } });
        }

        // Always use AI extraction — the local heuristic (whitespace/pipe detection)
        // requires raw newline-separated text, but cleanText() collapses all line breaks
        // so it never detects tables reliably.
        let tables = [];
        try {
            const context = smartTruncate(cleanText(pdf.textContent));
            const prompt = `Analyze the following document text and 
   identify any tabular or list-like structured data 
   (schedules, comparisons, itemized lists, data tables, etc).

   CRITICAL RULES:
   - Extract EVERY individual item/row exactly as it appears 
     in the source text. Do NOT group multiple items into 
     broader categories (e.g. if the text lists "7:00 AM - 
     Wake up", "7:15 AM - Brush teeth", "7:30 AM - Breakfast" 
     as separate items, output THREE separate rows, not one 
     row labeled "Morning").
   - Preserve exact wording, numbers, and times from the source.
   - Each distinct fact, time, or item in the source must 
     become its own row. Do not summarize, abbreviate, or 
     merge rows for brevity.
   - Only group rows under a shared header if the source 
     itself groups them (e.g. table sections), not based 
     on your own judgment of similarity.

   Return a JSON array where each element is an object with:
   - "headers": array of column header strings
   - "rows": 2D array of cell values (one row per individual 
     item found in the source — be exhaustive, not concise)
   If no tabular structure exists, return an empty array [].

   IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.

   Text:
   ${context}`;

            const rawResponse = await callGeminiWithRetry(prompt);
            const responseText = rawResponse.trim();

            // Strip possible markdown code fences
            const jsonStr = responseText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();

            const parsed = JSON.parse(jsonStr);
            tables = Array.isArray(parsed) ? parsed : [];

            // Sanitise: ensure every table has headers (string[]) and rows (string[][])
            tables = tables
                .filter(t => t && Array.isArray(t.headers) && Array.isArray(t.rows))
                .map(t => ({
                    headers: t.headers.map(h => String(h ?? '')),
                    rows: t.rows.map(r =>
                        Array.isArray(r) ? r.map(c => String(c ?? '')) : []
                    ),
                }))
                .filter(t => t.headers.length > 0);

        } catch (aiErr) {
            console.error('[extractTables] AI extraction failed:', aiErr.message);
            tables = [];
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

// ─── Generate Annotations ───────────────────────────────────────────────────────────
export const generateAnnotations = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' })
    if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' })

    const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id }).select('+textContent')
    if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' })
    if (!pdf.textContent) return res.status(400).json({ success: false, message: 'No text in PDF' })

    if (!req.query.force && pdf.annotationSentences && pdf.annotationSentences.length > 0) {
      return res.status(200).json({ success: true, data: { sentences: pdf.annotationSentences, source: 'cache' } })
    }

    const context = smartTruncate(cleanText(pdf.textContent))
    const prompt = `You are analyzing a document to create a study-guide 
style highlight set. From the following text, identify the 
MOST IMPORTANT complete sentences and definitions a student or 
reader should focus on.

STRICT REQUIREMENTS:
- Each item must be a COMPLETE sentence or definition copied 
  EXACTLY verbatim from the source text — minimum 8 words long. 
  Never return a bare word, function name, label, or sentence 
  fragment shorter than 8 words.
- Prioritize, in this order: (1) explicit definitions or 
  explanations of what something IS or DOES, (2) key facts, 
  numbers, dates, or requirements, (3) conclusions or summary 
  statements, (4) important warnings or critical steps.
- Skip purely structural text like headings, bullet labels, 
  code identifiers, file names, or table headers UNLESS they 
  are part of a full explanatory sentence.
- Return between 20 and 40 items if the document has enough 
  substantive content — be generous, this is meant to help 
  someone quickly review the whole document, not just a 
  handful of highlights.
- If the document is short, return fewer items, but still 
  prioritize coverage across the whole document rather than 
  clustering all picks in one section.

Return ONLY a JSON array of exact verbatim strings from the 
source text. No markdown, no explanation, no numbering.

Text:
${context}`

    const rawResponse = await callGeminiWithRetry(prompt)
    let sentences = []
    try {
      const jsonStr = rawResponse.trim()
        .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '')
      sentences = JSON.parse(jsonStr)
      if (!Array.isArray(sentences)) sentences = []
    } catch {
      sentences = []
    }

    pdf.annotationSentences = sentences
    await pdf.save()

    res.status(200).json({ success: true, data: { sentences } })
  } catch (error) {
    console.error('[generateAnnotations] Error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to generate annotations', error: error.message })
  }
}

// --- Get Page Images --------------------------------------------------------
export const getPageImages = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: 'PDF ID required' })
    if (!req.user?._id) return res.status(401).json({ success: false, message: 'Auth required' })

    const pdf = await PDF.findOne({ _id: req.params.id, user: req.user._id })
    if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found' })

    if (!req.query.force && pdf.pageImages && pdf.pageImages.length > 0) {
      return res.status(200).json({ success: true, data: { pages: pdf.pageImages, source: 'cache' } })
    }

    const pageUrls = await renderPDFPages(pdf.url, pdf._id.toString())

    pdf.pageImages = pageUrls
    await pdf.save()

    res.status(200).json({ success: true, data: { pages: pageUrls } })
  } catch (error) {
    console.error('[getPageImages] Error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to render pages', error: error.message })
  }
}

