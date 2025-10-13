---
sidebar_position: 2
---

# Deployment Guide

## Quick Start

### Local Development
```bash
cd Initial_API
npm install
npm run dev
```

### Production Deployment
```bash
cd Initial_API
npm install --production
npm start
```

## Docker Deployment

### Using Docker Compose (Recommended)

#### Development Environment
```bash
# Start development stack
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### Production Environment
```bash
# Start production stack
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Docker Commands

#### Build Images
```bash
# Build API image
docker build -f Initial_API/Dockerfile.dev -t aac-api:dev .

# Build documentation image
docker build -f documentation/Dockerfile -t aac-docs .
```

#### Run Containers
```bash
# Run API container
docker run -p 3000:3000 --name aac-api aac-api:dev

# Run documentation container
docker run -p 8080:80 --name aac-docs aac-docs
```

## Environment Configuration

### Environment Variables
Create a `.env` file in the `Initial_API` directory:
```bash
PORT=3000
NODE_ENV=production
```

### Docker Environment
Environment variables can be set in:
- `docker-compose.yml` files
- `.env` files
- Docker run commands with `-e` flag

## Health Checks

### Verify Deployment
```bash
# Check API health
curl http://localhost:3000/test

# Check API metrics
curl http://localhost:3000/metrics

# Check system health
curl http://localhost:3000/api/health
```

### Expected Responses
- **Health Check**: `{"status":"healthy","message":"AAC API is running"}`
- **System Health**: `{"status":"ok","uptime":...,"memory":...}`
- **Metrics**: Prometheus-formatted metrics

## Monitoring

### Logs
```bash
# Docker logs
docker-compose logs -f

# Application logs
# Logs are output to console with Morgan middleware
```

### Metrics
- Prometheus metrics available at `/metrics`
- HTTP request logging
- Error tracking
- Performance monitoring

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Docker Issues
```bash
# Clean up containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Rebuild
docker-compose build --no-cache
```

#### Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
```

## Scaling

### Horizontal Scaling
```bash
# Scale API instances
docker-compose up --scale api=3

# Use load balancer (nginx)
# Configure nginx.conf for load balancing
```

### Performance Tuning
- Adjust rate limiting settings
- Configure compression levels
- Optimize Docker images
- Monitor resource usage
