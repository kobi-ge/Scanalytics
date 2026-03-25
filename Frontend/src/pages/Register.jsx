// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../services/api';
import { useStore } from '../store/useStore';

export default function Register() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore(state => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // הנתיב המדויק בשרת של השותף
      const response = await api.post('/auth/register', formData);
      
      // שמירת הטוקן ועדכון המשתמש בסטייט
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user); // וודא שהשרת מחזיר אובייקט user ב-register
      useStore.getState().fetchInsightsData();

      alert("נרשמת בהצלחה! ברוך הבא.");
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בתהליך ההרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 border rounded-xl shadow-lg" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">יצירת חשבון</h2>
      {error && <p className="bg-red-50 text-red-500 p-3 rounded mb-4 text-center text-sm font-medium border border-red-200">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600 mr-1">שם מלא</label>
          <input 
            type="text" 
            placeholder='ישראל ישראלי' 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setFormData({...formData, fullName: e.target.value})} 
            required 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600 mr-1">אימייל</label>
          <input 
            type="email" 
            placeholder='you@example.com' 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600 mr-1">סיסמה</label>
          <input 
            type="password" 
            placeholder='מינימום 6 תווים' 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
          />
        </div>
        <button 
          disabled={loading}
          className="w-full bg-green-600 text-white p-2.5 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'יוצר חשבון...' : 'הירשם עכשיו'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 border-t pt-4">
        כבר יש לך חשבון?{' '}
        <Link to="/login" className="text-blue-600 font-bold hover:underline">
          התחבר כאן
        </Link>
      </div>
    </div>
  );
}