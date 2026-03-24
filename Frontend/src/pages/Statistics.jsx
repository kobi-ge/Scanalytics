import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { insightsApi } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#c7ae75", "#ffffff", "#4f5b66", "#1a2a3a", "#967f4a"];

export default function Statistics() {
  const { stats, setStats } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [catRes, trendRes, storeRes] = await Promise.all([
          insightsApi.get("/stats/category-distribution"),
          insightsApi.get("/stats/monthly-trends"),
          insightsApi.get("/stats/top-stores"),
        ]);
        setStats({
          categories: catRes.data,
          trends: trendRes.data,
          topStores: storeRes.data,
        });
      } catch (err) {
        console.error("Error fetching stats from Insights API");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="text-gold text-center mt-20 font-bold animate-pulse">
        מנתח נתונים מ-Elasticsearch...
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="bg-navy p-8 rounded-[32px] border-b-4 border-gold shadow-2xl">
        <h2 className="text-3xl font-black text-gold">Insights & Analytics</h2>
        <p className="text-white/60 text-xs mt-1 uppercase tracking-widest">
          נתונים בזמן אמת משרת ה-Insights
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* גרף עוגה - התפלגות קטגוריות */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gold/10">
          <h3 className="text-navy font-black mb-6 border-r-4 border-gold pr-3">
            התפלגות הוצאות לפי קטגוריה
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categories}
                  dataKey="total_amount"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {stats.categories.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* גרף עמודות - מגמות חודשיות */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gold/10">
          <h3 className="text-navy font-black mb-6 border-r-4 border-gold pr-3">
            מגמת הוצאות חודשית
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trends}>
                <XAxis
                  dataKey="month"
                  stroke="#0f1924"
                  fontSize={12}
                  fontWeight="bold"
                />
                <YAxis hide />
                <Tooltip cursor={{ fill: "#c7ae7520" }} />
                <Bar
                  dataKey="total_spent"
                  fill="#0f1924"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
