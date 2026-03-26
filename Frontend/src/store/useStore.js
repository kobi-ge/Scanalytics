import { create } from 'zustand';
import { insightsApi } from '../services/api';

export const useStore = create((set, get) => ({
  user: null,
  receipts: [],
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
    // שמירת ה-ID גם ב-localStorage עבור ה-Headers של הפייתון
    if (userData?._id) localStorage.setItem('userId', userData._id);
    set({ user: userData });
  },
  isFetchingInsights: false,
  logout: () => {
    localStorage.clear();
    set({ user: null, receipts: [], stats: { categories: [], trends: [], topStores: [], paymentMethods: [], spendingByMonthStore: [], benchmark: null } });
  },
  setReceipts: (receipts) => set({ receipts }),
  setStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
  fetchInsightsData: async () => {
    const { user } = get();
    if (!user) return;
    set({ isFetchingInsights: true });
    try {
      const [recRes, benchRes, catRes, trendRes, storeRes, payRes, spendRes] = await Promise.all([
        insightsApi.get("/receipts/recent"),
        insightsApi.get("/stats/user-benchmark"),
        insightsApi.get("/stats/category-distribution"),
        insightsApi.get("/stats/monthly-trends"),
        insightsApi.get("/stats/top-stores"),
        insightsApi.get("/stats/payment-methods"),
        insightsApi.get("/stats/spending-by-month-and-store")
      ]);
      set({ 
        receipts: recRes.data.items || [],
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