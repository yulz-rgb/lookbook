import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function assert(name, condition) {
  if (!condition) throw new Error(name);
  console.log(`✓ ${name}`);
}

async function testDesktop(page) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.nav-section-toggle');

  await assert('toggle exists', (await page.locator('.nav-section-toggle').count()) === 1);

  const bridge = page.locator('.nav-cat-btn', { hasText: 'Bridge' });
  await assert('bridge subcats open on load', (await page.locator('.nav-subcat-list').count()) === 1);

  await bridge.click();
  await page.waitForTimeout(200);
  await assert('bridge subcats collapse on re-click', (await page.locator('.nav-subcat-list').count()) === 0);

  await bridge.click();
  await page.waitForTimeout(200);
  await assert('bridge subcats reopen', (await page.locator('.nav-subcat-list').count()) === 1);

  await page.locator('.nav-section-toggle').click();
  await page.waitForTimeout(200);
  await assert('uniform section collapses', (await page.locator('.nav-cat-btn').count()) === 0);
  await assert('collapsed count badge shows', (await page.locator('.nav-section-count').textContent()) === '10');

  await page.locator('.nav-section-toggle').click();
  await page.waitForTimeout(200);
  await assert('uniform section reopens', (await page.locator('.nav-cat-btn').count()) === 10);
}

async function testMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });

  const offscreen = await page.locator('.nav-section-toggle').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.right < 0;
  });
  await assert('mobile sidebar starts off-screen', offscreen);

  await page.locator('.mobile-nav-toggle').click({ force: false });
  await page.waitForTimeout(350);
  await assert('mobile nav opens', (await page.locator('.left-nav.open').count()) === 1);

  const onscreen = await page.locator('.nav-section-toggle').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= window.innerWidth;
  });
  await assert('toggle reachable after menu open', onscreen);

  await page.locator('.nav-section-toggle').click();
  await page.waitForTimeout(200);
  await assert('mobile uniform section collapses', (await page.locator('.nav-cat-btn').count()) === 0);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await testDesktop(page);
    await testMobile(page);
    console.log('\nALL COLLAPSE TESTS PASSED');
  } catch (err) {
    console.error('\nFAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
