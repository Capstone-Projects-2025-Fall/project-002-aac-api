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
 *      The swagger documentation is available at http://localhost:8080/api-docs
 * 
 * Last Edit (10/13/2025): Updated the code to include swagger-autogen for automatic documentation 
 *                     generation. Added scripts to package.json for easy regeneration of docs.
 */

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');
const swaggerSpec = require('./swagger_output.json');
 * Last Edit (10/10/2025): Changed code to allow for unit testing with Jest
 * 
 * Update by Andrew Blass:
 * - added new post function for uploading audio file and recieving back a message
 * - new tests added to confirm responses for when file is and isnt attached to the request
 * - audio processing to translate speech to text still needed
 */

const express = require('express');
const multer = require('multer');
const app = express();
const PORT = 8080;

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to parse JSON
app.use(express.json());

// Swagger route setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Command to regenerate swagger docs: npm run swagger-autogen

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

app.post('/upload', upload.single("audioFile"), (req, res) =>{
    if(!req.file){
        return res.status(418).send({message: 'No audio file uploaded'});
    }

    //access the file buffer
    const audioBuffer = req.file.buffer;

    //insert audio processing here

    //return message
    res.status(200).send({
        message: 'Received audio file: ${req.file.originalname}',
        size: req.file.size + ' bytes'
    });
});

// Only start server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`it's alive on http://localhost:${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
}

// Export app for testing
module.exports = app;