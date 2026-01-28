# 10x-cards

10x-cards is a modern web application designed to revolutionize the way you study. By leveraging Large Language Models (LLMs), it automates the tedious process of creating flashcards from your notes, articles, or any learning material, allowing you to focus on what matters most: learning.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Creating high-quality flashcards for spaced repetition is often more time-consuming than the actual learning process. 10x-cards bridges this gap by providing an intelligent interface where you can paste raw text and receive a set of curated, ready-to-study flashcards in seconds.

### Key Features

- **AI-Powered Generation:** Automatically extract key concepts and questions from 1,000 to 10,000 characters of text.
- **Full Control:** Review, edit, or reject AI suggestions before saving them to your library.
- **Library Management:** Organize your collection with search, pagination, and manual CRUD operations.
- **Seamless Study Mode:** A clean, distraction-free interface for your daily review sessions.
- **Secure Auth:** Personal accounts powered by Supabase for data persistence and privacy.

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/):** For high-performance static site generation and modern routing.
- **[React 19](https://react.dev/):** Powers interactive components and dynamic state.
- **[Tailwind CSS 4](https://tailwindcss.com/):** For modern, utility-first styling.
- **[Shadcn/ui](https://ui.shadcn.com/):** High-quality, accessible UI components.
- **TypeScript 5:** Ensuring type safety and better developer experience.

### Backend & AI

- **[Supabase](https://supabase.com/):** Backend-as-a-Service providing PostgreSQL, Authentication, and real-time capabilities.
- **[OpenRouter.ai](https://openrouter.ai/):** Unified API access to world-class LLMs (OpenAI, Anthropic, Google).

### Testing & Quality

- **[Vitest](https://vitest.dev/):** Fast unit and integration testing with jsdom environment.
- **[@testing-library/react](https://testing-library.com/react):** Testing utilities for React components.
- **[Playwright](https://playwright.dev/):** E2E testing with Chromium/Desktop Chrome browser.
- **ESLint & Prettier:** For code quality and consistent formatting.

## Getting Started Locally

### Prerequisites

- **Node.js:** version `22.14.0` (as specified in `.nvmrc`)
- **Package Manager:** `npm` (included with Node.js)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/10x-cards.git
    cd 10x-cards
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add your credentials:

    ```env
    PUBLIC_SUPABASE_URL=your_supabase_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Running Tests

**Unit Tests (Vitest):**

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once
npm run test:run

# Open interactive UI
npm run test:ui
```

**End-to-End Tests (Playwright):**

```bash
# Run E2E tests (automatically starts dev server)
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Open Playwright UI for debugging
npm run test:e2e:ui
```

**Test Coverage:**

- **Unit tests** are located in `src/**/*.test.ts` files
- **E2E tests** are located in `tests/e2e/**/*.spec.ts` files
- Vitest is configured with jsdom environment for React component testing
- Playwright uses Chromium browser for consistent E2E testing

## Available Scripts

### Development

| Command            | Description                                   |
| :----------------- | :-------------------------------------------- |
| `npm run dev`      | Starts the Astro development server.          |
| `npm run build`    | Builds the project for production.            |
| `npm run preview`  | Previews the production build locally.        |

### Code Quality

| Command            | Description                                   |
| :----------------- | :-------------------------------------------- |
| `npm run lint`     | Runs ESLint to check for code quality issues. |
| `npm run lint:fix` | Automatically fixes linting errors.           |
| `npm run format`   | Formats the codebase using Prettier.          |

### Testing

| Command                 | Description                                                      |
| :---------------------- | :--------------------------------------------------------------- |
| `npm run test`          | Runs Vitest unit tests in watch mode.                            |
| `npm run test:run`      | Runs Vitest unit tests once (useful for CI/CD).                  |
| `npm run test:ui`       | Opens Vitest UI for interactive test exploration.                |
| `npm run test:e2e`      | Runs Playwright E2E tests (starts dev server automatically).     |
| `npm run test:e2e:ui`   | Opens Playwright UI mode for interactive E2E test debugging.     |
| `npm run test:e2e:headed` | Runs E2E tests with visible browser window.                    |

## Project Scope

### Included in MVP

- User registration and login (Email/Password).
- AI Flashcard generation from text (1k - 10k characters).
- Review and edit interface for generated cards.
- Library management (Search, Pagination, Manual Add/Edit/Delete).
- Basic study session mode (Reveal Answer).

### Currently Out of Scope

- Mobile applications (Native iOS/Android).
- Direct file uploads (PDF, DOCX, Images).
- Advanced SRS algorithms (SM-2, FSRS).
- Public card sets or collaborative sharing.
- Progress analytics and dashboards.

## Project Status

The project is currently in the **MVP / Initial Development** phase (v0.0.1). Core features for AI generation and library management are being actively implemented.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
