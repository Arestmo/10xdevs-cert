import type { Page, Locator } from '@playwright/test';

/**
 * Example Page Object Model
 * Encapsulates page interactions for better test maintainability
 */
export class ExamplePage {
	readonly page: Page;

	// Locators
	readonly heading: Locator;

	constructor(page: Page) {
		this.page = page;

		// Define locators
		this.heading = page.getByRole('heading', { level: 1 });
	}

	/**
	 * Navigate to the example page
	 */
	async goto() {
		await this.page.goto('/');
	}

	/**
	 * Get the page title
	 */
	async getTitle() {
		return await this.page.title();
	}

	/**
	 * Check if the page is loaded
	 */
	async isLoaded() {
		await this.page.waitForLoadState('networkidle');
		return true;
	}
}
