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
    const startedAt = Date.now();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/00b09f7f-606f-413d-aca0-e82cb5fb6ee5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: 'initial',
        hypothesisId: 'H1_baseURL_or_auth_headers',
        location: 'useStore.js:fetchInsightsData:start',
        message: 'fetchInsightsData started (fan-out)',
        data: {
          insightsBaseURL: insightsApi.defaults?.baseURL,
          hasUserId: Boolean(user?._id),
          hasToken: Boolean(localStorage.getItem('token')),
          hasStoredUserId: Boolean(localStorage.getItem('userId')),
          requests: [
            '/receipts/recent',
            '/stats/user-benchmark',
            '/stats/category-distribution',
            '/stats/monthly-trends',
            '/stats/top-stores',
            '/stats/payment-methods',
            '/stats/spending-by-month-and-store',
          ],
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/00b09f7f-606f-413d-aca0-e82cb5fb6ee5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: 'initial',
          hypothesisId: 'H2_gateway_502_504',
          location: 'useStore.js:fetchInsightsData:catch',
          message: 'fetchInsightsData failed (Promise.all)',
          data: {
            status: err?.response?.status,
            code: err?.code,
            url: err?.config?.url,
            baseURL: err?.config?.baseURL,
            durationMs: Date.now() - startedAt,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      console.error("Failed to fetch insights global data", err);
    } finally {
      set({ isFetchingInsights: false });
    }
  }
}));