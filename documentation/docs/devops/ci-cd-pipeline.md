---
sidebar_position: 1
---

# CI/CD Pipeline

## Overview
The AAC API project includes a comprehensive DevOps pipeline with automated testing, code quality checks, and deployment capabilities.

## Pipeline Stages

### 1. Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### 2. Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch
```

### 3. Build
```bash
# Build API (production ready)
npm start

# Build documentation
cd documentation
npm run build
```

### 4. Deployment

#### Docker Deployment
```bash
# Development deployment
docker-compose -f docker-compose.dev.yml up

# Production deployment
docker-compose up
```

#### Manual Deployment
```bash
# Start production server
cd Initial_API
npm start
```

## Monitoring & Observability

### Health Checks
- **API Health**: `GET /api/health`
- **Basic Health**: `GET /test`
- **Metrics**: `GET /metrics`

### Metrics Collection
- Prometheus-compatible metrics endpoint
- HTTP request logging with Morgan
- System resource monitoring
- Error tracking and logging

## Security Features
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request body validation
- **Error Handling**: Secure error responses

## Environment Management
- Environment variables via `.env` files
- Docker environment configuration
- Development vs production settings
- Port configuration (default: 3000)

## Documentation Pipeline
- Automated API documentation via OpenAPI
- Docusaurus documentation site
- Docker-based documentation deployment
- Version-controlled documentation updates
