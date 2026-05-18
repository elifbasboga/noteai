# NoteAI Backend

## Setup

1. cd backend
2. npm install
3. cp .env.example .env
4. Add your GEMINI_API_KEY to .env
5. node index.js

## Endpoints

- GET  /health
- POST /api/ocr/extract
- POST /api/ai/summarize
- POST /api/ai/generate-questions
- POST /api/ai/generate-flashcards

## Free tier

Uses Google Gemini 1.5 Flash — 1500 free requests/day via Google AI Studio.
