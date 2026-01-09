# Flashcards AI

An intelligent flashcard application powered by AI with spaced repetition learning system (FSRS). Create, study, and master any topic with personalized AI-generated flashcards.

## ✨ Features

- 🎯 **Smart Learning System** - FSRS algorithm for optimal spaced repetition
- 🤖 **AI-Powered Generation** - Create flashcards automatically from any topic
- 📚 **Deck Management** - Organize flashcards into custom decks
- 📊 **Progress Tracking** - Monitor your learning statistics and streaks
- 🔐 **Secure Authentication** - Google OAuth and Magic Link login
- 📱 **Responsive Design** - Works seamlessly on all devices
- ♿ **Accessibility First** - WCAG 2.1 AA compliant

## 🛠️ Tech Stack

### Core
- [Astro](https://astro.build/) v5 - Modern web framework with SSR enabled
- [React](https://react.dev/) v19 - UI library for interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework

### Backend & Database
- [Supabase](https://supabase.com/) - Backend services, authentication, and PostgreSQL database
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) - TypeScript implementation of FSRS algorithm

### UI Components
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible component library
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Lucide React](https://lucide.dev/) - Icon library

### Testing
- [Vitest](https://vitest.dev/) - Unit test framework
- [Playwright](https://playwright.dev/) - E2E testing
- [Testing Library](https://testing-library.com/) - React testing utilities
- [MSW](https://mswjs.io/) - API mocking

### Code Quality
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Code formatting
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [lint-staged](https://github.com/okonet/lint-staged) - Pre-commit linting

## 📋 Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)
- Supabase account (for backend services)

## 🚀 Getting Started

1. **Clone the repository:**

```bash
git clone <repository-url>
cd 10xdevs-cert
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory (see `.env.example`):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. **Set up Supabase:**

```bash
# Make sure Supabase CLI is installed
npx supabase start

# Apply migrations
npx supabase db push
```

5. **Run the development server:**

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:e2e:report` - View E2E test report

## 📁 Project Structure

```md
.
├── src/
│   ├── components/
│   │   ├── auth/                   # Authentication components
│   │   ├── dashboard/              # Dashboard components
│   │   ├── settings/               # Settings components
│   │   ├── study/                  # Study session components
│   │   ├── ui/                     # Shadcn/ui components
│   │   └── hooks/                  # Custom React hooks
│   ├── db/
│   │   ├── database.types.ts       # Generated database types
│   │   └── supabase.client.ts      # Supabase client configuration
│   ├── layouts/                    # Astro layouts
│   ├── lib/
│   │   ├── services/               # Business logic and services
│   │   └── validations/            # Zod validation schemas
│   ├── middleware/                 # Astro middleware
│   ├── pages/                      # Astro pages (file-based routing)
│   │   ├── api/                    # API endpoints
│   │   ├── auth/                   # Auth pages
│   │   ├── decks/                  # Deck management
│   │   └── study/                  # Study session pages
│   ├── content/                    # Content collections
│   │   └── legal/                  # Legal documents (T&C, Privacy)
│   ├── tests/                      # Unit test setup and mocks
│   │   ├── mocks/                  # MSW handlers
│   │   ├── factories/              # Test data factories
│   │   └── helpers/                # Test utilities
│   ├── styles/                     # Global styles
│   ├── types.ts                    # Shared types and interfaces
│   └── env.d.ts                    # TypeScript environment definitions
├── e2e/                            # E2E test files (Playwright)
├── supabase/
│   └── migrations/                 # Database migrations
├── public/                         # Static assets
└── README-TESTS.md                 # Comprehensive testing guide
```

## 🧪 Testing

This project has comprehensive test coverage with both unit and E2E tests. See [README-TESTS.md](./README-TESTS.md) for detailed testing documentation.

### Quick Testing Commands

```bash
# Run all unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification and use a Feature Branch Workflow. See [CLAUDE.md](./CLAUDE.md) for detailed contribution guidelines including:

- Git workflow and branch naming conventions
- Commit message format
- Code quality standards
- Architecture guidelines

### Quick Start for Contributors

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the project guidelines

3. Commit using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

4. Push and create a Pull Request to `develop`

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guidelines and architecture
- [README-TESTS.md](./README-TESTS.md) - Testing guide and best practices
- `.env.example` - Environment variables template

## 🤖 AI Development Support

This project is configured with AI development tools to enhance the development experience:

- **Claude Code** - `.cursor/` and `CLAUDE.md`
- **GitHub Copilot** - `.github/copilot-instructions.md`
- **Windsurf** - `.windsurfrules`

## 📄 License

MIT

---

Built with ❤️ using Astro, React, and Supabase
