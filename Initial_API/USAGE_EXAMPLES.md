# Usage Examples

## Basic Usage

### Simple Transcription

```javascript
const { transcribeAudio } = require('aac-speech-recognition');
const fs = require('fs');

async function transcribe() {
    // Read audio file
    const audioBuffer = fs.readFileSync('audio.wav');
    
    // Transcribe (uses all APIs by default: whisper,google,sphinx)
    const result = await transcribeAudio(audioBuffer);
    
    console.log('Transcription:', result.transcription);
    console.log('Confidence:', result.confidenceScore);
    console.log('Selected API:', result.selectedApi);
    console.log('All API results:', result.apiResults);
}

transcribe().catch(console.error);
```

### Specify Which APIs to Use

```javascript
// Use only Whisper (best for robotic voices)
const result = await transcribeAudio(audioBuffer, {
    speechApis: 'whisper'
});

// Use Whisper + Google (recommended for redundancy)
const result2 = await transcribeAudio(audioBuffer, {
    speechApis: 'whisper,google'
});

// Use all three APIs (default)
const result3 = await transcribeAudio(audioBuffer, {
    speechApis: 'whisper,google,sphinx'
});
```

### Custom Python Path

```javascript
// If Python is in a non-standard location
const result = await transcribeAudio(audioBuffer, {
    pythonPath: '/opt/homebrew/bin/python3.11',
    speechApis: 'whisper,google'
});
```

## Using as a Server

### Start Default Server

```bash
npm start
# Server runs on http://localhost:8080
```

### Custom Server Setup

```javascript
const { app } = require('aac-speech-recognition');
const express = require('express');

// Add custom routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Using with Express Middleware

```javascript
const express = require('express');
const { app } = require('aac-speech-recognition');

const customApp = express();

// Mount the speech recognition routes
customApp.use('/api/speech', app);

// Add your own routes
customApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

customApp.listen(3000);
```

## Error Handling

```javascript
const { transcribeAudio } = require('aac-speech-recognition');

async function transcribeWithErrorHandling(audioBuffer) {
    try {
        const result = await transcribeAudio(audioBuffer);
        
        if (result.success) {
            console.log('Success:', result.transcription);
        } else {
            console.error('Transcription failed:', result.error);
        }
    } catch (error) {
        console.error('Error:', error.message);
        
        // Handle specific error types
        if (error.message.includes('Python')) {
            console.error('Python not found or not configured correctly');
        } else if (error.message.includes('parse')) {
            console.error('Failed to parse transcription result');
        }
    }
}
```

## Integration Examples

### Express.js API

```javascript
const express = require('express');
const multer = require('multer');
const { transcribeAudio } = require('aac-speech-recognition');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        const result = await transcribeAudio(req.file.buffer, {
            speechApis: 'whisper,google'
        });
        
        res.json({
            success: true,
            transcription: result.transcription,
            confidence: result.confidenceScore
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(3000);
```

### Next.js API Route

```javascript
// pages/api/transcribe.js
import { transcribeAudio } from 'aac-speech-recognition';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const audioBuffer = Buffer.from(req.body.audio, 'base64');
        const result = await transcribeAudio(audioBuffer);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

### Command Line Tool

```javascript
// cli.js
const { transcribeAudio } = require('aac-speech-recognition');
const fs = require('fs');
const path = process.argv[2];

if (!path) {
    console.error('Usage: node cli.js <audio-file>');
    process.exit(1);
}

async function main() {
    try {
        const audioBuffer = fs.readFileSync(path);
        const result = await transcribeAudio(audioBuffer);
        
        console.log('Transcription:', result.transcription);
        console.log('Confidence:', result.confidenceScore);
        console.log('API:', result.selectedApi);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
```

## Environment Variables

Set default API configuration:

```bash
# .env file or environment
SPEECH_APIS=whisper,google,sphinx
PORT=8080
NODE_ENV=production
```

Then use in code:

```javascript
const result = await transcribeAudio(audioBuffer, {
    speechApis: process.env.SPEECH_APIS || 'whisper,google,sphinx'
});
```

