const path = require('path');
const request = require('supertest');
const app = require('../index'); // Import your Express app

describe('Basic API Tests', () => {

  //checking if status code is correct when file is not given
  it('POST /upload without file should return 418', async () => {
    const res = await request(app)
      .post('/upload')
      .send({});
    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({ message: 'No audio file uploaded' });
  });

  //checking if staus code is correct when file cannot be transcribed
  it('POST /upload with empty file should return 300 and message', async () => {
    const filePath = path.join(__dirname, 'test-audio.mp3');
    const res = await request(app)
      .post('/upload')
      .attach('audioFile', filePath);
    expect(res.statusCode).toBe(300);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Audio processing failed/i);
  });

  //checking if status code is correct when file is given able to be transcribed
  it('POST /upload with TestRecording file should return 200 and have message', async () =>{
    const filePath = path.join(__dirname, 'TestRecording.wav');
    const res = await request(app)
      .post('/upload')
      .attach('audioFile', filePath);
    expect(res.statusCode).toBe(200);
  });

  //checking if speech to text is accurate to the file
    it('POST /upload with TestRecording file should return correct transcript', async () =>{
    const filePath = path.join(__dirname, 'TestRecording.wav');
    const res = await request(app)
      .post('/upload')
      .attach('audioFile', filePath);
    expect(res.body.transcription).toMatch(/ice cream trucks are really cool/i);
  });
});
