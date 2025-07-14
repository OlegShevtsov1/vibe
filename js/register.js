/**
 * Registration Page Module
 * Handles user registration functionality
 */

class RegisterApp {
    constructor() {
        this.form = document.getElementById('register-form');
        this.emailField = document.getElementById('email');
        this.passwordField = document.getElementById('password');
        this.confirmPasswordField = document.getElementById('confirmPassword');
        this.submitButton = document.getElementById('registerButton');
        this.toggleButtons = document.querySelectorAll('.toggle-password');
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
            this.form.addEventListener('submit', (e) => this.handleRegister(e));
        }

        this.toggleButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                this.togglePasswordVisibility(targetId, button);
            });
        });
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
            this.passwordField.addEventListener('input', () => {
                UIManager.updatePasswordStrength(this.passwordField.value);
            });
        }

        if (this.confirmPasswordField) {
            this.confirmPasswordField.addEventListener('blur', () =>
                this.validateField(this.confirmPasswordField)
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
        } else if (field.id === 'password') {
            const validation = Validator.validatePassword(field.value);
            if (!validation.isValid) {
                UIManager.setFieldError(field, validation.message);
            }
        } else if (field.id === 'confirmPassword') {
            const validation = Validator.validatePasswordConfirmation(
                this.passwordField.value,
                field.value
            );
            if (!validation.isValid) {
                UIManager.setFieldError(field, validation.message);
            }
        }
    }

    togglePasswordVisibility(fieldId, button) {
        const field = document.getElementById(fieldId);
        if (!field) {
            return;
        }

        const type = field.type === 'password' ? 'text' : 'password';
        field.type = type;
        button.innerHTML =
            type === 'password'
                ? '<i class="bi bi-eye"></i>'
                : '<i class="bi bi-eye-slash"></i>';
    }

    async handleRegister(event) {
        event.preventDefault();

        // Prevent double submission
        if (this.submitButton.disabled) {
            console.log('Registration already in progress, ignoring');
            return;
        }

        UIManager.clearMessage();

        // Block button immediately
        UIManager.setButtonLoading(this.submitButton, true);

        const email = this.emailField.value.trim();
        const password = this.passwordField.value;
        const confirmPassword = this.confirmPasswordField.value;

        const emailValidation = Validator.validateEmail(email);
        if (!emailValidation.isValid) {
            UIManager.setFieldError(this.emailField, emailValidation.message);
            UIManager.setButtonLoading(this.submitButton, false);
            return;
        }

        const passwordValidation = Validator.validatePassword(password);
        if (!passwordValidation.isValid) {
            UIManager.setFieldError(
                this.passwordField,
                passwordValidation.message
            );
            UIManager.setButtonLoading(this.submitButton, false);
            return;
        }

        const confirmValidation = Validator.validatePasswordConfirmation(
            password,
            confirmPassword
        );
        if (!confirmValidation.isValid) {
            UIManager.setFieldError(
                this.confirmPasswordField,
                confirmValidation.message
            );
            UIManager.setButtonLoading(this.submitButton, false);
            return;
        }

        try {
            await AuthService.register({
                email,
                password,
                password_confirmation: confirmPassword,
            });

            UIManager.showMessage(
                'Registration successful! Redirecting to dashboard...',
                'success'
            );

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, CONFIG.TIMEOUTS.REDIRECT_DELAY);
        } catch (error) {
            console.error('Registration failed:', error);
            UIManager.showMessage(
                error.message || 'Registration failed. Please try again.',
                'error'
            );
        } finally {
            UIManager.setButtonLoading(this.submitButton, false);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new RegisterApp();
    app.init();
});
