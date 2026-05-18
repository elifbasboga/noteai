const Anthropic = require('@anthropic-ai/sdk');
const express = require('express');
const multer = require('multer');

const router = express.Router();
const MODEL = 'claude-sonnet-4-20250514';
const SYSTEM_PROMPT =
  'You are an OCR assistant. Extract all text from the image exactly as written. Preserve structure, bullet points, and formatting. Return only the extracted text, nothing else.';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const error = new Error('ANTHROPIC_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

function getTextFromMessage(message) {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function getImageMediaType(mimetype) {
  if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimetype)) {
    return mimetype;
  }

  const error = new Error('Unsupported image type. Use JPEG, PNG, GIF, or WebP.');
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

    const anthropic = getAnthropicClient();
    const base64 = req.file.buffer.toString('base64');
    const isPdf = req.file.mimetype === 'application/pdf';
    const isImage = req.file.mimetype.startsWith('image/');

    if (!isPdf && !isImage) {
      return res.status(400).json({
        success: false,
        error: 'Only PDF and image files are supported',
      });
    }

    const content = isPdf
      ? [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
            title: req.file.originalname || 'document.pdf',
          },
          {
            type: 'text',
            text: 'Extract all text from this document',
          },
        ]
      : [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: getImageMediaType(req.file.mimetype),
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Extract all text from this image',
          },
        ];

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    res.json({
      success: true,
      text: getTextFromMessage(message),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'OCR extraction failed',
    });
  }
});

module.exports = router;
