# TicTacToe with Voice Control

A voice-controlled Tic Tac Toe game for testing the AAC Board Speech Recognition API.

## Features

-  **Voice Control** - Play using speech commands
-  **Continuous Listening** - Hands-free gameplay
-  **Single Command Mode** - One command at a time
-  **API Logging** - Real-time view of API requests/responses
-  **Keyboard Fallback** - Click squares if voice isn't available
-  **Speech Feedback** - Game announces moves and status

---

## Prerequisites

Before starting, make sure you have installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://python.org/)
- **npm** (comes with Node.js)

Verify installations:
```bash
node --version    # Should show v16.x.x or higher
python3 --version # Should show Python 3.8.x or higher
npm --version     # Should show 8.x.x or higher
```

---

## Installation

### Step 1: Clone or Download the Project

```bash
# If using git
git clone <your-repo-url>
cd AAC-Board

# Or download and extract the ZIP file
```

### Step 2: Install API Server Dependencies

```bash
# Navigate to the API directory
cd Initial_API

# Install Node.js dependencies
npm install
```

This installs:
- express
- multer
- cors
- (and other dependencies from package.json)

### Step 3: Install Python Dependencies

```bash
# Install required Python packages
pip install SpeechRecognition --break-system-packages
pip install vosk --break-system-packages
pip install numpy --break-system-packages
pip install scipy --break-system-packages

# Or if you prefer using a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install SpeechRecognition vosk numpy scipy
```

### Step 4: Download Vosk Model (Optional but Recommended)

For offline speech recognition, download a Vosk model:

```bash
# Create model directory
mkdir -p model

# Download small English model (40MB)
cd model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
cd ..
```

Or download manually from [Vosk Models](https://alphacephei.com/vosk/models) and extract to `Initial_API/model/`

### Step 5: Install React Dependencies (for TicTacToe)

```bash
# Navigate to the React app directory (adjust path as needed)
cd ../tictactoe-app  # or wherever your React app is

# Install dependencies
npm install
```

---

## Project Structure

```
AAC-Board/
├── Initial_API/
│   ├── index.js              # Node.js API server
│   ├── speechRecognition.py  # Python speech recognition
│   ├── package.json          # Node.js dependencies
│   ├── model/                # Vosk model directory
│   │   └── vosk-model-small-en-us-0.15/
│   └── tests/
│       ├── api.test.js       # API tests
│       └── test.py           # Python tests
│
├── tictactoe-app/            # React application
│   ├── src/
│   │   └── TicTacToe.js      # Voice-controlled game component
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## Starting the Application

### Terminal 1: Start the API Server

```bash
# Navigate to API directory
cd Initial_API

# Start the server
node index.js
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║           AAC Speech Recognition API v2.0.0                ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:8080                  ║
║                                                            ║
║  Endpoints:                                                ║
║    GET  /health   - Health check & status                  ║
║    GET  /formats  - Supported audio formats                ║
║    POST /upload   - Upload audio for transcription         ║
╚════════════════════════════════════════════════════════════╝
```

### Terminal 2: Start the React App

```bash
# Navigate to React app directory
cd tictactoe-app

# Start development server
npm start
```

The app will open automatically at `http://localhost:3000`

---

## Quick Start (Both Servers)

Create a start script for convenience:

### start.sh (Linux/Mac)
```bash
#!/bin/bash

# Start API server in background
cd Initial_API
node index.js &
API_PID=$!

# Wait for API to start
sleep 2

# Start React app
cd ../tictactoe-app
npm start

# Cleanup on exit
trap "kill $API_PID" EXIT
```

### start.bat (Windows)
```batch
@echo off

:: Start API server in new window
start "AAC API Server" cmd /k "cd Initial_API && node index.js"

:: Wait for API to start
timeout /t 3

:: Start React app
cd tictactoe-app
npm start
```

Make executable and run:
```bash
# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
start.bat
```

---

## Using the Game

### Voice Commands

| Command | Action |
|---------|--------|
| "top left", "top center", "top right" | Place mark in top row |
| "middle left", "center", "middle right" | Place mark in middle row |
| "bottom left", "bottom center", "bottom right" | Place mark in bottom row |
| "one" through "nine" | Place mark (numbered 1-9) |
| "new game", "reset" | Start a new game |
| "stop listening" | Stop voice recognition |
| "help" | Hear available commands |

### Game Controls

1. **Start Continuous** - Always listening, hands-free play
2. **Single Command** - Records one command at a time
3. **New Game** - Reset the board
4. **Check API** - Verify server connection

### AAC Command Mode

Toggle "AAC Command Mode" for optimized short-phrase recognition. This is recommended for:
- Faster response times
- Better accuracy with simple commands
- Reduced processing overhead

---

## Troubleshooting

### API Server Won't Start

**Error: `EADDRINUSE: address already in use`**
```bash
# Find and kill process using port 8080
lsof -i :8080
kill -9 <PID>

# Or use a different port
PORT=8081 node index.js
```

**Error: `Cannot find module 'express'`**
```bash
cd Initial_API
npm install
```

### Python Speech Recognition Errors

**Error: `No module named 'speech_recognition'`**
```bash
pip install SpeechRecognition --break-system-packages
```

**Error: `No module named 'vosk'`**
```bash
pip install vosk --break-system-packages
```

**Error: `Vosk model not found`**
- Download and extract the Vosk model to `Initial_API/model/`
- Ensure the path matches: `model/vosk-model-small-en-us-0.15/`

### Microphone Issues

**Error: `NotAllowedError: Permission denied`**
- Click the lock icon in your browser's address bar
- Allow microphone access for localhost
- Refresh the page

**Error: `NotFoundError: Requested device not found`**
- Check that a microphone is connected
- Check system audio settings
- Try a different browser

### React App Issues

**Error: `Module not found`**
```bash
cd tictactoe-app
rm -rf node_modules package-lock.json
npm install
```

**Blank page or errors in console**
- Check that the API server is running
- Verify API URL in TicTacToe.js matches your server

### Low Recognition Accuracy

1. Enable "AAC Command Mode" 
2. Speak clearly and at moderate pace
3. Reduce background noise
4. Check the confidence scores in the API log
5. Try the Vosk offline model for better accuracy

---

## Testing

### Test the API

```bash
# Health check
curl http://localhost:8080/health

# Check formats
curl http://localhost:8080/formats
```

### Run API Tests

```bash
cd Initial_API
npm test
```

### Run Python Tests

```bash
cd Initial_API
python3 tests/test.py
```

### Test with Audio File

```bash
cd Initial_API
python3 tests/test.py --audio tests/TestRecording.wav
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | API server port |
| `VOSK_MODEL_PATH` | model/vosk-model-small-en-us-0.15 | Path to Vosk model |
| `AAC_COMMAND_MODE` | false | Enable command mode by default |
| `PRELOAD_VOSK` | true | Preload Vosk model on startup |

Example:
```bash
PORT=3001 VOSK_MODEL_PATH=./my-model node index.js
```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 66+ |  Full |
| Firefox 60+ |  Full |
| Safari 14+ |  Full |
| Edge 79+ |  Full |
| IE 11 |  Not supported |

---

## Need Help?

1. Check the API log panel in the game for detailed request/response info
2. Open browser developer tools (F12) for JavaScript errors
3. Check terminal output for server-side errors
4. Verify both servers are running on correct ports

---

## License

MIT
