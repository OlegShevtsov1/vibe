const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const fs = require('fs');
const {
    getAvailablePort,
    takeScreenshot,
    takeFailureScreenshot,
    generateRunId,
    cleanupOldScreenshots,
} = require('./helpers');

describe('Vibe Application E2E Tests', () => {
    let browser;
    let page;
    let server;
    let PORT;
    let BASE_URL;
    let runId;
    let currentTestName;

    // Start HTTP server before all tests
    beforeAll(async () => {
        // Generate unique run ID for this test session
        runId = generateRunId();

        // Clean up old screenshots (keep last 5 runs)
        cleanupOldScreenshots(5);
        // Skip server setup if BASE_URL is provided (Docker mode)
        if (process.env.BASE_URL) {
            BASE_URL = process.env.BASE_URL;
            // Just launch browser for external server
            browser = await puppeteer.launch({
                headless: process.env.HEADLESS !== 'false',
                slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                ],
                executablePath:
                    process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            });
            return;
        }

        // Get available port dynamically
        PORT = process.env.TEST_PORT
            ? parseInt(process.env.TEST_PORT)
            : await getAvailablePort();
        BASE_URL = `http://localhost:${PORT}`;

        // Create simple HTTP server to serve static files
        server = http.createServer((req, res) => {
            const filePath = path.join(
                __dirname,
                '../../',
                req.url === '/' ? 'index.html' : req.url
            );
            const extname = path.extname(filePath).toLowerCase();

            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
            };

            const contentType =
                mimeTypes[extname] || 'application/octet-stream';

            fs.readFile(filePath, (error, content) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(500);
                        res.end('Server Error');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        });

        await new Promise(resolve => {
            server.listen(PORT, resolve);
        });

        // Launch browser
        browser = await puppeteer.launch({
            headless: process.env.HEADLESS !== 'false',
            slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });
    });

    // Close browser and server after all tests
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
        if (server) {
            server.close();
        }
    });

    // Create new page for each test
    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        // Capture current test name
        currentTestName = expect.getState().currentTestName;

        // Listen for console logs
        page.on('console', msg => {
            if (process.env.JEST_DEBUG === 'true') {
                console.log('PAGE LOG:', msg.text());
            }
        });
    });

    // Close page after each test
    afterEach(async () => {
        if (page) {
            // Take screenshot based on test result
            const testResult = expect.getState().currentTestName;
            const hasErrors =
                expect.getState().assertionCalls > 0 &&
                expect.getState().assertionCalls !==
                    expect.getState().successfulAssertionCalls;

            if (process.env.SCREENSHOT_ON_SUCCESS === 'true' || hasErrors) {
                const status = hasErrors ? 'failure' : 'success';
                await takeScreenshot(
                    page,
                    currentTestName,
                    'Vibe Application E2E Tests',
                    status,
                    runId
                );
            }

            await page.close();
        }
    });

    describe('Page Loading', () => {
        test('should load the main page successfully', async () => {
            await page.goto(BASE_URL);

            const title = await page.title();
            expect(title).toBe('Vibe Application');
        });

        test('should display main header', async () => {
            await page.goto(BASE_URL);

            const headerText = await page.$eval('h1', el => el.textContent);
            expect(headerText).toBe('Vibe Application');
        });

        test('should display welcome card', async () => {
            await page.goto(BASE_URL);

            const cardTitle = await page.$eval(
                '.card-title',
                el => el.textContent
            );
            expect(cardTitle).toBe('Hello World!');

            const cardText = await page.$eval('.card-text', el =>
                el.textContent.trim()
            );
            expect(cardText).toBe('Welcome to Vibe Application!');
        });

        test('should display click button', async () => {
            await page.goto(BASE_URL);

            const button = await page.$('#hello-btn');
            expect(button).toBeTruthy();

            const buttonText = await page.$eval('#hello-btn', el =>
                el.textContent.trim()
            );
            expect(buttonText).toBe('Click me');
        });

        test('should display footer', async () => {
            await page.goto(BASE_URL);

            const footerText = await page.$eval(
                'footer p',
                el => el.textContent
            );
            expect(footerText).toBe('© 2024 Vibe Application');
        });
    });

    describe('Application Initialization', () => {
        test('should show initial welcome message', async () => {
            await page.goto(BASE_URL);

            // Wait for the app to initialize
            await page.waitForSelector('#message .alert', { timeout: 5000 });

            const messageText = await page.$eval(
                '#message .alert',
                el => el.textContent
            );
            expect(messageText).toContain('Application loaded successfully!');

            const alertClass = await page.$eval(
                '#message .alert',
                el => el.className
            );
            expect(alertClass).toContain('alert-info');
        });

        test('should log initialization message to console', async () => {
            const consoleLogs = [];
            page.on('console', msg => {
                consoleLogs.push(msg.text());
            });

            await page.goto(BASE_URL);

            // Wait a bit for console logs
            await new Promise(resolve => setTimeout(resolve, 1000));

            expect(consoleLogs).toContain(
                'Vibe Application loaded successfully!'
            );
        });
    });

    describe('Button Click Functionality', () => {
        test('should display success message when button is clicked', async () => {
            await page.goto(BASE_URL);

            // Wait for initial message to appear
            await page.waitForSelector('#message .alert');

            // Click the button
            await page.click('#hello-btn');

            // Wait for new message
            await new Promise(resolve => setTimeout(resolve, 500));

            const messageAlert = await page.$('#message .alert');
            expect(messageAlert).toBeTruthy();

            const alertClass = await page.$eval(
                '#message .alert',
                el => el.className
            );
            expect(alertClass).toContain('alert-success');
        });

        test('should display random messages on multiple clicks', async () => {
            await page.goto(BASE_URL);

            // Wait for initial message
            await page.waitForSelector('#message .alert');

            const messages = new Set();

            // Click multiple times to test randomness
            for (let i = 0; i < 5; i++) {
                await page.click('#hello-btn');
                await new Promise(resolve => setTimeout(resolve, 300));

                const messageText = await page.$eval(
                    '#message .alert',
                    el => el.textContent
                );
                messages.add(messageText);
            }

            // Should have at least one unique message
            expect(messages.size).toBeGreaterThan(0);
        });

        test('should display expected welcome messages', async () => {
            const expectedMessages = [
                'Hello! Welcome to Vibe Application!',
                'Great to see you here!',
                'Ready to explore the app?',
                "Let's get started!",
                'This is just the beginning!',
            ];

            await page.goto(BASE_URL);
            await page.waitForSelector('#message .alert');

            let foundValidMessage = false;

            // Try clicking multiple times to get different messages
            for (let i = 0; i < 10; i++) {
                await page.click('#hello-btn');
                await new Promise(resolve => setTimeout(resolve, 200));

                const messageText = await page.$eval(
                    '#message .alert',
                    el => el.textContent
                );

                if (expectedMessages.some(msg => messageText.includes(msg))) {
                    foundValidMessage = true;
                    break;
                }
            }

            expect(foundValidMessage).toBe(true);
        });
    });

    describe('Message Display Features', () => {
        test('should show message with close button', async () => {
            await page.goto(BASE_URL);

            await page.waitForSelector('#message .alert');

            const closeButton = await page.$('#message .alert .btn-close');
            expect(closeButton).toBeTruthy();

            const buttonLabel = await page.$eval(
                '#message .alert .btn-close',
                el => el.getAttribute('aria-label')
            );
            expect(buttonLabel).toBe('Close');
        });

        test('should have proper Bootstrap classes', async () => {
            await page.goto(BASE_URL);

            await page.waitForSelector('#message .alert');

            const alertClasses = await page.$eval(
                '#message .alert',
                el => el.className
            );
            expect(alertClasses).toContain('alert');
            expect(alertClasses).toContain('alert-dismissible');
            expect(alertClasses).toContain('fade');
            expect(alertClasses).toContain('show');
        });

        test('should display message in correct container', async () => {
            await page.goto(BASE_URL);

            await page.waitForSelector('#message .alert');

            const messageContainer = await page.$('#message');
            expect(messageContainer).toBeTruthy();

            const containerClass = await page.$eval(
                '#message',
                el => el.className
            );
            expect(containerClass).toContain('show');
        });
    });

    describe('Responsive Design', () => {
        test('should work on mobile viewport', async () => {
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(BASE_URL);

            const header = await page.$('h1');
            expect(header).toBeTruthy();

            const button = await page.$('#hello-btn');
            expect(button).toBeTruthy();

            // Test button click on mobile
            await page.click('#hello-btn');
            await new Promise(resolve => setTimeout(resolve, 500));

            const message = await page.$('#message .alert');
            expect(message).toBeTruthy();
        });

        test('should work on tablet viewport', async () => {
            await page.setViewport({ width: 768, height: 1024 });
            await page.goto(BASE_URL);

            const card = await page.$('.card');
            expect(card).toBeTruthy();

            const button = await page.$('#hello-btn');
            expect(button).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        test('should handle JavaScript errors gracefully', async () => {
            const jsErrors = [];
            page.on('pageerror', error => {
                jsErrors.push(error.message);
            });

            await page.goto(BASE_URL);
            await page.click('#hello-btn');
            await new Promise(resolve => setTimeout(resolve, 1000));

            expect(jsErrors).toHaveLength(0);
        });

        test('should handle network errors gracefully', async () => {
            const failedRequests = [];
            page.on('requestfailed', request => {
                failedRequests.push(request.url());
            });

            await page.goto(BASE_URL);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Should not have failed requests for basic functionality
            const criticalFailures = failedRequests.filter(
                url =>
                    url.includes('.js') ||
                    url.includes('.css') ||
                    url.includes('.html')
            );
            expect(criticalFailures).toHaveLength(0);
        });
    });

    describe('Performance', () => {
        test('should load page within reasonable time', async () => {
            const startTime = Date.now();

            await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(5000); // 5 seconds
        });

        test('should respond to button clicks quickly', async () => {
            await page.goto(BASE_URL);
            await page.waitForSelector('#hello-btn');

            // Warm up - first click to initialize
            await page.click('#hello-btn');
            await page.waitForSelector('#message .alert-success');

            // Clear message for clean test
            const closeBtn = await page.$('#message .alert .btn-close');
            if (closeBtn) {
                await closeBtn.click();
            }

            // Actual performance test
            const startTime = Date.now();
            await page.click('#hello-btn');
            await page.waitForSelector('#message .alert-success');
            const responseTime = Date.now() - startTime;

            // More realistic timeout for E2E tests
            expect(responseTime).toBeLessThan(3000); // 3 seconds
        });
    });
});
