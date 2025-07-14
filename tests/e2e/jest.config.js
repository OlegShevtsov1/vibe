module.exports = {
    displayName: 'E2E Tests',
    testEnvironment: 'node',
    testTimeout: 30000,
    testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
    verbose: true,
    collectCoverageFrom: ['js/**/*.js', '!js/**/*.test.js', '!node_modules/**'],
    setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
};
