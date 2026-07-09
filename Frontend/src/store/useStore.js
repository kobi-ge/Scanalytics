import { create } from 'zustand';
import { insightsApi, getReceiptCount } from '../services/api';

export const useStore = create((set, get) => ({
  user: null,
  receipts: [],
  receiptCount: null,
  receiptCountError: null,
  receiptListResetCallback: null,
  stats: {
    categories: [],
    trends: [],
    topStores: [],
    paymentMethods: [],
    spendingByMonthStore: [],
    benchmark: null
  },
  isProcessing: false,
  setProcessing: (val) => set({ isProcessing: val }),
  setUser: (userData) => {
    if (userData?._id) localStorage.setItem('userId', userData._id);
    set({ user: userData });
  },
  isFetchingInsights: false,
  logout: () => {
    localStorage.clear();
    set({
      user: null,
      receipts: [],
      receiptCount: null,
      receiptCountError: null,
      receiptListResetCallback: null,
      stats: { categories: [], trends: [], topStores: [], paymentMethods: [], spendingByMonthStore: [], benchmark: null }
    });
  },
  setReceipts: (receipts) => set({ receipts }),
  setStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
  registerReceiptListReset: (fn) => set({ receiptListResetCallback: fn }),
  resetReceiptList: () => {
    const fn = get().receiptListResetCallback;
    if (fn) fn();
  },
  fetchReceiptCount: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await getReceiptCount();
      set({ receiptCount: res.data.count, receiptCountError: null });
    } catch (err) {
      console.error("Failed to fetch receipt count", err);
      set({ receiptCountError: "לא ניתן לטעון את מספר הקבלות" });
    }
  },
  incrementReceiptCount: () => set((state) => ({
    receiptCount: state.receiptCount == null ? 1 : state.receiptCount + 1,
  })),
  setReceiptCount: (n) => set({ receiptCount: n }),
  fetchInsightsData: async () => {
    const { user } = get();
    if (!user) return;
    set({ isFetchingInsights: true });
    try {
      const [benchRes, catRes, trendRes, storeRes, payRes, spendRes] = await Promise.all([
        insightsApi.get('/insights/stats/user-benchmark'),
        insightsApi.get('/insights/stats/category-distribution'),
        insightsApi.get('/insights/stats/monthly-trends'),
        insightsApi.get('/insights/stats/top-stores'),
        insightsApi.get('/insights/stats/payment-methods'),
        insightsApi.get('/insights/stats/spending-by-month-and-store')
      ]);
      set({
        stats: {
          categories: catRes.data,
          trends: trendRes.data,
          topStores: storeRes.data,
          paymentMethods: payRes.data,
          spendingByMonthStore: spendRes.data,
          benchmark: benchRes.data
        },
        isProcessing: false
      });
    } catch (err) {
      console.error("Failed to fetch insights global data", err);
    } finally {
      set({ isFetchingInsights: false });
    }
  }
}));
