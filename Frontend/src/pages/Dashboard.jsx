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

// Predefined categories
const CATEGORIES = [
  "General",
  "Fashion & Apparel",
  "Home & Furniture",
  "Health & Beauty",
  "Leisure & Hobbies",
  "Food & Groceries",
  "Electronics & Gadgets",
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
        const res = await insightsApi.get("/receipts/images");
        if (res.data?.images) {
          setImages(res.data.images);
        } else {
          setImages([]);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setImages([]);
        } else {
          setImageError("Error loading receipt images");
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
      const response = await insightsApi.get("/receipts/search", {
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
      const msg = err.response?.data?.detail || "Search failed";
      alert(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const totalSpending =
    stats.benchmark?.user_total_spending?.toLocaleString() || 0;

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 px-4 md:px-0 animate-in fade-in duration-500"
      dir="ltr"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-[#967f4a] to-[#c4ad7a] p-8 md:p-10 rounded-[40px] text-white shadow-2xl border-l-[12px] border-[#0f1924] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#c7ae75]/5 rounded-full -ml-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">
            Welcome, {user?.fullName}!
          </h1>
          <p className="text-[#0f1924] font-medium mt-2 opacity-90">
            Your financial overview and purchases at a glance.
          </p>
        </div>
        <div className="relative z-10 text-center md:text-right bg-white/8 p-6 rounded-3xl backdrop-blur-md border border-[#c7ae75]/20 min-w-[200px]">
          <p className="text-[20px] text-[#0f1924] font-black uppercase tracking-widest mb-1">
            Total Expenses
          </p>
          <span className="text-4xl md:text-5xl font-black tracking-tighter">
            $ {totalSpending}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Link
          to="/upload"
          className="flex flex-col items-center p-6 bg-white border border-[#c7ae75]/10 rounded-3xl hover:border-[#c7ae75] hover:shadow-xl transition group"
        >
          <span className="text-3xl mb-2 group-hover:scale-110 transition">
            📸
          </span>
          <span className="font-black text-[#0f1924] text-xs uppercase tracking-widest">
            Scan Receipt
          </span>
        </Link>
        <Link
          to="/manual"
          className="flex flex-col items-center p-6 bg-white border border-[#c7ae75]/10 rounded-3xl hover:border-[#c7ae75] hover:shadow-xl transition group"
        >
          <span className="text-3xl mb-2 group-hover:scale-110 transition">
            ✍️
          </span>
          <span className="font-black text-[#0f1924] text-xs uppercase tracking-widest">
            Manual Entry
          </span>
        </Link>
        <Link
          to="/statistics"
          className="flex flex-col items-center p-6 bg-white border border-[#c7ae75]/10 rounded-3xl hover:border-[#c7ae75] hover:shadow-xl transition group"
        >
          <span className="text-3xl mb-2 group-hover:scale-110 transition">
            📊
          </span>
          <span className="font-black text-[#0f1924] text-xs uppercase tracking-widest">
            Analytics
          </span>
        </Link>
        <div className="flex flex-col items-center p-6 bg-[#0f1924] border border-[#c7ae75]/30 rounded-3xl text-[#c7ae75] shadow-lg shadow-[#0f1924]/20">
          <span className="text-2xl mb-2 font-serif  text-[#c7ae75] font-black">
            #
          </span>
          <span className="font-black text-[#c7ae75] text-xs uppercase tracking-widest">
            {images.length} Receipts
          </span>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white p-8 rounded-[32px] shadow-xl border border-[#c7ae75]/10">
        <h3 className="text-xl font-black text-[#0f1924] mb-6 flex items-center gap-2 border-l-4 border-[#c7ae75] pl-3">
          Search Receipts
        </h3>
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Category
            </label>
            <div className="relative group">
              <select
                className="w-full p-4 bg-gray-50 border border-gray-500 rounded-md focus:border-[#c7ae75] outline-none font-bold text-[#0f1924] appearance-none pr-12 transition-all cursor-pointer shadow-sm group-hover:bg-white"
                value={searchParams.category}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, category: e.target.value })
                }
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Chevron icon positioned absolutely */}
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#c7ae75] group-hover:scale-110 transition-transform">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Store Name
            </label>
            <input
              type="text"
              placeholder="e.g. Walmart"
              className="w-full p-4 bg-gray-50 border border-gray-500 rounded-md focus:border-[#c7ae75] outline-none font-bold text-[#0f1924]"
              value={searchParams.store}
              onChange={(e) =>
                setSearchParams({ ...searchParams, store: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Result Type
            </label>
            <div className="relative group">
              <select
                className="w-full p-4 bg-gray-50 border border-gray-500 rounded-md focus:border-[#c7ae75] outline-none font-bold text-[#0f1924] appearance-none pr-12 transition-all cursor-pointer"
                value={searchParams.type}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, type: e.target.value })
                }
              >
                <option value="data">Data Analysis (List)</option>
                <option value="physical">Physical Receipt (File)</option>
              </select>

              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#c7ae75] group-hover:text-[#0f1924] transition-colors">
                <ChevronDown size={20} strokeWidth={3} />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="w-full bg-[#0f1924] text-[#c7ae75] p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#c7ae75] hover:text-[#0f1924] transition shadow-lg disabled:opacity-50"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Search Results Modal */}
      {searchResults && (
        <div className="fixed inset-0 bg-[#0f1924]/80 backdrop-blur-lg z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-[#0f1924] p-8 flex justify-between items-center text-white border-b border-[#c7ae75]/20">
              <h3 className="text-2xl font-black text-[#c7ae75] uppercase tracking-tighter">
                Search Results
              </h3>
              <button
                onClick={() => setSearchResults(null)}
                className="text-[#c7ae75] hover:text-white bg-white/10 p-2 rounded-full transition-all border border-[#c7ae75]/30"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {searchResults.length === 0 ? (
                <p className="text-center text-[#0f1924]/40 font-bold py-10 italic">
                  No receipts found matching your criteria.
                </p>
              ) : (
                searchResults.map((receipt, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-[24px] border border-[#c7ae75]/10 flex justify-between items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-black text-[#0f1924] text-xl">
                        {receipt.store}
                      </p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        {receipt.purchase_date} • {receipt.items?.length || 0}{" "}
                        Items
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-2xl font-black text-[#0f1924] italic">
                        ${receipt.total_price}
                      </p>
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="flex items-center gap-1 text-[10px] font-black text-[#c7ae75] underline uppercase hover:tracking-widest transition-all"
                      >
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Receipts Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-[#0f1924] border-l-4 border-[#c7ae75] pl-3">
          Recent Receipts
        </h2>

        {loadingImages || isFetchingInsights ? (
          <div className="text-center p-20 text-[#0f1924]/30 font-black italic animate-pulse flex flex-col items-center gap-3">
            <Loader2 className="animate-spin" size={32} />
            Loading encrypted data...
          </div>
        ) : imageError ? (
          <div className="text-center p-10 text-red-400 font-bold bg-red-50 rounded-3xl border border-red-100">
            {imageError}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center p-20 bg-gray-50 border-2 border-dashed border-[#c7ae75]/20 rounded-[40px]">
            <p className="text-[#0f1924]/40 font-bold text-lg italic">
              No receipts found in your vault.
            </p>
            <p className="text-[#0f1924]/30 text-sm mt-2 font-medium">
              Scan your first receipt to see the magic happen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedReceipt(img)}
                className="bg-white rounded-[32px] shadow-lg border border-[#c7ae75]/10 overflow-hidden group hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2"
              >
                <div className="h-64 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={`data:${img.content_type};base64,${img.data_base64}`}
                    alt={img.filename}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 bg-[#0f1924] text-[#c7ae75] font-black text-xs uppercase tracking-widest flex justify-between items-center">
                  <span className="truncate">
                    {img.filename || `Receipt #${idx + 1}`}
                  </span>
                  <Receipt size={16} className="opacity-50" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Modal - z-index is higher to appear over search results */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-[#0f1924]/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[#c7ae75]/20">
            <div className="bg-[#0f1924] p-10 text-white flex justify-between items-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c7ae75]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-[#c7ae75] italic tracking-tighter">
                  Receipt Details
                </h3>
                <p className="text-[10px] opacity-50 uppercase font-bold tracking-[0.2em] mt-1">
                  {selectedReceipt.store || selectedReceipt.filename}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-[#c7ae75] hover:text-white bg-white/10 p-3 rounded-full transition-all border border-[#c7ae75]/30 relative z-10"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 max-h-[60vh] overflow-y-auto">
              {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-[#c7ae75]/10">
                      <th className="pb-4">Product Name</th>
                      <th className="pb-4 text-center">Qty</th>
                      <th className="pb-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedReceipt.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="group hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-5">
                          <span className="block font-black text-[#0f1924]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-[#c7ae75] font-black uppercase tracking-tighter">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-5 text-center font-bold text-gray-400">
                          {item.quantity}
                        </td>
                        <td className="py-5 text-right font-black text-[#0f1924] italic">
                          ${item.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-[#0f1924]/20 italic font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                  No line items extracted for this receipt.
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t border-[#c7ae75]/10 flex justify-between items-center">
              <div className="text-[#0f1924] font-black italic">
                <span className="text-[10px] uppercase block text-gray-400">
                  Total Price
                </span>
                <span className="text-3xl">
                  ${selectedReceipt.total_price || 0}
                </span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-[#0f1924] text-[#c7ae75] px-10 py-4 rounded-[20px] font-black uppercase tracking-widest hover:bg-[#c7ae75] hover:text-[#0f1924] transition-all shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
