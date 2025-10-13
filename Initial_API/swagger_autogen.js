const swaggerAutogen = require('swagger-autogen')(); // For generating swagger docs
const glob = require('glob'); // For file pattern matching
const path = require('path'); // For path operations


// Swagger definition
const doc = {
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'A basic initialization of an API'
  },
  host: 'localhost:8080',
  basePath: '/',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
};

const outputFile = './swagger_output.json'; // Output file for swagger docs

// Use glob to find all .js files in the current directory and subdirectories, excluding node_modules and this file
const endpointsFiles = glob.sync('./**/*.js', {
  ignore: ['./node_modules/**', './swagger_autogen.js', './swagger_output.json']
});

console.log("Scanning the following files for endpoints:", endpointsFiles);

swaggerAutogen(outputFile, endpointsFiles, doc); // Generate swagger docs