import { Link, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import "../App.css"

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-black text-blue-700 tracking-tighter"><img src="../public/logo with name.png" className="h-16 w-auto" alt="Logo" /></Link>
          <div className="hidden md:flex gap-6 text-gray-600 font-medium">
            <Link to="/" className="hover:text-blue-600">דשבורד</Link>
            <Link to="/statistics" className="hover:text-blue-600">סטטיסטיקות</Link>
            <Link to="/upload" className="hover:text-blue-600">סריקת קבלה</Link>
            <Link to="/manual" className="hover:text-blue-600">הזנה ידנית</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-left hidden sm:block">
            <p className="text-xs text-gray-500 font-bold">שלום, {user?.fullName}</p>
            <p className="text-xs text-green-600">₪{user?.totalExpenses?.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-red-50 hover:text-red-600 transition"
          >
            התנתק
          </button>
        </div>
      </div>
    </nav>
  );
}