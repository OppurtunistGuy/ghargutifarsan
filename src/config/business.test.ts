import { describe, expect, it } from 'vitest';
import { business, isWhatsAppConfigured } from './business';
import { media } from './media';
import { products, formatPrice, faralFilters, productsInCategories } from '../data/products';

describe('Unconfirmed business information', () => {
  it('does not publish contact details or verified claims by default', () => {
    expect(business.whatsappNumber).toBeNull();
    expect(business.email).toBeNull();
    expect(business.fssaiNumber).toBeNull();
    expect(business.googleReviewUrl).toBeNull();
    expect(business.pricesConfirmed).toBe(false);
    expect(Object.values(business.claims).every((claim) => claim.confirmed === false)).toBe(true);
  });

  it.each([null, '', '123', '+919876543210', 'number-pending', '0000000000'])('keeps WhatsApp unavailable for %s', (number) => {
    expect(isWhatsAppConfigured(number)).toBe(false);
  });

  it('accepts a digits-only international number', () => {
    // Test fixture only; not business configuration.
    expect(isWhatsAppConfigured('919876543210')).toBe(true);
  });

  it('only uses supplied editorial photos; missing ones stay placeholders', () => {
    expect(media.homeHero.photo).toBeNull();
    expect(media.faralHero.photo).toBeNull();
  });
});

describe('Catalogue', () => {
  it('has unique ids, a photo and at least one orderable variant for every product', () => {
    expect(products.length).toBe(30);
    expect(new Set(products.map((item) => item.id)).size).toBe(products.length);
    for (const item of products) {
      expect(item.image?.src).toBe(`/images/products/${item.id}.webp`);
      expect(item.variants.length).toBeGreaterThan(0);
      expect(item.availability).toBe('unconfirmed');
      expect(item.ingredients).toBeNull();
      expect(item.storageInformation).toBeNull();
    }
  });

  it('only carries the sample prices shown in the approved prototypes', () => {
    const priced = Object.fromEntries(products.filter((item) => item.variants[0].pricePaise !== null).map((item) => [item.id, item.variants[0].pricePaise]));
    expect(priced).toEqual({
      'besan-laddu': 36000, 'rawa-coconut-laddu': 26000, 'nachani-laddu': 25000, 'dink-laddu': 42000, 'ukadiche-modak': 3500,
      'bhajani-chakli': 34500, 'poha-chivda': 23000, shankarpali: 26000, karanji: 32000, anarse: 38000, shev: 20000,
      bakarwadi: 34000, kadboli: 28000, 'traditional-faral-combo': 99900, 'festive-gift-hamper': 149900,
    });
  });

  it('places every faral product in a specific filter as well as All Faral', () => {
    const all = productsInCategories(faralFilters[0].categories).map((item) => item.id).sort();
    const specific = faralFilters.slice(1).filter((filter) => filter.id !== 'festive').flatMap((filter) => productsInCategories(filter.categories)).map((item) => item.id).sort();
    expect(specific).toEqual(all);
    expect(productsInCategories(['festive-special']).length).toBe(6);
  });

  it('formats prices in rupees', () => {
    expect(formatPrice(null)).toBe('Price to be confirmed');
    expect(formatPrice(34500)).toBe('₹345');
    expect(formatPrice(12550)).toBe('₹125.50');
    expect(formatPrice(149900)).toBe('₹1,499');
  });
});
