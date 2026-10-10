import { describe, expect, it } from 'vitest';
import { business, isWhatsAppConfigured } from './business';
import { products, formatPrice } from '../data/products';

describe('Unconfirmed business information', () => {
  it('does not publish a contact number or verified claims by default', () => {
    expect(business.whatsappNumber).toBeNull();
    expect(Object.values(business.verifiedClaims).every((value) => value === null)).toBe(true);
  });

  it.each([null, '', '123', '+919876543210', 'number-pending', '0000000000'])('keeps WhatsApp unavailable for %s', (number) => {
    expect(isWhatsAppConfigured(number)).toBe(false);
  });

  it('accepts a digits-only international number', () => {
    // Test fixture only; not business configuration.
    expect(isWhatsAppConfigured('919876543210')).toBe(true);
  });

  it('keeps unspecified products unavailable and unpriced', () => {
    expect(products.length).toBe(10);
    expect(new Set(products.map((product) => product.id)).size).toBe(products.length);
    for (const product of products) {
      expect(product.availability).toBe('unconfirmed');
      expect(product.image).toBeNull();
      expect(product.variants).toEqual([]);
    }
    expect(formatPrice(null)).toBe('Price to be confirmed');
    expect(formatPrice(12550)).toBe('₹125.50');
  });
});
