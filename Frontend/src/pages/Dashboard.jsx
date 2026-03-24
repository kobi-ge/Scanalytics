import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { insightsApi } from "../services/api";
import ReceiptCard from "../components/ReceiptCard";
import { Link } from "react-router";
import "../App.css";

export default function Dashboard() {
  const { user, receipts, setReceipts } = useStore();
  const [loading, setLoading] = useState(true);

  // לוגיקת משיכת נתונים אוטומטית משרת 2 (Insights)
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        // פנייה לשרת פייתון 2 לקבלת הנתונים המעובדים
        const response = await insightsApi.get("/search/items");
        // עדכון ה-Store הגלובלי
        setReceipts(response.data.items || []);
      } catch (err) {
        console.error("Failed to fetch items from Insights API", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchItems();
  }, [user, setReceipts]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section - העיצוב המקורי עם הדרגיינט הזהוב */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-gradient-to-l from-[#967f4a] to-[#c4ad7a] p-8 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-black">שלום {user?.fullName}!</h1>
          <p className="opacity-90 mt-1">
            ריכזנו עבורך את כל הרכישות והנתונים הפיננסיים שלך.
          </p>
        </div>
        <div className="text-left bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
          <p className="text-sm opacity-80 uppercase font-bold tracking-wider">
            סה"כ הוצאות
          </p>
          <span className="text-4xl font-black">
            ₪ {user?.totalExpenses?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Quick Actions - האייקונים והסגנון מהקוד הראשון */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/upload"
          className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group shadow-sm"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">
            📸
          </span>
          <span className="font-bold text-gray-700">סרוק קבלה</span>
        </Link>
        <Link
          to="/manual"
          className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group shadow-sm"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">
            ✍️
          </span>
          <span className="font-bold text-gray-700">הזנה ידנית</span>
        </Link>
        <Link
          to="/statistics"
          className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group shadow-sm"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">
            📊
          </span>
          <span className="font-bold text-gray-700">ניתוח נתונים</span>
        </Link>
        <div className="flex flex-col items-center p-4 bg-white border rounded-xl shadow-sm">
          <span className="text-2xl mb-2 italic font-serif text-[#967f4a]">
            #
          </span>
          <span className="font-bold text-gray-700">
            {receipts.length} קבלות
          </span>
        </div>
      </div>

      {/* Receipts List - רשימה מוזנת אוטומטית מהשרת */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mr-2">קבלות אחרונות</h2>

        {loading ? (
          <div className="text-center p-10 text-gray-400 font-bold italic">
            טוען נתונים מה-Insights API...
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center p-20 bg-gray-50 border border-dashed rounded-2xl">
            <p className="text-gray-400 font-medium text-lg">
              עדיין לא הועלו קבלות למערכת.
            </p>
            <p className="text-gray-400 text-sm">
              הנתונים יופיעו כאן לאחר העיבוד ב-Kafka ו-Elasticsearch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.receipt_id} receipt={receipt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
