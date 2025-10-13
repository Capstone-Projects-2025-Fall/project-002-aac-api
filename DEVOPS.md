# DevOps Integration Guide

This document provides comprehensive instructions for the DevOps integration of the AAC API project.

## 🏗️ Architecture Overview

The project includes:
- **API Service**: Node.js Express API with Jest testing
- **Documentation**: Docusaurus static site
- **Monitoring**: Prometheus + Grafana stack
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions with automated testing and deployment

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Yarn package manager
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-002-aac-api
   ```

2. **Set up environment**
   ```bash
   cp config/env.example .env
   # Edit .env with your configuration
   ```

3. **Start development environment**
   ```bash
   # Start all services
   docker-compose -f docker-compose.dev.yml up -d
   
   # Or start individual services
   docker-compose up api-dev docs-dev
   ```

4. **Access services**
   - API: http://localhost:3001
   - Documentation: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

## 🧪 Testing

### Run All Tests
```bash
./scripts/test.sh
```

### Individual Test Commands
```bash
# API tests
cd Initial_API && npm test

# Documentation build test
cd documentation && yarn build

# Docker build tests
docker build -t aac-api-test ./Initial_API
docker build -t aac-docs-test ./documentation
```

## 🐳 Docker Commands

### Build Images
```bash
# Production builds
docker build -t aac-api ./Initial_API
docker build -t aac-docs ./documentation

# Development builds
docker build -f Initial_API/Dockerfile.dev -t aac-api-dev ./Initial_API
docker build -f documentation/Dockerfile.dev -t aac-docs-dev ./documentation
```

### Run Containers
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d

# Individual services
docker run -p 3001:3000 aac-api
docker run -p 8080:8080 aac-docs
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **API Testing**
   - Unit tests with Jest
   - Linting and code quality checks
   - Security vulnerability scanning

2. **Documentation Testing**
   - Build verification
   - Static site generation test

3. **Security Scanning**
   - Trivy vulnerability scanner
   - SARIF report upload

4. **Docker Build & Push**
   - Multi-architecture builds
   - GitHub Container Registry push
   - Image caching for performance

5. **Deployment**
   - Staging deployment (develop branch)
   - Production deployment (main branch)
   - Health checks and rollback capability

### Manual Deployment

```bash
# Deploy to different environments
./scripts/deploy.sh staging
./scripts/deploy.sh production
./scripts/deploy.sh local
```

## 📊 Monitoring & Observability

### Prometheus Metrics
- Application metrics: `/metrics` endpoint
- System metrics: Node exporter
- Docker metrics: Docker exporter

### Grafana Dashboards
- Access: http://localhost:3000
- Default credentials: admin/admin
- Pre-configured dashboards for:
  - API performance
  - System resources
  - Docker containers

### Health Checks
- API: `GET /test`
- Documentation: `GET /health`
- Prometheus: `GET /-/healthy`
- Grafana: `GET /api/health`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | API port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `REDIS_HOST` | Redis host | `localhost` |
| `GITHUB_TOKEN` | GitHub token for registry | Required |

### Docker Compose Overrides

Create environment-specific override files:
- `docker-compose.staging.yml`
- `docker-compose.prod.yml`
- `docker-compose.test.yml`

## 🛡️ Security

### Container Security
- Non-root user execution
- Minimal base images (Alpine Linux)
- Security scanning with Trivy
- Regular dependency updates

### Network Security
- Internal Docker networks
- Nginx reverse proxy
- SSL/TLS termination
- Security headers

### Secrets Management
- Environment variables for sensitive data
- GitHub Secrets for CI/CD
- Docker secrets for production

## 📈 Performance Optimization

### Docker Optimizations
- Multi-stage builds
- Layer caching
- BuildKit for faster builds
- Image size optimization

### Application Optimizations
- Gzip compression
- Static asset caching
- Database connection pooling
- Redis caching

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :3001
   ```

2. **Docker build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   docker builder prune
   ```

3. **Service health check failures**
   ```bash
   # Check container logs
   docker-compose logs api
   docker-compose logs docs
   ```

4. **Permission issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/*.sh
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f docs

# Debug container
docker exec -it aac-api sh
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./scripts/test.sh`
5. Submit a pull request

The CI/CD pipeline will automatically test your changes and deploy to staging if the PR is merged to the develop branch.
