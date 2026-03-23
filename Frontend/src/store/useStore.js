import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  receipts: [],
  setUser: (userData) => set({ user: userData }),
  logout: () => set({ user: null, receipts: [] }),
  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) => set((state) => ({ 
    receipts: [...state.receipts, receipt],
    // עדכון סך ההוצאות של היוזר בזמן אמת
    user: { ...state.user, totalExpenses: state.user.totalExpenses + receipt.total_price }
  })),
}));