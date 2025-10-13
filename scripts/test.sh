#!/bin/bash

# Test script for AAC API project
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running comprehensive test suite${NC}"

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test API
print_info "Testing API..."
cd Initial_API

if [ -f "package.json" ]; then
    print_status "Installing API dependencies"
    npm ci
    
    print_status "Running API unit tests"
    npm test
    
    print_status "Running API linting"
    npm run lint || print_warning "Linting not configured"
    
    print_status "Running API security audit"
    npm audit --audit-level moderate || print_warning "Security vulnerabilities found"
else
    print_error "API package.json not found"
    exit 1
fi

cd ..

# Test Documentation
print_info "Testing Documentation..."
cd documentation

if [ -f "package.json" ]; then
    print_status "Installing documentation dependencies"
    yarn install --frozen-lockfile
    
    print_status "Building documentation"
    yarn build
    
    print_status "Testing documentation build"
    yarn serve &
    SERVE_PID=$!
    sleep 10
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Documentation build test passed"
    else
        print_error "Documentation build test failed"
        kill $SERVE_PID 2>/dev/null || true
        exit 1
    fi
    
    kill $SERVE_PID 2>/dev/null || true
else
    print_error "Documentation package.json not found"
    exit 1
fi

cd ..

# Docker tests
print_info "Testing Docker builds..."

print_status "Building API Docker image"
docker build -t aac-api-test ./Initial_API

print_status "Building Documentation Docker image"
docker build -t aac-docs-test ./documentation

# Integration tests
print_info "Running integration tests..."

print_status "Starting services with Docker Compose"
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready"
sleep 30

# Test API endpoint
if curl -f http://localhost:3001/test > /dev/null 2>&1; then
    print_status "API integration test passed"
else
    print_error "API integration test failed"
    docker-compose -f docker-compose.test.yml down
    exit 1
fi

# Test Documentation endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_status "Documentation integration test passed"
else
    print_error "Documentation integration test failed"
    docker-compose -f docker-compose.test.yml down
    exit 1
fi

# Cleanup
print_status "Cleaning up test environment"
docker-compose -f docker-compose.test.yml down

print_status "All tests passed! 🎉"
