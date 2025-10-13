---
sidebar_position: 1
---
# Unit Tests

## Overview
The AAC API includes comprehensive unit tests using Jest and Supertest to ensure all endpoints function correctly.

## Running Unit Tests

### Prerequisites
```bash
cd Initial_API
npm install
```

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage
Current test suite includes:
- ✅ Health check endpoints (3 tests)
- ✅ Speech-to-text API (2 tests)
- ✅ Text-to-speech API (2 tests)
- ✅ Calculator API (4 tests)
- ✅ Error handling (1 test)
- ✅ Security headers (1 test)

**Total: 13 tests passing**

## Test Structure
Each test case consists of:
- Input parameter values
- Expected results
- Mock objects for external dependencies
- Proper error handling validation

## Viewing Coverage Reports
After running `npm run test:coverage`, view the detailed report:
```bash
open coverage/lcov-report/index.html
```
