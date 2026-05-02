# AI Smart Note System

Record conversations and get AI-powered structured notes.

## Implemented Features

- Browser audio recording and audio-file upload
- Backend speech-to-text transcription with OpenAI
- Structured AI notes with summary, key points, decisions, action items, topics, keywords, and insights
- Extracted questions and answers from transcripts
- MySQL storage for recordings, transcripts, summaries, and Q&A items
- Recording history, search, playback, pagination, and deletion

## Project Structure

```text
.
├── backend/          # Express API server
└── frontend/         # React/Vite UI
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+ recommended
- OpenAI API key

### Installation

```bash
npm install
```

Create `backend/.env`:

```bash
PORT=5000
OPENAI_API_KEY=your_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smartnotes
NODE_ENV=development
```

Initialize the database:

```bash
npm run db:init --workspace=backend
```

Start development servers:

```bash
npm run dev
```

- Backend API: http://localhost:5000
- Frontend app: http://localhost:3000

## Build

```bash
npm run build
```
