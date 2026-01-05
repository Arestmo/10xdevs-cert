import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests using axe-core
 * Tests for WCAG 2.1 AA compliance
 */
test.describe('Accessibility', () => {
	test('homepage should not have any automatically detectable accessibility issues', async ({
		page,
	}) => {
		// Navigate to the homepage
		await page.goto('/');

		// Wait for the page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Run axe accessibility scan
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		// Assert no violations were found
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	// Add more accessibility tests as needed
	// test('login page should be accessible', async ({ page }) => {
	//   await page.goto('/login');
	//   const results = await new AxeBuilder({ page }).analyze();
	//   expect(results.violations).toEqual([]);
	// });
});
