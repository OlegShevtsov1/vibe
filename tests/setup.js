// Jest setup file for DOM testing
// This file sets up the testing environment for our Vibe application

// Mock DOM elements for testing
global.document = {
    createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        innerHTML: '',
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
        },
    })),
    getElementById: jest.fn(),
    addEventListener: jest.fn(),
    head: {
        appendChild: jest.fn(),
    },
};

global.window = {
    addEventListener: jest.fn(),
};

// Store original console methods
const originalConsole = global.console;

global.console = {
    log: jest.fn((...args) => {
        // Show in console when needed
        if (process.env.JEST_DEBUG === 'true') {
            originalConsole.log(...args);
        }
    }),
    error: jest.fn((...args) => {
        // Always show errors
        originalConsole.error(...args);
    }),
    warn: jest.fn((...args) => {
        if (process.env.JEST_DEBUG === 'true') {
            originalConsole.warn(...args);
        }
    }),
};

// Mock Bootstrap's alert dismiss functionality
global.bootstrap = {
    Alert: jest.fn(),
};

// Set up DOM cleanup after each test
afterEach(() => {
    jest.clearAllMocks();
});
