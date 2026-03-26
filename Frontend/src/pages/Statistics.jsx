import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { insightsApi } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#c7ae75", "#7c8a99", "#4f5b66", "#1a2a3a", "#967f4a", "#8C7146", "#B9B5A4"];

export default function Statistics() {
  const { stats, isFetchingInsights } = useStore();

  if (isFetchingInsights)
    return (
      <div className="text-gold text-center mt-20 font-bold animate-pulse">
        מנתח נתונים מ-Elasticsearch...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="bg-navy p-8 rounded-[32px] border-b-4 border-gold shadow-2xl">
        <h2 className="text-3xl font-black text-gold">Insights & Analytics</h2>
        <p className="text-[#c7ae75] text-xs mt-1 uppercase tracking-widest opacity-80">
          נתונים בזמן אמת משרת ה-Insights
        </p>
      </header>

      {/* Benchmark Summary Cards */}
      {stats.benchmark && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow border border-gold/10 text-center">
            <h4 className="text-gray-500 font-bold text-sm mb-2"> מחיר ממוצע לפריט שלך </h4>
            <span className="text-3xl font-black text-navy">${stats.benchmark.user_avg_item_price}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow border border-gold/10 text-center">
            <h4 className="text-gray-500 font-bold text-sm mb-2"> מחיר ממוצע לפריט במערכת</h4>
            <span className="text-3xl font-black text-[#967f4a]">${stats.benchmark.global_avg_item_price}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow border border-gold/10 text-center flex flex-col justify-center">
            <h4 className="text-navy font-black text-lg mb-1">{stats.benchmark.status}</h4>
            <span className="text-[#967f4a] font-bold text-sm"> הוצאות גבוהות מ- {stats.benchmark.percentile_rank} % מהמשתמשים</span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gold/10">
          <h3 className="text-navy font-black mb-6 border-r-4 border-gold pr-3">
            התפלגות הוצאות לפי קטגוריה
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.categories} dataKey="total_price" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {stats.categories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gold/10">
          <h3 className="text-navy font-black mb-6 border-r-4 border-gold pr-3">
            אמצעי תשלום נפוצים
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.paymentMethods} dataKey="total_spending" nameKey="payment_method" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                  {stats.paymentMethods.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gold/10">
          <h3 className="text-navy font-black mb-6 border-r-4 border-gold pr-3">
            מגמת הוצאות חודשית
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trends}>
                <XAxis dataKey="month" stroke="#0f1924" fontSize={12} fontWeight="bold" />
                <YAxis hide />
                <Tooltip cursor={{ fill: "#c7ae7520" }} />
                <Bar dataKey="total_spending" fill="#0f1924" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Stores */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gold/10">
          <h3 className="text-navy font-black mb-6 border-r-4 border-gold pr-3">
            חנויות מובילות (לפי רווח)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topStores} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="store" type="category" stroke="#0f1924" fontSize={12} fontWeight="bold" width={80} />
                <Tooltip cursor={{ fill: "#c7ae7520" }} />
                <Bar dataKey="total_spending" fill="#967f4a" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
