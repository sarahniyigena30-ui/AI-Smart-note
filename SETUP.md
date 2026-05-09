# Setup and Installation Guide

## Project

AI Web-Based Smart Note System for Conversation Recording and Deep Summarization

This guide explains how to run the system locally without external AI APIs. The backend stores audio and transcript data, then uses internal NLP logic to generate structured notes.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MySQL 8 recommended
- A modern browser with microphone access

## Install Dependencies

From the project root:

```bash
npm install
```

## Configure Environment Variables

Create `backend/.env`:

```bash
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartnotes
NODE_ENV=development
```

No OpenAI key, Whisper key, or other external AI API key is required.

## Initialize the Database

Make sure MySQL is running, then run:

```bash
npm run db:init --workspace=backend
```

The database initializer creates the `smartnotes` database if needed and applies the schema in `backend/database/schema.sql`.

## Start Development Servers

```bash
npm run dev
```

This starts:

- Backend API: http://localhost:5000
- Frontend app: http://localhost:3000

Open the frontend URL in your browser.

## Main Workflow

1. Start a recording from the web interface.
2. Allow microphone access in the browser.
3. Speak during the recording. If the browser supports speech recognition, transcript text appears live.
4. Stop the recording. The audio and transcript are sent to the backend.
5. The backend stores the record and generates structured notes using internal NLP.
6. Review the transcript, summary, key points, decisions, action items, topics, keywords, and Q&A items in the recording history.

For uploaded audio files, paste the transcript in the transcript field before upload if you want the system to generate notes.

## Available Scripts

Root:

```bash
npm run dev
npm run build
```

Backend:

```bash
npm run dev --workspace=backend
npm run build --workspace=backend
npm run start --workspace=backend
npm run db:init --workspace=backend
```

Frontend:

```bash
npm run dev --workspace=frontend
npm run build --workspace=frontend
npm run preview --workspace=frontend
```

## API Endpoints

- `GET /api/status` - API health and processing mode
- `GET /api/recordings` - paginated recording list
- `GET /api/recordings/:id` - recording details
- `GET /api/recordings/search/query?q=term` - search by title, transcript, or summary
- `POST /api/recordings/upload` - upload audio and optional transcript
- `POST /api/recordings/:id/summarize` - regenerate internal notes from an existing transcript
- `GET /api/recordings/:id/download` - download audio
- `DELETE /api/recordings/:id` - delete a recording

## Troubleshooting

### Microphone Access Denied

Check browser permissions and allow microphone access for the local site.

### No Live Transcript Appears

Live speech recognition depends on browser support. The recording is still saved. To generate notes for an audio file, paste a transcript before upload.

### Database Connection Fails

Confirm that MySQL is running and that the credentials in `backend/.env` are correct. Then run the database initialization command again.

### Port Already in Use

Change `PORT` in `backend/.env`, or stop the process already using the configured port. Vite may automatically choose another frontend port if `3000` is busy.

## Evaluation Guidance

For the research evaluation story, prepare a small set of meeting or interview transcripts with manual notes. Compare the generated notes against the manual notes using:

- Coverage of key points
- Correctness of decisions and action items
- Keyword/topic relevance
- Time saved during review
- User satisfaction from reviewers

Record the results in a table so the system can be evaluated professionally.
