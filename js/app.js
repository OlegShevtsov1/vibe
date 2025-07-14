// Main application JavaScript file
// This file contains the core functionality for the Vibe Application

// Configuration is now loaded from js/config.js
// APP_CONFIG will be available globally after config.js is loaded

/**
 * Utility functions
 */
class Utils {
    /**
     * Display a message to the user
     * @param {string} message - The message to display
     * @param {string} type - The type of message (success, error, info)
     */
    static showMessage(message, type = 'info') {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML = `<div class="alert alert-${
                type === 'error' ? 'danger' : type
            } alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
            messageElement.classList.add('show');
        }
    }

    /**
     * Clear the message area
     */
    static clearMessage() {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML = '';
            messageElement.classList.remove('show');
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    static isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    /**
     * Get current user
     * @returns {object|null} - User object or null
     */
    static getCurrentUser() {
        const user = localStorage.getItem('userData');
        return user ? JSON.parse(user) : null;
    }
}

/**
 * Main application class
 */
class VibeApp {
    constructor() {
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.setupEventListeners();
        this.updateUIForAuthState();
        this.greetUser();
    }

    /**
     * Update UI based on authentication state
     */
    updateUIForAuthState() {
        const headerNav = document.getElementById('header-nav');
        const user = Utils.getCurrentUser();

        if (Utils.isAuthenticated() && user) {
            // User is authenticated, show user info and logout button
            if (headerNav) {
                headerNav.innerHTML = `
                    <div class="d-flex align-items-center gap-3">
                        <a href="index.html" class="btn btn-outline-secondary btn-sm">
                            <i class="bi bi-house me-1"></i>Home
                        </a>
                        <span class="text-muted">
                            <i class="bi bi-person-circle me-1"></i>Hello, ${user.email}!
                        </span>
                        <button id="logout-btn" class="btn btn-outline-danger btn-sm">
                            <i class="bi bi-box-arrow-right me-1"></i>Logout
                        </button>
                    </div>
                `;

                // Add logout functionality
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener(
                        'click',
                        this.handleLogout.bind(this)
                    );
                }
            }
        } else {
            // User is not authenticated, show login and register links
            if (headerNav) {
                headerNav.innerHTML = `
                    <a href="index.html" class="btn btn-outline-secondary me-2">
                        <i class="bi bi-house me-1"></i>Home
                    </a>
                    <a href="login.html" class="btn btn-outline-primary me-2">
                        <i class="bi bi-box-arrow-in-right me-1"></i>Login
                    </a>
                    <a href="register.html" class="btn btn-outline-success">
                        <i class="bi bi-person-plus me-1"></i>Register
                    </a>
                `;
            }
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        try {
            // Clear authentication data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('refreshToken');

            Utils.showMessage('You have been logged out successfully', 'info');

            // Update UI to show login/register buttons
            this.updateUIForAuthState();

            // Optionally redirect to auth page or reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            Utils.showMessage('An error occurred during logout', 'error');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const helloBtn = document.getElementById('hello-btn');
        if (helloBtn) {
            helloBtn.addEventListener(
                'click',
                this.handleHelloClick.bind(this)
            );
        }
    }

    /**
     * Handle hello button click
     */
    handleHelloClick() {
        const user = Utils.getCurrentUser();

        const messages = user
            ? [
                  `Hello, ${user.name}! Welcome to Vibe Application!`,
                  `Great to see you here, ${user.name}!`,
                  'Ready to explore the app?',
                  "Let's get started!",
                  'This is just the beginning!',
              ]
            : [
                  'Hello! Welcome to Vibe Application!',
                  'Great to see you here!',
                  'Ready to explore the app?',
                  "Let's get started!",
                  'This is just the beginning!',
              ];

        const randomMessage =
            messages[Math.floor(Math.random() * messages.length)];
        Utils.showMessage(randomMessage, 'success');
    }

    /**
     * Greet the user on page load
     */
    greetUser() {
        const user = Utils.getCurrentUser();
        const greeting = user
            ? `Vibe Application loaded! Welcome back, ${user.name}!`
            : 'Vibe Application loaded successfully!';

        console.log(greeting);

        if (user) {
            Utils.showMessage(`Welcome back, ${user.name}!`, 'success');
        } else {
            Utils.showMessage('Application loaded successfully!', 'info');
        }
    }

    /**
     * Check authentication status and verify token if needed
     */
    async checkTokenValidity() {
        if (!Utils.isAuthenticated()) {
            return;
        }

        try {
            const userData = JSON.parse(
                localStorage.getItem('userData') || '{}'
            );
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${APP_CONFIG.apiUrl}/me`, {
                headers: {
                    'X-User-Token': token,
                    'X-User-Email': userData.email,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Token is invalid, clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                localStorage.removeItem('refreshToken');
                this.updateUIForAuthState();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            // Optionally clear auth data on network error
        }
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new VibeApp();

    // Optionally check token validity on load
    app.checkTokenValidity();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    // Import APP_CONFIG from config.js for testing
    const { APP_CONFIG } = require('./config.js');
    module.exports = { VibeApp, Utils, APP_CONFIG };
}
