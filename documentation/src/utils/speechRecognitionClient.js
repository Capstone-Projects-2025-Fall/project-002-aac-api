/**
 * Browser-compatible client wrapper for aac-speech-recognition library
 * For use in React/Next.js client components
 * Provides the same API interface as the Node.js library but uses HTTP calls
 */

/**
 * Transcribe audio blob using the aac-speech-recognition library API
 * @param {Blob} audioBlob - Audio file blob (from MediaRecorder, File, etc.)
 * @param {Object} options - Configuration options
 * @param {string} options.apiUrl - API endpoint URL (default: http://localhost:8080/upload)
 * @param {string} options.speechApis - Comma-separated list of APIs to use (default: whisper,google,sphinx)
 * @returns {Promise<Object>} Transcription result with confidence scores
 */
export async function transcribeAudio(audioBlob, options = {}) {
  if (!audioBlob || !(audioBlob instanceof Blob)) {
    throw new Error('Invalid audio blob provided');
  }

  const apiUrl = options.apiUrl || 'http://localhost:8080/upload';
  const formData = new FormData();
  formData.append('audioFile', audioBlob, 'recording.wav');

  // Add custom headers if speechApis is specified
  const headers = {};
  if (options.speechApis) {
    headers['x-speech-apis'] = options.speechApis;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: headers
    });

    const data = await response.json();

    // Handle error responses
    if (response.status === 300 || !response.ok) {
      const error = new Error(data.error?.message || data.error?.code || 'Transcription failed');
      error.code = data.error?.code || 'PROCESSING_ERROR';
      error.response = data;
      throw error;
    }

    // Return result in the same format as the Node.js library
    return {
      success: data.success !== false,
      transcription: data.transcription || null,
      
      // Confidence scores
      confidenceScore: data.confidenceScore || null,
      aggregatedConfidenceScore: data.aggregatedConfidenceScore || null,
      selectedApi: data.selectedApi || null,
      apiResults: data.apiResults || null,
      
      // Audio metadata
      duration: data.audio?.duration || null,
      format: data.audio?.format || null,
      sampleRate: data.audio?.sampleRate || null,
      
      // Error information (if any)
      error: data.error ? {
        code: data.error.code,
        message: data.error.message
      } : undefined
    };
  } catch (error) {
    // Re-throw if it's already our formatted error
    if (error.code) {
      throw error;
    }
    
    // Wrap network errors
    const wrappedError = new Error(`Failed to transcribe audio: ${error.message}`);
    wrappedError.code = 'NETWORK_ERROR';
    wrappedError.originalError = error;
    throw wrappedError;
  }
}

/**
 * Parse user agent string to extract browser and device info
 * Browser-compatible version (same interface as library)
 * @param {string} userAgent - User agent string
 * @returns {Object} Parsed user agent info
 */
export function parseUserAgent(userAgent) {
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

// Export default object matching library structure
export default {
  transcribeAudio,
  parseUserAgent
};
