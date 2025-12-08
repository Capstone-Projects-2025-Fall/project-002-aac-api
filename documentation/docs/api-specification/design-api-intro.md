# Design Document: AAC Speech Recognition API

**Description:**  
This document provides the complete design for the **AAC Board Speech Recognition API**, including module/class purposes, data fields, methods, routes, pre/post conditions, parameters, exceptions, and helper utilities.

The API is built with **Express.js**, supports audio upload and speech recognition via Python backends, and is optimized for **Augmentative and Alternative Communication (AAC)** devices.

---

## Overview

This software implements a robust speech-to-text REST API with:

- Multiple speech-recognition backends (e.g., Google Speech API, offline Vosk)
- Command mode for AAC command recognition
- Word-level timing metadata
- camelCase JSON responses
- Health and capability endpoints
- Consent-based logging of audio metadata
- Fallback and tolerant JSON parsing of Python output

### Purpose

* Provide a reliable speech recognition endpoint for AAC devices.  
* Expose system health information for device connectivity.  
* Support multiple audio formats and command modes.  
* Serve as a modern, extensible foundation for AAC-focused speech recognition systems.

---

## Modules and Fields

| Field | Type | Purpose |
|-------|------|---------|
| `express` | Module | Main HTTP framework for routing and middleware. |
| `multer` | Module | Parses audio uploads via multipart/form-data. |
| `cors` | Module | Enables cross-origin requests (important for AAC devices). |
| `fs` | Module | File system access for logs and script validation. |
| `spawn` | Module | Executes Python speech recognition backend. |
| `path` | Module | File path resolution. |
| `app` | Object | Express instance for routes and middleware. |
| `PORT` | Number | API port (`8080` default, environment override supported). |
| `upload` | Multer Instance | Memory-based upload handler (10MB limit). |
| `LOG_DIR` | String | Directory used for daily JSON log files. |
| `SPEECH_SCRIPT` | String | Path to Python speech recognition script. |
| `SUPPORTED_FORMATS` | Array\<String\> | Allowed audio formats. |
| `SERVER_START_TIME` | Number | Millisecond timestamp for uptime calculations. |

---

## Middleware

### JSON Parser

```js
app.use(express.json());
````

**Purpose:** Automatically parses incoming JSON request bodies.
**Pre-condition:** Body must be valid JSON when JSON is expected.
**Post-condition:** Parsed JSON becomes available via `req.body`.

---

### CORS

```js
app.use(cors());
```

**Purpose:** Enables cross-origin access from AAC devices (web apps, tablets, mobile apps).

---

### Request Timing Middleware

```js
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});
```

**Purpose:** Tracks request processing time for diagnostics and response metadata.

---

### File Upload (Multer)

```js
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});
```

* Files stored in memory, not on disk.
* Maximum size: **10MB**.
* Used only for the `/upload` endpoint.

**Exceptions:**

* `LIMIT_FILE_SIZE` handled by global error handler → returns **413**.
* Missing file handled manually → returns **400**.

---

## Helper Functions

### parseUserAgent(ua)

Extracts browser + device info for diagnostics.

### detectAudioFormat(filename)

Returns audio format from file extension (default `"WAV"`).

### logRequest(data, consentGiven)

Writes request metadata to a daily JSON log file when allowed.

### buildSuccessResponse(params)

Standard camelCase success response wrapper.

### buildErrorResponse(params)

Standard camelCase error response wrapper.

### parsePythonOutput(stdout)

Parses JSON output from Python script.
Supports both **camelCase** and old **PascalCase** formats.

---

## Server Initialization

```js
app.listen(PORT, () => {
    // Styled console startup banner
});
```

**Purpose:** Starts the Express.js server and prints endpoint help.
**Exceptions:**

* `EADDRINUSE` if another process occupies the port.

---

# Routes and Methods

---

# GET /health

### Purpose

System health, supported formats, uptime, and status of Python backend.
Designed for AAC device connectivity checks.

### Success Response Example

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00Z",
  "uptime": 1234,
  "uptimeFormatted": "0h 20m 34s",
  "version": "2.0.0",
  "services": {
    "speechRecognition": true,
    "logging": true
  },
  "supportedFormats": ["WAV","MP3","FLAC","AIFF","OGG","M4A","RAW","PCM"],
  "endpoints": {
    "health": "/health",
    "upload": "/upload",
    "formats": "/formats"
  }
}
```

**Exceptions:** None.

---

# GET /formats

### Purpose

Returns audio formats supported by the API and recommended settings for lowest latency.

### Success Response

```json
{
  "supportedFormats": [...],
  "optimal": {
    "format": "WAV",
    "sampleRate": 16000,
    "bitDepth": 16,
    "channels": 1
  },
  "notes": [
    "WAV format recommended for lowest latency",
    "16kHz sample rate optimal",
    "Mono audio preferred",
    "Raw PCM supported with x-sample-rate header"
  ]
}
```

**Exceptions:** None.

---

# POST /upload

### Purpose

Uploads audio for AAC-optimized speech recognition and returns:

* Transcription
* Confidence values
* Processing metadata
* AAC command detection
* Word timing array
* User & device metadata
* Audio metadata

---

### Headers

| Header              | Purpose                            |
| ------------------- | ---------------------------------- |
| `x-user-id`         | Optional user ID                   |
| `x-session-id`      | Fallback ID                        |
| `x-logging-consent` | `"true"` → enable request logging  |
| `x-command-mode`    | `"true"` → AAC command recognition |
| `x-sample-rate`     | For RAW/PCM audio only             |

---

### Form Fields (multipart/form-data)

| Field         | Type   | Required | Description           |
| ------------- | ------ | -------- | --------------------- |
| `audioFile`   | File   | ✔        | Audio data            |
| `commandMode` | Bool   | ✖        | Alternative to header |
| `userId`      | String | ✖        | Alternative to header |

---

### Successful Response Example

```json
{
  "success": true,
  "transcription": "hello world",
  "confidence": 0.92,
  "service": "Google",
  "processingTimeMs": 320,
  "audio": {
    "filename": "speech.wav",
    "size": 10240,
    "format": "WAV",
    "duration": 1.23,
    "sampleRate": 16000,
    "channels": 1
  },
  "request": {
    "timestamp": "2025-01-01T00:00:00Z",
    "device": "Mobile",
    "browser": "Chrome",
    "userAgent": "Mozilla/5.0 ..."
  },
  "aac": {
    "commandMode": true,
    "commandType": "navigation",
    "isCommand": true
  },
  "wordTiming": [
    { "word": "hello", "start": 0.0, "end": 0.4 },
    { "word": "world", "start": 0.5, "end": 0.9 }
  ]
}
```

---

### Error Responses

#### No file uploaded (400)

```json
{
  "success": false,
  "error": {
    "code": "NO_FILE",
    "message": "No audio file uploaded"
  }
}
```

#### Python backend error (422)

```json
{
  "success": false,
  "error": {
    "code": "AUDIO_ERROR",
    "message": "Could not read audio"
  }
}
```

#### File too large (413)

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Audio file exceeds maximum size (10MB)"
  }
}
```

#### Internal server error (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

### Status Codes

| Status  | Meaning                  |
| ------- | ------------------------ |
| **200** | Successful recognition   |
| **400** | Missing/invalid inputs   |
| **413** | File too large           |
| **422** | Python-recognition error |
| **500** | Server/internal failure  |

---

# 404 Handler

### Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Endpoint GET /foobar not found"
  },
  "availableEndpoints": {
    "GET /health": "Health check and status",
    "GET /formats": "Supported audio formats",
    "POST /upload": "Transcription endpoint"
  }
}
```

---

# Global Error Handler

### Example: File too large

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Audio file exceeds maximum size (10MB)"
  }
}
```

### Example: Unexpected error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Summary Table

| Method | Endpoint   | Description                    | Success Response            | Error Response     |
| ------ | ---------- | ------------------------------ | --------------------------- | ------------------ |
| GET    | `/health`  | Returns server status & uptime | Status metadata             | N/A                |
| GET    | `/formats` | Lists supported audio formats  | Format list                 | N/A                |
| POST   | `/upload`  | Audio → transcription          | Full transcription response | 400, 413, 422, 500 |

---

## Notes

* Run from this directory with:

  ```bash
  node .
  ```
* Test suite:

  ```bash
  npm test
  ```
* Logging only occurs with consent (`x-logging-consent: true`).
* Python backend (`speechRecognition.py`) must exist and be executable.
* Recommended audio settings: **WAV, 16kHz, mono**.

---

**End of Document**
