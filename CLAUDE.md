# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Astro 5** - SSR-enabled web framework (server mode)
- **React 19** - UI library for interactive components
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - UI component library
- **Supabase** - Backend services, authentication, and database
- **Node.js Adapter** - Standalone mode for deployment

## Development Commands

### Core Commands
```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
```

### Pre-commit
Husky runs `lint-staged` on commit, which:
- Auto-fixes and lints `*.{ts,tsx,astro}` files
- Formats `*.{json,css,md}` files

## Git Commit Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

```bash
feat: add user authentication
feat(api): implement JWT token refresh
fix: resolve navigation menu overlap on mobile
fix(forms): correct email validation regex
docs: update API documentation
refactor(auth): simplify login logic
perf: optimize image loading
test: add unit tests for user service
build: update dependencies
ci: add GitHub Actions workflow
chore: update .gitignore
```

### Guidelines

- Use the imperative, present tense: "add" not "added" nor "adds"
- Don't capitalize the first letter
- No period (.) at the end
- Keep the description concise (50 characters or less)
- Use the body to explain what and why vs. how (if needed)
- Reference issues and pull requests in the footer when applicable

## Project Structure

```
src/
├── layouts/           # Astro layouts
├── pages/             # Astro pages (file-based routing)
│   └── api/           # API endpoints (SSR)
├── middleware/
│   └── index.ts       # Astro middleware
├── components/
│   ├── ui/            # Shadcn/ui components
│   └── hooks/         # Custom React hooks
├── lib/
│   └── services/      # Business logic and services
├── db/                # Supabase clients and types
├── types.ts           # Shared types (Entities, DTOs)
├── assets/            # Internal static assets
└── styles/            # Global styles
```

## Architecture Guidelines

### Astro Configuration
- **Output mode**: `server` (SSR enabled)
- **Adapter**: Node.js standalone
- **Port**: 3000
- **Integrations**: React, Sitemap
- **View Transitions**: Use ClientRouter API for smooth page transitions
- Leverage Server Endpoints for API routes
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use `Astro.cookies` for server-side cookie management
- Leverage `import.meta.env` for environment variables
- Use content collections with type safety for blog posts, documentation, etc.

### Component Strategy
- **Static content**: Use `.astro` components for static content and layout
- **Interactive UI**: Use React components (`.tsx`) only when interactivity is needed
- Never use Next.js directives like `"use client"` - this is Astro + React, not Next.js

### API Routes
- Place in `src/pages/api/`
- Use uppercase HTTP method exports: `GET`, `POST` (not `get`, `post`)
- Add `export const prerender = false` to API routes
- Validate input with Zod schemas
- Extract business logic to `src/lib/services/`

### Styling with Tailwind
- Use the `@layer` directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., `w-[123px]`) for precise one-off designs
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the `theme()` function in CSS for accessing Tailwind theme values
- Implement dark mode with the `dark:` variant
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.) for adaptive designs
- Leverage state variants (`hover:`, `focus-visible:`, `active:`, etc.) for interactive elements
- Shadcn/ui style: "new-york" with base color "neutral"

### Supabase Integration
- Use Supabase for backend services, including authentication and database interactions
- Follow Supabase guidelines for security and performance
- Access via `context.locals.supabase` in Astro routes (not direct import)
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Validate data with Zod schemas

### TypeScript Configuration
- Base URL: `.`
- Path alias: `@/*` maps to `./src/*`
- JSX: React JSX transform
- Extends: `astro/tsconfigs/strict`

## Code Quality Standards

### Guidelines for Clean Code

- Use feedback from linters to improve the code when making changes
- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Avoid unnecessary else statements; use if-return pattern instead
- Use guard clauses to handle preconditions and invalid states early
- Implement proper error logging and user-friendly error messages
- Consider using custom error types or error factories for consistent error handling

### Error Handling Pattern
```typescript
// Handle errors first with guard clauses
if (!data) {
  return error()
}
if (validationFails) {
  return error()
}

// Happy path last
return success(data)
```

### React Best Practices
- Use functional components with hooks instead of class components
- Never use "use client" and other Next.js directives as we use React with Astro
- Extract logic into custom hooks in `src/components/hooks/`
- Implement `React.memo()` for expensive components that render often with the same props
- Utilize `React.lazy()` and `Suspense` for code-splitting and performance optimization
- Use the `useCallback` hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer `useMemo` for expensive calculations to avoid recomputation on every render
- Implement `useId()` for generating unique IDs for accessibility attributes
- Consider using the new `useOptimistic` hook for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates to keep the UI responsive

### Accessibility (ARIA)
- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set `aria-expanded` and `aria-controls` for expandable content like accordions and dropdowns
- Use `aria-live` regions with appropriate politeness settings for dynamic content updates
- Implement `aria-hidden` to hide decorative or duplicative content from screen readers
- Apply `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-describedby` to associate descriptive text with form inputs or complex elements
- Implement `aria-current` for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

### Environment Variables
- Access via `import.meta.env`
- Example variables (from `.env.example`):
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `OPENROUTER_API_KEY`

## ESLint Configuration

- Base: TypeScript strict + stylistic rules
- Plugins: Astro, React, React Hooks, React Compiler, JSX a11y, Prettier
- `no-console`: warning
- React in JSX scope: disabled (automatic JSX transform)
- React Compiler: enforced as error

## Important Notes

- Server-side rendering is enabled globally (`output: "server"`)
- Hybrid rendering available: set `prerender: true/false` per route
- Use `Astro.cookies` for cookie management
- Image optimization available via Astro Image integration
- Content collections available for type-safe content management

## Shadcn/ui Components

This project uses @shadcn/ui for UI components. These are beautifully designed, accessible components that can be customized for your application.

### Finding Installed Components
- Components are available in `src/components/ui` folder
- Import using the `@/` alias configured in `components.json`

### Using Components
```tsx
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
```

Example usage:
```tsx
<Button variant="outline">Click me</Button>

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
```

### Installing Additional Components
Many other components are available but not currently installed. Full list at https://ui.shadcn.com/

To install a new component, use the shadcn CLI:
```bash
npx shadcn@latest add [component-name]
```

For example, to add the accordion component:
```bash
npx shadcn@latest add accordion
```

IMPORTANT: `npx shadcn-ui@latest` has been deprecated, use `npx shadcn@latest`

Popular components include:
- Accordion, Alert, AlertDialog, AspectRatio, Avatar
- Calendar, Checkbox, Collapsible, Command, ContextMenu
- DataTable, DatePicker, Dropdown Menu
- Form, Hover Card, Menubar, Navigation Menu
- Popover, Progress, Radio Group, ScrollArea, Select
- Separator, Sheet, Skeleton, Slider, Switch
- Table, Textarea, Sonner (previously Toast), Toggle, Tooltip

### Component Styling
This project uses the "new-york" style variant with "neutral" base color and CSS variables for theming, as configured in `components.json`.

## Database Migrations (Supabase)

This project uses migrations provided by the Supabase CLI.

### Creating Migration Files

Migration files must be created in the `supabase/migrations/` folder following this naming convention:

Format: `YYYYMMDDHHmmss_short_description.sql` (UTC time)
- `YYYY` - Four digits for the year (e.g., `2024`)
- `MM` - Two digits for the month (01 to 12)
- `DD` - Two digits for the day of the month (01 to 31)
- `HH` - Two digits for the hour in 24-hour format (00 to 23)
- `mm` - Two digits for the minute (00 to 59)
- `ss` - Two digits for the second (00 to 59)
- Add an appropriate description for the migration

Example: `20240906123045_create_profiles.sql`

### SQL Guidelines

Write Postgres-compatible SQL code for Supabase migration files that:

- Includes a header comment with metadata about the migration, such as the purpose, affected tables/columns, and any special considerations
- Includes thorough comments explaining the purpose and expected behavior of each migration step
- Write all SQL in lowercase
- Add copious comments for any destructive SQL commands, including truncating, dropping, or column alterations
- When creating a new table, you MUST enable Row Level Security (RLS) even if the table is intended for public access
- When creating RLS Policies:
  - Ensure the policies cover all relevant access scenarios (e.g. select, insert, update, delete) based on the table's purpose and data sensitivity
  - If the table is intended for public access the policy can simply return `true`
  - RLS Policies should be granular: one policy for `select`, one for `insert` etc) and for each Supabase role (`anon` and `authenticated`). DO NOT combine Policies even if the functionality is the same for both roles
  - Include comments explaining the rationale and intended behavior of each security policy

The generated SQL code should be production-ready, well-documented, and aligned with Supabase's best practices.

## Supabase Initialization

### Prerequisites
- Project should use Astro 5, TypeScript 5, React 19, and Tailwind 4
- Install the `@supabase/supabase-js` package
- Ensure that `/supabase/config.toml` exists
- Ensure that a file `/src/db/database.types.ts` exists and contains the correct type definitions for your database

IMPORTANT: Check prerequisites before performing actions. If they're not met, ask the user for the fix.

### File Structure

1. **Supabase Client** (`/src/db/supabase.client.ts`):
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

2. **Middleware** (`/src/middleware/index.ts`):
```ts
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

3. **TypeScript Environment Definitions** (`src/env.d.ts`):
```ts
/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```
