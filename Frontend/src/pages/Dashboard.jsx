import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { insightsApi } from "../services/api";
import { Link } from "react-router";
import {
  Camera,
  PenLine,
  BarChart3,
  Receipt,
  Search,
  X,
  ChevronRight,
  Loader2,
  ChevronDown,
} from "lucide-react";
import "../App.css";

const CATEGORIES = [
  { value: "", label: "הכל" },
  { value: "General", label: "כללי" },
  { value: "Fashion & Apparel", label: "אופנה ובגדים" },
  { value: "Home & Furniture", label: "בית ורהיטים" },
  { value: "Health & Beauty", label: "בריאות ויופי" },
  { value: "Leisure & Hobbies", label: "בילוי ותחביבים" },
  { value: "Food & Groceries", label: "מזון ומצרכים" },
  { value: "Electronics & Gadgets", label: "אלקטרוניקה" },
];

export default function Dashboard() {
  const { user, isFetchingInsights } = useStore();
  const stats = useStore((state) => state.stats);
  const [searchParams, setSearchParams] = useState({
    category: "",
    store: "",
    type: "data",
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      setLoadingImages(true);
      setImageError(null);
      try {
        const res = await insightsApi.get("/insights/receipts/images");
        setImages(res.data?.images || []);
      } catch (err) {
        if (err.response?.status === 404) {
          setImages([]);
        } else {
          setImageError("לא ניתן לטעון את הקבלות כרגע");
        }
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, [user, isFetchingInsights]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    try {
      const response = await insightsApi.get("/insights/receipts/search", {
        params: {
          category: searchParams.category,
          store: searchParams.store,
          search_type: searchParams.type,
        },
        responseType: searchParams.type === "physical" ? "blob" : "json",
      });

      if (searchParams.type === "physical") {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: response.headers["content-type"] }),
        );
        window.open(url, "_blank");
      } else {
        setSearchResults(response.data.items);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "החיפוש נכשל";
      alert(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const totalSpending = stats?.benchmark?.user_total_spending?.toLocaleString() || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-0" dir="rtl">
      <div className="relative overflow-hidden rounded-[40px] border-l-[12px] border-[#0f1924] bg-gradient-to-r from-[#967f4a] to-[#c4ad7a] p-8 text-white shadow-2xl md:p-10">
        <div className="absolute left-0 top-0 -mt-32 -ml-32 h-64 w-64 rounded-full bg-[#c7ae75]/5 blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-black tracking-tighter md:text-4xl">
              ברוך הבא, {user?.fullName}!
            </h1>
            <p className="mt-2 text-sm font-medium text-[#0f1924] opacity-90">
              סיכום מהיר של ההוצאות והקבלות שלך.
            </p>
          </div>
          <div className="min-w-[220px] rounded-3xl border border-[#c7ae75]/20 bg-white/10 p-6 text-center backdrop-blur-md md:text-right">
            <p className="mb-1 text-[16px] font-black uppercase tracking-[0.3em] text-[#0f1924]">
              סה"כ הוצאות
            </p>
            <span className="text-4xl font-black tracking-tighter md:text-5xl">
              ₪ {totalSpending}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link
          to="/receipts"
          className="flex flex-col items-center rounded-3xl border border-[#c7ae75]/10 bg-white p-6 transition hover:border-[#c7ae75] hover:shadow-xl"
        >
          <span className="mb-2 text-3xl transition group-hover:scale-110">📸</span>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#0f1924]">
            סריקת קבלה
          </span>
        </Link>
        <Link
          to="/receipts"
          className="flex flex-col items-center rounded-3xl border border-[#c7ae75]/10 bg-white p-6 transition hover:border-[#c7ae75] hover:shadow-xl"
        >
          <span className="mb-2 text-3xl transition group-hover:scale-110">✍️</span>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#0f1924]">
            הזנה ידנית
          </span>
        </Link>
        <Link
          to="/statistics"
          className="flex flex-col items-center rounded-3xl border border-[#c7ae75]/10 bg-white p-6 transition hover:border-[#c7ae75] hover:shadow-xl"
        >
          <span className="mb-2 text-3xl transition group-hover:scale-110">📊</span>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#0f1924]">
            סטטיסטיקות
          </span>
        </Link>
        <div className="flex flex-col items-center rounded-3xl border border-[#c7ae75]/30 bg-[#0f1924] p-6 text-[#c7ae75] shadow-lg shadow-[#0f1924]/20">
          <span className="mb-2 text-2xl font-black text-[#c7ae75]">#</span>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#c7ae75]">
            {images.length} קבלות
          </span>
        </div>
      </div>

      <div className="rounded-[32px] border border-[#c7ae75]/10 bg-white p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-2 border-r-4 border-[#c7ae75] pr-3 text-xl font-black text-[#0f1924]">
          <Search size={20} />
          חיפוש קבלות
        </h3>
        <form onSubmit={handleSearch} className="grid gap-6 md:grid-cols-4 md:items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              קטגוריה
            </label>
            <div className="group relative">
              <select
                className="w-full appearance-none rounded-md border border-gray-500 bg-gray-50 p-4 pr-12 font-bold text-[#0f1924] shadow-sm outline-none transition-all focus:border-[#c7ae75] group-hover:bg-white"
                value={searchParams.category}
                onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value || "all"} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#c7ae75] transition-transform group-hover:scale-110">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              שם חנות
            </label>
            <input
              type="text"
              placeholder="למשל: סופרמרקט"
              className="w-full rounded-md border border-gray-500 bg-gray-50 p-4 font-bold text-[#0f1924] outline-none transition-all focus:border-[#c7ae75]"
              value={searchParams.store}
              onChange={(e) => setSearchParams({ ...searchParams, store: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              סוג תוצאה
            </label>
            <div className="group relative">
              <select
                className="w-full appearance-none rounded-md border border-gray-500 bg-gray-50 p-4 pr-12 font-bold text-[#0f1924] outline-none transition-all focus:border-[#c7ae75]"
                value={searchParams.type}
                onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
              >
                <option value="data">רשימת נתונים</option>
                <option value="physical">קבלה פיזית</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#c7ae75] transition-colors group-hover:text-[#0f1924]">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="w-full rounded-2xl bg-[#0f1924] p-4 font-black uppercase tracking-[0.3em] text-[#c7ae75] shadow-lg transition hover:bg-[#c7ae75] hover:text-[#0f1924] disabled:opacity-50"
          >
            {searchLoading ? "מחפש..." : "חיפוש"}
          </button>
        </form>
      </div>

      {searchResults && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f1924]/80 p-4 backdrop-blur-lg">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c7ae75]/20 bg-[#0f1924] p-8 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-[#c7ae75]">
                תוצאות חיפוש
              </h3>
              <button
                onClick={() => setSearchResults(null)}
                className="rounded-full border border-[#c7ae75]/30 bg-white/10 p-2 text-[#c7ae75] transition hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-8">
              {searchResults.length === 0 ? (
                <p className="py-10 text-center text-lg font-bold italic text-[#0f1924]/40">
                  לא נמצאו קבלות התואמות את החיפוש.
                </p>
              ) : (
                searchResults.map((receipt, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 rounded-[24px] border border-[#c7ae75]/10 bg-white p-6 transition hover:shadow-md">
                    <div>
                      <p className="text-xl font-black text-[#0f1924]">{receipt.store}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                        {receipt.purchase_date} • {receipt.items?.length || 0} פריטים
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <p className="text-2xl font-black italic text-[#0f1924]">₪{receipt.total_price}</p>
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="flex items-center gap-1 text-[10px] font-black uppercase text-[#c7ae75] underline transition hover:tracking-widest"
                      >
                        לפרטים <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="border-r-4 border-[#c7ae75] pr-3 text-2xl font-black text-[#0f1924]">
          קבלות אחרונות
        </h2>

        {loadingImages || isFetchingInsights ? (
          <div className="flex flex-col items-center gap-3 rounded-[32px] border border-dashed border-[#c7ae75]/20 bg-gray-50 p-20 text-center text-[#0f1924]/30">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-black italic">טוען נתונים מאובטחים...</span>
          </div>
        ) : imageError ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-10 text-center font-bold text-red-400">
            {imageError}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-[40px] border-2 border-dashed border-[#c7ae75]/20 bg-gray-50 p-20 text-center">
            <p className="text-lg font-bold italic text-[#0f1924]/40">לא נמצאו קבלות במאגר שלך.</p>
            <p className="mt-2 text-sm font-medium text-[#0f1924]/30">הוסף את הקבלה הראשונה ותראה את כל הנתונים כאן.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedReceipt(img)}
                className="group cursor-pointer overflow-hidden rounded-[24px] border border-[#c7ae75]/10 bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex h-44 items-center justify-center overflow-hidden bg-gray-50">
                  <img
                    src={`data:${img.content_type};base64,${img.data_base64}`}
                    alt={img.filename}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex items-center justify-between bg-[#0f1924] p-4 text-[#c7ae75]">
                  <span className="truncate text-xs font-black uppercase tracking-[0.2em]">
                    {img.filename || `קבלה #${idx + 1}`}
                  </span>
                  <Receipt size={16} className="opacity-50" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f1924]/90 p-4 backdrop-blur-xl">
          <div className="w-full max-w-2xl overflow-hidden rounded-[40px] border border-[#c7ae75]/20 bg-white shadow-2xl">
            <div className="relative flex items-center justify-between bg-[#0f1924] p-8 text-white">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-[#c7ae75]/5 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black tracking-tighter text-[#c7ae75]">
                  פרטי קבלה
                </h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  {selectedReceipt.store || selectedReceipt.filename}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="relative z-10 rounded-full border border-[#c7ae75]/30 bg-white/10 p-3 text-[#c7ae75] transition hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-8">
              {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-[#c7ae75]/10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                      <th className="pb-4">שם מוצר</th>
                      <th className="pb-4 text-center">כמות</th>
                      <th className="pb-4">מחיר</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedReceipt.items.map((item, idx) => (
                      <tr key={idx} className="transition hover:bg-gray-50">
                        <td className="py-5">
                          <span className="block font-black text-[#0f1924]">{item.name}</span>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-[#c7ae75]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-5 text-center font-bold text-gray-400">{item.quantity}</td>
                        <td className="py-5 font-black text-[#0f1924]">₪{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-gray-100 py-16 text-center font-bold italic text-[#0f1924]/20">
                  לא נמצאו שורות לפריט זה.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#c7ae75]/10 bg-gray-50 p-8">
              <div className="font-black text-[#0f1924]">
                <span className="block text-[10px] uppercase text-gray-400">סך הכול</span>
                <span className="text-3xl">₪{selectedReceipt.total_price || 0}</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-[20px] bg-[#0f1924] px-10 py-4 font-black uppercase tracking-[0.3em] text-[#c7ae75] shadow-lg transition hover:bg-[#c7ae75] hover:text-[#0f1924]"
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
