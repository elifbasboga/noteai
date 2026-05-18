const Anthropic = require('@anthropic-ai/sdk');
const express = require('express');

const router = express.Router();
const MODEL = 'claude-sonnet-4-20250514';
const SYSTEM_PROMPT =
  'You are an expert academic assistant. Always respond in the same language as the input text. Be concise and structured.';

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

function parseJsonResponse(rawText) {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1] : rawText;
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Claude response did not contain valid JSON');
  }

  return JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));
}

async function callClaudeForJson(prompt) {
  const anthropic = getAnthropicClient();
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return parseJsonResponse(getTextFromMessage(message));
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
    const summary = await callClaudeForJson(`Summarize the following ${subject} notes:

${text}

Provide:
1. A brief overview (2-3 sentences)
2. Key concepts (bullet points, max 8)
3. Important terms with one-line definitions (max 6)

Format the response as JSON:
{
  "overview": "...",
  "keyConcepts": ["...", "..."],
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
    const questions = await callClaudeForJson(`Based on these ${subject} notes, generate exam questions:

${text}

Generate:
- 3 multiple choice questions (4 options each, mark correct answer)
- 2 true/false questions
- 2 open-ended questions

Format as JSON:
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
}`);

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
    const result = await callClaudeForJson(`Create flashcards from these ${subject} notes:

${text}

Generate 8-10 flashcards covering the most important concepts.

Format as JSON:
{
  "flashcards": [
    { "front": "...", "back": "..." }
  ]
}`);

    res.json({
      success: true,
      flashcards: Array.isArray(result.flashcards) ? result.flashcards : [],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
