# Testing Guide

This document describes the testing setup and best practices for this project.

## Tech Stack

### Unit & Integration Testing
- **Vitest** - Fast unit test framework with native ESM support
- **@testing-library/react** - Testing utilities for React components
- **@testing-library/user-event** - Advanced user interaction simulation
- **@testing-library/jest-dom** - Custom jest matchers for DOM assertions
- **MSW (Mock Service Worker)** - API mocking library for testing HTTP requests
- **V8 Coverage Provider** - Fast native code coverage

### E2E Testing
- **Playwright** - Modern E2E testing framework
- **@axe-core/playwright** - Automated accessibility testing (WCAG 2.1 AA)
- **Lighthouse CLI** - Performance and Web Vitals testing

## Project Structure

```
├── src/
│   ├── tests/                    # Unit test configuration
│   │   ├── setup.ts              # Vitest setup file
│   │   ├── mocks/                # MSW mock handlers
│   │   │   ├── handlers.ts       # API mock handlers
│   │   │   └── server.ts         # MSW server instance
│   │   └── example.test.tsx      # Example unit test
│   └── components/               # Component tests live next to components
│       └── ui/
│           └── button.test.tsx   # Example: Button component test
├── e2e/
│   ├── tests/                    # E2E test files
│   │   ├── example.spec.ts       # Example E2E test
│   │   └── accessibility.spec.ts # Accessibility test example
│   ├── fixtures/                 # Test fixtures and test data
│   └── utils/                    # E2E test utilities
│       └── lighthouse.ts         # Lighthouse helpers
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Writing Unit Tests

### Component Testing Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Service/Hook Testing Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/components/hooks/useMyHook';

describe('useMyHook', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useMyHook());

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Mocking APIs with MSW

Add handlers to `src/tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe' }
    ]);
  }),
];
```

## Writing E2E Tests

### Basic E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

### Accessibility Testing

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page should be accessible', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Performance Testing with Lighthouse

```typescript
import { test } from '@playwright/test';
import { runLighthouse, assertLighthouseScores } from '../utils/lighthouse';

test('homepage should meet performance thresholds', async ({ page }) => {
  const results = await runLighthouse(page, 'http://localhost:3000');

  assertLighthouseScores(results.categories, {
    performance: 0.9,
    accessibility: 0.9,
  });
});
```

## Best Practices

### Unit Tests (Vitest)

1. **Use the AAA Pattern**: Arrange, Act, Assert
2. **Test behavior, not implementation**: Focus on what the component does, not how
3. **Mock external dependencies**: Use MSW for API calls, vi.mock() for modules
4. **Keep tests isolated**: Each test should be independent
5. **Use descriptive test names**: Test names should clearly describe what is being tested
6. **Leverage setup files**: Use `src/tests/setup.ts` for global test configuration

### E2E Tests (Playwright)

1. **Use Page Object Model**: Organize selectors and actions into reusable page objects
2. **Use reliable selectors**: Prefer role-based selectors and data-testid attributes
3. **Wait for elements properly**: Use Playwright's auto-waiting features
4. **Keep tests independent**: Each test should be able to run in isolation
5. **Use fixtures for test data**: Create reusable test data in the fixtures directory
6. **Test critical user flows**: Focus on the most important user journeys
7. **Run accessibility tests**: Include axe-core tests for WCAG compliance

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

### Viewing Coverage

1. Run `npm run test:coverage`
2. Open `coverage/index.html` in your browser
3. Review coverage for your changes

**Note**: We focus on meaningful test coverage, not arbitrary percentages. Critical paths and business logic should have thorough coverage.

## CI/CD Integration

Tests run automatically in CI/CD pipelines:

- Unit tests run on every push
- E2E tests run on pull requests
- Coverage reports are uploaded to code coverage services

## Troubleshooting

### Vitest Issues

**Problem**: Tests fail with "Cannot find module" errors
**Solution**: Check that path aliases in `vitest.config.ts` match `tsconfig.json`

**Problem**: Tests timeout
**Solution**: Increase timeout in test or use `vi.setConfig({ testTimeout: 10000 })`

### Playwright Issues

**Problem**: Chromium not found
**Solution**: Run `npx playwright install chromium`

**Problem**: Tests fail in CI but pass locally
**Solution**: Ensure webServer is properly configured in `playwright.config.ts`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
