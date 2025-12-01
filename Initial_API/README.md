# AAC Speech Recognition Library

Multi-API speech recognition library with confidence scoring, designed for AAC (Augmentative and Alternative Communication) applications. Supports Whisper, Google, and Sphinx APIs with automatic best-result selection.

## Installation

### For Users of This Library

**Option 1: Install from npm** (if published)
```bash
npm install aac-speech-recognition
```

**Option 2: Install from GitHub**
```bash
npm install git+https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git#library:Initial_API
```

**Option 3: Install Locally**
```bash
git clone https://github.com/Capstone-Projects-2025-Fall/project-002-aac-api.git
cd project-002-aac-api
git checkout library
cd Initial_API
npm install
```

### Python Requirements

This library requires Python 3.11+ with the following packages:

```bash
# macOS (recommended: use Homebrew Python)
brew install python@3.11
/opt/homebrew/bin/pip3.11 install openai-whisper SpeechRecognition pocketsphinx

# Linux
pip3.11 install openai-whisper SpeechRecognition pocketsphinx

# Windows
pip install openai-whisper SpeechRecognition pocketsphinx
```

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions.

## Usage

### As a Library

```javascript
const { transcribeAudio } = require('aac-speech-recognition');
// or if installed locally:
// const { transcribeAudio } = require('./index');
const fs = require('fs');

// Read audio file
const audioBuffer = fs.readFileSync('audio.wav');

// Transcribe with default APIs (whisper,google,sphinx)
const result = await transcribeAudio(audioBuffer);

console.log('Transcription:', result.transcription);
console.log('Confidence:', result.confidenceScore);
console.log('Selected API:', result.selectedApi);

// Or specify which APIs to use
const result2 = await transcribeAudio(audioBuffer, {
    speechApis: 'whisper,google'
});
```

### As a Server

```bash
# Start the API server
npm start
# or
node index.js
# or
node server.js
```

The server will run on `http://localhost:8080` (or the port specified in `PORT` environment variable).

#### API Endpoint

**POST /upload**

Upload an audio file for transcription.

```bash
curl -X POST http://localhost:8080/upload \
  -F "audioFile=@audio.wav" \
  -H "x-logging-consent: true"
```

**Response:**
```json
{
  "success": true,
  "transcription": "Hello, how are you?",
  "confidenceScore": 0.85,
  "aggregatedConfidenceScore": 0.72,
  "selectedApi": "whisper",
  "apiResults": [...],
  "audio": {
    "filename": "audio.wav",
    "size": 12345,
    "format": "WAV",
    "duration": 2.5,
    "sampleRate": 16000
  }
}
```

### Custom Server Setup

```javascript
const { app } = require('./index');
// or
const app = require('./server');

// Add custom routes, middleware, etc.
app.use('/custom', customRouter);

app.listen(3000);
```

## API Reference

### `transcribeAudio(audioBuffer, options)`

Transcribe audio buffer using multi-API speech recognition.

**Parameters:**
- `audioBuffer` (Buffer): Audio file buffer
- `options` (Object, optional):
  - `pythonPath` (string): Path to Python executable (default: auto-detect)
  - `speechApis` (string): Comma-separated list of APIs (default: "whisper,google,sphinx")

**Returns:** Promise<Object>
- `success` (boolean): Whether transcription succeeded
- `transcription` (string): Transcribed text
- `confidenceScore` (number): Confidence score of selected API
- `aggregatedConfidenceScore` (number): Average confidence across all APIs
- `selectedApi` (string): API that provided the best result
- `apiResults` (Array): Results from all APIs tried
- `duration` (number): Audio duration in seconds
- `format` (string): Audio format
- `sampleRate` (number): Sample rate
- `error` (Object, optional): Error information if failed

### `parseUserAgent(userAgent)`

Parse user agent string to extract browser and device info.

**Parameters:**
- `userAgent` (string): User agent string

**Returns:** Object
- `browser` (string): Browser name
- `device` (string): Device type (Mobile/Tablet/Desktop)

### `logRequest(data, consentGiven, logDir)`

Log request data to file (with consent).

**Parameters:**
- `data` (Object): Data to log
- `consentGiven` (boolean): Whether user consented to logging
- `logDir` (string, optional): Directory for log files (default: ./logs)

## Supported APIs

1. **Whisper** (OpenAI) - Best for robotic/synthesized voices
   - Excellent accuracy with synthesized voices
   - Works offline
   - High confidence scores (~0.85)

2. **Google Speech Recognition** - Good for natural speech
   - Free tier available
   - Requires internet connection
   - Default confidence: 0.7

3. **Sphinx** (CMU) - Offline fallback
   - Works offline
   - Better with synthesized voices than Google
   - Default confidence: 0.6

## Configuration

Set the `SPEECH_APIS` environment variable to customize which APIs to use:

```bash
export SPEECH_APIS=whisper,google,sphinx  # All three (default)
export SPEECH_APIS=whisper,google         # Whisper + Google
export SPEECH_APIS=whisper               # Only Whisper
```

## Python Requirements

The library requires Python 3.11+ with the following packages:

```bash
# Using Homebrew Python (recommended on macOS)
/opt/homebrew/bin/pip3.11 install openai-whisper SpeechRecognition pocketsphinx
```

## Testing

```bash
npm test
```

## License

ISC

