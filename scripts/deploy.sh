#!/bin/bash

# Deployment script for AAC API project
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
REGISTRY="ghcr.io"
PROJECT_NAME="project-002-aac-api"

echo -e "${GREEN}🚀 Starting deployment to ${ENVIRONMENT}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GITHUB_TOKEN environment variable is not set"
    exit 1
fi

# Login to GitHub Container Registry
print_status "Logging in to GitHub Container Registry"
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

# Build and push API image
print_status "Building and pushing API image"
docker build -t "$REGISTRY/$PROJECT_NAME-api:$ENVIRONMENT" ./Initial_API
docker push "$REGISTRY/$PROJECT_NAME-api:$ENVIRONMENT"

# Build and push Documentation image
print_status "Building and pushing Documentation image"
docker build -t "$REGISTRY/$PROJECT_NAME-docs:$ENVIRONMENT" ./documentation
docker push "$REGISTRY/$PROJECT_NAME-docs:$ENVIRONMENT"

# Deploy based on environment
case $ENVIRONMENT in
    "staging")
        print_status "Deploying to staging environment"
        docker-compose -f docker-compose.staging.yml up -d
        ;;
    "production")
        print_status "Deploying to production environment"
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    "local")
        print_status "Deploying to local environment"
        docker-compose up -d
        ;;
    *)
        print_error "Unknown environment: $ENVIRONMENT"
        print_warning "Available environments: staging, production, local"
        exit 1
        ;;
esac

# Health check
print_status "Performing health checks"
sleep 30

# Check API health
if curl -f http://localhost:3001/test > /dev/null 2>&1; then
    print_status "API is healthy"
else
    print_error "API health check failed"
    exit 1
fi

# Check Documentation health
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_status "Documentation is healthy"
else
    print_error "Documentation health check failed"
    exit 1
fi

print_status "Deployment to $ENVIRONMENT completed successfully! 🎉"

# Display service URLs
echo -e "${GREEN}📋 Service URLs:${NC}"
echo -e "  API: http://localhost:3001"
echo -e "  Documentation: http://localhost:8080"
echo -e "  Monitoring: http://localhost:3000 (Grafana)"
echo -e "  Metrics: http://localhost:9090 (Prometheus)"
