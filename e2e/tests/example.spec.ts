import { test, expect } from "@playwright/test";

/**
 * Example E2E test
 * This demonstrates basic Playwright functionality
 */
test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    // Navigate to the homepage
    await page.goto("/");

    // Wait for the page to be loaded
    await page.waitForLoadState("networkidle");

    // Verify the page loaded successfully
    expect(page.url()).toContain("localhost:3000");
  });

  test("should have proper page title", async ({ page }) => {
    await page.goto("/");

    // Check if the page has a title
    await expect(page).toHaveTitle(/.+/);
  });
});
