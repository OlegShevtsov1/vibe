// Main application JavaScript file
// This file contains the core functionality for the Vibe Application

/**
 * Application configuration
 */
const APP_CONFIG = {
    apiUrl: 'http://localhost:3000',
};

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
        this.greetUser();
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
        const messages = [
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
        console.log('Vibe Application loaded successfully!');
        Utils.showMessage('Application loaded successfully!', 'info');
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    new VibeApp();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VibeApp, Utils, APP_CONFIG };
}
