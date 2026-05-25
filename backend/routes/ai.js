const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const router = express.Router();
const MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION =
  'You are an expert academic assistant. Always respond in the same language as the input text. Be concise and structured. Always return valid JSON only, no markdown, no backticks.';

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

function parseJSON(text) {
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

async function callGeminiForJson(prompt) {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

function validateTextBody(req) {
  const { text, subject } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    const error = new Error('text is required');
    error.statusCode = 400;
    throw error;
  }

  return {
    text: text.trim(),
    subject:
      typeof subject === 'string' && subject.trim().length > 0
        ? subject.trim()
        : 'general',
  };
}

router.post('/summarize', async (req, res, next) => {
  try {
    const { text, subject } = validateTextBody(req);
    const summary = await callGeminiForJson(`Summarize the following ${subject} notes:

${text}

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "overview": "2-3 sentence summary",
  "keyConcepts": ["concept1", "concept2"],
  "importantTerms": [{"term": "...", "definition": "..."}]
}`);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-questions', async (req, res, next) => {
  try {
    const { text, subject } = validateTextBody(req);
    const questions = await callGeminiForJson(`Based on these ${subject} notes, generate exam questions:

${text}

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "multipleChoice": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A"
    }
  ],
  "trueFalse": [
    { "question": "...", "answer": true }
  ],
  "openEnded": [
    { "question": "..." }
  ]
}
Generate 3 multiple choice, 2 true/false, 2 open-ended questions.`);

    res.json({
      success: true,
      questions,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-flashcards', async (req, res, next) => {
  try {
    const { text, subject } = validateTextBody(req);
    const result = await callGeminiForJson(`Create flashcards from these ${subject} notes:

${text}

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "flashcards": [
    { "front": "...", "back": "..." }
  ]
}
Generate 8-10 flashcards covering the most important concepts.`);

    res.json({
      success: true,
      flashcards: Array.isArray(result.flashcards) ? result.flashcards : [],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
