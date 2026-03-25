import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { insightsApi } from "../services/api";
import { Link } from "react-router";
import "../App.css";

export default function Dashboard() {
  const { user, isFetchingInsights, stats } = useStore();
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageError, setImageError] = useState(null);

  // טעינת תמונות הקבלות האמיתיות מ-GridFS
  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      setLoadingImages(true);
      setImageError(null);
      try {
        const res = await insightsApi.get("/receipts/images");
        // מחזיר { images: [...], count: N } או StreamingResponse בודד
        if (res.data?.images) {
          setImages(res.data.images);
        } else {
          // קובץ בודד — לא צפוי בקונטקסט הזה
          setImages([]);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setImages([]); // אין תמונות עדיין — תקין
        } else {
          setImageError("שגיאה בטעינת תמונות הקבלות");
        }
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, [user, isFetchingInsights]); // רענן גם כשמגיעים עדכוני insights חדשים

  const totalSpending = stats.benchmark?.user_total_spending?.toLocaleString() || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-l from-[#967f4a] to-[#c4ad7a] p-6 md:p-8 rounded-2xl text-white shadow-lg text-center md:text-right">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-black">שלום {user?.fullName}!</h1>
          <p className="opacity-90 mt-1 text-sm md:text-base">ריכזנו עבורך את כל הרכישות והנתונים הפיננסיים שלך.</p>
        </div>
        <div className="w-full md:w-auto text-center md:text-left bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
          <p className="text-xs opacity-80 uppercase font-bold tracking-wider">סה"כ הוצאות</p>
          <span className="text-3xl md:text-4xl font-black">₪ {totalSpending}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/upload" className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group shadow-sm text-center">
          <span className="text-2xl mb-2 group-hover:scale-110 transition">📸</span>
          <span className="font-bold text-gray-700 text-sm md:text-base">סרוק קבלה</span>
        </Link>
        <Link to="/manual" className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group shadow-sm text-center">
          <span className="text-2xl mb-2 group-hover:scale-110 transition">✍️</span>
          <span className="font-bold text-gray-700 text-sm md:text-base">הזנה ידנית</span>
        </Link>
        <Link to="/statistics" className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group shadow-sm text-center">
          <span className="text-2xl mb-2 group-hover:scale-110 transition">📊</span>
          <span className="font-bold text-gray-700 text-sm md:text-base">ניתוח נתונים</span>
        </Link>
        <div className="flex flex-col items-center p-4 bg-white border rounded-xl shadow-sm text-center">
          <span className="text-2xl mb-2 italic font-serif text-[#967f4a]">#</span>
          <span className="font-bold text-gray-700 text-sm md:text-base">{images.length} קבלות</span>
        </div>
      </div>

      {/* Receipt Images Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mr-2">קבלות אחרונות</h2>

        {loadingImages || isFetchingInsights ? (
          <div className="text-center p-10 text-gray-400 font-bold italic animate-pulse">
            טוען תמונות קבלות מהשרת...
          </div>
        ) : imageError ? (
          <div className="text-center p-10 text-red-400 font-bold">{imageError}</div>
        ) : images.length === 0 ? (
          <div className="text-center p-20 bg-gray-50 border border-dashed rounded-2xl mx-2">
            <p className="text-gray-400 font-medium text-lg">עדיין לא הועלו קבלות עם תמונות למערכת.</p>
            <p className="text-gray-400 text-sm mt-2">לאחר סריקה, התמונות יופיעו כאן אוטומטית.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-[24px] shadow-lg border border-gold/10 overflow-hidden group hover:shadow-xl transition-all">
                <img
                  src={`data:${img.content_type};base64,${img.data_base64}`}
                  alt={img.filename || `קבלה ${idx + 1}`}
                  className="w-full object-contain max-h-64 bg-gray-50"
                />
                <div className="p-4 bg-navy text-gold font-bold text-sm truncate text-center">
                  {img.filename || `קבלה ${idx + 1}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
