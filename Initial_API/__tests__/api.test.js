const path = require('path');
const request = require('supertest');
const app = require('../index'); // Import your Express app

describe('Basic API Tests', () => {

  it('GET /test should return 200 and correct JSON', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      name: 'Test1',
      status: 'test'
    });
  });

  it('POST /test/:id with info should return 200 and message', async () => {
    const res = await request(app)
      .post('/test/123')
      .send({ info: 'hello' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      name: 'Test message with info: hello and ID: 123'
    });
  });

  it('POST /test/:id without info should return 418', async () => {
    const res = await request(app)
      .post('/test/123')
      .send({});
    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({ message: 'No info!' });
  });

  it('POST /upload without file should return 418 with error structure', async () => {
    const res = await request(app)
      .post('/upload')
      .send({});
    expect(res.statusCode).toBe(418);
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error.code).toBe('NO_FILE');
    expect(res.body).toHaveProperty('request');
    expect(res.body.request).toHaveProperty('timestamp');
  });

  it('POST /upload with file should return 200 with comprehensive metadata', async () => {
    // Use WAV file since speech_recognition only supports WAV, FLAC, AIFF
    const filePath = path.join(__dirname, 'TestRecording.wav');
    const res = await request(app)
      .post('/upload')
      .attach('audioFile', filePath);
    
    // Response structure validation
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('transcription');
    expect(res.body).toHaveProperty('audio');
    expect(res.body.audio).toHaveProperty('filename');
    expect(res.body.audio).toHaveProperty('size');
    expect(res.body.audio).toHaveProperty('sizeBytes');
    expect(res.body.audio).toHaveProperty('format');
    expect(res.body).toHaveProperty('request');
    expect(res.body.request).toHaveProperty('timestamp');
    expect(res.body.request).toHaveProperty('device');
    expect(res.body.request).toHaveProperty('browser');
    expect(res.body.request).toHaveProperty('userAgent');
  });

  it('POST /upload should capture user identifier from header', async () => {
    const filePath = path.join(__dirname, 'TestRecording.wav');
    const res = await request(app)
      .post('/upload')
      .set('X-User-Id', 'test-user-123')
      .attach('audioFile', filePath);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.id).toBe('test-user-123');
  });

  it('POST /upload should include logging consent header', async () => {
    const filePath = path.join(__dirname, 'TestRecording.wav');
    const res = await request(app)
      .post('/upload')
      .set('X-Logging-Consent', 'true')
      .attach('audioFile', filePath);
    
    expect(res.statusCode).toBe(200);
    // In development, consent defaults to true, so logs should be created
    // We can verify the response structure includes all metadata
    expect(res.body).toHaveProperty('audio');
    expect(res.body).toHaveProperty('request');
  });

  it('POST /upload should return error information on failure', async () => {
    // This test verifies error structure when processing fails
    const filePath = path.join(__dirname, 'TestRecording.wav');
    const res = await request(app)
      .post('/upload')
      .attach('audioFile', filePath);
    
    // Whether success or failure, the structure should be consistent
    expect(res.body).toHaveProperty('success');
    if (!res.body.success) {
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
    }
  });
});
