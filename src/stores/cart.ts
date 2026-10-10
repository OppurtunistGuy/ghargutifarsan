import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { findProduct, findVariant } from '../data/products';

export const MAX_QUANTITY = 50;

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState {
  lines: readonly CartLine[];
  add: (productId: string, variantId: string, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
}

const clamp = (quantity: number) => Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity)));
const same = (line: CartLine, productId: string, variantId: string) => line.productId === productId && line.variantId === variantId;

/** Drops lines whose product or variant no longer exists, e.g. after a catalogue edit. */
export function sanitizeLines(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return [];
  return lines.flatMap((line: Partial<CartLine>) => {
    if (typeof line?.productId !== 'string' || typeof line.variantId !== 'string' || typeof line.quantity !== 'number') return [];
    const item = findProduct(line.productId);
    if (!item || !findVariant(item, line.variantId) || !Number.isFinite(line.quantity)) return [];
    return [{ productId: line.productId, variantId: line.variantId, quantity: clamp(line.quantity) }];
  });
}

export const useCartStore = create<CartState>()(persist((set) => ({
  lines: [],
  add: (productId, variantId, quantity = 1) => set(({ lines }) => {
    const existing = lines.find((line) => same(line, productId, variantId));
    if (existing) return { lines: lines.map((line) => (line === existing ? { ...line, quantity: clamp(line.quantity + quantity) } : line)) };
    return { lines: [...lines, { productId, variantId, quantity: clamp(quantity) }] };
  }),
  setQuantity: (productId, variantId, quantity) => set(({ lines }) => ({
    lines: lines.map((line) => (same(line, productId, variantId) ? { ...line, quantity: clamp(quantity) } : line)),
  })),
  remove: (productId, variantId) => set(({ lines }) => ({ lines: lines.filter((line) => !same(line, productId, variantId)) })),
  clear: () => set({ lines: [] }),
}), {
  name: 'gharguti-farsan-bag',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: ({ lines }) => ({ lines }),
  merge: (persisted, current) => ({ ...current, lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines) }),
}));

export function selectCartCount(state: Pick<CartState, 'lines'>): number {
  return state.lines.reduce((count, line) => count + line.quantity, 0);
}
