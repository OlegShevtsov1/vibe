#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const httpServer = require('http-server');
const { exec } = require('child_process');

// Get port from environment variable or default to 8080
const port = process.env.PORT || 8080;
const shouldOpen = !process.argv.includes('--no-open');

// Create and start server
const server = httpServer.createServer({
    root: './',
    cache: 3600,
    showDir: true,
    autoIndex: true,
    gzip: false,
    brotli: false,
    cors: false,
});

console.log(`Starting server on port ${port}...`);

server.listen(port, '0.0.0.0', () => {
    const url = `http://localhost:${port}`;
    console.log(`Server running at ${url}`);

    if (shouldOpen) {
        console.log('Opening browser...');
        exec(`open ${url}`, (error) => {
            if (error) {
                console.log(`Could not open browser: ${error.message}`);
                console.log(`Please open ${url} manually`);
            }
        });
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
