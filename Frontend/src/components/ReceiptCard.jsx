import { useState } from "react";
import { useStore } from "../store/useStore";
import "../App.css"

export default function ReceiptCard({ receipt }) {
  const [isOpen, setIsOpen] = useState(false);
  const deleteReceipt = useStore((state) => state.deleteReceipt);

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex justify-between items-center bg-gray-50 border-b">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{receipt.store}</h3>
          <p className="text-xs text-gray-500">{receipt.purchase_date}</p>
        </div>
        <div className="text-left">
          <span className="text-xl font-black text-blue-600">
            ₪{receipt.total_price}
          </span>
          <p className="text-[10px] text-gray-400 uppercase">
            {receipt["Payment type"]}
          </p>
        </div>
      </div>

      <div className="p-4 flex justify-between items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          {isOpen ? "סגור פירוט" : `הצג ${receipt.items.length} מוצרים`}
        </button>
        <button
          onClick={() => {
            if (window.confirm("למחוק קבלה זו?"))
              deleteReceipt(receipt.receipt_id);
          }}
          className="text-xs text-red-400 hover:text-red-600 transition"
        >
          מחק
        </button>
      </div>

      {isOpen && (
        <div className="bg-blue-50/30 p-4 border-t space-y-2">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-gray-500 border-b border-blue-100">
                <th className="pb-1 font-semibold">מוצר</th>
                <th className="pb-1 font-semibold text-center">כמות</th>
                <th className="pb-1 font-semibold text-left">מחיר</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, idx) => (
                <tr key={idx} className="border-b border-blue-50 last:border-0">
                  <td className="py-2">
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-left">₪{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
