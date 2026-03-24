import { useState } from 'react';
import { useStore } from '../store/useStore';
import { mockApi } from '../services/mockApi';
import { useNavigate } from 'react-router';
import "../App.css"

const CATEGORIES = ["Fashion & Apparel", "Home & Furniture", "Health & Beauty", "Leisure & Hobbies", "Food & Groceries", "Electronics & Gadgets", "General"];

export default function ManualEntry() {
  const user = useStore(state => state.user);
  const addReceipt = useStore(state => state.addReceipt);
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState({
    store: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_price: 0,
    "Payment type": 'cash',
    items: []
  });

  const addItem = () => {
    setReceipt({
      ...receipt,
      items: [...receipt.items, { name: '', quantity: 1, price: 0, category: 'General' }]
    });
  };

  // פונקציה חדשה למחיקת פריט מהרשימה
  const removeItem = (index) => {
    const newItems = receipt.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    setReceipt({ ...receipt, items: newItems, total_price: newTotal });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...receipt.items];
    newItems[index][field] = (field === 'price' || field === 'quantity') ? Number(value) : value;
    
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    setReceipt({ ...receipt, items: newItems, total_price: newTotal });
  };

  const handleSave = async () => {
    if (!receipt.store || receipt.items.length === 0) {
      alert("נא למלא שם חנות ולהוסיף לפחות פריט אחד.");
      return;
    }
    try {
      const saved = await mockApi.saveReceipt({ ...receipt, receipt_id: `man_${Date.now()}` }, user.id);
      addReceipt(saved);
      navigate('/');
    } catch (err) {
      alert("שגיאה בשמירת הנתונים.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md border mt-10" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-800">הזנת קבלה ידנית</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">שם החנות</label>
          <input 
            placeholder="לדוגמה: מחסני חשמל" 
            className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={receipt.store} 
            onChange={e => setReceipt({...receipt, store: e.target.value})} 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">תאריך רכישה</label>
          <input 
            type="date" 
            className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={receipt.purchase_date} 
            onChange={e => setReceipt({...receipt, purchase_date: e.target.value})} 
          />
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4 text-gray-700">פירוט מוצרים</h3>
      
      <div className="space-y-3">
        {receipt.items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
            
            {/* שם המוצר */}
            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="text-[11px] font-bold text-gray-400">שם המוצר</label>
              <input 
                placeholder="שם הפריט" 
                className="p-2 border rounded bg-white text-sm focus:border-blue-400 outline-none"
                value={item.name} 
                onChange={e => handleItemChange(idx, 'name', e.target.value)} 
              />
            </div>

            {/* כמות */}
            <div className="flex flex-col gap-1 md:col-span-1">
              <label className="text-[11px] font-bold text-gray-400 text-center">כמות</label>
              <input 
                type="number" 
                min="1"
                className="p-2 border rounded bg-white text-sm text-center focus:border-blue-400 outline-none"
                value={item.quantity} 
                onChange={e => handleItemChange(idx, 'quantity', e.target.value)} 
              />
            </div>

            {/* מחיר ליחידה */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] font-bold text-gray-400 text-center">מחיר ליחידה</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="p-2 border rounded bg-white text-sm text-center focus:border-blue-400 outline-none"
                value={item.price} 
                onChange={e => handleItemChange(idx, 'price', e.target.value)} 
              />
            </div>

            {/* קטגוריה - הורחב משמעותית */}
            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="text-[11px] font-bold text-gray-400">קטגוריה</label>
              <select 
                className="p-2 border rounded bg-white text-sm focus:border-blue-400 outline-none w-full"
                value={item.category} 
                onChange={e => handleItemChange(idx, 'category', e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* סה"כ לשורה */}
            <div className="flex flex-col gap-1 md:col-span-2 text-center">
              <label className="text-[11px] font-bold text-gray-400">סה"כ פריט</label>
              <div className="p-2 font-bold text-blue-700 bg-blue-50 rounded border border-blue-100 text-sm">
                ₪{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>

            {/* כפתור מחיקה */}
            <div className="md:col-span-1 flex justify-center pb-1">
              <button 
                onClick={() => removeItem(idx)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="מחק פריט"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

          </div>
        ))}
      </div>

      <button 
        onClick={addItem} 
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
      >
        <span className="text-xl">+</span> הוסף מוצר לקבלה
      </button>
      
      <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">סכום הקבלה הסופי</span>
          <span className="text-4xl font-black text-blue-900">₪{receipt.total_price.toLocaleString()}</span>
        </div>
        <button 
          onClick={handleSave} 
          className="w-full md:w-auto bg-green-600 text-white px-12 py-4 rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg transform hover:-translate-y-1"
        >
          שמור קבלה במערכת
        </button>
      </div>
    </div>
  );
}