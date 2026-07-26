# RAG Chat Frontend

A modern React frontend for a Retrieval Augmented Generation (RAG) application with a ChatGPT-like interface.

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API calls
- FastAPI backend

## Prerequisites

- Node.js (LTS version recommended) - [Download here](https://nodejs.org/)
- Python 3.8+
- pip

## Setup Instructions

### 1. Install Python Dependencies

From the project root (`d:/YTRAG`):

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root with your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Install Node.js Dependencies

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

### 4. Start the Backend Server

From the project root:

```bash
python server.py
```

The backend will start on `http://localhost:8000`

### 5. Start the Frontend Development Server

From the frontend directory (in a new terminal):

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ChatWindow.tsx      # Main chat display area
│   │   ├── MessageBubble.tsx   # Individual message component
│   │   ├── ChatInput.tsx        # Input field with send button
│   │   ├── LoadingIndicator.tsx # Loading spinner
│   │   └── SourceList.tsx      # Display document sources
│   ├── services/
│   │   └── api.ts              # API service with Axios
│   ├── types/
│   │   └── chat.ts             # TypeScript interfaces
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles with Tailwind
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Features

- **ChatGPT-like Interface**: Clean, modern UI with user messages on the right and AI responses on the left
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Chat**: Instant message display with loading indicators
- **Source Attribution**: Displays document sources for AI responses
- **Auto-scroll**: Automatically scrolls to the latest message
- **Error Handling**: Graceful error handling for API failures

## API Integration

The frontend connects to the backend via the `/api/chat` endpoint:

**Request:**
```json
{
  "conversation_id": "conv_123",
  "query": "What is vector database?"
}
```

**Response:**
```json
{
  "conversation_id": "conv_123",
  "run_id": "run_456",
  "answer": "A vector database stores embeddings...",
  "sources": [
    {
      "document_name": "vector_db_guide.pdf",
      "page": 4
    }
  ]
}
```

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Troubleshooting

**TypeScript errors in IDE**: These are expected if Node.js dependencies aren't installed. Run `npm install` in the frontend directory to resolve them.

**Backend connection errors**: Ensure the FastAPI server is running on port 8000 before starting the frontend.

**CORS errors**: The backend is configured to allow all origins for development. For production, update the CORS settings in `server.py`.
