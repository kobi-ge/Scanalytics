import { useState } from "react";
import { useStore } from "../store/useStore";
import { ingestionApi } from "../services/api";
// import { useNavigate } from "react-router";
import { Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";

const CATEGORIES = [
  "General",
  "Fashion & Apparel",
  "Home & Furniture",
  "Health & Beauty",
  "Leisure & Hobbies",
  "Food & Groceries",
  "Electronics & Gadgets",
];

export default function ManualEntry() {
  const { user, setProcessing } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [receipt, setReceipt] = useState({
    store: "",
    purchase_date: new Date().toISOString().split("T")[0],
    total_price: 0,
    payment_method: "Visa",
    receipt_id: `manual_${Date.now()}`,
    items: [{ name: "", quantity: 1, price: 0, category: "General" }],
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...receipt.items];
    newItems[index][field] =
      field === "price" || field === "quantity" ? Number(value) : value;
    const newTotal = newItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    setReceipt({ ...receipt, items: newItems, total_price: newTotal });
  };

  const handleSave = async () => {
    if (!user || !user._id) {
      alert("Error: User not logged in. Please log in again.");
      return;
    }

    if (!receipt.store || receipt.items.length === 0) {
      alert("Please enter a store name and add at least one item.");
      return;
    }
    setLoading(true);

    const payload = {
      ...receipt,
      user_id: user._id, // Attach User ID to data
    };
    try {
      // Send to Python server (Port 8000)
      await ingestionApi.post("/manual-entry", payload);
      setProcessing(true);
      alert("Data sent successfully!");
      navigate("/");
      // Retry logic for OCR processing
      [20000, 45000, 90000].forEach(delay =>
        setTimeout(() => useStore.getState().fetchInsightsData(), delay)
      );
    } catch (err) {
      console.error(err);
      alert("Error sending to data server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-navy p-8 border-b border-gold/20 flex justify-between items-center">
        <h2 className="text-3xl font-black text-gold tracking-tight">
          Manual Entry
        </h2>
        <div className="text-navy bg-gold px-4 py-1 rounded-full text-xs font-black uppercase">
          Data Schema V1
        </div>
      </div>

      <div className="p-10 space-y-10">
        {/* General Receipt Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-navy uppercase ml-1">
              Store Name
            </label>
            <input
              placeholder="e.g. Walmart"
              value={receipt.store}
              onChange={(e) =>
                setReceipt({ ...receipt, store: e.target.value })
              }
              className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-gold focus:bg-white rounded-2xl outline-none transition-all font-bold text-navy"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-navy uppercase ml-1">
              Purchase Date
            </label>
            <input
              type="date"
              value={receipt.purchase_date}
              onChange={(e) =>
                setReceipt({ ...receipt, purchase_date: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-gold focus:bg-white rounded-2xl outline-none transition-all font-bold text-navy"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-navy uppercase ml-1">
              Payment Method
            </label>
            <select
              value={receipt.payment_method}
              onChange={(e) =>
                setReceipt({ ...receipt, payment_method: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-gold focus:bg-white rounded-2xl outline-none transition-all font-bold text-navy appearance-none"
            >
              <option value="Visa">Visa</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-l-4 border-gold pl-4">
            <h3 className="font-black text-navy text-lg">Product Details</h3>
            <button
              onClick={() =>
                setReceipt({
                  ...receipt,
                  items: [
                    ...receipt.items,
                    { name: "", quantity: 1, price: 0, category: "Other" },
                  ],
                })
              }
              className="text-gold bg-navy p-2 rounded-xl hover:scale-110 transition-transform"
            >
              <PlusCircle size={24} />
            </button>
          </div>

          <div className="space-y-3">
            {receipt.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-2 md:grid-cols-12 gap-4 items-end bg-[#f8fafc] p-5 rounded-2xl border border-gray-100 hover:border-gold/30 transition-all group"
              >
                {/* Item Name - Full width on mobile, 4 columns on desktop */}
                <div className="col-span-2 md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Item Name
                  </label>
                  <input
                    placeholder="Product Name"
                    className="w-full p-3 bg-white rounded-xl border-none shadow-sm text-sm"
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(idx, "name", e.target.value)
                    }
                  />
                </div>

                {/* Quantity - Half row on mobile */}
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase text-center block">
                    Qty
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white rounded-xl border-none shadow-sm text-center text-sm"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", e.target.value)
                    }
                  />
                </div>

                {/* Price - Half row on mobile */}
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase text-center block">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white rounded-xl border-none shadow-sm text-center text-sm"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(idx, "price", e.target.value)
                    }
                  />
                </div>

                {/* Category - Almost full row on mobile */}
                <div className="col-span-1 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Category
                  </label>
                  <select
                    className="w-full p-3 bg-white rounded-xl border-none shadow-sm text-xs"
                    value={item.category}
                    onChange={(e) =>
                      handleItemChange(idx, "category", e.target.value)
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delete button - Left aligned on mobile */}
                <div className="col-span-1 md:col-span-1 flex justify-center pb-2">
                  <button
                    onClick={() =>
                      setReceipt({
                        ...receipt,
                        items: receipt.items.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-red-300 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary and Save button */}
        <div className="pt-10 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="bg-navy/5 p-6 rounded-3xl border border-navy/5 w-full md:w-auto">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
              Total Price:
            </p>
            <div className="text-5xl font-black text-navy tracking-tighter">
              {receipt.total_price.toLocaleString()} $
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="group relative w-full md:w-auto bg-navy text-gold px-16 py-5 rounded-[24px] font-black text-xl hover:bg-gold hover:text-navy transition-all shadow-xl shadow-navy/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <CheckCircle2 /> {loading ? "Processing..." : "Save Transaction"}
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
