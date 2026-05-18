# NoteAI Backend

## Setup

```sh
cd backend
npm install
cp .env.example .env
```

Add your `ANTHROPIC_API_KEY` to `.env`.

```sh
node index.js
```

## Endpoints

```txt
GET  /health
POST /api/ocr/extract
POST /api/ai/summarize
POST /api/ai/generate-questions
POST /api/ai/generate-flashcards
```
