#!/usr/bin/env node
/** End-to-end stress test: public access, demo workspace, preview, catalog, forms. */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function assert(name, condition) {
  if (!condition) throw new Error(name);
  console.log(`✓ ${name}`);
}

async function testPublicHome(page) {
  const res = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await assert('homepage returns 200', res?.status() === 200);
  await assert('homepage has hero h1', (await page.locator('#hero-heading').count()) === 1);
  const url = page.url();
  await assert('homepage not redirected to sign-in', !url.includes('/sign-in'));
}

async function testDemoWorkspace(page) {
  await page.goto(`${BASE}/demo`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.dashboard', { timeout: 60000 });
  await page.waitForSelector('.result-count', { timeout: 120000 });
  const resultCount = parseInt((await page.locator('.result-count').first().textContent()).replace(/,/g, ''), 10);
  await assert('all-suppliers catalog shows 5000+ items', resultCount >= 5000);
  await assert('demo loads workspace', (await page.locator('.dashboard').count()) === 1);
  await assert('preview uses photo cutout not CSS head', (await page.locator('.preview-model-cutout').count()) === 1);
  await assert('no CSS mannequin head in preview', (await page.locator('.preview-frame .body.head').count()) === 0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  await assert('demo has no horizontal overflow at 1400px', !overflow);
}

async function testProductCards(page) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`${BASE}/demo`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.product-card', { timeout: 120000 });
  const count = await page.locator('.product-card').count();
  await assert('product cards render first page', count >= 60 && count <= 120);

  const overlap = await page.locator('.product-card').first().evaluate((card) => {
    const badge = card.querySelector('.in-look-badge');
    const img = card.querySelector('.product-photo-img');
    if (!img) return false;
    const imgBox = img.getBoundingClientRect();
    if (badge) {
      const badgeBox = badge.getBoundingClientRect();
      const intersects = !(badgeBox.right < imgBox.left || badgeBox.left > imgBox.right
        || badgeBox.bottom < imgBox.top || badgeBox.top > imgBox.bottom);
      if (intersects) return true;
    }
    return imgBox.top < card.getBoundingClientRect().top + 8;
  });
  await assert('product card image does not overlap top badges', !overlap);

  await page.locator('.product-card .card-btn.primary').first().click();
  await page.waitForTimeout(400);
  await assert('product can be added to look', (await page.locator('.in-look-badge').count()) >= 1);
}

async function testLookThumbs(page) {
  await assert('look thumbs use look-visual not mannequin', (await page.locator('.look-thumb-card .look-visual').count()) > 0);
  await assert('look thumbs no compact mannequin', (await page.locator('.look-thumb-card .mannequin.compact').count()) === 0);
}

async function testMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  await assert('homepage mobile no horizontal overflow', !overflow);

  await page.locator('.landing-menu-btn').click();
  await assert('mobile menu opens', await page.locator('#mobile-nav').isVisible());
}

async function testEnquiryApi(page) {
  const res = await page.request.post(`${BASE}/api/enquiry`, {
    data: {
      name: 'E2E Test',
      email: 'e2e@test.example',
      message: 'Automated stress test enquiry message.',
    },
  });
  await assert('enquiry API accepts valid payload', res.ok());
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 1400, height: 900 });
    await testPublicHome(page);
    await testDemoWorkspace(page);
    await testProductCards(page);
    await testLookThumbs(page);
    await testMobile(page);
    await testEnquiryApi(page);
    console.log('\nALL STRESS TESTS PASSED');
  } catch (err) {
    console.error('\nFAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
