import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  ['/', 'घरगुती फरसाण'], ['/laddus', 'आपले लाडू'], ['/faral', 'आपला पारंपरिक फराळ'],
  ['/our-story', 'आमची गोष्ट'], ['/contact', 'संपर्क'], ['/cart', 'आपली पिशवी'],
  ['/products/bhajani-chakli', 'भाजणी चकली'], ['/missing-page', 'हे पान सापडले नाही'],
] as const;

test('all route scaffolds render, without browser errors or unconfigured contact links', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [path, heading] of routes) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('desktop navigation changes route, title, active state and focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Faral', exact: true }).click();
  await expect(page).toHaveURL('/faral');
  await expect(page).toHaveTitle('Faral | Gharguti Farsan');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Faral', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'Shopping bag, 0 items' }).click();
  await expect(page.getByRole('heading', { name: 'आपली पिशवी' })).toBeVisible();
});

test('mobile disclosure supports keyboard dismissal, navigation and resizing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Faral', exact: true }).click();
  await expect(page).toHaveURL('/faral');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('main')).toBeFocused();
  await menu.click();
  await page.getByRole('banner').getByRole('link', { name: 'Gharguti Farsan — Home' }).click();
  await expect(page).toHaveURL('/');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  // Wait for the desktop breakpoint change to be handled before resizing again.
  await expect(page.locator('button[aria-controls="mobile-navigation"]')).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('skip link is the first keyboard stop and reaches main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`responsive rendering and accessibility at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const path of ['/', '/faral', '/contact', '/cart']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(accessibility.violations).toEqual([]);
    }
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('600 32px Mukta', 'घरगुती'))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
    await page.goto('/faral');
    await page.screenshot({ path: testInfo.outputPath(`faral-${width}.png`), fullPage: true });
    if (width === 390) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(accessibility.violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('mobile-navigation.png'), fullPage: true });
    }
  });
}
