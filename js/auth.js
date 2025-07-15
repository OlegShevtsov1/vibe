/**
 * Authentication Module - Shared utilities for authentication
 * Contains AuthService, UIManager, Validator, and CONFIG
 *
 * Note: Requires config.js to be loaded before this file
 */

// Use global APP_CONFIG from config.js directly
const CONFIG = APP_CONFIG;

/**
 * Validation utilities
 */
// eslint-disable-next-line no-unused-vars
class Validator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !email.trim()) {
            return { isValid: false, message: 'Email is required' };
        }

        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address',
            };
        }

        return { isValid: true, message: '' };
    }

    static validatePassword(password) {
        if (!password) {
            return { isValid: false, message: 'Password is required' };
        }

        if (password.length < 8) {
            return {
                isValid: false,
                message: 'Password must be at least 8 characters long',
            };
        }

        if (!/(?=.*[a-z])/.test(password)) {
            return {
                isValid: false,
                message: 'Password must contain at least one lowercase letter',
            };
        }

        if (!/(?=.*[A-Z])/.test(password)) {
            return {
                isValid: false,
                message: 'Password must contain at least one uppercase letter',
            };
        }

        if (!/(?=.*\d)/.test(password)) {
            return {
                isValid: false,
                message: 'Password must contain at least one number',
            };
        }

        return { isValid: true, message: '' };
    }

    static validatePasswordConfirmation(password, confirmPassword) {
        if (!confirmPassword) {
            return { isValid: false, message: 'Please confirm your password' };
        }

        if (password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }

        return { isValid: true, message: '' };
    }
}

/**
 * UI Management utilities
 */
// eslint-disable-next-line no-unused-vars
class UIManager {
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

    static clearMessage() {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML = '';
            messageElement.classList.remove('show');
        }
    }

    static setFieldError(field, message) {
        this.clearFieldError(field);

        field.classList.add('is-invalid');

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        errorElement.textContent = message;

        // Insert after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    static clearFieldError(field) {
        field.classList.remove('is-invalid');

        // Remove existing error message
        const errorElement =
            field.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
    }

    static setButtonLoading(button, isLoading) {
        if (!button) {
            return;
        }

        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Loading...
            `;
        } else {
            button.disabled = false;
            // Restore original text based on button ID
            if (button.id === 'loginButton') {
                button.innerHTML = 'Sign In';
            } else if (button.id === 'registerButton') {
                button.innerHTML = 'Create Account';
            } else {
                button.innerHTML = 'Submit';
            }
        }
    }

    static updatePasswordStrength(password) {
        const strengthElement = document.getElementById('passwordStrength');
        if (!strengthElement) {
            return;
        }

        let strength = 0;
        let strengthText = '';
        let strengthClass = '';

        if (password.length >= 8) {
            strength++;
        }
        if (/(?=.*[a-z])/.test(password)) {
            strength++;
        }
        if (/(?=.*[A-Z])/.test(password)) {
            strength++;
        }
        if (/(?=.*\d)/.test(password)) {
            strength++;
        }
        if (/(?=.*[!@#$%^&*])/.test(password)) {
            strength++;
        }

        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthClass = 'text-danger';
                break;
            case 2:
                strengthText = 'Weak';
                strengthClass = 'text-warning';
                break;
            case 3:
                strengthText = 'Medium';
                strengthClass = 'text-info';
                break;
            case 4:
                strengthText = 'Strong';
                strengthClass = 'text-success';
                break;
            case 5:
                strengthText = 'Very Strong';
                strengthClass = 'text-success fw-bold';
                break;
        }

        strengthElement.innerHTML = `<small class="${strengthClass}">Password strength: ${strengthText}</small>`;
    }
}

/**
 * Authentication Service
 */
// eslint-disable-next-line no-unused-vars
class AuthService {
    static async makeRequest(endpoint, options = {}) {
        const url = `${CONFIG.apiUrl}${endpoint}`;
        console.log('Making request to:', url);

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: CONFIG.TIMEOUTS.REQUEST_TIMEOUT,
        };

        // Add auth token if available
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        console.log('Request options:', requestOptions);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                CONFIG.TIMEOUTS.REQUEST_TIMEOUT
            );

            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Response error:', errorData);

                let errorMessage = 'An error occurred';
                try {
                    const parsed = JSON.parse(errorData);
                    errorMessage =
                        parsed.message || parsed.error || errorMessage;
                } catch {
                    errorMessage = errorData || errorMessage;
                }

                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }

            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError')
            ) {
                throw new Error(
                    'Network error. Please check your connection and try again.'
                );
            }

            throw error;
        }
    }

    static async login(email, password) {
        console.log('AuthService.login called with:', { email });

        const response = await this.makeRequest('/sign_in', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
            }),
        });

        console.log('Login response:', response);

        if (response.status === 'success' && response.data) {
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.AUTH_TOKEN,
                response.data.authentication_token
            );
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.USER_DATA,
                JSON.stringify({
                    id: response.data.user_id,
                    email: response.data.email,
                })
            );
            console.log('Login successful, token stored');
            return response;
        } else {
            throw new Error(response.message || 'Invalid response from server');
        }
    }

    static async register(userData) {
        console.log('AuthService.register called with:', {
            email: userData.email,
        });

        const response = await this.makeRequest('/users', {
            method: 'POST',
            body: JSON.stringify({
                user: userData,
            }),
        });

        console.log('Registration response:', response);

        if (response.status === 'success' && response.data) {
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.AUTH_TOKEN,
                response.data.authentication_token
            );
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.USER_DATA,
                JSON.stringify({
                    id: response.data.user_id,
                    email: response.data.email,
                })
            );
            console.log('Registration successful, token stored');
            return response;
        } else {
            throw new Error(response.message || 'Invalid response from server');
        }
    }

    static async getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            // Try to get user from localStorage first
            const userData = localStorage.getItem(
                CONFIG.STORAGE_KEYS.USER_DATA
            );
            if (userData) {
                return JSON.parse(userData);
            }

            // Fallback to API call
            const response = await this.makeRequest('/me');
            if (response.user) {
                localStorage.setItem(
                    CONFIG.STORAGE_KEYS.USER_DATA,
                    JSON.stringify(response.user)
                );
                return response.user;
            }

            return response;
        } catch (error) {
            console.error('Failed to get current user:', error);
            this.logout();
            return null;
        }
    }

    static isAuthenticated() {
        return !!localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    }

    static logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        window.location.href = 'index.html';
    }

    static getAuthToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    }
}
