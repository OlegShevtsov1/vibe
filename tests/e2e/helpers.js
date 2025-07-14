const fs = require('fs');
const path = require('path');

// E2E Test Helper Functions
// This file contains utility functions for Puppeteer E2E tests

/**
 * Wait for element to be visible and clickable
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<ElementHandle>}
 */
async function waitForClickable(page, selector, timeout = 5000) {
    await page.waitForSelector(selector, { visible: true, timeout });
    const element = await page.$(selector);

    // Ensure element is clickable
    await page.waitForFunction(
        sel => {
            const el = document.querySelector(sel);
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        },
        { timeout },
        selector
    );

    return element;
}

/**
 * Wait for text to appear in element
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string} text - Expected text
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>}
 */
async function waitForText(page, selector, text, timeout = 5000) {
    try {
        await page.waitForFunction(
            (sel, expectedText) => {
                const element = document.querySelector(sel);
                return element && element.textContent.includes(expectedText);
            },
            { timeout },
            selector,
            text
        );
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get all text content from elements matching selector
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @returns {Promise<string[]>}
 */
async function getAllTextContent(page, selector) {
    return await page.$$eval(selector, elements =>
        elements.map(el => el.textContent.trim())
    );
}

/**
 * Check if element has specific class
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string} className - Class name to check
 * @returns {Promise<boolean>}
 */
async function hasClass(page, selector, className) {
    return await page.$eval(
        selector,
        (el, cls) => el.classList.contains(cls),
        className
    );
}

/**
 * Wait for element to disappear
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>}
 */
async function waitForDisappear(page, selector, timeout = 5000) {
    try {
        await page.waitForSelector(selector, { hidden: true, timeout });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Simulate typing with delay
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string} text - Text to type
 * @param {number} delay - Delay between keystrokes
 * @returns {Promise<void>}
 */
async function typeWithDelay(page, selector, text, delay = 50) {
    await page.focus(selector);
    await page.keyboard.type(text, { delay });
}

/**
 * Check if page has no JavaScript errors
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<string[]>} Array of error messages
 */
async function getJavaScriptErrors(page) {
    const errors = [];

    page.on('pageerror', error => {
        errors.push(error.message);
    });

    return errors;
}

/**
 * Wait for page to be fully loaded
 * @param {Object} page - Puppeteer page object
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<void>}
 */
async function waitForFullLoad(page, timeout = 10000) {
    await page.waitForLoadState('networkidle2', { timeout });
}

/**
 * Get element attribute value
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector
 * @param {string} attribute - Attribute name
 * @returns {Promise<string|null>}
 */
async function getAttribute(page, selector, attribute) {
    return await page.$eval(
        selector,
        (el, attr) => el.getAttribute(attr),
        attribute
    );
}

/**
 * Find an available port dynamically
 * @returns {Promise<number>} Available port number
 */
const getAvailablePort = () => {
    return new Promise((resolve, reject) => {
        const net = require('net');
        const server = net.createServer();

        server.unref();
        server.on('error', reject);

        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => {
                resolve(port);
            });
        });
    });
};

/**
 * Create screenshots directory structure
 * @param {string} runId - Unique run identifier
 * @returns {string} Screenshots directory path
 */
const createScreenshotsDir = runId => {
    const baseDir = path.join(process.cwd(), 'artifacts', 'screenshots');
    const runDir = path.join(baseDir, runId);

    if (!fs.existsSync(runDir)) {
        fs.mkdirSync(runDir, { recursive: true });
    }

    return runDir;
};

/**
 * Generate unique run ID for organizing screenshots
 * @returns {string} Unique run identifier
 */
const generateRunId = () => {
    const now = new Date();
    const timestamp = now
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .split('.')[0];

    // Add CI info if available
    if (process.env.CI) {
        const ciInfo =
            process.env.GITHUB_RUN_ID ||
            process.env.GITLAB_CI_PIPELINE_ID ||
            process.env.BUILD_NUMBER ||
            'ci-run';
        return `${ciInfo}_${timestamp}`;
    }

    return `local_${timestamp}`;
};

/**
 * Take screenshot with proper naming and organization
 * @param {object} page - Puppeteer page object
 * @param {string} testName - Name of the test
 * @param {string} suiteName - Name of the test suite
 * @param {string} status - 'success' or 'failure'
 * @param {string} runId - Unique run identifier
 * @returns {Promise<string>} Path to saved screenshot
 */
const takeScreenshot = async (
    page,
    testName,
    suiteName,
    status = 'info',
    runId = null
) => {
    try {
        if (!runId) {
            runId = generateRunId();
        }

        const screenshotsDir = createScreenshotsDir(runId);
        const suiteDir = path.join(
            screenshotsDir,
            suiteName.replace(/[^a-zA-Z0-9-_]/g, '-')
        );

        if (!fs.existsSync(suiteDir)) {
            fs.mkdirSync(suiteDir, { recursive: true });
        }

        const cleanTestName = testName.replace(/[^a-zA-Z0-9-_]/g, '-');
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-')
            .split('.')[0];
        const filename = `${cleanTestName}_${status}_${timestamp}.png`;
        const filepath = path.join(suiteDir, filename);

        await page.screenshot({
            path: filepath,
            fullPage: true,
            captureBeyondViewport: true,
        });

        console.log(`📸 Screenshot saved: ${filepath}`);
        return filepath;
    } catch (error) {
        console.error('❌ Failed to take screenshot:', error);
        return null;
    }
};

/**
 * Take screenshot on test failure
 * @param {object} page - Puppeteer page object
 * @param {string} testName - Name of the failed test
 * @param {string} suiteName - Name of the test suite
 * @param {Error} error - Error object
 * @param {string} runId - Unique run identifier
 * @returns {Promise<string>} Path to saved screenshot
 */
const takeFailureScreenshot = async (
    page,
    testName,
    suiteName,
    error,
    runId = null
) => {
    const filepath = await takeScreenshot(
        page,
        testName,
        suiteName,
        'failure',
        runId
    );

    if (filepath) {
        // Save error details
        const errorFile = filepath.replace('.png', '_error.json');
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            testName,
            suiteName,
            url: await page.url(),
            viewport: await page.viewport(),
        };

        fs.writeFileSync(errorFile, JSON.stringify(errorInfo, null, 2));
        console.log(`📝 Error details saved: ${errorFile}`);
    }

    return filepath;
};

/**
 * Clean up old screenshots (keep last N runs)
 * @param {number} keepRuns - Number of recent runs to keep
 */
const cleanupOldScreenshots = (keepRuns = 5) => {
    const screenshotsDir = path.join(process.cwd(), 'artifacts', 'screenshots');

    if (!fs.existsSync(screenshotsDir)) {
        return;
    }

    const runs = fs
        .readdirSync(screenshotsDir)
        .filter(item => {
            const itemPath = path.join(screenshotsDir, item);
            return fs.statSync(itemPath).isDirectory();
        })
        .map(item => ({
            name: item,
            path: path.join(screenshotsDir, item),
            time: fs.statSync(path.join(screenshotsDir, item)).ctime,
        }))
        .sort((a, b) => b.time - a.time);

    const runsToDelete = runs.slice(keepRuns);

    runsToDelete.forEach(run => {
        fs.rmSync(run.path, { recursive: true, force: true });
        console.log(`🗑️ Cleaned up old screenshots: ${run.name}`);
    });
};

/**
 * Quick screenshot for specific test debugging
 * @param {object} page - Puppeteer page object
 * @param {string} name - Simple name for screenshot
 * @returns {Promise<string>} Path to screenshot
 */
const quickScreenshot = async (page, name = 'debug') => {
    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .split('.')[0];
    const filename = `debug_${name}_${timestamp}.png`;
    const filepath = path.join(
        process.cwd(),
        'artifacts',
        'screenshots',
        filename
    );

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({
        path: filepath,
        fullPage: true,
    });

    console.log(`📸 Quick screenshot: ${filepath}`);
    return filepath;
};

module.exports = {
    waitForClickable,
    waitForText,
    getAllTextContent,
    hasClass,
    waitForDisappear,
    typeWithDelay,
    getJavaScriptErrors,
    waitForFullLoad,
    getAttribute,
    getAvailablePort,
    createScreenshotsDir,
    generateRunId,
    takeScreenshot,
    takeFailureScreenshot,
    cleanupOldScreenshots,
    quickScreenshot,
};
