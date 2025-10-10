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
 */

const express = require('express');
const multer = require('multer');
const app = express();
const PORT = 8080;

const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON
app.use(express.json());

// GET
app.get('/test', upload.single("audioFile"), (req, res) => {
    if(!req.file){
        res.status(400).send('No audio file uploaded.');
    }else{
        res.status(200).send({
            name: 'Test1',
            status: 'test'
        });
    }
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

// Only start server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => console.log(`it's alive on http://localhost:${PORT}`));
}

// Export app for testing
module.exports = app;