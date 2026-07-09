import { Receipt } from "lucide-react";
import LazyReceiptImage from "./LazyReceiptImage";

export default function ReceiptListCard({ receipt, onClick }) {
  const label = receipt.store || receipt.purchase_date || `קבלה`;

  return (
    <div
      onClick={() => onClick(receipt)}
      className="group cursor-pointer overflow-hidden rounded-[24px] border border-[#c7ae75]/10 bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="flex h-44 items-center justify-center overflow-hidden bg-gray-50">
        <LazyReceiptImage
          fileId={receipt.has_image ? receipt.file_id : null}
          alt={label}
          className="h-full w-full"
        />
      </div>
      <div className="space-y-1 bg-[#0f1924] p-4 text-[#c7ae75]">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-black uppercase tracking-[0.2em]">{label}</span>
          <Receipt size={16} className="shrink-0 opacity-50" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-white/60">
          <span>{receipt.purchase_date || "—"}</span>
          <span>₪{receipt.total_price ?? 0}</span>
        </div>
        <div className="text-[10px] text-white/40">{receipt.item_count ?? 0} פריטים</div>
      </div>
    </div>
  );
}
