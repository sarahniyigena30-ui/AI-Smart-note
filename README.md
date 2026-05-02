# AI Smart Note System

Record conversations and get AI-powered summaries in real-time.

## Features

- 🎤 Record audio conversations
- 🤖 AI-powered summarization using OpenAI
- 💾 Store recordings and summaries in database
- 📝 View conversation history
- 🎨 Clean, intuitive UI

## Project Structure

```
.
├── backend/          # Express API server
└── frontend/         # React/Vite UI
```

## Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key
- MySQL (v8.0+ recommended)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Backend: create .env in backend/
# OPENAI_API_KEY=your_key
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=recording

# Start development servers
npm run dev
```

### Build for Production

```bash
npm run build
```

## License

MIT
