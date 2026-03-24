import { useState } from "react";
import dataApi from "../services/api";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router";

export default function UploadReceipt() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useStore();
  const addReceipt = useStore((state) => state.addReceipt);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return alert("אנא צרף קבלה");
    if (!user?._id) return alert("אנא התחבר מחדש");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file); // הפייתון מצפה למפתח 'file'
    formData.append("user_id", user._id); // הצמדת ה-ID של המשתמש

    try {
      const response = await dataApi.post("/upload-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        "הקבלה נשלחה לעיבוד דאטה בהצלחה! (ID: " + response.data.file_id + ")",
      );
      navigate("/");
    } catch (error) {
      alert("שגיאה בשליחה לפענוח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-[32px] shadow-2xl border border-gold/10 overflow-hidden">
      <div className="bg-navy p-8 border-b border-gold/20 flex flex-col items-center">
        <div className="bg-gold p-4 rounded-full mb-4 shadow-lg shadow-gold/20 text-navy">
          <Camera size={32} />
        </div>
        <h2 className="text-2xl font-black text-gold">סריקת קבלה לענן</h2>
        <p className="text-gold/60 text-xs mt-1 uppercase font-bold tracking-widest">
          FastAPI & Kafka Gateway
        </p>
      </div>

      <div className="p-10 space-y-6 text-center">
        <label className="block border-2 border-dashed border-gold/20 rounded-2xl p-10 cursor-pointer hover:bg-gold/5 transition-all group">
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <UploadCloud
            className="mx-auto mb-4 text-gold/40 group-hover:text-gold transition-colors"
            size={48}
          />
          <span className="block text-navy font-bold">
            {file ? file.name : "לחץ לבחירת קובץ"}
          </span>
          <span className="text-xs text-gray-400 mt-2 block italic">
            פורמטים נתמכים: JPG, PNG, PDF
          </span>
        </label>

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full bg-navy text-gold py-4 rounded-2xl font-black text-lg hover:bg-gold hover:text-navy transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? "מעלה ושולח ל-Kafka..." : "שלח לסריקה ועיבוד"}
        </button>
      </div>
    </div>
  );
}
