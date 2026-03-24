import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
const CATEGORIES = ["Fashion & Apparel", "Home & Furniture", "Health & Beauty", "Leisure & Hobbies", "Food & Groceries", "Electronics & Gadgets", "General"];

export default function Statistics() {
  const receipts = useStore(state => state.receipts);

  // 1. חילוץ רשימת חודשים ייחודיים מתוך הקבלות לצורך תיבת הבחירה
  const availableMonths = useMemo(() => {
    const months = [...new Set(receipts.map(r => r.purchase_date.substring(0, 7)))];
    return months.sort((a, b) => b.localeCompare(a)); // מיון מהחדש לישן
  }, [receipts]);

  // 2. סטייט לחודש הנבחר (ברירת מחדל: החודש האחרון שיש בו נתונים)
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || "");

  // 3. עיבוד נתונים לעוגה - מסונן לפי החודש הנבחר בלבד
  const pieData = useMemo(() => {
    if (!selectedMonth) return [];
    
    const categories = {};
    // מסננים קבלות ששייכות רק לחודש הנבחר
    const filteredReceipts = receipts.filter(r => r.purchase_date.startsWith(selectedMonth));

    filteredReceipts.forEach(r => {
      r.items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + (Number(item.price) * Number(item.quantity));
      });
    });

    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [receipts, selectedMonth]);

  // 4. עיבוד נתונים לגרף העמודות (נשאר לכל החודשים כדי לראות מגמה)
  const monthlyCategoryData = useMemo(() => {
    const dataMap = {};
    receipts.forEach(r => {
      const month = r.purchase_date.substring(0, 7);
      if (!dataMap[month]) {
        dataMap[month] = { month };
        CATEGORIES.forEach(cat => dataMap[month][cat] = 0);
      }
      r.items.forEach(item => {
        dataMap[month][item.category] += (Number(item.price) * Number(item.quantity));
      });
    });
    return Object.values(dataMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [receipts]);

  if (receipts.length === 0) {
    return (
      <div className="text-center mt-20 p-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
        <h2 className="text-xl font-bold text-gray-700">אין עדיין נתונים לניתוח</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">ניתוח הוצאות</h2>
          <p className="text-gray-500">ניהול ובקרה על בסיס נתונים חודשיים</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* גרף עוגה - ממוקד חודש */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-700 text-sm">התפלגות לחודש:</h3>
            
            {/* כפתור בחירת חודש */}
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-blue-50 text-blue-700 text-xs font-bold p-2 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={85} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {pieData.map((entry, index) => {
                    const catIndex = CATEGORIES.indexOf(entry.name);
                    return <Cell key={`cell-${index}`} fill={COLORS[catIndex % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {pieData.length === 0 && <p className="text-center text-gray-400 text-xs mt-4">אין נתונים לחודש זה</p>}
        </div>

        {/* גרף עמודות מוערם - כל התקופה */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-bold mb-6 text-gray-700">מגמת הוצאות כללית</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCategoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{fontSize: '12px'}} />
                <YAxis axisLine={false} tickLine={false} style={{fontSize: '12px'}} />
                <Tooltip cursor={{fill: '#f9fafb'}} formatter={(value) => `₪${value.toLocaleString()}`} />
                <Legend iconType="circle" />
                {CATEGORIES.map((cat, index) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* השוואת מאקרו תחתונה */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-6 text-gray-700 text-center">איך ההוצאות שלך ביחס לאחרים?</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
                { name: 'מזון', mine: pieData.find(d => d.name === 'Food & Groceries')?.value || 0, average: 2100 },
                { name: 'חשמל', mine: pieData.find(d => d.name === 'Electronics & Gadgets')?.value || 0, average: 1400 },
                { name: 'פנאי', mine: pieData.find(d => d.name === 'Leisure & Hobbies')?.value || 0, average: 750 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip />
              <Legend />
              <Bar dataKey="mine" name="אני (החודש הנבחר)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="average" name="ממוצע קהילה" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}