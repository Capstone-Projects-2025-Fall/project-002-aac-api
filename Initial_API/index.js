/**
 * Author: Kieran Plenn
 * Date: 10/03/2025
 * Description: This is a basic initialization of an API. Instructions were followed from this
 *              video: https://www.youtube.com/watch?v=-MTSQjw5DrM
 * Note: Key 'bug' fix was to make sure the app.listen() function was not deleted. 
 */

const express = require('express');
const app = express();
const PORT = 8080;

// Middleware to parse JSON
app.use( express.json() )

// Runs API on server
app.listen(
    PORT,
    () => console.log(`it's alive on http://localhost:${PORT}`)
)

// GET
app.get('/test', (req, res) => {
    res.status(200).send({
        name: 'Test1',
        status: 'test'
    })
});

//POST
app.post('/test/:id', (req, res) => {
    const{ id } = req.params
    const{ info } = req.body

    if (!info) {
        res.status(418).send({ message: 'No info!' })
    }

    res.send({
        name: `Test message with info: ${info} and ID: ${id}`,
    });
});