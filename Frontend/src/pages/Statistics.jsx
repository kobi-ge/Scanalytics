import { useMemo } from "react";
import { useStore } from "../store/useStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

export default function Statistics() {
  const receipts = useStore((state) => state.receipts);

  // 1. עיבוד נתונים לפי קטגוריות (לגרף עוגה)
  const categoryData = useMemo(() => {
    const categories = {};
    receipts.forEach((r) => {
      r.items.forEach((item) => {
        categories[item.category] =
          (categories[item.category] || 0) + item.price * item.quantity;
      });
    });
    return Object.keys(categories).map((key) => ({
      name: key,
      value: categories[key],
    }));
  }, [receipts]);

  // 2. עיבוד נתונים לפי חודשים (לגרף עמודות)
  const monthlyData = useMemo(() => {
    const months = {};
    receipts.forEach((r) => {
      const month = r.purchase_date.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + r.total_price;
    });
    return Object.keys(months)
      .sort()
      .map((month) => ({ month, total: months[month] }));
  }, [receipts]);

  // 3. נתונים להשוואת "מאקרו" (Mock של ממוצע משתמשים אחרים)
  const macroComparison = [
    {
      category: "Food & Groceries",
      mine: categoryData.find((c) => c.name === "Food & Groceries")?.value || 0,
      average: 2500,
    },
    {
      category: "Electronics",
      mine:
        categoryData.find((c) => c.name === "Electronics & Gadgets")?.value ||
        0,
      average: 1200,
    },
    {
      category: "General",
      mine: categoryData.find((c) => c.name === "General")?.value || 0,
      average: 800,
    },
  ];

  if (receipts.length === 0) {
    return (
      <div className="text-center mt-20 p-10 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-700">
          אין מספיק נתונים להצגת סטטיסטיקות
        </h2>
        <p className="text-gray-500 mt-2">
          העלה קבלות או הזן נתונים ידנית כדי לראות את הגרפים.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-3xl font-black text-gray-800">
        ניתוח נתונים וסטטיסטיקות
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* גרף עוגה - התפלגות לפי קטגוריות */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">התפלגות הוצאות לפי קטגוריה</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* גרף עמודות - הוצאות חודשיות */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-4">הוצאות לאורך זמן (חודשי)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* גרף השוואת מאקרו - המשתמש מול הממוצע */}
        <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">
            ההוצאות שלך לעומת הממוצע במערכת (מאקרו)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={macroComparison}
                layout="vertical"
                margin={{ left: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="mine" name="ההוצאה שלי" fill="#10B981" />
                <Bar dataKey="average" name="ממוצע משתמשים" fill="#D1D5DB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
