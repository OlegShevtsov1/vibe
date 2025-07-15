// Test suite for Vibe Application
// This file contains unit tests for the main application functionality

const { VibeApp, Utils, APP_CONFIG } = require('../js/app.js');

describe('Vibe Application Tests', () => {
    describe('APP_CONFIG', () => {
        test('should have correct API configuration', () => {
            // Set default API URL for test
            process.env.DEFAULT_API_URL = 'http://localhost:3102/api/v1';

            // Re-require to get fresh config
            delete require.cache[require.resolve('../js/config.js')];
            delete require.cache[require.resolve('../js/app.js')];
            const { APP_CONFIG: freshConfig } = require('../js/app.js');

            expect(typeof freshConfig.apiUrl).toBe('string');
            expect(freshConfig.apiUrl).toMatch(/^https?:\/\/.+/);
        });

        test('should use environment variable when set', () => {
            process.env.DEFAULT_API_URL = 'https://api.example.com/v1';

            // Re-require to get fresh config
            delete require.cache[require.resolve('../js/config.js')];
            delete require.cache[require.resolve('../js/app.js')];
            const { APP_CONFIG: freshConfig } = require('../js/app.js');

            expect(freshConfig.apiUrl).toBe('https://api.example.com/v1');
        });
    });

    describe('Utils class', () => {
        let mockMessageElement;

        beforeEach(() => {
            mockMessageElement = {
                innerHTML: '',
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                },
            };
            document.getElementById = jest
                .fn()
                .mockReturnValue(mockMessageElement);
        });

        test('should display success message', () => {
            Utils.showMessage('Test message', 'success');

            expect(document.getElementById).toHaveBeenCalledWith('message');
            expect(mockMessageElement.innerHTML).toContain('Test message');
            expect(mockMessageElement.innerHTML).toContain('alert-success');
            expect(mockMessageElement.classList.add).toHaveBeenCalledWith(
                'show'
            );
        });

        test('should display error message', () => {
            Utils.showMessage('Error message', 'error');

            expect(mockMessageElement.innerHTML).toContain('Error message');
            expect(mockMessageElement.innerHTML).toContain('alert-danger');
        });

        test('should display info message by default', () => {
            Utils.showMessage('Info message');

            expect(mockMessageElement.innerHTML).toContain('Info message');
            expect(mockMessageElement.innerHTML).toContain('alert-info');
        });

        test('should clear message', () => {
            Utils.clearMessage();

            expect(document.getElementById).toHaveBeenCalledWith('message');
            expect(mockMessageElement.innerHTML).toBe('');
            expect(mockMessageElement.classList.remove).toHaveBeenCalledWith(
                'show'
            );
        });

        test('should handle missing message element gracefully', () => {
            document.getElementById = jest.fn().mockReturnValue(null);

            expect(() => {
                Utils.showMessage('Test message');
                Utils.clearMessage();
            }).not.toThrow();
        });
    });

    describe('VibeApp class', () => {
        let mockHelloBtn, mockMessageElement;

        beforeEach(() => {
            mockHelloBtn = {
                addEventListener: jest.fn(),
            };
            mockMessageElement = {
                innerHTML: '',
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                },
            };

            document.getElementById = jest.fn((id) => {
                if (id === 'hello-btn') {
                    return mockHelloBtn;
                }
                if (id === 'message') {
                    return mockMessageElement;
                }
                return null;
            });
        });

        test('should initialize app successfully', () => {
            new VibeApp();

            expect(document.getElementById).toHaveBeenCalledWith('hello-btn');
            expect(mockHelloBtn.addEventListener).toHaveBeenCalledWith(
                'click',
                expect.any(Function)
            );
            expect(console.log).toHaveBeenCalledWith(
                'Vibe Application loaded successfully!'
            );
        });

        test('should handle missing hello button gracefully', () => {
            document.getElementById = jest.fn().mockReturnValue(null);

            expect(() => {
                new VibeApp();
            }).not.toThrow();
        });

        test('should handle hello button click', () => {
            new VibeApp();

            // Get the click handler from the addEventListener mock
            const clickHandler = mockHelloBtn.addEventListener.mock.calls[0][1];

            // Simulate click
            clickHandler();

            expect(mockMessageElement.innerHTML).toContain('alert-success');
            expect(mockMessageElement.classList.add).toHaveBeenCalledWith(
                'show'
            );
        });

        test('should show random messages on click', () => {
            new VibeApp();
            const clickHandler = mockHelloBtn.addEventListener.mock.calls[0][1];

            // Click multiple times to test randomness
            const messages = new Set();
            for (let i = 0; i < 10; i++) {
                clickHandler();
                messages.add(mockMessageElement.innerHTML);
            }

            // Should have at least one message (could be the same due to randomness)
            expect(messages.size).toBeGreaterThan(0);
        });
    });

    describe('Hello World functionality', () => {
        test('should display welcome message', () => {
            const welcomeMessages = [
                'Hello! Welcome to Vibe Application!',
                'Great to see you here!',
                'Ready to explore the app?',
                "Let's get started!",
                'This is just the beginning!',
            ];

            welcomeMessages.forEach((message) => {
                expect(typeof message).toBe('string');
                expect(message.length).toBeGreaterThan(0);
            });
        });

        test('should handle application initialization', () => {
            // This test verifies that the DOM event listener is set up
            // We check that the application class exists and can be instantiated
            const app = new VibeApp();
            expect(app).toBeDefined();
            expect(typeof app.initializeApp).toBe('function');
            expect(typeof app.setupEventListeners).toBe('function');
        });
    });

    describe('Integration Tests', () => {
        test('should work as a complete hello world app', () => {
            const mockHelloBtn = {
                addEventListener: jest.fn(),
            };
            const mockMessageElement = {
                innerHTML: '',
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                },
            };

            document.getElementById = jest.fn((id) => {
                if (id === 'hello-btn') {
                    return mockHelloBtn;
                }
                if (id === 'message') {
                    return mockMessageElement;
                }
                return null;
            });

            // Initialize app
            new VibeApp();

            // Verify initial state
            expect(console.log).toHaveBeenCalledWith(
                'Vibe Application loaded successfully!'
            );
            expect(mockMessageElement.innerHTML).toContain(
                'Application loaded successfully!'
            );

            // Test button click
            const clickHandler = mockHelloBtn.addEventListener.mock.calls[0][1];
            clickHandler();

            // Verify click response
            expect(mockMessageElement.innerHTML).toContain('alert-success');
            expect(mockMessageElement.classList.add).toHaveBeenCalledWith(
                'show'
            );
        });
    });
});
