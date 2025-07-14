/**
 * Application Configuration
 * This file contains environment-specific configuration
 */

// Get API URL from environment or use default
const getApiUrl = () => {
    // Check for environment variable in various places
    if (typeof process !== 'undefined' && process.env && process.env.API_URL) {
        return process.env.API_URL;
    }

    // Check for meta tag in HTML
    const metaTag = document.querySelector('meta[name="api-url"]');
    if (metaTag) {
        return metaTag.getAttribute('content');
    }

    // Check for window.env (can be set by build process)
    if (typeof window !== 'undefined' && window.env && window.env.API_URL) {
        return window.env.API_URL;
    }

    // Check for data attribute on script tag
    const scriptTag = document.querySelector('script[data-api-url]');
    if (scriptTag) {
        return scriptTag.getAttribute('data-api-url');
    }

    // Default fallback - can be set via environment
    return (
        (typeof process !== 'undefined' &&
            process.env &&
            process.env.DEFAULT_API_URL) ||
        'http://localhost:3102/api/v1'
    );
};

// Unified configuration object
const APP_CONFIG = {
    get apiUrl() {
        return getApiUrl();
    },
    TIMEOUTS: {
        REDIRECT_DELAY: 1500,
        REQUEST_TIMEOUT: 10000,
    },
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_DATA: 'userData',
    },
};

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG };
} else if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}

console.log('App configuration loaded:', {
    apiUrl: APP_CONFIG.apiUrl,
    env: typeof process !== 'undefined' ? process.env.NODE_ENV : 'browser',
});
