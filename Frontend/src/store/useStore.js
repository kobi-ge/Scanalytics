import { create } from "zustand";

export const useStore = create((set) => ({
  user: null,
  receipts: [],
  setUser: (userData) => set({ user: userData }),
  logout: () => set({ user: null, receipts: [] }),
  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) =>
    set((state) => ({
      receipts: [receipt, ...state.receipts], // הוספה להתחלה
      user: {
        ...state.user,
        totalExpenses: state.user.totalExpenses + receipt.total_price,
      },
    })),
  // פונקציה חדשה למחיקה
  deleteReceipt: (id) =>
    set((state) => {
      const receiptToDelete = state.receipts.find((r) => r.receipt_id === id);
      const newTotal =
        state.user.totalExpenses - (receiptToDelete?.total_price || 0);
      return {
        receipts: state.receipts.filter((r) => r.receipt_id !== id),
        user: { ...state.user, totalExpenses: newTotal },
      };
    }),
}));
