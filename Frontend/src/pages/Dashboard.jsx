import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { insightsApi } from "../services/api";
import { Link } from "react-router";
import "../App.css";

export default function Dashboard() {
  const { user, isFetchingInsights } = useStore();
  const stats = useStore((state) => state.stats);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({ category: "", store: "", type: "data" });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    try {
      const response = await insightsApi.get("/receipts/search", {
        params: {
          category: searchParams.category,
          store: searchParams.store,
          search_type: searchParams.type
        },
        // For physical receipts, we expect a binary stream
        responseType: searchParams.type === "physical" ? "blob" : "json"
      });

      if (searchParams.type === "physical") {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
        window.open(url, '_blank');
      } else {
        setSearchResults(response.data.items);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "חיפוש נכשל";
      alert(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const totalSpending = stats.benchmark?.user_total_spending?.toLocaleString() || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-l from-[#967f4a] to-[#c4ad7a] p-6 md:p-8 rounded-2xl text-white shadow-lg text-center md:text-right">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-black">שלום {user?.fullName}!</h1>
          <p className="opacity-90 mt-1 text-sm md:text-base">ריכזנו עבורך את כל הרכישות והנתונים הפיננסיים שלך.</p>
        </div>
        <div className="w-full md:w-auto text-center md:text-left bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
          <p className="text-xs opacity-80 uppercase font-bold tracking-wider">סה"כ הוצאות</p>
          <span className="text-3xl md:text-4xl font-black">$ {totalSpending}</span>
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

      {/* Search Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/10">
        <h3 className="text-xl font-black text-navy mb-4 flex items-center gap-2">
           חיפוש קבלות
        </h3>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">קטגוריה</label>
            <input 
              type="text"
              placeholder="למשל: אוכל"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-gold outline-none font-bold text-navy"
              value={searchParams.category}
              onChange={(e) => setSearchParams({...searchParams, category: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">שם חנות</label>
            <input 
              type="text"
              placeholder="למשל: סופר"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-gold outline-none font-bold text-navy"
              value={searchParams.store}
              onChange={(e) => setSearchParams({...searchParams, store: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">סוג תוצאה</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-gold outline-none font-bold text-navy appearance-none"
              value={searchParams.type}
              onChange={(e) => setSearchParams({...searchParams, type: e.target.value})}
            >
              <option value="data">ניתוח נתונים (JSON)</option>
              <option value="physical">קבלה פיזית (קובץ)</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={searchLoading}
            className="w-full bg-navy text-gold p-3 rounded-xl font-black hover:bg-navy/90 transition disabled:opacity-50"
          >
            {searchLoading ? "מחפש..." : "חיפוש"}
          </button>
        </form>
      </div>

      {/* Search Results Modal */}
      {searchResults && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-navy p-6 flex justify-between items-center text-white">
              <h3 className="text-2xl font-black text-gold">תוצאות חיפוש</h3>
              <button onClick={() => setSearchResults(null)} className="text-gold bg-white/10 p-2 rounded-full hover:scale-110 transition">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {searchResults.map((receipt, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-black text-navy text-lg">{receipt.store}</p>
                      <p className="text-xs text-gray-500 font-bold">{receipt.purchase_date} | {receipt.items.length} פריטים</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-navy">${receipt.total_price}</p>
                      <button 
                        onClick={() => setSelectedReceipt(receipt)}
                        className="text-xs font-black text-gold underline uppercase hover:text-gold/80"
                      >
                        צפה בפרטים
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div 
                key={idx} 
                onClick={() => setSelectedReceipt(img)}
                className="bg-white rounded-[24px] shadow-lg border border-gold/10 overflow-hidden group hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
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

      {/* Item Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-navy p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gold">פירוט פריטים</h3>
                <p className="text-xs opacity-60 uppercase font-bold tracking-widest">{selectedReceipt.filename}</p>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-gold hover:scale-110 transition-transform bg-white/10 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase border-b border-gold/10">
                      <th className="pb-4">שם המוצר</th>
                      <th className="pb-4 text-center">כמות</th>
                      <th className="pb-4 text-left">מחיר</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedReceipt.items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-4">
                          <span className="block font-bold text-navy">{item.name}</span>
                          <span className="text-[10px] text-gold font-black uppercase tracking-tighter">{item.category}</span>
                        </td>
                        <td className="py-4 text-center font-bold text-gray-500">{item.quantity}</td>
                        <td className="py-4 text-left font-black text-navy">${item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-400 italic font-bold">
                  לא נמצאו פריטים משוייכים לקבלה זו.
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="bg-navy text-gold px-8 py-3 rounded-2xl font-black hover:bg-gold hover:text-navy transition-all"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}