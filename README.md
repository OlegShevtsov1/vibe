# Vibe Application

A modern, responsive web application built with vanilla JavaScript, HTML5, CSS3, and Bootstrap.

## Features

- **Modern UI**: Clean, responsive design with Bootstrap 5
- **Interactive Elements**: Dynamic content and user interactions
- **Testing**: Comprehensive test suite with Jest
- **CI/CD**: Automated testing and deployment with GitHub Actions
- **Cross-browser**: Compatible with all modern browsers

## Tech Stack

- **Frontend**: JavaScript (ES6+), HTML5, CSS3
- **Framework**: Bootstrap 5
- **Testing**: Jest
- **CI/CD**: GitHub Actions
- **Server**: http-server (for development)

## Installation

## Repository

**GitHub:** [vibe](vibe)

## Project

**GitHub:** [projects/6](projects/6)

Setup environment variables (optional):

```bash
cp .env.example .env
# Edit .env file with your actual values
```

## Development

### 🖥️ Local Development

Start the development server:

```bash
npm start                     # Start server and open browser
npm run dev                   # Start server without opening browser
```

The application will be available at `http://localhost:8080`

### 🐳 Docker Development

Build and run with Docker:

```bash
docker-compose build         # Build Docker image
docker-compose up -d         # Start containers in background
docker-compose up --build    # Build and start in one command
```

Container management:

```bash
docker-compose down          # Stop containers
docker-compose logs -f       # View logs
docker exec -it 1_vibe-app-1 sh    # Access container shell
```

Run commands in container:

```bash
docker exec -it 1_vibe-app-1 npm test           # Run tests
docker exec -it 1_vibe-app-1 npm run lint       # Run JavaScript linting
docker exec -it 1_vibe-app-1 npm run lint:html  # Run HTML validation
docker exec -it 1_vibe-app-1 npm run security   # Run security scan
```

## Testing

```bash
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Generate coverage report
```

### Testing in Docker

```bash
docker exec -it 1_vibe-app-1 npm test                  # Run tests in container
docker exec -it 1_vibe-app-1 npm run test:coverage     # Run tests with coverage
docker exec -it 1_vibe-app-1 npm run lint:all          # Run all linting (JS + HTML)
```

### Test

```bash
npx jest -t "should handle missing message element gracefully" # Example test with debug
JEST_DEBUG=true npx jest tests/app.test.js  # Run specific test file with debug
JEST_DEBUG=true npm run test:file tests/app.test.js  # Run specific test file
npm run test:name "should handle missing message element gracefully"n specific test by name
```

```E2E
npm run test:e2e          # ALL (9.3s)
npm run test:e2e:visual   # Visual mode
npm run test:e2e:debug    # Debug mode
npm run test:e2e:fast     # Fast mode

HEADLESS=false SLOWMO=100 npx jest tests/e2e/app.e2e.test.js --testNamePattern="should display success message" --testTimeout=30000 --testEnvironment=node


# Single test with screenshot
SCREENSHOT_ON_SUCCESS=true npx jest tests/e2e/app.e2e.test.js --testNamePattern="should load the main page" --testTimeout=30000 --testEnvironment=node

# Visual test with slow motion + single test with screenshot
HEADLESS=false SLOWMO=100 SCREENSHOT_ON_SUCCESS=true npx jest tests/e2e/app.e2e.test.js --testNamePattern="should load the main page" --testTimeout=30000 --testEnvironment=node
```

## Code Quality

```bash
npm run lint                  # Check JavaScript quality
npm run lint:fix              # Auto-fix JavaScript issues
npm run lint:html             # Check HTML validation
npm run lint:all              # Check both JavaScript and HTML
npm run format                # Auto-format code
npm run format:check          # Check formatting
```

```bash
npm run  lint:html:fix
npm run  lint:html:fix:all
npm run  lint:html:autofix
```

### Security & Performance

```bash
npm run audit                 # Check vulnerabilities
npm run security              # Run security scan
npm run lighthouse            # Performance audit
```

## CI/CD Pipeline

The project uses GitHub Actions with the following stages:

1. **Test**: Unit and integration tests on Node.js 20.x, 22.x
2. **Lint**: Code quality checks (ESLint, HTML, CSS validation)
3. **Build**: Production build creation
4. **Deploy**: Automatic deployment on main branch

Reports are generated in the `reports/` directory.

## Project Structure

```
├── css/                      # Stylesheets
├── js/                       # JavaScript files
├── tests/                    # Test files
├── scripts/                  # Build scripts
├── .github/                  # CI/CD workflows
├── index.html               # Main HTML file
└── package.json             # Dependencies
```
