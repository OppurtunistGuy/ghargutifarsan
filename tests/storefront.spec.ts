import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  ['/', 'लहानपणीची चव, पुन्हा एकदा.'],
  ['/laddus', 'आमचे खास लाडू आणि मोदक'],
  ['/faral', 'सणांची चव, घरगुती फराळाची परंपरा.'],
  ['/our-story', 'आमची गोष्ट'],
  ['/contact', 'संपर्क'],
  ['/cart', 'तुमची पिशवी रिकामी आहे'],
  ['/products/bhajani-chakli', 'Bhajani Chakli'],
  ['/missing-page', 'हे पान सापडले नाही'],
] as const;

const cartButton = (page: Page) => page.getByRole('banner').getByRole('button', { name: /^Cart, \d+ items?$/ });

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('every route renders without errors or unconfigured contact links', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [path, heading] of routes) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('a[href*="wa.me"], a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('unverified claims and missing photos are visibly marked, never asserted', async ({ page }) => {
  await page.goto('/faral');
  const claims = page.locator('[data-claim]');
  await expect(claims.first()).toBeVisible();
  for (const claim of await claims.all()) await expect(claim).toHaveAttribute('data-confirmed', 'false');
  await expect(page.getByText('Licence no. to add')).toBeVisible();
  await expect(page.locator('[data-placeholder="photo"]').first()).toBeVisible();
  await expect(page.getByText('Sample prices').first()).toBeVisible();
});

test('desktop navigation changes route, title, active state and focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await nav.getByRole('link', { name: 'Faral', exact: true }).click();
  await expect(page).toHaveURL('/faral');
  await expect(page).toHaveTitle('Faral | Gharguti Farsan');
  await expect(page.locator('main')).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Faral', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('mobile navigation supports keyboard dismissal and route changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Laddus', exact: true }).click();
  await expect(page).toHaveURL('/laddus');
  await expect(page.locator('button[aria-controls="mobile-navigation"]')).toHaveAttribute('aria-expanded', 'false');
});

test('skip link is the first keyboard stop and reaches main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('faral filters change the grid and the URL', async ({ page }) => {
  await page.goto('/faral');
  const grid = page.locator('#faral-grid');
  const filters = page.getByRole('group', { name: 'Filter faral' });
  await expect(grid.locator('[data-product]')).toHaveCount(12);
  await filters.getByRole('button', { name: /^Chakli/ }).click();
  await expect(page).toHaveURL('/faral?filter=chakli');
  await expect(filters.getByRole('button', { name: /^Chakli/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(grid.locator('[data-product]')).toHaveCount(2);
  await expect(grid.locator('[data-product="bhajani-chakli"]')).toBeVisible();
  await filters.getByRole('button', { name: /^Sweet Snacks/ }).click();
  await expect(grid.locator('[data-product]')).toHaveCount(3);
  await page.getByRole('button', { name: 'View All Combos' }).click();
  await expect(page).toHaveURL('/faral?filter=festive');
  await expect(grid.locator('[data-product]')).toHaveCount(6);
  await filters.getByRole('button', { name: /^All Faral/ }).click();
  await expect(page).toHaveURL('/faral');
  await expect(grid.locator('[data-product]')).toHaveCount(12);
});

test('laddus page switches between laddus and modak', async ({ page }) => {
  await page.goto('/laddus');
  const grid = page.locator('#sweets-grid');
  await expect(grid.locator('[data-product]')).toHaveCount(12);
  await page.getByRole('group', { name: 'Show sweets' }).getByRole('button', { name: /^Modak/ }).click();
  await expect(page).toHaveURL('/laddus?type=modak');
  await expect(grid.locator('[data-product]')).toHaveCount(6);
  await expect(grid.locator('[data-product="ukadiche-modak"]')).toBeVisible();
});

test('festive View Details opens the product page', async ({ page }) => {
  await page.goto('/faral');
  await page.getByRole('link', { name: 'View details of Traditional Faral Combo' }).click();
  await expect(page).toHaveURL('/products/traditional-faral-combo');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Traditional Faral Combo');
  await expect(page.getByText('Chakli, Chivda, Shankarpali, Anarse, Shev, Kadboli')).toBeVisible();
});

test('cart: add, change quantity, persist across reload, build the WhatsApp message, remove', async ({ page }) => {
  await page.goto('/faral');
  await page.locator('[data-product="bhajani-chakli"]').getByRole('button', { name: 'Add Bhajani Chakli to cart' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Bhajani Chakli added to your cart' })).toBeVisible();
  await page.locator('[data-product="chivda-mix"]').getByRole('button', { name: 'Add Chivda Mix to cart' }).click();
  await expect(cartButton(page)).toHaveAccessibleName('Cart, 2 items');

  await cartButton(page).click();
  const drawer = page.getByRole('dialog', { name: 'Your cart' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Increase quantity of Bhajani Chakli' }).click();
  await expect(drawer.locator('[data-cart-subtotal]')).toHaveText('₹690');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  await page.reload();
  await expect(cartButton(page)).toHaveAccessibleName('Cart, 3 items');

  await page.goto('/cart');
  const message = page.locator('[data-order-message]');
  await expect(message).toContainText('1. Bhajani Chakli (500 g) x 2: ₹690');
  await expect(message).toContainText('2. Chivda Mix x 1: price to be confirmed');
  await expect(message).toContainText('Estimated total: ₹690 + 1 item to be priced');
  await page.getByLabel('Your name').fill('Asha');
  await expect(message).toContainText('Name: Asha');
  await expect(page.getByRole('button', { name: 'Send on WhatsApp' })).toBeDisabled();
  await expect(page.getByText('WhatsApp number to be added')).toBeVisible();

  await page.getByRole('button', { name: 'Remove Chivda Mix from cart' }).click();
  await expect(page.getByRole('main').locator('[data-cart-line]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove Bhajani Chakli from cart' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('तुमची पिशवी रिकामी आहे');
  await expect(cartButton(page)).toHaveAccessibleName('Cart, 0 items');
});

test('product page adds the chosen quantity', async ({ page }) => {
  await page.goto('/products/ukadiche-modak');
  await expect(page.locator('[data-product-price]')).toHaveText('₹35 / piece');
  await page.getByRole('button', { name: 'Increase quantity of Ukadiche Modak' }).click();
  await page.getByRole('button', { name: 'Increase quantity of Ukadiche Modak' }).click();
  await page.getByRole('main').getByRole('button', { name: 'Add Ukadiche Modak to cart' }).first().click();
  await expect(cartButton(page)).toHaveAccessibleName('Cart, 3 items');
  await expect(page.getByText('Ingredients')).toBeVisible();
  await expect(page.getByText('To be supplied').first()).toBeVisible();
});

test('contact form validates and prepares a WhatsApp enquiry without sending', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Prepare message' }).click();
  await expect(page.getByText('Please enter your name.')).toBeVisible();
  await expect(page.getByLabel('Your name')).toBeFocused();
  await page.getByLabel('Your name').fill('Ravi');
  await page.getByLabel('Your message').fill('Short');
  await page.getByRole('button', { name: 'Prepare message' }).click();
  await expect(page.getByText(/at least 10 characters/)).toBeVisible();
  await page.getByLabel('Your message').fill('50 return gift packs for a pooja on Sunday');
  const popup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null);
  await page.getByRole('button', { name: 'Prepare message' }).click();
  await expect(page.locator('[data-enquiry-message]')).toContainText('50 return gift packs for a pooja on Sunday');
  expect(await popup).toBeNull();
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`no horizontal overflow and no automated WCAG A/AA violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto('/products/besan-laddu');
    await page.getByRole('main').getByRole('button', { name: 'Add Besan Laddu to cart' }).first().click();
    for (const path of ['/', '/faral', '/laddus', '/our-story', '/contact', '/cart', '/products/festive-gift-hamper']) {
      await page.goto(path);
      await settle(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} overflows`).toBe(true);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(accessibility.violations.map((violation) => `${path}: ${violation.id} ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)).toEqual([]);
    }
    expect(await page.evaluate(() => document.fonts.check('700 32px "Noto Serif Devanagari Variable"', 'घरगुती'))).toBe(true);
  });
}

test('cart drawer and open mobile menu pass an automated accessibility scan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/laddus');
  await page.locator('[data-product="dink-laddu"]').getByRole('button', { name: 'Add Dink Laddu to cart' }).click();
  await cartButton(page).click();
  await expect(page.getByRole('dialog', { name: 'Your cart' })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Close cart' }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([]);
});
