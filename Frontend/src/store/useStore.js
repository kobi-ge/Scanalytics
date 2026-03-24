import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  receipts: [],
  setUser: (userData) => set({ user: userData }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, receipts: [] });
  },
  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) => set((state) => ({ receipts: [receipt, ...state.receipts] })),
  deleteReceipt: (id) => set((state) => ({
    // מוחק לפי ה-_id של MongoDB או receipt_id של הדאטה
    receipts: state.receipts.filter(r => (r._id !== id && r.receipt_id !== id))
  })),
}));