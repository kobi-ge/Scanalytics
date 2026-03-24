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
    <nav className="bg-[#0f1924] border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="tracking-tighter"><img src="../public/white.png" className="h-16 w-auto" alt="Logo" /></Link>
          <div className="hidden md:flex gap-6 text-[#c7ae75] font-medium">
            <Link to="/" className="hover:text-[#ffffff]">דשבורד</Link>
            <Link to="/statistics" className="hover:text-[#ffffff]">סטטיסטיקות</Link>
            <Link to="/upload" className="hover:text-[#ffffff]">סריקת קבלה</Link>
            <Link to="/manual" className="hover:text-[#ffffff]">הזנה ידנית</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-left hidden sm:block">
            <p className="text-xs text-[#967f4a] font-bold">שלום, {user?.fullName}</p>
            <p className="text-xs text-green-400">₪{user?.totalExpenses?.toLocaleString()}</p>
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