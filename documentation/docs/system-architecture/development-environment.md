---
sidebar_position: 4
---

# Development Environment

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Docker (optional)
- Git

## Local Development Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd project-002-aac-api/Initial_API
npm install
```

### 2. Environment Configuration
Create a `.env` file:
```bash
PORT=3000
NODE_ENV=development
```

### 3. Start Development Server
```bash
# Start API server
npm run dev

# Or start with nodemon for auto-restart
npm start
```

### 4. Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### 5. Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix
```

## Docker Development

### Using Docker Compose
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose up
```

### Individual Docker Commands
```bash
# Build API image
docker build -f Dockerfile.dev -t aac-api:dev .

# Run API container
docker run -p 3000:3000 aac-api:dev
```

## API Endpoints
- **Health Check**: `http://localhost:3000/test`
- **API Health**: `http://localhost:3000/api/health`
- **Metrics**: `http://localhost:3000/metrics`
- **Speech-to-Text**: `POST /api/speech-to-text`
- **Text-to-Speech**: `POST /api/text-to-speech`
- **Calculator**: `POST /api/calculate`

## Monitoring
- **Prometheus Metrics**: Available at `/metrics`
- **Health Monitoring**: Built-in health checks
- **Logging**: Morgan HTTP request logging
- **Security**: Helmet security headers, CORS, rate limiting
