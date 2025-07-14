// E2E tests setup file
// This file configures the test environment for Puppeteer E2E tests

// Set longer timeout for E2E tests
jest.setTimeout(30000);

// Global test configuration
global.testConfig = {
    viewport: {
        width: 1280,
        height: 720,
    },
    puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
};

// Mock console methods for E2E tests
const originalConsole = global.console;

// Only show console logs in debug mode
if (process.env.JEST_DEBUG !== 'true') {
    global.console = {
        ...originalConsole,
        log: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };
}

// Clean up after each test
afterEach(async () => {
    // Small delay to ensure proper cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
});
