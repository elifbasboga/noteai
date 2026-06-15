## NoteAI

AI-powered smart note assistant for students.

### Features
- Upload PDF or photos -> OCR text extraction
- AI summarization (overview, key concepts, important terms)
- Question generation (multiple choice, true/false, open-ended) with language selection (TR/EN)
- Flashcard creation with SM-2 spaced repetition
- Quiz mode with randomized answers
- Export notes and questions as PDF
- Exam calendar with push notifications
- Progress dashboard with weekly activity chart
- AI chat assistant per note
- Dark/light theme toggle
- Full data persistence (survives app restarts)

### Tech Stack
- Frontend: React Native (Expo)
- Backend: Node.js + Express
- AI: Google Gemini 1.5 Flash (free tier)
- Storage: AsyncStorage (local persistence)
- State: Zustand

### Getting Started

**Requirements:**
- Node.js 18+
- Expo Go app on your phone
- Google Gemini API key (free at aistudio.google.com)

**Run:**
1. Clone the repo
2. npm install
3. cd backend && cp .env.example .env -> add GEMINI_API_KEY
4. cd .. && npm start
5. Scan QR code with Expo Go

### Project Structure
src/
  screens/       - all app screens
  components/    - reusable components
  navigation/    - tab + stack navigator
  store/         - Zustand store (persisted)
  services/      - API service
  hooks/         - useAI, useAppTheme
  theme/         - colors, typography
backend/
  routes/        - ai.js, ocr.js
  middleware/    - errorHandler.js
