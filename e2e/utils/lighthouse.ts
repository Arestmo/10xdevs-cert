import lighthouse from "lighthouse";
import type { Page } from "@playwright/test";

/**
 * Run Lighthouse performance audit
 * @param page - Playwright page object
 * @param url - URL to audit
 * @returns Lighthouse results
 */
export async function runLighthouse(page: Page, url: string) {
  // Get the CDP (Chrome DevTools Protocol) session
  const client = await page.context().newCDPSession(page);

  // Run Lighthouse
  const { lhr } = await lighthouse(url, {
    port: new URL(client.connection().url()).port as unknown as number,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  });

  return lhr;
}

/**
 * Assert Lighthouse scores meet minimum thresholds
 * @param scores - Lighthouse category scores
 * @param thresholds - Minimum score thresholds (0-1)
 */
export function assertLighthouseScores(
  scores: Record<string, { score: number | null }>,
  thresholds: Record<string, number> = {
    performance: 0.9,
    accessibility: 0.9,
    "best-practices": 0.9,
    seo: 0.9,
  }
) {
  for (const [category, threshold] of Object.entries(thresholds)) {
    const score = scores[category]?.score;
    if (score === null || score === undefined) {
      throw new Error(`Lighthouse score for ${category} is null or undefined`);
    }
    if (score < threshold) {
      throw new Error(`Lighthouse ${category} score (${score}) is below threshold (${threshold})`);
    }
  }
}
