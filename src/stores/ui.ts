import { create } from 'zustand';

interface UiState {
  bagOpen: boolean;
  /** Latest add-to-bag confirmation; `id` changes on every add so repeated adds re-announce. */
  notice: { id: number; message: string } | null;
  openBag: () => void;
  closeBag: () => void;
  notify: (message: string) => void;
  dismissNotice: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  bagOpen: false,
  notice: null,
  openBag: () => set({ bagOpen: true, notice: null }),
  closeBag: () => set({ bagOpen: false }),
  notify: (message) => set(({ notice }) => ({ notice: { id: (notice?.id ?? 0) + 1, message } })),
  dismissNotice: () => set({ notice: null }),
}));
