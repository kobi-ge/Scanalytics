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

  const handleItemChange = (index, field, value) => {
    const newItems = [...receipt.items];
    newItems[index][field] = value;
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
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border mt-10">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">הזנת קבלה ידנית</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input 
          placeholder="שם החנות" 
          className="p-2 border rounded"
          value={receipt.store} 
          onChange={e => setReceipt({...receipt, store: e.target.value})} 
        />
        <input 
          type="date" 
          className="p-2 border rounded"
          value={receipt.purchase_date} 
          onChange={e => setReceipt({...receipt, purchase_date: e.target.value})} 
        />
      </div>

      <div className="space-y-3">
        {receipt.items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
            <input 
              placeholder="מוצר" 
              className="flex-1 p-1 border rounded text-sm"
              value={item.name} 
              onChange={e => handleItemChange(idx, 'name', e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="מחיר" 
              className="w-20 p-1 border rounded text-sm"
              value={item.price} 
              onChange={e => handleItemChange(idx, 'price', e.target.value)} 
            />
            <select 
              className="p-1 border rounded text-sm"
              value={item.category} 
              onChange={e => handleItemChange(idx, 'category', e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        ))}
      </div>

      <button onClick={addItem} className="mt-4 text-blue-600 font-medium hover:text-blue-800">+ הוסף פריט</button>
      
      <div className="mt-8 pt-4 border-t flex justify-between items-center">
        <span className="text-xl font-bold text-gray-700">סה"כ לתשלום: ₪{receipt.total_price}</span>
        <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold">
          שמור קבלה
        </button>
      </div>
    </div>
  );
}