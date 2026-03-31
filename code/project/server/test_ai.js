import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateDummyPDF() {
  const filepath = 'test.pdf';
  // If we don't have pdfkit, we just make a dummy file pretending to be PDF
  // But actually the server validator requires a real one if using strict validation.
  // We'll write a minimal valid PDF format:
  const minimalPDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 53 >>
stream
BT /F1 24 Tf 100 700 Td (This is a minimal valid PDF for upload testing) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000254 00000 n 
0000000356 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
444
%%EOF`;

  fs.writeFileSync(filepath, minimalPDF);
  return filepath;
}

async function run() {
  const EMAIL = `test_${Date.now()}@example.com`;
  const USERNAME = `TestUser_${Date.now()}`;
  const PASSWORD = `password123`;
  
  try {
    console.log('[1] Registering test user...');
    await axios.post('http://localhost:5001/api/auth/register', {
      username: USERNAME,
      email: EMAIL,
      password: PASSWORD
    });

    console.log('[2] Logging in...');
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: EMAIL,
      password: PASSWORD
    });
    const token = loginRes.data.token;
    console.log('Token received:', token.substring(0, 10) + '...');

    const pdfPath = await generateDummyPDF();

    console.log(`[3] Testing PDF upload... (Uploading ${pdfPath})`);
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    form.append('title', 'Test Document');

    const uploadRes = await axios.post('http://localhost:5001/api/pdfs/upload', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });

    const pdfId = uploadRes.data.data._id;
    console.log('Upload response success! PDF ID:', pdfId);

    // MOCK: inject textContent directly to MongoDB to test AI pipeline
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect('mongodb+srv://lastphantom:Phantom30606gn@white.6gvhy90.mongodb.net/docugenie?retryWrites=true&w=majority&appName=white');
    await mongoose.connection.db.collection('pdfs').updateOne(
        { _id: new mongoose.Types.ObjectId(pdfId) },
        { $set: { textContent: "This document is about AI, Node.js, and Software Engineering. It outlines the core principles of artificial intelligence and its integration into modern web applications using Express and MongoDB. The primary author is John Doe." } }
    );
    await mongoose.disconnect();

    console.log('\n[4] Testing Summarize API...');
    try {
      const summaryRes = await axios.post(`http://localhost:5001/api/pdfs/${pdfId}/summarize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('-> Summary output length:', summaryRes.data.data.summary.length);
    } catch(err) {
      console.log('-> Summary failed:', err.response?.data || err.message);
    }

    console.log('\n[5] Testing Ask API...');
    try {
      const askRes = await axios.post(`http://localhost:5001/api/pdfs/${pdfId}/ask`, { question: 'What is this document about?' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('-> Ask output:', askRes.data.data.response);
    } catch(err) {
      console.log('-> Ask failed:', err.response?.data || err.message);
    }

  } catch (err) {
    console.log('Fatal script error:', err.response?.data || err.message);
  }
}

run();
