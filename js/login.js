/**
 * Login Page Module
 * Handles user login functionality
 */

class LoginApp {
    constructor() {
        this.form = document.getElementById('login-form');
        this.emailField = document.getElementById('email');
        this.passwordField = document.getElementById('password');
        this.submitButton = document.getElementById('loginButton');
        this.toggleButton = document.getElementById('toggle-password');
    }

    init() {
        this.checkAuthenticationStatus();
        this.bindEventListeners();
        this.addRealTimeValidation();
    }

    checkAuthenticationStatus() {
        if (AuthService.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }

    bindEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () =>
                this.togglePasswordVisibility()
            );
        }
    }

    addRealTimeValidation() {
        if (this.emailField) {
            this.emailField.addEventListener('blur', () =>
                this.validateField(this.emailField)
            );
        }

        if (this.passwordField) {
            this.passwordField.addEventListener('blur', () =>
                this.validateField(this.passwordField)
            );
        }
    }

    validateField(field) {
        if (!field || !field.value.trim()) {
            return;
        }

        UIManager.clearFieldError(field);

        if (field.type === 'email') {
            const validation = Validator.validateEmail(field.value);
            if (!validation.isValid) {
                UIManager.setFieldError(field, validation.message);
            }
        }
    }

    togglePasswordVisibility() {
        const type =
            this.passwordField.type === 'password' ? 'text' : 'password';
        this.passwordField.type = type;
        this.toggleButton.innerHTML =
            type === 'password'
                ? '<i class="bi bi-eye"></i>'
                : '<i class="bi bi-eye-slash"></i>';
    }

    async handleLogin(event) {
        event.preventDefault();

        // Prevent double submission
        if (this.submitButton.disabled) {
            return;
        }

        UIManager.clearMessage();

        // Block button immediately
        UIManager.setButtonLoading(this.submitButton, true);

        const email = this.emailField.value.trim();
        const password = this.passwordField.value;
        console.log('Login attempt for email:', email);

        // Validate input
        const emailValidation = Validator.validateEmail(email);
        if (!emailValidation.isValid) {
            console.log('Email validation failed:', emailValidation.message);
            UIManager.setFieldError(this.emailField, emailValidation.message);
            UIManager.setButtonLoading(this.submitButton, false);
            return;
        }

        if (!password) {
            console.log('Password validation failed: empty password');
            UIManager.setFieldError(this.passwordField, 'Password is required');
            UIManager.setButtonLoading(this.submitButton, false);
            return;
        }

        console.log('Starting login process...');

        try {
            console.log('Calling AuthService.login...');
            await AuthService.login(email, password);
            console.log('Login succeeded, showing success message');

            UIManager.showMessage(
                'Login successful! Redirecting to dashboard...',
                'success'
            );

            setTimeout(() => {
                console.log('Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            }, CONFIG.TIMEOUTS.REDIRECT_DELAY);
        } catch (error) {
            console.error('Login failed in handleLogin:', error);
            UIManager.showMessage(
                error.message || 'Login failed. Please try again.',
                'error'
            );
        } finally {
            console.log('Resetting button loading state');
            UIManager.setButtonLoading(this.submitButton, false);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new LoginApp();
    app.init();
});
