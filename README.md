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

### Privacy & Data Storage
All user data, including notes, profile details, exam schedules, and quiz history, is stored locally on the device using AsyncStorage. Nothing is sent to or stored in a remote database.

Only the text needed for AI features is transmitted to Google's Gemini API during OCR, summarization, and question generation. That content is used temporarily for processing and is not retained by this application's backend.

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

### Screenshots


| Screen | Description |
|---|---|
| <img src="./assets/screenshots/home_study.jpeg" width="320" /> | **Home — Study Mode:** The main dashboard with Flashcards and Quiz modes, showing recent activity. |
| <img src="./assets/screenshots/exam_calendar.jpeg" width="320" /> | **Exam Calendar:** Monthly view of upcoming exams with preparation status. |
| <img src="./assets/screenshots/question_detail.jpeg" width="320" /> | **Question Detail:** Detailed question view with sharing, PDF export and flashcard creation options. |
| <img src="./assets/screenshots/share_export.jpeg" width="320" /> | **Share & Export:** Share summaries and questions, and export as PDF. |
| <img src="./assets/screenshots/profile_stats.jpeg" width="320" /> | **Profile — Stats:** User statistics including total notes, flashcards, and activity chart. |
| <img src="./assets/screenshots/profile_settings.jpeg" width="320" /> | **Profile — Settings:** Theme customization and data management options. |


### Project Structure

| Directory | Description |
|------------|-------------|
| `src/screens` | Application screens |
| `src/components` | Reusable UI components |
| `src/navigation` | Tab and Stack navigation |
| `src/store` | Zustand state management with persistence |
| `src/services` | API service layer |
| `src/hooks` | Custom React hooks (`useAI`, `useAppTheme`, etc.) |
| `src/theme` | Colors, typography, and theme configuration |
| `backend/routes` | AI and OCR API endpoints |
| `backend/middleware` | Express middleware and error handling |
