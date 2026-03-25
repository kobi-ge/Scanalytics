import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  receipts: [],
  stats: {
    categories: [],
    trends: [],
    topStores: []
  },
  setUser: (userData) => {
    // שמירת ה-ID גם ב-localStorage עבור ה-Headers של הפייתון
    if (userData?._id) localStorage.setItem('userId', userData._id);
    set({ user: userData });
  },
  logout: () => {
    localStorage.clear();
    set({ user: null, receipts: [], stats: {} });
  },
  setReceipts: (receipts) => set({ receipts }),
  setStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
}));