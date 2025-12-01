/**
 * Speech Recognition Library
 * Core functionality for multi-API speech-to-text transcription
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Transcribe audio buffer using multi-API speech recognition
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {Object} options - Configuration options
 * @param {string} options.pythonPath - Path to Python executable (default: auto-detect)
 * @param {string} options.speechApis - Comma-separated list of APIs to use (default: whisper,google,sphinx)
 * @returns {Promise<Object>} Transcription result with confidence scores
 */
function transcribeAudio(audioBuffer, options = {}) {
    return new Promise((resolve, reject) => {
        if (!audioBuffer || !Buffer.isBuffer(audioBuffer)) {
            return reject(new Error('Invalid audio buffer provided'));
        }

        // Determine Python path
        let pythonCmd = options.pythonPath;
        if (!pythonCmd) {
            if (process.platform === "win32") {
                pythonCmd = "python";
            } else {
                // Check for Homebrew Python first (better for packages like Whisper)
                const homebrewPython = "/opt/homebrew/bin/python3.11";
                if (fs.existsSync(homebrewPython)) {
                    pythonCmd = homebrewPython;
                } else {
                    pythonCmd = "python3";
                }
            }
        }

        // Set API list in environment if provided
        const env = { ...process.env };
        if (options.speechApis) {
            env.SPEECH_APIS = options.speechApis;
        }

        // Call Python script
        const python = spawn(pythonCmd, [
            path.join(__dirname, '..', 'speech2.py')
        ], { env });

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
            let confidenceScore = null;
            let aggregatedConfidenceScore = null;
            let selectedApi = null;
            let apiResults = null;
            let duration = null;
            let format = null;
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
                    format = pythonResult.format || null;
                    sampleRate = pythonResult.sample_rate || null;
                    
                    // Extract confidence scores and API results
                    confidenceScore = pythonResult.confidenceScore || null;
                    aggregatedConfidenceScore = pythonResult.aggregatedConfidenceScore || null;
                    selectedApi = pythonResult.selectedApi || null;
                    apiResults = pythonResult.apiResults || null;
                    
                    if (!success) {
                        // Check if there are API results with error information
                        if (apiResults && apiResults.length > 0 && apiResults[0].error) {
                            errorCode = apiResults[0].error.code || pythonResult.error_code || 'PROCESSING_ERROR';
                            errorMessage = apiResults[0].error.message || pythonResult.error_message || error || 'Unknown error';
                        } else {
                            errorCode = pythonResult.error_code || 'PROCESSING_ERROR';
                            errorMessage = pythonResult.error_message || error || 'Unknown error';
                        }
                    }
                } else if (error) {
                    // If no result but there's an error, use the error
                    errorCode = 'PYTHON_ERROR';
                    errorMessage = error || 'Python script produced no output';
                }
            } catch (parseError) {
                // Fallback: if JSON parsing fails, treat as plain text transcription
                transcription = result.trim() || null;
                success = code === 0 && transcription !== null && transcription !== '';
                if (!success) {
                    errorCode = 'PARSE_ERROR';
                    errorMessage = `Failed to parse Python script output: ${parseError.message}. Python error: ${error || 'none'}`;
                }
            }

            const resultData = {
                success: success && code === 0,
                transcription: transcription,
                
                // Confidence scores
                confidenceScore: confidenceScore,
                aggregatedConfidenceScore: aggregatedConfidenceScore,
                selectedApi: selectedApi,
                apiResults: apiResults, // Results from all APIs tried
                
                // Audio metadata
                duration: duration,
                format: format,
                sampleRate: sampleRate,
                
                // Error information (if any)
                error: success ? undefined : {
                    code: errorCode || `PYTHON_EXIT_${code}`,
                    message: errorMessage || error || 'Audio processing failed',
                    pythonExitCode: code
                }
            };

            if (success && code === 0) {
                resolve(resultData);
            } else {
                reject(new Error(errorMessage || 'Transcription failed'));
            }
        });

        python.on('error', (err) => {
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });
    });
}

/**
 * Parse user agent string to extract browser and device info
 * @param {string} userAgent - User agent string
 * @returns {Object} Parsed user agent info
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
    
    // Detect device
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
    else device = 'Desktop';
    
    return { browser, device };
}

/**
 * Log request data to file (with consent)
 * @param {Object} data - Data to log
 * @param {boolean} consentGiven - Whether user consented to logging
 * @param {string} logDir - Directory for log files (default: ./logs)
 */
function logRequest(data, consentGiven, logDir = null) {
    if (!consentGiven) return; // Only log if consent is given
    
    const LOG_DIR = logDir || path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
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

module.exports = {
    transcribeAudio,
    parseUserAgent,
    logRequest
};

