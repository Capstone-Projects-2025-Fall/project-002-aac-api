/**
 * AAC Board Speech Recognition API
 * =================================
 * REST API for speech-to-text optimized for AAC (Augmentative and Alternative Communication) devices.
 * 
 * Features:
 * - Multiple recognition backends with fallback (Google, Vosk offline)
 * - Command mode for faster AAC command recognition
 * - Word-level timing information
 * - Standardized camelCase JSON responses
 * - Health check endpoint for device connectivity testing
 * - Consent-based logging
 * 
 * Author: Kieran Plenn (original), Andrew Blass (audio upload), Gio (AAC improvements)
 * 
 * Run: node . (from this directory)
 * Test: npm test
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    }
});

// Directory for storing logs (with consent)
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Python script path
const SPEECH_SCRIPT = path.join(__dirname, 'speechRecognition.py');

// Supported audio formats
const SUPPORTED_FORMATS = ['WAV', 'MP3', 'FLAC', 'AIFF', 'OGG', 'M4A', 'RAW', 'PCM'];

// Server start time for uptime tracking
const SERVER_START_TIME = Date.now();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse user agent string to extract browser and device info
 * @param {string} userAgent - User agent string
 * @returns {{browser: string, device: string}}
 */
function parseUserAgent(userAgent) {
    if (!userAgent) return { browser: 'Unknown', device: 'Unknown' };
    
    const ua = userAgent.toLowerCase();
    let browser = 'Unknown';
    let device = 'Unknown';
    
    // Detect browser
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';
    
    // Detect device type
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
    else device = 'Desktop';
    
    return { browser, device };
}

/**
 * Detect audio format from filename extension
 * @param {string} filename - Original filename
 * @returns {string} Detected format or 'WAV' as default
 */
function detectAudioFormat(filename) {
    if (!filename) return 'WAV';
    const ext = filename.split('.').pop()?.toUpperCase() || 'WAV';
    return SUPPORTED_FORMATS.includes(ext) ? ext : 'WAV';
}

/**
 * Log request data (only with user consent)
 * @param {object} data - Data to log
 * @param {boolean} consentGiven - Whether logging consent was given
 */
function logRequest(data, consentGiven) {
    if (!consentGiven) return;
    
    const logFile = path.join(LOG_DIR, `requests-${new Date().toISOString().split('T')[0]}.json`);
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...data
    };
    
    let logs = [];
    if (fs.existsSync(logFile)) {
        try {
            const content = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(content);
        } catch (e) {
            logs = [];
        }
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

/**
 * Build standardized success response (camelCase)
 * @param {object} params - Response parameters
 * @returns {object} Formatted response
 */
function buildSuccessResponse({ 
    transcription, 
    confidence, 
    service, 
    processingTimeMs,
    audio,
    request,
    userId,
    aac,
    wordTiming,
    warnings
}) {
    const response = {
        success: true,
        transcription,
        confidence,
        service,
        processingTimeMs,
        audio,
        request,
        aac
    };

    // Only include optional fields if they have values
    if (userId) response.user = { id: userId };
    if (wordTiming && wordTiming.length > 0) response.wordTiming = wordTiming;
    if (warnings && warnings.length > 0) response.warnings = warnings;

    return response;
}

/**
 * Build standardized error response (camelCase)
 * @param {object} params - Error parameters
 * @returns {object} Formatted error response
 */
function buildErrorResponse({
    errorCode,
    errorMessage,
    audio,
    request,
    userId,
    processingTimeMs,
    errorDetails,
    warnings
}) {
    const response = {
        success: false,
        transcription: null,
        processingTimeMs: processingTimeMs || 0,
        error: {
            code: errorCode,
            message: errorMessage
        },
        request
    };

    if (audio) response.audio = audio;
    if (userId) response.user = { id: userId };
    if (errorDetails) response.error.details = errorDetails;
    if (warnings && warnings.length > 0) response.warnings = warnings;

    return response;
}

/**
 * Parse Python script JSON output, handling both old and new formats
 * @param {string} output - Raw stdout from Python script
 * @returns {object} Parsed result
 */
function parsePythonOutput(output) {
    const trimmed = output.trim();
    if (!trimmed) return null;

    try {
        const parsed = JSON.parse(trimmed);
        
        // Handle both old (PascalCase) and new (camelCase) formats for backwards compatibility
        return {
            success: parsed.success ?? parsed.Success ?? false,
            transcription: parsed.transcription ?? parsed.Transcription ?? null,
            confidence: parsed.confidence ?? parsed.Confidence ?? null,
            service: parsed.service ?? parsed.Service ?? null,
            processingTimeMs: parsed.processingTimeMs ?? null,
            duration: parsed.audio?.duration ?? parsed.duration ?? null,
            sampleRate: parsed.audio?.sampleRate ?? parsed.sample_rate ?? null,
            format: parsed.audio?.format ?? parsed.format ?? null,
            channels: parsed.audio?.channels ?? parsed.channels ?? 1,
            errorCode: parsed.error?.code ?? parsed.Error_code ?? null,
            errorMessage: parsed.error?.message ?? parsed.Error_message ?? null,
            errorDetails: parsed.error?.details ?? parsed.Error_details ?? null,
            warnings: parsed.warnings ?? parsed.Warnings ?? [],
            aac: parsed.aac ?? null,
            wordTiming: parsed.wordTiming ?? parsed.Words ?? null
        };
    } catch (e) {
        return null;
    }
}

// =============================================================================
// Middleware
// =============================================================================

app.use(express.json());
app.use(cors());

// Request timing middleware
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// =============================================================================
// Routes
// =============================================================================

/**
 * Health check endpoint
 * GET /health
 * 
 * Returns server status and model availability for AAC device connectivity testing.
 */
app.get('/health', (req, res) => {
    const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
    
    // Check if Python script exists
    const scriptExists = fs.existsSync(SPEECH_SCRIPT);
    
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: uptime,
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
        version: '2.0.0',
        services: {
            speechRecognition: scriptExists,
            logging: fs.existsSync(LOG_DIR)
        },
        supportedFormats: SUPPORTED_FORMATS,
        endpoints: {
            health: '/health',
            upload: '/upload',
            formats: '/formats'
        }
    });
});

/**
 * Supported formats endpoint
 * GET /formats
 * 
 * Returns information about supported audio formats and optimal settings.
 */
app.get('/formats', (req, res) => {
    res.status(200).json({
        supportedFormats: SUPPORTED_FORMATS,
        optimal: {
            format: 'WAV',
            sampleRate: 16000,
            bitDepth: 16,
            channels: 1
        },
        notes: [
            'WAV format recommended for lowest latency',
            '16kHz sample rate optimal for speech recognition',
            'Mono audio preferred (stereo will be converted)',
            'Raw PCM supported with x-sample-rate header'
        ]
    });
});

/**
 * Audio upload and transcription endpoint
 * POST /upload
 * 
 * Accepts audio file and returns transcription with AAC-optimized metadata.
 * 
 * Headers:
 *   x-user-id: Optional user identifier
 *   x-session-id: Optional session identifier
 *   x-logging-consent: 'true' to enable server-side logging
 *   x-command-mode: 'true' to enable AAC command recognition mode
 *   x-sample-rate: Sample rate for raw PCM audio
 * 
 * Body:
 *   audioFile: Audio file (multipart/form-data)
 *   commandMode: Boolean to enable command mode (alternative to header)
 */
app.post('/upload', upload.single("audioFile"), async (req, res) => {
    const requestStartTime = Date.now();
    const requestTimestamp = new Date().toISOString();
    const userAgent = req.get('user-agent') || 'Unknown';
    const { browser, device } = parseUserAgent(userAgent);
    const userId = req.get('x-user-id') || req.body?.userId || req.get('x-session-id') || null;
    
    // Check for command mode
    const commandMode = req.get('x-command-mode') === 'true' || 
                       req.body?.commandMode === true ||
                       req.body?.commandMode === 'true';

    // Build request metadata
    const requestMeta = {
        timestamp: requestTimestamp,
        device: device,
        browser: browser,
        userAgent: userAgent
    };

    // Validate file upload
    if (!req.file) {
        const processingTimeMs = Date.now() - requestStartTime;
        const errorResponse = buildErrorResponse({
            errorCode: 'NO_FILE',
            errorMessage: 'No audio file uploaded',
            request: requestMeta,
            userId,
            processingTimeMs
        });
        return res.status(400).json(errorResponse);
    }

    // Check for logging consent
    const consentGiven = req.get('x-logging-consent') === 'true' || 
                        req.body?.loggingConsent === true ||
                        process.env.NODE_ENV !== 'production';

    const audioBuffer = req.file.buffer;
    const filename = req.file.originalname || 'unknown.wav';
    const fileSize = req.file.size;
    const detectedFormat = detectAudioFormat(filename);
    const mimeType = req.file.mimetype || `audio/${detectedFormat.toLowerCase()}`;

    // Build audio metadata
    const audioMeta = {
        filename: filename,
        size: fileSize,
        sizeBytes: fileSize,
        format: detectedFormat,
        mimeType: mimeType,
        duration: null,
        sampleRate: null,
        channels: null
    };

    try {
        // Build Python command with optional flags
        const pythonCmd = process.platform === "win32" ? "python" : "python3";
        const pythonArgs = [SPEECH_SCRIPT];
        
        if (commandMode) {
            pythonArgs.push('--command-mode');
        }

        // Spawn Python process
        const python = spawn(pythonCmd, pythonArgs);

        // Send audio data to Python script via stdin
        python.stdin.write(audioBuffer);
        python.stdin.end();

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Handle process completion
        python.on('close', (code) => {
            const processingTimeMs = Date.now() - requestStartTime;
            
            // Parse Python output
            const pythonResult = parsePythonOutput(stdout);

            if (!pythonResult) {
                // Failed to parse Python output
                const errorResponse = buildErrorResponse({
                    errorCode: 'PARSE_ERROR',
                    errorMessage: 'Failed to parse speech recognition output',
                    audio: audioMeta,
                    request: requestMeta,
                    userId,
                    processingTimeMs
                });

                if (consentGiven) {
                    logRequest({ ...errorResponse, stderr }, consentGiven);
                }

                return res.status(500).json(errorResponse);
            }

            // Update audio metadata from Python result
            if (pythonResult.duration) audioMeta.duration = pythonResult.duration;
            if (pythonResult.sampleRate) audioMeta.sampleRate = pythonResult.sampleRate;
            if (pythonResult.format) audioMeta.format = pythonResult.format;
            if (pythonResult.channels) audioMeta.channels = pythonResult.channels;

            if (pythonResult.success && code === 0) {
                // Success response
                const successResponse = buildSuccessResponse({
                    transcription: pythonResult.transcription,
                    confidence: pythonResult.confidence,
                    service: pythonResult.service,
                    processingTimeMs: pythonResult.processingTimeMs || processingTimeMs,
                    audio: audioMeta,
                    request: requestMeta,
                    userId,
                    aac: pythonResult.aac || {
                        commandMode: commandMode,
                        commandType: null,
                        isCommand: false
                    },
                    wordTiming: pythonResult.wordTiming,
                    warnings: pythonResult.warnings
                });

                if (consentGiven) {
                    logRequest(successResponse, consentGiven);
                }

                return res.status(200).json(successResponse);
            } else {
                // Error response from Python
                const errorResponse = buildErrorResponse({
                    errorCode: pythonResult.errorCode || `PYTHON_EXIT_${code}`,
                    errorMessage: pythonResult.errorMessage || stderr || 'Audio processing failed',
                    audio: audioMeta,
                    request: requestMeta,
                    userId,
                    processingTimeMs: pythonResult.processingTimeMs || processingTimeMs,
                    errorDetails: pythonResult.errorDetails,
                    warnings: pythonResult.warnings
                });

                if (consentGiven) {
                    logRequest(errorResponse, consentGiven);
                }

                // Use 422 for processing errors, 500 for system errors
                const statusCode = pythonResult.errorCode ? 422 : 500;
                return res.status(statusCode).json(errorResponse);
            }
        });

        // Handle Python process errors
        python.on('error', (err) => {
            const processingTimeMs = Date.now() - requestStartTime;
            const errorResponse = buildErrorResponse({
                errorCode: 'PROCESS_ERROR',
                errorMessage: `Failed to start speech recognition: ${err.message}`,
                audio: audioMeta,
                request: requestMeta,
                userId,
                processingTimeMs
            });

            if (consentGiven) {
                logRequest(errorResponse, consentGiven);
            }

            return res.status(500).json(errorResponse);
        });

    } catch (error) {
        const processingTimeMs = Date.now() - requestStartTime;
        const errorResponse = buildErrorResponse({
            errorCode: 'SERVER_ERROR',
            errorMessage: error.message,
            audio: audioMeta,
            request: requestMeta,
            userId,
            processingTimeMs
        });

        if (consentGiven) {
            logRequest(errorResponse, consentGiven);
        }

        return res.status(500).json(errorResponse);
    }
});

/**
 * 404 handler for unknown routes
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`
        },
        availableEndpoints: {
            'GET /health': 'Health check and server status',
            'GET /formats': 'Supported audio formats',
            'POST /upload': 'Upload audio for transcription'
        }
    });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: 'Audio file exceeds maximum size (10MB)'
            }
        });
    }

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        }
    });
});

// =============================================================================
// Server Startup
// =============================================================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║           AAC Speech Recognition API v2.0.0                ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT.toString().padEnd(21)}║
║                                                            ║
║  Endpoints:                                                ║
║    GET  /health   - Health check & status                  ║
║    GET  /formats  - Supported audio formats                ║
║    POST /upload   - Upload audio for transcription         ║
║                                                            ║
║  Features:                                                 ║
║    • Command mode: x-command-mode: true                    ║
║    • Word timing in responses                              ║
║    • camelCase JSON responses                              ║
╚════════════════════════════════════════════════════════════╝
        `);
    });
}