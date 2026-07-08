import { useState } from "react";
import { Camera, PenLine } from "lucide-react";
import UploadReceipt from "./UploadReceipt";
import ManualEntry from "./ManualEntry";

export default function Receipts() {
  const [activeTab, setActiveTab] = useState("scan");

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-2 md:px-0" dir="rtl">
      <div className="rounded-[32px] border border-[#c7ae75]/20 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#967f4a]">
              ניהול קבלות
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#0f1924]">
              הוספת קבלה חדשה
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              בחר בין סריקה לאחסון מיידי לבין הזנה ידנית, וכל ההליך יישאר באותה המסגרת.
            </p>
          </div>

          <div className="flex rounded-full border border-[#c7ae75]/30 bg-[#f8fafc] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("scan")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === "scan"
                  ? "bg-[#0f1924] text-[#c7ae75] shadow"
                  : "text-[#0f1924] hover:bg-white"
              }`}
            >
              <Camera size={16} />
              סריקת קבלה
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === "manual"
                  ? "bg-[#0f1924] text-[#c7ae75] shadow"
                  : "text-[#0f1924] hover:bg-white"
              }`}
            >
              <PenLine size={16} />
              הזנה ידנית
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] bg-[#f8fafc] p-4 shadow-inner md:p-6">
        {activeTab === "scan" ? <UploadReceipt /> : <ManualEntry />}
      </div>
    </div>
  );
}
