/**
 * Express Server for Speech Recognition API
 * Uses the speechRecognition library
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { transcribeAudio, parseUserAgent, logRequest } = require('./lib/speechRecognition');

const app = express();
const PORT = process.env.PORT || 8080;

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(cors());

/**
 * POST /upload - Upload audio file for transcription
 */
app.post('/upload', upload.single("audioFile"), async (req, res) => {
    // Capture request metadata even for error cases
    const requestTime = new Date().toISOString();
    const userAgent = req.get('user-agent') || 'Unknown';
    const { browser, device } = parseUserAgent(userAgent);
    const userId = req.get('x-user-id') || (req.body && req.body.userId) || req.get('x-session-id') || null;
    
    if (!req.file) {
        const errorResponse = {
            success: false,
            transcription: null,
            audio: null,
            request: {
                timestamp: requestTime,
                device: device,
                browser: browser,
                userAgent: userAgent
            },
            user: userId ? { id: userId } : undefined,
            error: {
                code: 'NO_FILE',
                message: 'No audio file uploaded'
            }
        };
        return res.status(418).send(errorResponse);
    }

    // Check for logging consent (default to true for development/testing)
    const consentGiven = req.get('x-logging-consent') === 'true' || 
                        req.body.loggingConsent === true ||
                        process.env.NODE_ENV !== 'production';

    const audioBuffer = req.file.buffer;
    const filename = req.file.originalname;
    const fileSize = req.file.size;
    
    // Detect format from filename extension
    const fileExtension = filename.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    const detectedFormat = ['WAV', 'MP3', 'FLAC', 'AIFF', 'OGG', 'M4A'].includes(fileExtension) 
        ? fileExtension 
        : 'WAV';

    try {
        // Get API configuration from environment or request
        const speechApis = req.get('x-speech-apis') || process.env.SPEECH_APIS;
        
        // Use library to transcribe audio
        const transcriptionResult = await transcribeAudio(audioBuffer, {
            speechApis: speechApis
        });

        // Build comprehensive response
        const responseData = {
            success: transcriptionResult.success,
            transcription: transcriptionResult.transcription,
            
            // Confidence scores
            confidenceScore: transcriptionResult.confidenceScore,
            aggregatedConfidenceScore: transcriptionResult.aggregatedConfidenceScore,
            selectedApi: transcriptionResult.selectedApi,
            apiResults: transcriptionResult.apiResults,
            
            // Audio file metadata
            audio: {
                filename: filename,
                size: fileSize,
                sizeBytes: fileSize,
                format: transcriptionResult.format || detectedFormat,
                duration: transcriptionResult.duration,
                sampleRate: transcriptionResult.sampleRate,
                mimeType: req.file.mimetype || `audio/${(transcriptionResult.format || detectedFormat).toLowerCase()}`
            },
            
            // Request metadata
            request: {
                timestamp: requestTime,
                device: device,
                browser: browser,
                userAgent: userAgent
            },
            
            // User identifier (only included if provided)
            user: userId ? { id: userId } : undefined,
            
            // Error information (if any)
            error: transcriptionResult.error
        };

        // Log request server-side (with consent)
        if (consentGiven) {
            logRequest({
                ...responseData,
                audioBufferSize: audioBuffer.length,
                ipAddress: req.ip || req.connection.remoteAddress
            }, consentGiven);
        }

        // Send response
        if (transcriptionResult.success) {
            res.status(200).send(responseData);
        } else {
            res.status(300).send(responseData);
        }

    } catch (error) {
        const errorResponse = {
            success: false,
            transcription: null,
            audio: {
                filename: filename,
                size: fileSize,
                sizeBytes: fileSize,
                format: detectedFormat
            },
            request: {
                timestamp: requestTime,
                device: device,
                browser: browser,
                userAgent: userAgent
            },
            user: userId ? { id: userId } : undefined,
            error: {
                code: 'SERVER_ERROR',
                message: error.message
            }
        };

        // Log error (with consent)
        if (consentGiven) {
            logRequest({
                ...errorResponse,
                audioBufferSize: audioBuffer ? audioBuffer.length : 0,
                ipAddress: req.ip || req.connection.remoteAddress
            }, consentGiven);
        }

        res.status(500).send(errorResponse);
    }
});

module.exports = app;

