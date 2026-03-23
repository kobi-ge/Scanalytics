import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useStore } from '../store/useStore';
import { mockApi } from '../services/mockApi';
import "../App.css"

export default function Register() {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    username: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // וולידציה בסיסית לצד לקוח
    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים.');
      return;
    }

    setLoading(true);
    try {
      const userData = await mockApi.register(formData);
      setUser(userData);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">יצירת חשבון חדש</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">שם מלא</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">אימייל</label>
          <input 
            type="email" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">שם משתמש</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">סיסמה</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 font-bold transition"
        >
          {loading ? 'יוצר חשבון...' : 'הירשם עכשיו'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        כבר רשום? <Link to="/login" className="text-blue-600 hover:underline">היכנס כאן</Link>
      </p>
    </div>
  );
}