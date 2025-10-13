const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Create test app without starting server
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'AAC API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/test"} 1
http_requests_total{method="GET",endpoint="/metrics"} 1
  `);
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Speech-to-text endpoint
app.post('/api/speech-to-text', (req, res) => {
  try {
    const { audio, language = 'en-US' } = req.body;
    
    if (!audio) {
      return res.status(400).json({
        error: 'Audio data is required'
      });
    }

    res.json({
      text: 'Hello, this is a mock speech-to-text response',
      confidence: 0.95,
      language: language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Text-to-speech endpoint
app.post('/api/text-to-speech', (req, res) => {
  try {
    const { text, voice = 'default', language = 'en-US' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required'
      });
    }

    res.json({
      audioUrl: 'mock-audio-url',
      text: text,
      voice: voice,
      language: language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Calculator endpoint
app.post('/api/calculate', (req, res) => {
  try {
    const { expression } = req.body;
    
    if (!expression) {
      return res.status(400).json({
        error: 'Expression is required'
      });
    }

    const result = eval(expression);
    
    res.json({
      expression: expression,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid expression',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

describe('AAC API Tests', () => {
  
  describe('Health Check Endpoints', () => {
    test('GET /test should return health status', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('message', 'AAC API is running');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });

    test('GET /api/health should return system health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);
      
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('http_requests_total');
    });
  });

  describe('Speech-to-Text API', () => {
    test('POST /api/speech-to-text should process audio', async () => {
      const mockAudio = 'base64-encoded-audio-data';
      
      const response = await request(app)
        .post('/api/speech-to-text')
        .send({ audio: mockAudio, language: 'en-US' })
        .expect(200);
      
      expect(response.body).toHaveProperty('text');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('language', 'en-US');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/speech-to-text should return error for missing audio', async () => {
      const response = await request(app)
        .post('/api/speech-to-text')
        .send({ language: 'en-US' })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Audio data is required');
    });
  });

  describe('Text-to-Speech API', () => {
    test('POST /api/text-to-speech should process text', async () => {
      const mockText = 'Hello, this is a test message';
      
      const response = await request(app)
        .post('/api/text-to-speech')
        .send({ text: mockText, voice: 'default', language: 'en-US' })
        .expect(200);
      
      expect(response.body).toHaveProperty('audioUrl');
      expect(response.body).toHaveProperty('text', mockText);
      expect(response.body).toHaveProperty('voice', 'default');
      expect(response.body).toHaveProperty('language', 'en-US');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/text-to-speech should return error for missing text', async () => {
      const response = await request(app)
        .post('/api/text-to-speech')
        .send({ voice: 'default' })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Text is required');
    });
  });

  describe('Calculator API', () => {
    test('POST /api/calculate should perform basic calculations', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ expression: '2 + 2' })
        .expect(200);
      
      expect(response.body).toHaveProperty('expression', '2 + 2');
      expect(response.body).toHaveProperty('result', 4);
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/calculate should handle complex expressions', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ expression: '(10 + 5) * 2' })
        .expect(200);
      
      expect(response.body).toHaveProperty('result', 30);
    });

    test('POST /api/calculate should return error for invalid expressions', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({ expression: 'invalid expression' })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid expression');
    });

    test('POST /api/calculate should return error for missing expression', async () => {
      const response = await request(app)
        .post('/api/calculate')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Expression is required');
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/test');
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
