import { useStore } from '../store/useStore';
import ReceiptCard from '../components/ReceiptCard';
import { Link } from 'react-router';
import "../App.css"

export default function Dashboard() {
  const { user, receipts } = useStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-gradient-to-l from-[#967f4a] to-[#c4ad7a] p-8 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-black">שלום {user?.fullName}!</h1>
          <p className="opacity-90 mt-1">ריכזנו עבורך את כל הרכישות והנתונים הפיננסיים שלך.</p>
        </div>
        <div className="text-left bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
          <p className="text-sm opacity-80 uppercase font-bold tracking-wider">סה"כ הוצאות</p>
          <span className="text-4xl font-black">₪{user?.totalExpenses?.toLocaleString()}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/upload" className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition">📸</span>
          <span className="font-bold text-gray-700">סרוק קבלה</span>
        </Link>
        <Link to="/manual" className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition">✍️</span>
          <span className="font-bold text-gray-700">הזנה ידנית</span>
        </Link>
        <Link to="/statistics" className="flex flex-col items-center p-4 bg-white border rounded-xl hover:bg-blue-50 transition group">
          <span className="text-2xl mb-2 group-hover:scale-110 transition">📊</span>
          <span className="font-bold text-gray-700">ניתוח נתונים</span>
        </Link>
        <div className="flex flex-col items-center p-4 bg-white border rounded-xl">
          <span className="text-2xl mb-2 italic font-serif">#</span>
          <span className="font-bold text-gray-700">{receipts.length} קבלות</span>
        </div>
      </div>

      {/* Receipts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mr-2">קבלות אחרונות</h2>
        {receipts.length === 0 ? (
          <div className="text-center p-20 bg-gray-50 border border-dashed rounded-2xl">
            <p className="text-gray-400">עדיין לא הועלו קבלות למערכת.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receipts.map(receipt => (
              <ReceiptCard key={receipt.receipt_id} receipt={receipt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}