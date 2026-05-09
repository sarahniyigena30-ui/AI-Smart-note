# AI Web-Based Smart Note System for Conversation Recording and Deep Summarization

This project is a web-based smart note-taking system for meetings, interviews, discussions, and academic conversations. It records conversation audio, captures or accepts transcript text, analyzes the transcript with internal NLP logic, and generates structured notes that include summaries, key points, decisions, action items, questions, topics, and keywords.

The system is designed to work without external AI APIs. Audio is captured securely through the web interface, while transcription support comes from the browser during live recording or from a transcript pasted by the user for uploaded audio. Summarization and analysis are performed by the backend using internal processing.

## Problem Statement

During meetings, interviews, and discussions, users often struggle to write complete and accurate notes while still paying attention to the conversation. Important points, decisions, questions, and follow-up tasks can be missed. Many existing note-taking tools mainly record audio or store plain text, leaving users to spend extra time reviewing long recordings and manually organizing information.

## Proposed Solution

The proposed system provides one web platform where users can record conversations, save the audio, capture transcript text, and automatically generate organized smart notes. Instead of only storing recordings, the system extracts meaningful information from the conversation and presents it in a structured format that is easy to review, search, and retrieve.

## What Makes This System Different

- It combines recording, transcription support, summarization, storage, search, and retrieval in one web system.
- It does not rely on paid external AI APIs for summarization or analysis.
- It generates structured outputs, including key points, decisions, action items, topics, keywords, insights, and question-answer pairs.
- It supports real-time browser recording and uploaded audio with a provided transcript.
- It stores conversation records securely in a database for later review.

## Working Flow

1. User starts a conversation recording or uploads an audio file.
2. The browser captures audio through the microphone or file input.
3. During live recording, the browser can capture transcript text when speech recognition is supported.
4. For uploaded audio, the user may paste an existing transcript.
5. The backend stores the audio, transcript, and metadata.
6. Internal NLP processing identifies key points, decisions, action items, topics, keywords, insights, and questions.
7. The system generates a structured summary.
8. Users can search, view, play, download, or delete saved recordings and notes.

## User Stories

| Story | User Story |
| --- | --- |
| 1. Conversation Recording | As a user, I want to record real-time conversations through the web interface so that audio is captured securely for processing. |
| 2. Speech to Text | As a user, I want the system to capture live transcript text during recording or accept a provided transcript so that conversations can be analyzed without external APIs. |
| 3. NLP Analysis | As a developer, I want to apply internal NLP techniques to transcript text so that key topics, decisions, questions, and action items are identified. |
| 4. Deep Structured Summarization | As a user, I want the system to generate structured summaries from conversations so that I can quickly review key points and decisions. |
| 5. Topic and Keyword Extraction | As a user, I want the system to extract important topics and keywords so that I can understand the main discussion themes. |
| 6. Storage and Retrieval | As a user, I want recorded conversations and summaries stored securely so that I can retrieve and review them anytime. |
| 7. User Interface | As a user, I want a simple web interface to start recordings, upload audio, view transcripts, and read summaries so that the system is easy to use on any device. |
| 8. System Evaluation | As a researcher, I want to compare generated summaries with manual notes so that I can measure the system's accuracy, usefulness, and efficiency. |

## Implemented Features

- Browser audio recording and audio-file upload
- Manual transcript input for uploaded audio
- **Automatic French speech-to-text transcription** using OpenAI Whisper (trained on CommonVoice French dataset)
- Internal structured summary generation
- Key point, decision, action item, insight, topic, and keyword extraction
- Question and answer extraction from transcript text
- MySQL storage for recordings, transcripts, summaries, and Q&A items
- Recording history, search, playback, pagination, download, and deletion
- Optional local model evaluation dashboard

## Project Structure

```text
.
|-- backend/          Express API server and internal NLP processing
|-- frontend/         React/Vite web interface
|-- models/           Local model metrics and artifacts
|-- scripts/          Optional local data/model scripts
|-- archive/          Local dataset archive
```

## Quick Start

```bash
npm install
```

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

Initialize the database:

```bash
npm run db:init --workspace=backend
```

Start the development servers:

```bash
npm run dev
```

- Backend API: http://localhost:5000
- Frontend app: http://localhost:3000

## Machine Learning & French Transcription

The system includes automatic French audio transcription using OpenAI's Whisper model, trained on the CommonVoice French dataset.

### Setup ML Dependencies

Install the ML/Python dependencies for transcription:

```bash
pip install -r requirements-ml.txt
```

This installs:
- `transformers` - For the Whisper model
- `torch` - PyTorch for model execution
- `librosa` - Audio processing
- `datasets` - For loading audio data
- Other supporting libraries

### How Transcription Works

1. When an audio file is uploaded without a manual transcript, the backend automatically attempts transcription
2. The system uses OpenAI's Whisper-small model optimized for French
3. Transcription results are saved to the database
4. If transcription succeeds, the system automatically generates summaries and extracts key points
5. If transcription fails, users can manually add a transcript later

### Supported Audio Formats

- MP3, WAV, OGG, FLAC, M4A, WebM, AAC, Opus, and other formats supported by Whisper

## Build

```bash
npm run build
```
