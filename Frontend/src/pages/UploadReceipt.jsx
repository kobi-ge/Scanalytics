import { useState } from "react";
import { useStore } from "../store/useStore";
import { ingestionApi } from "../services/api";
import { useNavigate } from "react-router";
import { Camera, Upload } from "lucide-react";

export default function UploadReceipt() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useStore();
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return alert("בחר קובץ");
    if (!user?._id) return alert("שגיאת משתמש");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file); // הפייתון מצפה למפתח 'file'
    formData.append("user_id", user._id);

    try {
      const response = await ingestionApi.post("/upload-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("הקבלה נשלחה בהצלחה: " + response.data.message);
      navigate("/");
    } catch (error) {
      alert("שגיאה בשליחה לשרת ה-Ingestion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-[32px] shadow-2xl border border-gold/10 overflow-hidden">
      <div className="bg-navy p-10 flex flex-col items-center border-b border-gold/20">
        <div className="bg-gold p-4 rounded-full text-navy shadow-lg shadow-gold/20 mb-4">
          <Camera size={40} />
        </div>
        <h2 className="text-2xl font-black text-gold">סריקת קבלה חדשה</h2>
        <p className="text-gold/50 text-xs mt-1 uppercase font-bold tracking-widest italic">
          FastAPI Gateway
        </p>
      </div>

      <div className="p-10 space-y-8 text-center">
        <label className="block border-2 border-dashed border-gold/20 rounded-2xl p-12 cursor-pointer hover:bg-gold/5 transition-all">
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Upload className="mx-auto text-gold/30 mb-4" size={48} />
          <span className="text-navy font-bold text-lg block">
            {file ? file.name : "בחר קובץ לסריקה"}
          </span>
          <span className="text-gray-400 text-xs mt-2 block italic">
            הקובץ יישמר ב-GridFS ויישלח ל-Kafka
          </span>
        </label>

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full bg-navy text-gold py-5 rounded-2xl font-black text-xl hover:bg-gold hover:text-navy transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? "מעבד ושולח..." : "שלח לעיבוד דאטה"}
        </button>
      </div>
    </div>
  );
}
