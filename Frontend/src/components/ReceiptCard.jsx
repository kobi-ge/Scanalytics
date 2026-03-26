import { useState } from "react";
import { useStore } from "../store/useStore";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  CreditCard,
} from "lucide-react";

export default function ReceiptCard({ receipt }) {
  const [isOpen, setIsOpen] = useState(false);
  const deleteReceipt = useStore((state) => state.deleteReceipt);

  return (
    <div className="bg-white border border-gold/10 rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
// Header Section
      <div className="p-6 flex justify-between items-center bg-navy text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="font-black text-gold text-xl tracking-tight">
            {receipt.store}
          </h3>
          <div className="flex gap-4 mt-1 opacity-60">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
              <Calendar size={12} />{" "}
              {new Date(receipt.purchase_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
              <CreditCard size={12} /> {receipt.payment_method}
            </span>
          </div>
        </div>
        <div className="relative z-10 text-left">
          <span className="text-3xl font-black text-white italic">
            ${receipt.total_price}
          </span>
        </div>
      </div>

      {/* Footer עם כפתורי פעולה */}
      <div className="px-6 py-4 flex justify-between items-center bg-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-black text-navy/40 hover:text-gold transition-colors uppercase tracking-widest"
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isOpen
            ? "Close Details"
            : `Items (${receipt.items?.length || 0})`}
        </button>
        <button
          onClick={() =>
            window.confirm("Delete this receipt?") &&
            deleteReceipt(receipt._id || receipt.receipt_id)
          }
          className="p-2 text-red-200 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* אזור הפירוט שנפתח */}
      {isOpen && (
        <div className="px-6 pb-6 bg-gray-50/50 border-t border-gold/5 animate-in slide-in-from-top-4 duration-300">
          <table className="w-full text-sm text-left mt-4 uppercase">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 border-b border-gold/10">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items?.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors"
                >
                  <td className="py-3">
                    <span className="block font-bold text-navy">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gold font-medium uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 text-center font-medium">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-black text-navy italic">
                    ${item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
