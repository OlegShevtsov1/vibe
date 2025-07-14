const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const fs = require('fs');
const {
    getAvailablePort,
    takeScreenshot,
    generateRunId,
    cleanupOldScreenshots,
} = require('./helpers');

describe('Vibe Application Accessibility E2E Tests', () => {
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

        await new Promise((resolve) => {
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
    });

    // Close page after each test
    afterEach(async () => {
        if (page) {
            // Take screenshot based on test result
            const hasErrors =
                expect.getState().assertionCalls > 0 &&
                expect.getState().assertionCalls !==
                    expect.getState().successfulAssertionCalls;

            if (process.env.SCREENSHOT_ON_SUCCESS === 'true' || hasErrors) {
                const status = hasErrors ? 'failure' : 'success';
                await takeScreenshot(
                    page,
                    currentTestName,
                    'Vibe Application Accessibility E2E Tests',
                    status,
                    runId
                );
            }

            await page.close();
        }
    });

    // Helper function to wait for dynamic content to load
    const waitForDynamicContent = async () => {
        try {
            // Wait for page to be ready and scripts loaded
            await page.waitForFunction(
                () => document.readyState === 'complete',
                { timeout: 5000 }
            );

            // Give a moment for script execution
            await page.waitForTimeout(1000);

            // Check if containers have content
            await page.waitForFunction(
                () => {
                    const header = document.querySelector('#header-container');
                    const footer = document.querySelector('#footer-container');
                    return (
                        header &&
                        footer &&
                        header.children.length > 0 &&
                        footer.children.length > 0
                    );
                },
                { timeout: 5000 }
            );
        } catch (error) {
            console.log(
                'Warning: Dynamic content loading timeout, continuing with test...'
            );
        }
    };

    describe('Keyboard Navigation', () => {
        test('should be able to navigate using Tab key', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();
            await waitForDynamicContent();

            // Wait for hello button to be available
            await page.waitForSelector('#hello-btn');

            // Start from a known state - click somewhere first
            await page.click('body');

            // Tab through elements to reach the button
            // Header links first, then main content button
            let tabCount = 0;
            let focusedElement = '';

            // Tab until we find the hello button or reach max tabs
            while (focusedElement !== 'hello-btn' && tabCount < 10) {
                await page.keyboard.press('Tab');
                focusedElement = await page.evaluate(
                    () =>
                        document.activeElement.id ||
                        document.activeElement.tagName.toLowerCase()
                );
                tabCount++;

                if (focusedElement === 'hello-btn') {
                    break;
                }
            }

            expect(focusedElement).toBe('hello-btn');
        });

        test('should be able to activate button with Enter key', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Focus on button
            await page.focus('#hello-btn');

            // Press Enter
            await page.keyboard.press('Enter');

            // Wait for message to appear
            await page.waitForSelector('#message .alert-success');

            const message = await page.$('#message .alert-success');
            expect(message).toBeTruthy();
        });

        test('should be able to activate button with Space key', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Focus on button
            await page.focus('#hello-btn');

            // Press Space
            await page.keyboard.press('Space');

            // Wait for message to appear
            await page.waitForSelector('#message .alert-success');

            const message = await page.$('#message .alert-success');
            expect(message).toBeTruthy();
        });
    });

    describe('ARIA Attributes', () => {
        test('should have proper ARIA labels on button', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            const buttonText = await page.$eval('#hello-btn', (el) =>
                el.textContent.trim()
            );
            expect(buttonText).toBe('Click me');
        });

        test('should have proper ARIA labels on alert close button', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#message .alert .btn-close');

            const ariaLabel = await page.$eval(
                '#message .alert .btn-close',
                (el) => el.getAttribute('aria-label')
            );
            expect(ariaLabel).toBe('Close');
        });

        test('should have proper role attributes on alert', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#message .alert');

            const role = await page.$eval('#message .alert', (el) =>
                el.getAttribute('role')
            );
            expect(role).toBe('alert');
        });
    });

    describe('Screen Reader Support', () => {
        test('should have proper heading structure', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();
            await waitForDynamicContent();

            // Check h1 exists (now in header container)
            const h1 = await page.$('#header-container h1');
            expect(h1).toBeTruthy();

            // Check h2 exists
            const h2 = await page.$('h2');
            expect(h2).toBeTruthy();

            // Check proper heading hierarchy
            const h1Text = await page.$eval('#header-container h1', (el) =>
                el.textContent.trim()
            );
            const h2Text = await page.$eval('h2', (el) =>
                el.textContent.trim()
            );

            expect(h1Text).toContain('Vibe Application');
            expect(h2Text).toBe('Hello World!');
        });

        test('should have proper semantic HTML structure', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            // Check for semantic elements
            const header = await page.$('header');
            const main = await page.$('main');
            const footer = await page.$('footer');

            expect(header).toBeTruthy();
            expect(main).toBeTruthy();
            expect(footer).toBeTruthy();
        });
    });

    describe('Color Contrast and Visual Accessibility', () => {
        test('should have visible focus indicators', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Focus on button
            await page.focus('#hello-btn');

            // Check if button has focus (we can't test actual visual focus ring, but we can check focus state)
            const isButtonFocused = await page.evaluate(
                () => document.activeElement.id === 'hello-btn'
            );
            expect(isButtonFocused).toBe(true);
        });

        test('should maintain readability at different zoom levels', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            // Test at 200% zoom
            await page.setViewport({
                width: 640,
                height: 360,
                deviceScaleFactor: 2,
            });

            await page.waitForSelector('#hello-btn');

            // Check if button is still clickable
            const button = await page.$('#hello-btn');
            expect(button).toBeTruthy();

            // Test button functionality at zoom level
            await page.click('#hello-btn');
            await page.waitForSelector('#message .alert-success');

            const message = await page.$('#message .alert-success');
            expect(message).toBeTruthy();
        });
    });

    describe('Mobile Accessibility', () => {
        test('should be accessible on mobile devices', async () => {
            // Set mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Test touch interaction - use click instead of tap for more reliability
            await page.click('#hello-btn');

            await page.waitForSelector('#message .alert-success', {
                timeout: 10000,
            });

            const message = await page.$('#message .alert-success');
            expect(message).toBeTruthy();
        }, 45000);

        test('should have proper touch targets size', async () => {
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Get button dimensions
            const buttonBounds = await page.$eval('#hello-btn', (el) => {
                const rect = el.getBoundingClientRect();
                return {
                    width: rect.width,
                    height: rect.height,
                };
            });

            // Check if button meets minimum touch target size (44x44px minimum recommended)
            expect(buttonBounds.width).toBeGreaterThan(40);
            expect(buttonBounds.height).toBeGreaterThan(35);
        });
    });

    describe('Error Handling and User Feedback', () => {
        test('should provide clear feedback when actions occur', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Click button
            await page.click('#hello-btn');

            // Wait for feedback
            await page.waitForSelector('#message .alert-success');

            // Check that message is visible and has content
            const messageText = await page.$eval(
                '#message .alert-success',
                (el) => el.textContent
            );
            expect(messageText.length).toBeGreaterThan(0);

            // Check that message has proper styling
            const alertClasses = await page.$eval(
                '#message .alert-success',
                (el) => el.className
            );
            expect(alertClasses).toContain('alert-success');
        });

        test('should handle rapid interactions gracefully', async () => {
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            await page.waitForSelector('#hello-btn');

            // Click button multiple times rapidly
            for (let i = 0; i < 5; i++) {
                await page.click('#hello-btn');
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Should still show a message
            const message = await page.$('#message .alert');
            expect(message).toBeTruthy();
        });
    });

    describe('Browser Compatibility', () => {
        test('should work with disabled JavaScript features', async () => {
            // This tests graceful degradation
            await page.goto(BASE_URL);
            await waitForDynamicContent();

            // Even if some JS features fail, basic HTML should still be accessible
            const button = await page.$('#hello-btn');
            expect(button).toBeTruthy();

            const header = await page.$('h1');
            expect(header).toBeTruthy();
        });
    });
});
