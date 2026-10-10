import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_QUANTITY, sanitizeLines, selectCartCount, useCartStore } from './cart';

describe('Cart store', () => {
  beforeEach(() => useCartStore.getState().clear());

  it('adds, merges, updates and removes lines', () => {
    const cart = useCartStore.getState();
    cart.add('besan-laddu', '500-g');
    cart.add('besan-laddu', '500-g', 2);
    cart.add('shev', '250-g');
    expect(useCartStore.getState().lines).toEqual([
      { productId: 'besan-laddu', variantId: '500-g', quantity: 3 },
      { productId: 'shev', variantId: '250-g', quantity: 1 },
    ]);
    expect(selectCartCount(useCartStore.getState())).toBe(4);
    cart.setQuantity('shev', '250-g', 0);
    expect(useCartStore.getState().lines[1]?.quantity).toBe(1);
    cart.setQuantity('shev', '250-g', 999);
    expect(useCartStore.getState().lines[1]?.quantity).toBe(MAX_QUANTITY);
    cart.remove('besan-laddu', '500-g');
    expect(useCartStore.getState().lines.map((line) => line.productId)).toEqual(['shev']);
  });

  it('discards corrupt or outdated persisted lines', () => {
    expect(sanitizeLines('nope')).toEqual([]);
    expect(sanitizeLines([
      { productId: 'karanji', variantId: '500-g', quantity: 2.4 },
      { productId: 'karanji', variantId: '1-kg', quantity: 1 },
      { productId: 'gone', variantId: 'standard', quantity: 1 },
      { productId: 'shev', variantId: '250-g', quantity: '3' },
      null,
    ])).toEqual([{ productId: 'karanji', variantId: '500-g', quantity: 2 }]);
  });
});
