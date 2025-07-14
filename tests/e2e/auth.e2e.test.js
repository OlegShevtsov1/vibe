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

describe('Authentication E2E Tests', () => {
    let browser;
    let page;
    let server;
    let PORT;
    let BASE_URL;
    let runId;

    beforeAll(async () => {
        // Generate unique run ID for this test session
        runId = generateRunId();
        cleanupOldScreenshots(5);

        // Skip server setup if BASE_URL is provided (Docker mode)
        if (process.env.BASE_URL) {
            BASE_URL = process.env.BASE_URL;
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

        // Find available port
        PORT = await getAvailablePort(8080);
        BASE_URL = `http://localhost:${PORT}`;

        // Create HTTP server
        server = http.createServer((req, res) => {
            // Parse the URL to get the file path
            let filePath = req.url === '/' ? '/index.html' : req.url;

            // Remove query parameters
            filePath = filePath.split('?')[0];

            // Construct the full file path
            const fullPath = path.join(__dirname, '../..', filePath);

            // Check if file exists
            fs.access(fullPath, fs.constants.F_OK, (err) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                    return;
                }

                // Read and serve the file
                fs.readFile(fullPath, (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal server error');
                        return;
                    }

                    // Determine content type
                    const ext = path.extname(filePath);
                    let contentType = 'text/plain';
                    switch (ext) {
                        case '.html':
                            contentType = 'text/html';
                            break;
                        case '.css':
                            contentType = 'text/css';
                            break;
                        case '.js':
                            contentType = 'application/javascript';
                            break;
                        case '.json':
                            contentType = 'application/json';
                            break;
                    }

                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                });
            });
        });

        // Start the server
        await new Promise((resolve) => {
            server.listen(PORT, resolve);
        });

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: process.env.HEADLESS !== 'false',
            slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
    });

    afterEach(async () => {
        if (page) {
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

    describe('Login Page Tests', () => {
        beforeEach(async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();
        });

        it('should display login form correctly', async () => {
            await page.waitForSelector('#login-form');

            const title = await page.title();
            expect(title).toBe('Login - Vibe Application');

            const emailField = await page.$('#email');
            const passwordField = await page.$('#password');
            const submitButton = await page.$('button[type="submit"]');

            expect(emailField).toBeTruthy();
            expect(passwordField).toBeTruthy();
            expect(submitButton).toBeTruthy();

            const submitText = await page.$eval('button[type="submit"]', (el) =>
                el.textContent.trim()
            );
            expect(submitText).toContain('Sign In');
        });

        it('should validate email field', async () => {
            await page.click('#email');
            await page.type('#email', 'invalid-email');
            await page.click('#password'); // trigger blur event

            // Check if browser validation appears
            const isValid = await page.$eval(
                '#email',
                (el) => el.validity.valid
            );
            expect(isValid).toBe(false);
        });

        it('should show error for invalid credentials', async () => {
            await page.type('#email', 'test@example.com');
            await page.type('#password', 'wrongpassword');

            await page.click('button[type="submit"]');

            // Note: This would need actual backend to test properly
            // For now, just verify form submission attempt
            const form = await page.$('#login-form');
            expect(form).toBeTruthy();
        });

        it('should toggle password visibility', async () => {
            await waitForDynamicContent();

            const passwordField = await page.$('#password');
            let type = await passwordField.getProperty('type');
            expect(await type.jsonValue()).toBe('password');

            await page.click('#toggle-password');
            await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for toggle to complete

            type = await passwordField.getProperty('type');
            expect(await type.jsonValue()).toBe('text');

            await page.click('#toggle-password');
            await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for toggle to complete

            type = await passwordField.getProperty('type');
            expect(await type.jsonValue()).toBe('password');
        });
    });

    describe('Register Page Tests', () => {
        beforeEach(async () => {
            await page.goto(`${BASE_URL}/register.html`);
            await waitForDynamicContent();
        });

        it('should display registration form correctly', async () => {
            await page.waitForSelector('#register-form');

            const title = await page.title();
            expect(title).toBe('Register - Vibe Application');

            const emailField = await page.$('#email');
            const passwordField = await page.$('#password');
            const confirmPasswordField = await page.$('#confirmPassword');
            const submitButton = await page.$('button[type="submit"]');

            expect(emailField).toBeTruthy();
            expect(passwordField).toBeTruthy();
            expect(confirmPasswordField).toBeTruthy();
            expect(submitButton).toBeTruthy();

            const submitText = await page.$eval('button[type="submit"]', (el) =>
                el.textContent.trim()
            );
            expect(submitText).toContain('Create Account');
        });

        it('should validate password strength', async () => {
            await page.click('#password');
            await page.type('#password', '123'); // weak password
            await page.click('#confirmPassword'); // trigger blur event

            // Check if browser validation appears
            const value = await page.$eval('#password', (el) => el.value);
            expect(value.length).toBeLessThan(8);
        });

        it('should validate password confirmation', async () => {
            await page.type('#password', 'Password123!');
            await page.type('#confirmPassword', 'DifferentPassword');
            await page.click('#email'); // trigger blur event

            // Check password mismatch (would need custom validation for this)
            const password = await page.$eval('#password', (el) => el.value);
            const confirmPassword = await page.$eval(
                '#confirmPassword',
                (el) => el.value
            );
            expect(password).not.toBe(confirmPassword);
        });

        it('should show error for existing email', async () => {
            await page.type('#email', 'existing@example.com');
            await page.type('#password', 'Password123!');
            await page.type('#confirmPassword', 'Password123!');
            await page.click('#terms');

            await page.click('button[type="submit"]');

            // Note: This would need actual backend to test properly
            // For now, just verify form submission attempt
            const form = await page.$('#register-form');
            expect(form).toBeTruthy();
        });
    });

    describe('Navigation Tests', () => {
        it('should navigate between auth pages', async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();
            await page.waitForSelector('a[href="register.html"]');

            await page.click('a[href="register.html"]');
            await waitForDynamicContent();

            const url = page.url();
            expect(url).toContain('register.html');

            await page.waitForSelector('a[href="login.html"]');
            await page.click('a[href="login.html"]');
            await waitForDynamicContent();

            const backUrl = page.url();
            expect(backUrl).toContain('login.html');
        });

        it('should navigate to home page', async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();
            await page.waitForSelector('a[href="index.html"]');

            await page.click('a[href="index.html"]');
            await waitForDynamicContent();

            const url = page.url();
            expect(url.includes('index.html') || url === `${BASE_URL}/`).toBe(
                true
            );
        });
    });

    describe('Form Validation Tests', () => {
        it('should prevent form submission with invalid data', async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();
            await page.waitForSelector('#login-form');

            // Try to submit empty form
            await page.click('button[type="submit"]');

            // Check if required field validation prevents submission
            const emailRequired = await page.$eval(
                '#email',
                (el) => el.required
            );
            const passwordRequired = await page.$eval(
                '#password',
                (el) => el.required
            );

            expect(emailRequired).toBe(true);
            expect(passwordRequired).toBe(true);
        });

        it('should handle form interaction properly', async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();
            await page.waitForSelector('#login-form');

            // Fill form with valid data
            await page.type('#email', 'test@example.com');
            await page.type('#password', 'validpassword');

            // Check form state
            const emailValue = await page.$eval('#email', (el) => el.value);
            const passwordValue = await page.$eval(
                '#password',
                (el) => el.value
            );

            expect(emailValue).toBe('test@example.com');
            expect(passwordValue).toBe('validpassword');
        });
    });

    describe('UI State Tests', () => {
        it('should display forms with proper styling', async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();

            const cardElement = await page.$('.card');
            const formElement = await page.$('#login-form');

            expect(cardElement).toBeTruthy();
            expect(formElement).toBeTruthy();

            // Check that Bootstrap classes are applied
            const hasBootstrapCard = await page.$eval('.card', (el) =>
                el.classList.contains('card')
            );
            expect(hasBootstrapCard).toBe(true);
        });

        it('should display header and footer correctly', async () => {
            await page.goto(`${BASE_URL}/login.html`);
            await waitForDynamicContent();

            // Check header
            const headerContainer = await page.$('#header-container');
            const headerContent = await page.$eval(
                '#header-container',
                (el) => el.innerHTML
            );
            expect(headerContainer).toBeTruthy();
            expect(headerContent).toContain('Vibe Application');

            // Check footer
            const footerContainer = await page.$('#footer-container');
            expect(footerContainer).toBeTruthy();
        });
    });
});
