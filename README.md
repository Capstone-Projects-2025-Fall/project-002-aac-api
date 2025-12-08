# AAC Board Speech Recognition API

A speech-to-text API designed for **AAC (Augmentative and Alternative Communication)** devices and applications. Optimized for low-latency voice command recognition to help developers integrate voice controls into games, apps, and assistive technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)

---

##  Features

-  **Multiple Recognition Engines** - Google Speech Recognition + Vosk offline fallback
-  **Command Mode** - Optimized for short AAC commands with faster response times from AAC devices
-  **Confidence Scoring** - Filter low-confidence recognitions
-  **Word-Level Timing** - Get start/end times for each recognized word
-  **Standardized JSON Responses** - Consistent camelCase API format
-  **Request Logging** - Optional consent-based logging for analytics
-  **Game Integration Ready** - Drop-in JavaScript module included
-  **Privacy Focused** - Offline recognition available, logging requires consent

---

## Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [API Reference](#-api-reference)
- [Response Format](#-response-format)
- [Game Integration](#-game-integration)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Examples](#-examples)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Quick Start - How to quickly run our API

```bash
# Clone the repository
git clone https://github.com/yourusername/aac-board-api.git
cd aac-board-api

# Install dependencies
npm install
pip install SpeechRecognition vosk numpy scipy --break-system-packages

# Start the server
node index.js
```

The API is now running at `http://localhost:8080`

### Test it:

```bash
# Health check
curl http://localhost:8080/health

# Upload audio for transcription
curl -X POST http://localhost:8080/upload \
  -F "audioFile=@your-audio.wav"
```

---

##  Installation

### Prerequisites

| Requirement | Version | Download |
|-------------|---------|----------|
| Node.js | 16+ | [nodejs.org](https://nodejs.org/) |
| Python | 3.8+ | [python.org](https://python.org/) |
| npm | 8+ | Included with Node.js |

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/aac-board-api.git
cd aac-board-api
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Install Python Dependencies

```bash
# Standard installation
pip install SpeechRecognition vosk numpy scipy

# If you get externally-managed-environment error (Python 3.11+)
pip install SpeechRecognition vosk numpy scipy --break-system-packages

# Or use a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install SpeechRecognition vosk numpy scipy
```

### Step 4: Download Vosk Model (Optional)

If Vosk failes to compile from python installation, an alternative method is to download the model directly into your system and the unzip within the project folder. This also enables it to work offline if internet access is a major concern.

For offline speech recognition:

```bash
mkdir -p model && cd model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
cd ..
```

Other models available at [alphacephei.com/vosk/models](https://alphacephei.com/vosk/models)

### Step 5: Start the Server

```bash
node index.js
```

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health and status |
| `GET` | `/formats` | Supported audio formats |
| `POST` | `/upload` | Upload audio for transcription |

---

### GET `/health`

Returns server status, uptime, and service availability.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "version": "2.0.0",
  "services": {
    "speechRecognition": true,
    "logging": true
  },
  "supportedFormats": ["WAV", "MP3", "FLAC", "OGG", "M4A"],
  "endpoints": {
    "health": "/health",
    "upload": "/upload",
    "formats": "/formats"
  }
}
```

---

### GET `/formats`

Returns supported audio formats and optimal settings.

**Response:**
```json
{
  "supportedFormats": ["WAV", "MP3", "FLAC", "AIFF", "OGG", "M4A", "RAW", "PCM"],
  "optimal": {
    "format": "WAV",
    "sampleRate": 16000,
    "bitDepth": 16,
    "channels": 1
  },
  "notes": [
    "WAV format recommended for lowest latency",
    "16kHz sample rate optimal for speech recognition",
    "Mono audio preferred (stereo will be converted)"
  ]
}
```

---

### POST `/upload`

Upload an audio file for speech-to-text transcription.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `audioFile` - The audio file to transcribe

**Headers (Optional):**

| Header | Description |
|--------|-------------|
| `x-command-mode` | Set to `"true"` for AAC command optimization |
| `x-user-id` | User identifier for logging |
| `x-session-id` | Session identifier (fallback for user-id) |
| `x-logging-consent` | Set to `"true"` to enable server-side logging |

**Example Request:**

```bash
curl -X POST http://localhost:8080/upload \
  -H "x-command-mode: true" \
  -H "x-user-id: user123" \
  -F "audioFile=@recording.wav"
```

**Success Response (200):**
```json
{
  "success": true,
  "transcription": "hello world",
  "confidence": 0.92,
  "service": "vosk",
  "processingTimeMs": 245,
  "audio": {
    "filename": "recording.wav",
    "size": 32000,
    "sizeBytes": 32000,
    "format": "WAV",
    "duration": 1.5,
    "sampleRate": 16000,
    "channels": 1,
    "mimeType": "audio/wav"
  },
  "request": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "device": "Desktop",
    "browser": "Chrome",
    "userAgent": "Mozilla/5.0..."
  },
  "aac": {
    "commandMode": true,
    "commandType": "communication",
    "isCommand": true,
    "suggestedActions": ["send_message", "repeat", "edit"]
  },
  "wordTiming": [
    { "word": "hello", "startTime": 0.12, "endTime": 0.45, "confidence": 0.94 },
    { "word": "world", "startTime": 0.48, "endTime": 0.82, "confidence": 0.90 }
  ]
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "transcription": null,
  "processingTimeMs": 150,
  "error": {
    "code": "AUDIO_QUALITY_ISSUES",
    "message": "Audio appears silent or nearly silent",
    "details": [
      { "service": "google", "error": "Could not understand audio" },
      { "service": "vosk", "error": "No speech detected" }
    ]
  },
  "request": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "device": "Desktop",
    "browser": "Chrome"
  },
  "warnings": ["Audio volume is low"]
}
```

---

## Response Format

All responses use **camelCase** keys for consistency.

### Success Response Structure

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether transcription succeeded |
| `transcription` | string | Recognized text |
| `confidence` | number | Recognition confidence (0-1) |
| `service` | string | Recognition service used (`google`, `vosk`) |
| `processingTimeMs` | number | Processing time in milliseconds |
| `audio` | object | Audio file metadata |
| `request` | object | Request metadata |
| `aac` | object | AAC-specific information |
| `wordTiming` | array | Word-level timing (when available) |
| `user` | object | User identifier (if provided) |
| `warnings` | array | Non-fatal warnings |

### AAC Object

| Field | Type | Description |
|-------|------|-------------|
| `commandMode` | boolean | Whether command mode was enabled |
| `commandType` | string | Classified command type |
| `isCommand` | boolean | Whether recognized text is a known command |
| `suggestedActions` | array | Suggested follow-up actions |

**Command Types:**
- `navigation` - back, next, up, down, etc.
- `selection` - select, choose, yes, no, etc.
- `communication` - hello, thank you, help, etc.
- `media` - play, pause, stop, etc.
- `freeform` - Unclassified speech

---

##  Game Integration

We provide a drop-in JavaScript module for easy game integration.

### Quick Integration

```html
<script type="module">
  import { AACGameController } from './aac-voice-control.js';

  const voice = new AACGameController({
    apiUrl: 'http://localhost:8080',
    commandMode: true
  });

  // Map voice commands to game actions
  voice.mapCommand(['jump', 'hop'], () => player.jump());
  voice.mapCommand(['left', 'go left'], () => player.moveLeft());
  voice.mapCommand(['fire', 'shoot'], () => player.attack());

  // Or use common command mappings
  voice.mapCommonCommands({
    up: () => player.moveUp(),
    down: () => player.moveDown(),
    select: () => game.select(),
    pause: () => game.pause()
  });

  // Start listening
  voice.start();
</script>
```

### Module Features

-  Continuous and single-shot listening modes
-  Multi-phrase command mapping
-  Confidence thresholds
-  Built-in UI panel (optional)
-  Event-based architecture

See [aac-voice-control.js](./aac-voice-control.js) for full documentation.

---

##  Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `VOSK_MODEL_PATH` | `model/vosk-model-small-en-us-0.15` | Path to Vosk model |
| `AAC_COMMAND_MODE` | `false` | Enable command mode by default |
| `PRELOAD_VOSK` | `true` | Preload Vosk model on startup |
| `NODE_ENV` | `development` | Environment (`production` disables auto-consent) |

**Example:**
```bash
PORT=3000 VOSK_MODEL_PATH=./my-model node index.js
```

### Command Mode

Enable for AAC devices to optimize for short commands:

```bash
# Via header
curl -H "x-command-mode: true" ...

# Via environment
AAC_COMMAND_MODE=true node index.js
```

Benefits:
- Faster recognition for short phrases
- Limited vocabulary reduces errors
- Optimized for common AAC commands

---

##  Testing

### Run API Tests

```bash
npm test
```

### Run Python Tests

```bash
python test.py                    # Run all tests
python test.py --audio file.wav   # Test specific file
python test.py --record           # Record from microphone
python test.py --command-mode     # Test with command mode
```

### Manual Testing

```bash
# Health check
curl http://localhost:8080/health

# Upload test audio
curl -X POST http://localhost:8080/upload \
  -F "audioFile=@tests/TestRecording.wav"

# With command mode
curl -X POST http://localhost:8080/upload \
  -H "x-command-mode: true" \
  -F "audioFile=@tests/TestRecording.wav"
```

---

##  Examples

### Basic Transcription (Node.js)

```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function transcribe(audioPath) {
  const form = new FormData();
  form.append('audioFile', fs.createReadStream(audioPath));

  const response = await fetch('http://localhost:8080/upload', {
    method: 'POST',
    body: form
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Transcription:', result.transcription);
    console.log('Confidence:', result.confidence);
  } else {
    console.error('Error:', result.error.message);
  }
}

transcribe('recording.wav');
```

### Browser Integration

```javascript
async function recordAndTranscribe() {
  // Get microphone access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audioFile', blob, 'recording.webm');

    const response = await fetch('http://localhost:8080/upload', {
      method: 'POST',
      headers: { 'x-command-mode': 'true' },
      body: formData
    });

    const result = await response.json();
    console.log(result.transcription);
  };

  // Record for 3 seconds
  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 3000);
}
```

### Python Client

```python
import requests

def transcribe(audio_path, command_mode=False):
    url = 'http://localhost:8080/upload'
    
    headers = {}
    if command_mode:
        headers['x-command-mode'] = 'true'
    
    with open(audio_path, 'rb') as f:
        files = {'audioFile': f}
        response = requests.post(url, files=files, headers=headers)
    
    result = response.json()
    
    if result['success']:
        print(f"Transcription: {result['transcription']}")
        print(f"Confidence: {result['confidence']:.1%}")
        print(f"Service: {result['service']}")
    else:
        print(f"Error: {result['error']['message']}")
    
    return result

# Usage
transcribe('recording.wav', command_mode=True)
```

---

##  Troubleshooting

### Common Issues

<details>
<summary><strong>EADDRINUSE: Port already in use</strong></summary>

```bash
# Find process using port
lsof -i :8080

# Kill it
kill -9 <PID>

# Or use different port
PORT=8081 node index.js
```
</details>

<details>
<summary><strong>Python module not found</strong></summary>

```bash
# Install missing module
pip install SpeechRecognition --break-system-packages

# Or use virtual environment
python -m venv venv
source venv/bin/activate
pip install SpeechRecognition vosk numpy scipy
```
</details>

<details>
<summary><strong>Vosk model not found</strong></summary>

```bash
# Download and extract model
mkdir -p model && cd model
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
```
</details>

<details>
<summary><strong>Low recognition accuracy</strong></summary>

1. Enable command mode: `-H "x-command-mode: true"`
2. Use WAV format at 16kHz mono
3. Reduce background noise
4. Speak clearly at moderate pace
5. Try the Vosk offline model
</details>

<details>
<summary><strong>CORS errors in browser</strong></summary>

The API includes CORS support. If issues persist:
```javascript
// Ensure you're using the correct URL
const API_URL = 'http://localhost:8080';  // Not 127.0.0.1
```
</details>

---

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/aac-board-api.git
cd aac-board-api

# Install dependencies
npm install
pip install -r requirements.txt

# Run tests
npm test
python test.py

# Start in development mode
npm run dev
```

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Acknowledgments

- [SpeechRecognition](https://github.com/Uberi/speech_recognition) - Python speech recognition library
- [Vosk](https://alphacephei.com/vosk/) - Offline speech recognition
- [Express.js](https://expressjs.com/) - Web framework for Node.js
- Lily Ulrey - For creation of our project logo for the website. 

---

##  Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/aac-board-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aac-board-api/discussions)

---

<p align="center">
  Made with ❤️ for the AAC community
</p>
