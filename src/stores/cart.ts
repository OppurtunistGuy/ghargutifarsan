import { create } from 'zustand';

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState { lines: readonly CartLine[] }

// Phase 1 state contract. Mutation, validation and persistence belong to Phase 4.
export const useCartStore = create<CartState>(() => ({ lines: [] }));

export function selectCartCount(state: CartState): number {
  return state.lines.reduce((count, line) => count + line.quantity, 0);
}
