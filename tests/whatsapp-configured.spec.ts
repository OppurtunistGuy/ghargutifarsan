import { test, expect } from '@playwright/test';

// Runs against the dev server started with VITE_WHATSAPP_NUMBER=919800000000 (playwright.config.ts),
// proving the build-time override replaces the number in src/config/business.ts everywhere.
const NUMBER = '919800000000';

test.beforeEach(async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Never load the real wa.me in tests; just record that the browser was sent there.
  await context.route('https://wa.me/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>wa.me</title>' }));
});

test('cart "Send on WhatsApp" opens a chat with the business number and the exact order message', async ({ page }) => {
  await page.goto('/faral');
  await page.locator('[data-product="bhajani-chakli"]').getByRole('button', { name: 'Add Bhajani Chakli to cart' }).click();
  await page.locator('[data-product="chivda-mix"]').getByRole('button', { name: 'Add Chivda Mix to cart' }).click();
  await page.goto('/cart');
  await page.getByLabel('Your name').fill('Asha');
  await page.getByLabel('Note for us').fill('Saturday morning & early please');

  const send = page.getByRole('link', { name: /Send on WhatsApp/ });
  await expect(send).toBeVisible();
  await expect(page.getByText('WhatsApp number to be added')).toHaveCount(0);
  const href = await send.getAttribute('href');
  expect(href?.startsWith(`https://wa.me/${NUMBER}?text=`)).toBe(true);
  const message = decodeURIComponent(new URL(href!).searchParams.get('text') ?? '');
  expect(message).toBe(await page.locator('[data-order-message]').innerText());
  expect(message).toContain('1. Bhajani Chakli (500 g) x 1: ₹345');
  expect(message).toContain('Note: Saturday morning & early please');
  await expect(send).toHaveAttribute('target', '_blank');

  const popup = page.waitForEvent('popup');
  await send.click();
  expect((await popup).url()).toBe(href);
});

test('contact form sends the enquiry to WhatsApp and lists the number', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('[data-contact="WhatsApp"] a')).toHaveAttribute('href', `https://wa.me/${NUMBER}`);
  await page.getByLabel('Your name').fill('Ravi');
  await page.getByLabel('Your message').fill('Do you take bulk orders of 100 return gift packs?');
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Send on WhatsApp' }).click();
  const url = new URL((await popup).url());
  expect(url.origin + url.pathname).toBe(`https://wa.me/${NUMBER}`);
  expect(url.searchParams.get('text')).toBe('Namaskar Gharguti Farsan,\n\nDo you take bulk orders of 100 return gift packs?\n\nName: Ravi');
  await expect(page.getByText('WhatsApp opened with your message')).toBeVisible();
});

test('the "Order on WhatsApp" band leads to the cart, where sending is enabled', async ({ page }) => {
  await page.goto('/products/karanji');
  await page.getByRole('main').getByRole('button', { name: 'Add Karanji to cart' }).first().click();
  await page.goto('/');
  await page.getByRole('link', { name: /Order on WhatsApp/ }).click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('link', { name: /Send on WhatsApp/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/919800000000\?text=/);
});
