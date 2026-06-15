const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const router = express.Router();
const MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION =
  'You are an expert academic assistant. Always respond in the same language as the input text. Be concise and structured. Always return valid JSON only, no markdown, no backticks.';

function getGeminiModel(systemInstruction = SYSTEM_INSTRUCTION) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const options = { model: MODEL };

  if (systemInstruction) {
    options.systemInstruction = systemInstruction;
  }

  return genAI.getGenerativeModel(options);
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

function getQuestionPromptDetails(questionType, labels) {
  if (questionType === 'multipleChoice') {
    return {
      instruction: 'Generate 5 multiple choice questions only.',
      schema: `{
  "multipleChoice": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A"
    }
  ]
}`,
    };
  }

  if (questionType === 'trueFalse') {
    return {
      instruction: 'Generate 5 true/false questions only.',
      schema: `{
  "trueFalse": [
    {
      "question": "...",
      "answer": true,
      "trueFalseLabels": {"true": "${labels.true}", "false": "${labels.false}"}
    }
  ]
}`,
    };
  }

  if (questionType === 'openEnded') {
    return {
      instruction:
        'Generate 4 open-ended questions with detailed model answers only.',
      schema: `{
  "openEnded": [
    { "question": "...", "answer": "Detailed answer here" }
  ]
}`,
    };
  }

  return {
    instruction:
      'Generate 3 multiple choice, 2 true/false, 2 open-ended questions. For open-ended questions, also provide a detailed model answer.',
    schema: `{
  "multipleChoice": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A"
    }
  ],
  "trueFalse": [
    {
      "question": "...",
      "answer": true,
      "trueFalseLabels": {"true": "${labels.true}", "false": "${labels.false}"}
    }
  ],
  "openEnded": [
    { "question": "...", "answer": "Detailed answer here" }
  ]
}`,
  };
}

function getLanguagePrompt(language) {
  if (language === 'en') {
    return {
      instruction:
        'Generate all questions, options, and answers in English. For true/false questions, include trueFalseLabels: {"true": "True", "false": "False"}.',
      labels: { true: 'True', false: 'False' },
    };
  }

  return {
    instruction:
      'Generate all questions, options, and answers in Turkish. For true/false questions, use "Doğru" and "Yanlış" as the boolean labels — the question JSON should include a field trueFalseLabels: {"true": "Doğru", "false": "Yanlış"}.',
    labels: { true: 'Doğru', false: 'Yanlış' },
  };
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
    const allowedTypes = ['multipleChoice', 'trueFalse', 'openEnded', 'mixed'];
    const questionType = allowedTypes.includes(req.body.questionType)
      ? req.body.questionType
      : 'mixed';
    const language = req.body.language === 'en' ? 'en' : 'tr';
    const labels =
      language === 'en'
        ? { true: 'True', false: 'False' }
        : { true: 'Doğru', false: 'Yanlış' };
    const promptDetails = getQuestionPromptDetails(questionType, labels);
    const languagePrompt = getLanguagePrompt(language);
    const questions = await callGeminiForJson(`Based on these ${subject} notes, generate exam questions:

${text}

Return ONLY a valid JSON object, no markdown, no backticks:
${promptDetails.schema}
${promptDetails.instruction}
${languagePrompt.instruction}`);

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

router.post('/chat', async (req, res, next) => {
  try {
    const { messages, noteContent, subject } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      const error = new Error('messages are required');
      error.statusCode = 400;
      throw error;
    }

    if (
      !noteContent ||
      typeof noteContent !== 'string' ||
      noteContent.trim().length === 0
    ) {
      const error = new Error('noteContent is required');
      error.statusCode = 400;
      throw error;
    }

    const safeSubject =
      typeof subject === 'string' && subject.trim().length > 0
        ? subject.trim()
        : 'general';
    const systemPrompt = `You are a helpful academic assistant for the subject: ${safeSubject}.
You have access to the following study notes:

${noteContent.trim()}

Answer questions based on these notes. Be concise and helpful.
Respond in the same language as the user's question.`;

    const conversationHistory = messages
      .filter(
        (message) =>
          message &&
          typeof message.content === 'string' &&
          ['user', 'assistant'].includes(message.role)
      )
      .map(
        (message) =>
          `${message.role === 'user' ? 'User' : 'Assistant'}: ${
            message.content
          }`
      )
      .join('\n');

    const model = getGeminiModel('You are a helpful academic assistant.');
    const prompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nAssistant:`;
    const result = await model.generateContent(prompt);

    res.json({
      success: true,
      message: result.response.text(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
