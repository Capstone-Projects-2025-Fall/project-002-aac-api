/**
 * Entry point for Speech Recognition API
 * Can be used as a library or run as a server
 * 
 * Usage as server:
 *   node index.js
 *   or
 *   npm start
 * 
 * Usage as library:
 *   const { transcribeAudio } = require('./index');
 *   const result = await transcribeAudio(audioBuffer);
 */

const app = require('./server');
const { transcribeAudio, parseUserAgent, logRequest } = require('./lib/speechRecognition');

const PORT = process.env.PORT || 8080;

// Export library functions
module.exports = {
    transcribeAudio,
    parseUserAgent,
    logRequest,
    app // Express app for custom server setups
};

// Start server if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Speech Recognition API is alive on http://localhost:${PORT}`);
    });
}