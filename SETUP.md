# AI Smart Note System - Setup and Installation Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **MySQL** 8+ recommended
- **OpenAI API Key** (for transcription and summarization)
- A modern web browser with microphone access

## Quick Start

### 1. Clone/Extract the Project

Extract the project files to your desired location.

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Backend configuration
PORT=5000
OPENAI_API_KEY=sk-your-openai-api-key-here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartnotes
NODE_ENV=development
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 4. Start Development Servers

```bash
# From the root directory
npm run dev
```

This will start:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:3000

### 5. Access the Application

Open your browser and navigate to: **http://localhost:3000**

## Features

### Recording
- 🎤 Direct microphone recording with real-time waveform visualization
- 📤 Upload existing audio files (MP3, WAV, M4A, etc.)
- ⏱️ Recording timer with visual feedback
- 🔊 Progress tracking during processing

### AI Processing
- 🤖 Automatic speech-to-text transcription (OpenAI Whisper)
- ✨ AI-powered summaries (GPT-3.5-turbo)
- 📌 Automatic key points extraction
- ⚡ Fast processing with real-time status updates

### Management
- 📚 Complete recording history
- 🔍 Full-text search across transcripts and summaries
- 📄 View transcripts, summaries, and key points
- 🎵 Play recordings directly in the app
- 🗑️ Delete recordings with confirmation
- 📖 Paginated listing with 10 recordings per page

## Project Structure

```
.
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── index.ts           # Main server file
│   │   ├── database.ts        # Database initialization
│   │   ├── summary.ts         # OpenAI integration
│   │   └── routes/
│   │       └── recordings.ts  # API routes
│   ├── database/
│   │   └── schema.sql         # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── uploads/               # Audio storage
│
├── frontend/                   # React + Vite App
│   ├── src/
│   │   ├── main.tsx          # Entry point
│   │   ├── App.tsx           # Main component
│   │   ├── App.css           # Global styles
│   │   └── components/
│   │       ├── RecordingSection.tsx    # Recording interface
│   │       ├── RecordingList.tsx       # Recordings grid
│   │       ├── RecordingCard.tsx       # Individual recording card
│   │       ├── SearchBar.tsx           # Search functionality
│   │       └── ErrorBoundary.tsx       # Error handling
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── package.json               # Root workspace config
└── README.md
```

## API Endpoints

### GET /api/recordings
Get all recordings with pagination
- **Query params**: `page=1&limit=10`
- **Returns**: List of recordings with metadata

### GET /api/recordings/:id
Get a single recording with full details
- **Returns**: Recording with transcript and summary

### GET /api/recordings/search/query
Search recordings by title, transcript, or summary
- **Query params**: `q=search-term`
- **Returns**: Matching recordings

### POST /api/recordings/upload
Upload and process audio file
- **Form data**: 
  - `audio`: Audio file (required)
  - `title`: Recording title (optional)
- **Returns**: Recording details with transcript and summary

### DELETE /api/recordings/:id
Delete a recording
- **Returns**: Success confirmation

### GET /api/recordings/:id/download
Download a recording file
- **Returns**: Audio file download

## Troubleshooting

### Microphone Access Denied
- Check browser permissions for microphone
- Firefox/Chrome: Click lock icon in address bar → Allow microphone
- Safari: System Preferences → Security & Privacy → Microphone

### OpenAI API Errors
- Verify API key is correct in `.env`
- Check API key has sufficient credits
- Ensure API endpoint is accessible

### Database Issues
- Check your MySQL credentials in `.env`
- Ensure the MySQL service is running on your machine
- Run `npm run db:init` to recreate the schema if needed
- Ensure `uploads/` directory exists
- Check file permissions in the directory

### Port Already in Use
- Backend: Change `PORT` in `.env` or kill process using port 5000
- Frontend: Vite will auto-increment to 3001 if 3000 is taken

### Slow Transcription
- Whisper API can take 1-2 minutes for longer audio
- Keep the app open; processing continues in background
- Refresh to see updated status

## Development

### Build for Production

```bash
# Build both frontend and backend
npm run build

# Build backend only
cd backend && npm run build

# Build frontend only
cd frontend && npm run build
```

### Database Management

```bash
# Initialize database manually
cd backend
npm run db:init
```

### Available Scripts

**Root:**
- `npm run dev` - Start development servers
- `npm run build` - Build both apps

**Backend:**
- `npm run dev` - Start with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled code
- `npm run db:init` - Initialize database

**Frontend:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Performance Optimization

### Frontend
- Component lazy loading for better performance
- Debounced search (300ms)
- Pagination to reduce memory usage
- Canvas-based waveform visualization

### Backend
- Efficient MySQL queries with proper connection pooling
- Stream-based file handling
- Async/await for non-blocking operations
- Proper foreign key constraints for data integrity

## Security Notes

- API key is server-side only (never exposed to client)
- File uploads validated for audio types
- File size limits (100MB)
- Input sanitization for search queries
- CORS enabled for development (configurable)

## Support & Documentation

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## License

MIT License - Feel free to use this project for personal or commercial purposes.

---

**Happy recording!** 🎤✨
