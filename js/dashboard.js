/**
 * Dashboard Page Module
 * Handles dashboard functionality for authenticated users
 */

class DashboardApp {
    constructor() {
        this.userProfile = document.getElementById('userProfile');
        this.userActivity = document.getElementById('userActivity');
    }

    async init() {
        // Check authentication first
        if (!AuthService.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        this.bindEventListeners();
        await this.loadUserData();
        await this.updateHeaderNavigation();
        this.showWelcomeMessage();
    }

    bindEventListeners() {
        // Event listeners for dashboard functionality
        // Header logout button is handled in updateHeaderNavigation()
    }

    async loadUserData() {
        try {
            console.log('Loading user data...');
            const user = await AuthService.getCurrentUser();

            if (user) {
                console.log('User data loaded:', user);
                this.displayUserProfile(user);
            } else {
                console.log('No user data available');
                this.displayProfileError();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.displayProfileError();
        }
    }

    displayUserProfile(user) {
        if (!this.userProfile) {
            return;
        }

        const profileHtml = `
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <i class="bi bi-person-circle display-6 text-primary"></i>
                </div>
                <div>
                    <h6 class="mb-1">${user.email || 'Unknown User'}</h6>
                    <p class="text-muted mb-0 small">
                        Member since ${this.formatDate(user.created_at)}
                    </p>
                </div>
            </div>
            <div class="mt-3">
                <div class="row text-center">
                    <div class="col-4">
                        <div class="border-end">
                            <div class="h6 mb-0">42</div>
                            <small class="text-muted">Items</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="border-end">
                            <div class="h6 mb-0">15</div>
                            <small class="text-muted">Projects</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="h6 mb-0">98%</div>
                        <small class="text-muted">Score</small>
                    </div>
                </div>
            </div>
        `;

        this.userProfile.innerHTML = profileHtml;
    }

    displayProfileError() {
        if (!this.userProfile) {
            return;
        }

        this.userProfile.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-exclamation-triangle"></i>
                <p class="mb-0">Unable to load profile data</p>
            </div>
        `;
    }

    showWelcomeMessage() {
        UIManager.showMessage(
            'Welcome to your dashboard! You are successfully logged in.',
            'success'
        );

        // Clear the message after a few seconds
        setTimeout(() => {
            UIManager.clearMessage();
        }, 5000);
    }

    formatDate(dateString) {
        if (!dateString) {
            return 'Unknown';
        }

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Unknown';
        }
    }

    handleLogout() {
        console.log('Logout button clicked');
        UIManager.showMessage('Logging out...', 'info');

        setTimeout(() => {
            AuthService.logout();
        }, 500);
    }

    async updateHeaderNavigation() {
        const headerNav = document.getElementById('header-nav');
        const user = await AuthService.getCurrentUser();

        if (headerNav && user) {
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

            // Add logout functionality to the header button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }
        }
    }
}

// Initialize the dashboard app
document.addEventListener('DOMContentLoaded', () => {
    const app = new DashboardApp();
    app.init();
});
