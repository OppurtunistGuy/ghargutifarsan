// Visual QA captures. Dev or preview server must be running.
// Usage: node scripts/screenshots.mjs <outDir> [baseUrl] [routes comma-separated] [widths comma-separated]
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const [outDir = 'test-results/screens', base = 'http://localhost:5182', routeArg, widthArg] = process.argv.slice(2);
const routes = routeArg ? routeArg.split(',') : ['/', '/faral', '/laddus', '/our-story', '/contact', '/cart', '/products/bhajani-chakli'];
const widths = widthArg ? widthArg.split(',').map(Number) : [1440, 390];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
for (const width of widths) {
  // Reduced motion renders the settled state (no entrance fades mid-capture).
  const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 900 }, reducedMotion: 'reduce' });
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Scroll through once so lazy images load before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    const name = (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')) + `-${width}.png`;
    await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${name}${overflow > 0 ? `  OVERFLOW ${overflow}px` : ''}`);
  }
  await page.close();
}
await browser.close();
