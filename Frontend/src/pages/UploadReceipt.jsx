import { useState } from "react";
import { useStore } from "../store/useStore";
import { ingestionApi } from "../services/api";
import { useNavigate } from "react-router";
import { Camera, Upload } from "lucide-react";

export default function UploadReceipt() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user, setProcessing } = useStore();
    const navigate = useNavigate();

    const handleUpload = async () => {
        if (!file) return alert("בחר קובץ");
        if (!user?._id) return alert("שגיאת משתמש");

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file); // הפייתון מצפה למפתח 'file'
        formData.append("user_id", user._id);

        try {
            const response = await ingestionApi.post("/ingestion/upload-receipt", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert("הקבלה נשלחה בהצלחה: " + response.data.message);
            setProcessing(true);
            navigate("/");
            // OCR יכול לקחת זמן — ננסה 3 פעמים
            [20000, 45000, 90000].forEach(delay =>
                setTimeout(() => useStore.getState().fetchInsightsData(), delay)
            );
        } catch {
            alert("שגיאה בשליחה לשרת ה-Ingestion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl rounded-[32px] border border-[#c7ae75]/20 bg-white shadow-2xl overflow-hidden">
            <div className="flex flex-col items-center border-b border-[#c7ae75]/20 bg-[#0f1924] p-8 text-center">
                <div className="mb-4 rounded-full bg-[#c7ae75] p-4 text-[#0f1924] shadow-lg">
                    <Camera size={40} />
                </div>
                <h2 className="text-2xl font-black text-[#c7ae75]">סריקת קבלה חדשה</h2>
                <p className="mt-2 text-sm text-[#d8c79b]">העלאה של תמונת קבלה והמרתה למידע מסודר.</p>
            </div>

            <div className="space-y-8 p-8 text-center">
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#c7ae75]/30 p-10 transition-all hover:bg-[#f8fafc]">
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <Upload className="mx-auto mb-4 text-[#967f4a]" size={48} />
                    <span className="block text-lg font-bold text-[#0f1924]">
                        {file ? file.name : "בחר קובץ לסריקה"}
                    </span>
                    <span className="mt-2 block text-xs italic text-gray-400">
                        ניתן להעלות JPG, PNG או PDF.
                    </span>
                </label>

                <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className="w-full rounded-2xl bg-[#0f1924] py-5 text-xl font-black text-[#c7ae75] shadow-xl transition-all hover:bg-[#c7ae75] hover:text-[#0f1924] disabled:opacity-50"
                >
                    {loading ? "מעבד ושולח..." : "שלח לעיבוד נתונים"}
                </button>
            </div>
        </div>
    );
}