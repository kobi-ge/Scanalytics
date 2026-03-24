// src/pages/UploadReceipt.jsx
import { useState } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router";
import { mockApi } from "../services/mockApi";
import "../App.css";

const CATEGORIES = [
  "Fashion & Apparel",
  "Home & Furniture",
  "Health & Beauty",
  "Leisure & Hobbies",
  "Food & Groceries",
  "Electronics & Gadgets",
  "General",
];

export default function UploadReceipt() {
  const user = useStore((state) => state.user);
  const addReceipt = useStore((state) => state.addReceipt);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState("");

  // שלב 1: שליחת התמונה
  const handleUpload = async () => {
    if (!file) {
      setError("נא לבחור קובץ תחילה");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await mockApi.uploadReceiptImage(file);
      setParsedData(data); // מציג את הדאטה לעריכה
    } catch (err) {
      setError("שגיאה בפענוח התמונה.");
    } finally {
      setLoading(false);
    }
  };

  // שלב 2: פונקציות עריכת הדאטה
  const handleFieldChange = (field, value) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...parsedData.items];
    updatedItems[index][field] = value;

    // עדכון סכום כולל אוטומטי אם משנים מחיר או כמות
    let newTotal = parsedData.total_price;
    if (field === "price" || field === "quantity") {
      newTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      );
    }

    setParsedData({
      ...parsedData,
      items: updatedItems,
      total_price: newTotal,
    });
  };

  // שלב 3: שמירה סופית ל-DB
  const handleSave = async () => {
    try {
      const savedReceipt = await mockApi.saveReceipt(parsedData, user.id);
      addReceipt(savedReceipt);
      alert("הקבלה נשמרה בהצלחה!");
      navigate("/");
    } catch (err) {
      setError("שגיאה בשמירת הקבלה.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">העלאת קבלה ופענוח</h2>

      {!parsedData ? (
        <div className="flex flex-col gap-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="p-2 border border-dashed border-gray-400 rounded bg-gray-50"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-[#0f1924] text-[#c7ae75] border-[#c7ae75] border-2 p-2 rounded transition-colors duration-300 hover:bg-[#c7ae75] hover:text-[#0f1924] disabled:opacity-50"
          >
            {loading ? "מפענח נתונים (AI)..." : "העלה ופענח"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 p-3 rounded border border-green-200 text-green-800 text-sm">
            הפענוח הסתיים בהצלחה. אנא עברו על הנתונים, תקנו טעויות במידת הצורך
            ולחצו על שמירה.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold">חנות</label>
              <input
                type="text"
                value={parsedData.store}
                onChange={(e) => handleFieldChange("store", e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">תאריך</label>
              <input
                type="date"
                value={parsedData.purchase_date}
                onChange={(e) =>
                  handleFieldChange("purchase_date", e.target.value)
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">סך הכל (₪)</label>
              <input
                type="number"
                value={parsedData.total_price}
                onChange={(e) =>
                  handleFieldChange("total_price", Number(e.target.value))
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">אמצעי תשלום</label>
              <input
                type="text"
                value={parsedData["Payment type"]}
                onChange={(e) =>
                  handleFieldChange("Payment type", e.target.value)
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold mt-6 border-b pb-2">מוצרים שזוהו</h3>
          {parsedData.items.map((item, index) => (
            <div
              key={item.id || index}
              className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded border items-end"
            >
              <div>
                <label className="block text-xs mb-1">שם מוצר</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, "name", e.target.value)
                  }
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">כמות</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", Number(e.target.value))
                  }
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">מחיר יחידה</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handleItemChange(index, "price", Number(e.target.value))
                  }
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">קטגוריה</label>
                <select
                  value={item.category}
                  onChange={(e) =>
                    handleItemChange(index, "category", e.target.value)
                  }
                  className="w-full p-1 border rounded text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition mt-4"
          >
            אשר ושמור קבלה למערכת
          </button>
        </div>
      )}
    </div>
  );
}
