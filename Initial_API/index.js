/**
 * Author: Kieran Plenn
 * Date: 10/03/2025
 * Description: This is a basic initialization of an API. Instructions were followed from this
 *              video: https://www.youtube.com/watch?v=-MTSQjw5DrM
 * 
 * Note: Key 'bug' fix was to make sure the app.listen() function was not deleted. 
 * 
 * Run: Make sure you're in the Initial_API directory. Enter 'node .' into the terminal to start
 *      the API. Check http://localhost:8080 for success.
 * 
 * Last Edit (10/10/2025): Changed code to allow for unit testing with Jest
 * 
 * Update by Andrew Blass:
 * - added new post function for uploading audio file and recieving back a message
 * - new tests added to confirm responses for when file is and isnt attached to the request
 * - audio processing to translate speech to text still needed
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const PORT = 8080;
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Directory for storing logs (with consent)
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Helper function to parse user agent
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
    
    // Detect device
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
    else device = 'Desktop';
    
    return { browser, device };
}

// Helper function to log request data (with consent)
function logRequest(data, consentGiven) {
    if (!consentGiven) return; // Only log if consent is given
    
    const logFile = path.join(LOG_DIR, `requests-${new Date().toISOString().split('T')[0]}.json`);
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...data
    };
    
    // Append to log file
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

// Middleware to parse JSON
app.use(express.json());
app.use(cors());
// GET
app.get('/test', (req, res) => {
    res.status(200).send({
        name: 'Test1',
        status: 'test'
    });
});

// POST
app.post('/test/:id', (req, res) => {
    const { id } = req.params;
    const { info } = req.body;

    if (!info) {
        return res.status(418).send({ message: 'No info!' });
    }

    res.send({
        name: `Test message with info: ${info} and ID: ${id}`,
    });
});

app.post('/upload', upload.single("audioFile"), async (req, res) => {
    // Capture request metadata even for error cases
    const requestTime = new Date().toISOString();
    const userAgent = req.get('user-agent') || 'Unknown';
    const { browser, device } = parseUserAgent(userAgent);
    const userId = req.get('x-user-id') || req.body.userId || req.get('x-session-id') || null;
    
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
    // In production, this should be explicitly set by the client
    const consentGiven = req.get('x-logging-consent') === 'true' || 
                        req.body.loggingConsent === true ||
                        process.env.NODE_ENV !== 'production'; // Auto-consent in development

    const audioBuffer = req.file.buffer;
    const filename = req.file.originalname;
    const fileSize = req.file.size;
    
    // Detect format from filename extension
    const fileExtension = filename.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    const detectedFormat = ['WAV', 'MP3', 'FLAC', 'AIFF', 'OGG', 'M4A'].includes(fileExtension) 
        ? fileExtension 
        : 'WAV'; // Default to WAV if unknown

    try {
        // Call Python script
        const python = spawn(process.platform === "win32" ? "python" : "python3", [
            path.join(__dirname, 'speech2.py')
        ]);

        // Send audio data to Python script via stdin
        python.stdin.write(audioBuffer);
        python.stdin.end();

        let result = '';
        let error = '';

        // Collect output
        python.stdout.on('data', (data) => {
            result += data.toString();
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Wait for completion
        python.on('close', (code) => {
            let pythonResult = null;
            let transcription = null;
            let duration = null;
            let format = detectedFormat;
            let sampleRate = null;
            let success = false;
            let errorCode = null;
            let errorMessage = null;

            // Try to parse JSON response from Python
            try {
                const trimmedResult = result.trim();
                if (trimmedResult) {
                    pythonResult = JSON.parse(trimmedResult);
                    success = pythonResult.success === true;
                    transcription = pythonResult.transcription || null;
                    duration = pythonResult.duration || null;
                    format = pythonResult.format || format;
                    sampleRate = pythonResult.sample_rate || null;
                    
                    if (!success) {
                        errorCode = pythonResult.error_code || 'PROCESSING_ERROR';
                        errorMessage = pythonResult.error_message || 'Unknown error';
                    }
                }
            } catch (parseError) {
                // Fallback: if JSON parsing fails, treat as plain text transcription
                transcription = result.trim() || null;
                success = code === 0 && transcription !== null && transcription !== '';
                if (!success) {
                    errorCode = 'PARSE_ERROR';
                    errorMessage = 'Failed to parse Python script output';
                }
            }

            // Build comprehensive response
            const responseData = {
                success: success && code === 0,
                transcription: transcription,
                
                // Audio file metadata
                audio: {
                    filename: filename,
                    size: fileSize,
                    sizeBytes: fileSize,
                    format: format,
                    duration: duration, // in seconds
                    sampleRate: sampleRate,
                    mimeType: req.file.mimetype || `audio/${format.toLowerCase()}`
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
                error: success ? undefined : {
                    code: errorCode || `PYTHON_EXIT_${code}`,
                    message: errorMessage || error || 'Audio processing failed',
                    pythonExitCode: code
                }
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
            if (code !== 0 || !success) {
                return res.status(300).send(responseData);
            }

            res.status(200).send(responseData);
        });

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

// Only start server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => console.log(`it's alive on http://localhost:${PORT}`));
}

// Export app for testing
module.exports = app;