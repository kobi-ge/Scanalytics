import { useState } from 'react';
import api from '../services/api';

const CATEGORIES = [
  "Fashion & Apparel", "Home & Furniture", "Health & Beauty",
  "Leisure & Hobbies", "Food & Groceries", "Electronics & Gadgets", "General"
];

export default function ManualEntry() {
  const [receipt, setReceipt] = useState({
    store: '',
    purchase_date: '',
    total_price: 0,
    items: []
  });

  const handleAddItem = () => {
    setReceipt({
      ...receipt,
      items: [...receipt.items, { name: '', quantity: 1, price: 0, category: 'General' }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/receipts/manual', receipt);
      console.log('Receipt saved successfully:', response.data);
      // כאן ניתן להוסיף חיווי הצלחה למשתמש ואיפוס של הטופס
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };

  return (
    <div>
      <h2>הזנת קבלה ידנית</h2>
      {/* כאן ייכנסו שדות האינפוט עבור החנות, התאריך והסכום הכולל */}
      
      <button onClick={handleAddItem}>הוסף מוצר</button>
      <button onClick={handleSubmit}>שמור קבלה</button>
    </div>
  );
}