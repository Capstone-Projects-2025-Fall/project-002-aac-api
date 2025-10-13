const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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

    // Mock response for now
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

    // Mock response for now
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

// Calculator endpoint (from the original requirements)
app.post('/api/calculate', (req, res) => {
  try {
    const { expression } = req.body;
    
    if (!expression) {
      return res.status(400).json({
        error: 'Expression is required'
      });
    }

    // Simple calculator logic
    const result = eval(expression); // Note: In production, use a proper math parser
    
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AAC API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/test`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});

module.exports = app;
