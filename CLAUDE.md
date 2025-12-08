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

### Component Strategy
- **Static content**: Use `.astro` components
- **Interactive UI**: Use React components (`.tsx`)
- Never use Next.js directives like `"use client"` - this is Astro + React, not Next.js

### API Routes
- Place in `src/pages/api/`
- Use uppercase HTTP method exports: `GET`, `POST` (not `get`, `post`)
- Add `export const prerender = false` to API routes
- Validate input with Zod schemas
- Extract business logic to `src/lib/services/`

### Styling with Tailwind
- Use arbitrary values: `w-[123px]`
- Organize with `@layer` directive
- Leverage responsive (`sm:`, `md:`, `lg:`) and state variants (`hover:`, `focus-visible:`)
- Dark mode: use `dark:` variant
- Shadcn/ui style: "new-york"

### Supabase Integration
- Access via `context.locals.supabase` in Astro routes (not direct import)
- Use `SupabaseClient` type from `src/db/supabase.client.ts`
- Validate data with Zod schemas

### TypeScript Configuration
- Base URL: `.`
- Path alias: `@/*` maps to `./src/*`
- JSX: React JSX transform
- Extends: `astro/tsconfigs/strict`

## Code Quality Standards

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

- Use early returns for error conditions
- Avoid unnecessary `else` statements
- Place happy path last for readability
- Implement proper error logging with user-friendly messages

### React Best Practices
- Functional components with hooks only
- Extract custom hooks to `src/components/hooks/`
- Use `React.memo()` for expensive components with stable props
- Use `React.lazy()` + `Suspense` for code-splitting
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs
- Consider `useOptimistic` for optimistic UI updates
- Use `useTransition` for non-urgent state updates

### Accessibility (ARIA)
- Use ARIA landmarks for page regions
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` for dynamic content updates
- Apply `aria-label`/`aria-labelledby` for unlabeled elements
- Avoid redundant ARIA on semantic HTML

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
