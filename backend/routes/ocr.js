const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const multer = require('multer');

const router = express.Router();
const MODEL = 'gemini-1.5-flash';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
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

router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'file is required',
      });
    }

    const model = getGeminiModel();
    const mimeType = getSupportedMimeType(req.file);
    const filePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType,
      },
    };
    const isPdf = mimeType === 'application/pdf';
    const result = await model.generateContent([
      isPdf
        ? 'Extract all text from this document exactly as written. Preserve structure and formatting. Return only the extracted text.'
        : 'Extract all text from this image exactly as written. Preserve structure and formatting. Return only the extracted text.',
      filePart,
    ]);

    res.json({
      success: true,
      text: result.response.text(),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'OCR extraction failed',
    });
  }
});

module.exports = router;
