/**
 * Verifies the Uniform sidebar uses By Supplier / By Brand / By Department / By Category.
 * Run with dev server: npm run dev && node scripts/test-uniform-nav-groups.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function assert(name, condition) {
  if (!condition) throw new Error(name);
  console.log(`✓ ${name}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/demo`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.nav-group-btn', { timeout: 30000 });

    for (const label of ['By Supplier', 'By Brand', 'By Department', 'By Category']) {
      await assert(`${label} group visible`, (await page.locator('.nav-group-btn', { hasText: label }).count()) === 1);
    }

    await assert('no legacy CATALOG header', (await page.locator('.nav-subsection-label', { hasText: 'Catalog' }).count()) === 0);
    await assert('no legacy SUPPLIERS header', (await page.locator('.nav-subsection-label', { hasText: 'Suppliers' }).count()) === 0);

    await page.locator('.nav-group-btn', { hasText: 'By Department' }).click();
    await page.waitForTimeout(200);
    await assert('department Bridge visible', (await page.locator('.nav-cat-btn--nested', { hasText: 'Bridge' }).count()) === 1);

    await page.locator('.nav-group-btn', { hasText: 'By Category' }).click();
    await page.waitForTimeout(200);
    await assert('category Footwear visible', (await page.locator('.nav-cat-btn--nested', { hasText: 'Footwear' }).count()) === 1);
    await assert('category Polos visible', (await page.locator('.nav-cat-btn--nested', { hasText: 'Polos' }).count()) === 1);

    await page.getByRole('button', { name: 'Male', exact: true }).click();
    await page.waitForTimeout(200);
    await assert('Dresses hidden for Male', (await page.locator('.nav-cat-btn--nested', { hasText: 'Dresses' }).count()) === 0);

    console.log('\nALL NAV GROUP TESTS PASSED');
  } catch (err) {
    console.error('\nFAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
