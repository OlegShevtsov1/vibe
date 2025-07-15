// HTML Components - DRY reusable parts
// eslint-disable-next-line no-unused-vars
class HTMLComponents {
    // Common HTML head (meta tags, links)
    static getHead(description = 'Vibe Application') {
        return `
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="description" content="${description}">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
            <link rel="stylesheet" href="css/style.css">
        `;
    }

    // Common header with navigation
    static getHeader(activePage = '') {
        return `
            <header class="py-4 mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <h1 class="h3 mb-0">
                        <i class="bi bi-lightning-charge text-primary"></i>
                        Vibe Application
                    </h1>
                    <nav id="header-nav">
                        <a href="index.html" class="btn ${activePage === 'home' ? 'btn-primary' : 'btn-outline-primary'} me-2">Home</a>
                        <a href="login.html" class="btn ${activePage === 'login' ? 'btn-primary' : 'btn-outline-secondary'} me-2">Login</a>
                        <a href="register.html" class="btn ${activePage === 'register' ? 'btn-primary' : 'btn-outline-secondary'}">Register</a>
                    </nav>
                </div>
            </header>
        `;
    }

    // Common footer
    static getFooter() {
        return `
            <footer class="py-4 mt-5 border-top">
                <div class="text-center text-muted">
                    <p>&copy; 2024 Vibe Application. All rights reserved.</p>
                </div>
            </footer>
        `;
    }

    // Bootstrap scripts
    static getScripts() {
        return `
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        `;
    }

    // Initialize page with common components
    static initPage(config = {}) {
        const { activePage = '', description = 'Vibe Application' } = config;

        // Add head content (preserving existing title)
        document.head.insertAdjacentHTML(
            'beforeend',
            this.getHead(description)
        );

        // Insert header
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = this.getHeader(activePage);
        }

        // Insert footer
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = this.getFooter();
        }

        // Add bootstrap scripts to body end
        document.body.insertAdjacentHTML('beforeend', this.getScripts());
    }
}
