import { describe, expect, it } from 'vitest';
import { buildEnquiryMessage, buildOrderMessage, priceWithUnit, summarizeBag, whatsappUrl } from './order';
import { findProduct } from '../data/products';

describe('Order summary and WhatsApp message', () => {
  const lines = [
    { productId: 'bhajani-chakli', variantId: '500-g', quantity: 2 },
    { productId: 'ukadiche-modak', variantId: 'piece', quantity: 11 },
    { productId: 'chivda-mix', variantId: 'standard', quantity: 1 },
    { productId: 'removed-product', variantId: 'standard', quantity: 4 },
  ];

  it('totals priced lines and counts lines awaiting a price', () => {
    const summary = summarizeBag(lines);
    expect(summary.lines.map((line) => line.product.id)).toEqual(['bhajani-chakli', 'ukadiche-modak', 'chivda-mix']);
    expect(summary.itemCount).toBe(14);
    expect(summary.estimatedTotalPaise).toBe(2 * 34500 + 11 * 3500);
    expect(summary.unpricedLineCount).toBe(1);
  });

  it('writes every product, quantity, price and the estimated total', () => {
    const message = buildOrderMessage(summarizeBag(lines), { name: '  Asha ', note: 'Needed by Friday' });
    expect(message).toContain('1. Bhajani Chakli (500 g) x 2: ₹690');
    expect(message).toContain('2. Ukadiche Modak (piece) x 11: ₹385');
    expect(message).toContain('3. Chivda Mix x 1: price to be confirmed');
    expect(message).toContain('Estimated total (sample prices): ₹1,075 + 1 item to be priced');
    expect(message).toContain('Please confirm prices, availability and delivery.');
    expect(message).toContain('Name: Asha');
    expect(message).toContain('Note: Needed by Friday');
  });

  it('omits empty optional details', () => {
    const message = buildOrderMessage(summarizeBag(lines.slice(0, 1)));
    expect(message).not.toContain('Name:');
    expect(message).not.toContain('Note:');
    expect(message).toContain('Estimated total (sample prices): ₹690');
    expect(message).not.toContain('to be priced');
  });

  it('encodes the message and refuses to build a link without a valid number', () => {
    expect(whatsappUrl('Hi & bye', null)).toBeNull();
    expect(whatsappUrl('Hi & bye', '+91 98')).toBeNull();
    // Test fixture only; not business configuration.
    expect(whatsappUrl('Hi & bye\nx', '919876543210')).toBe('https://wa.me/919876543210?text=Hi%20%26%20bye%0Ax');
  });

  it('builds an enquiry message', () => {
    expect(buildEnquiryMessage(' Ravi ', ' 50 return gift packs for a pooja ')).toBe('Namaskar Gharguti Farsan,\n\n50 return gift packs for a pooja\n\nName: Ravi');
  });

  it('labels prices with their pack', () => {
    expect(priceWithUnit(findProduct('shev')!.variants[0])).toBe('₹200 / 250 g');
    expect(priceWithUnit(findProduct('dal-chivda')!.variants[0])).toBe('Price to be confirmed');
  });
});
