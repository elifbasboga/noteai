const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const router = express.Router();
const MODEL = 'gemini-2.5-flash';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(os.tmpdir(), 'noteai-uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${uniqueSuffix}-${safeName}`);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: MODEL });
}

function parseJSON(text) {
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

function getSupportedMimeType(file) {
  if (file.mimetype === 'application/pdf') {
    return 'application/pdf';
  }

  if (file.mimetype.startsWith('image/')) {
    return file.mimetype;
  }

  const error = new Error('Only PDF and image files are supported');
  error.statusCode = 400;
  throw error;
}

async function extractPdfText(buffer) {
  const result = await pdfParse(buffer);
  return (result.text || '').trim();
}

async function readUploadedFile(filePath) {
  return fs.promises.readFile(filePath);
}

async function extractWithGemini(buffer, mimeType) {
  const model = getGeminiModel();
  const filePart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };

  const result = await model.generateContent([
    mimeType === 'application/pdf'
      ? 'Extract all text from this document exactly as written. Preserve structure and formatting. Return only the extracted text.'
      : 'Extract all text from this image exactly as written. Preserve structure and formatting. Return only the extracted text.',
    filePart,
  ]);

  return result.response.text().trim();
}

router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'file is required',
      });
    }

    const mimeType = getSupportedMimeType(req.file);
    const fileBuffer = await readUploadedFile(req.file.path);
    let text = '';

    if (mimeType === 'application/pdf') {
      try {
        text = await extractPdfText(fileBuffer);
      } catch {
        text = '';
      }

      if (!text) {
        text = await extractWithGemini(fileBuffer, mimeType);
      }
    } else {
      text = await extractWithGemini(fileBuffer, mimeType);
    }

    fs.promises.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      text,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'OCR extraction failed',
    });
  }
});

module.exports = router;
