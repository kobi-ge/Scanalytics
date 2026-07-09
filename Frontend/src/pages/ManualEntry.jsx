import { useState } from "react";
import { useStore } from "../store/useStore";
import { ingestionApi } from "../services/api";
// import { useNavigate } from "react-router";
import { Trash2, PlusCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";

const CATEGORIES = [
  { value: "General", label: "כללי" },
  { value: "Fashion & Apparel", label: "אופנה ובגדים" },
  { value: "Home & Furniture", label: "בית ורהיטים" },
  { value: "Health & Beauty", label: "בריאות ויופי" },
  { value: "Leisure & Hobbies", label: "בילוי ותחביבים" },
  { value: "Food & Groceries", label: "מזון ומצרכים" },
  { value: "Electronics & Gadgets", label: "אלקטרוניקה" },
];

export default function ManualEntry() {
  const { user, setProcessing } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [receipt, setReceipt] = useState({
    store: "",
    purchase_date: new Date().toISOString().split("T")[0],
    total_price: 0,
    payment_method: "כרטיס אשראי",
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
      alert("שגיאה: משתמש לא מחובר. אנא היכנס מחדש.");
      return;
    }

    if (!receipt.store || receipt.items.length === 0) {
      alert("נא למלא שם חנות ולהוסיף לפחות פריט אחד.");
      return;
    }
    setLoading(true);

    const payload = {
      ...receipt,
      user_id: user._id, // הצמדת ה-ID לנתונים
    };
    try {
      await ingestionApi.post('/ingestion/manual-entry', payload);
      setProcessing(true);
      useStore.getState().incrementReceiptCount();
      useStore.getState().resetReceiptList();
      alert("הנתונים נשלחו בהצלחה!");
      navigate("/");
      setTimeout(() => useStore.getState().fetchReceiptCount(), 30000);
    } catch (err) {
      console.error(err);
      alert("שגיאה בשליחה לשרת הדאטה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-navy p-8 border-b border-gold/20 flex justify-between items-center">
        <h2 className="text-3xl font-black text-gold tracking-tight">
          הזנה ידנית
        </h2>
        <div className="text-navy bg-gold px-4 py-1 rounded-full text-xs font-black uppercase">
          Data Schema V1
        </div>
      </div>

      <div className="p-10 space-y-10">
        {/* פרטי קבלה כלליים */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-navy uppercase mr-1">
              שם העסק / חנות
            </label>
            <input
              placeholder="לדוגמה: מחסני חשמל"
              value={receipt.store}
              onChange={(e) =>
                setReceipt({ ...receipt, store: e.target.value })
              }
              className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-gold focus:bg-white rounded-2xl outline-none transition-all font-bold text-navy"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-navy uppercase mr-1">
              תאריך רכישה
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
            <label className="text-xs font-black text-navy uppercase mr-1">
              אמצעי תשלום
            </label>
            <select
              value={receipt.payment_method}
              onChange={(e) =>
                setReceipt({ ...receipt, payment_method: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-gold focus:bg-white rounded-2xl outline-none transition-all font-bold text-navy appearance-none"
            >
              <option value="כרטיס אשראי">כרטיס אשראי</option>
              <option value="מזומן">מזומן</option>
            </select>
          </div>
        </div>

        {/* טבלת מוצרים */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-r-4 border-gold pr-4">
            <h3 className="font-black text-navy text-lg">פירוט מוצרים</h3>
            <button
              onClick={() =>
                setReceipt({
                  ...receipt,
                  items: [
                    ...receipt.items,
                    { name: "", quantity: 1, price: 0, category: "General" },
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
                {/* שם פריט - תופס שורה שלמה במובייל, 4 עמודות בדסקטופ */}
                <div className="col-span-2 md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    שם פריט
                  </label>
                  <input
                    placeholder="שם המוצר"
                    className="w-full p-3 bg-white rounded-xl border-none shadow-sm text-sm"
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(idx, "name", e.target.value)
                    }
                  />
                </div>

                {/* כמות - חצי שורה במובייל */}
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase text-center block">
                    כמות
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

                {/* מחיר - חצי שורה במובייל */}
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase text-center block">
                    מחיר
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

                {/* קטגוריה - כמעט שורה שלמה במובייל */}
                <div className="col-span-1 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    קטגוריה
                  </label>
                  <select
                    className="w-full p-3 bg-white rounded-xl border-none shadow-sm text-xs"
                    value={item.category}
                    onChange={(e) =>
                      handleItemChange(idx, "category", e.target.value)
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* כפתור מחיקה - מיושר לשמאל במובייל */}
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

        {/* סיכום וכפתור שמירה */}
        <div className="pt-10 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="bg-navy/5 p-6 rounded-3xl border border-navy/5 w-full md:w-auto">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
              סה"כ לתשלום:
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
              <CheckCircle2 /> {loading ? "מעבד נתונים..." : "שמור עסקה"}
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
