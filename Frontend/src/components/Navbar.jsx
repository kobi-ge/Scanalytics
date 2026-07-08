import { useState } from "react"; // הוספנו useState
import { Link, useNavigate } from "react-router";
import { useStore } from "../store/useStore";
import { Menu, X } from "lucide-react"; // אייקונים לתפריט מובייל
import "../App.css";

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // סטייט לתפריט מובייל

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // פונקציית עזר לסגירת התפריט בלחיצה על לינק
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-[#0f1924] border-b border-[#c7ae75]/20 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="tracking-tighter">
            <img src="white.png" className="h-12 md:h-16 w-auto" alt="Logo" />
          </Link>

          {/* תפריט דסקטופ (נשאר בדיוק כפי שהיה) */}
          <div className="hidden md:flex gap-6 text-[#c7ae75] font-medium">
            <Link to="/" className="hover:text-[#ffffff] transition-colors">
              דף הבית
            </Link>
            <Link
              to="/statistics"
              className="hover:text-[#ffffff] transition-colors"
            >
              סטטיסטיקות
            </Link>
            <Link
              to="/receipts"
              className="hover:text-[#ffffff] transition-colors"
            >
              קבלות
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left hidden sm:block">
            <p className="text-xs text-[#967f4a] font-bold">
              שלום, {user?.fullName}
            </p>
            <p className="text-xs text-green-400 font-mono">
              ${user?.totalExpenses?.toLocaleString()}
            </p>
          </div>

          {/* כפתור התנתקות (דסקטופ) */}
          <button
            onClick={handleLogout}
            className="hidden md:block bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-red-50 hover:text-red-600 transition"
          >
            התנתק
          </button>

          {/* כפתור המבורגר למובייל (יוצג רק במסכים קטנים) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#c7ae75] hover:text-white transition-colors"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* תפריט מובייל (Dropdown) - נפתח רק כש-isMenuOpen אמת */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0f1924] border-t border-[#c7ae75]/10 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-4 space-y-4 text-center">
            <Link
              to="/"
              onClick={closeMenu}
              className="text-[#c7ae75] hover:text-white font-bold py-2 border-b border-white/5"
            >
              דף הבית
            </Link>
            <Link
              to="/statistics"
              onClick={closeMenu}
              className="text-[#c7ae75] hover:text-white font-bold py-2 border-b border-white/5"
            >
              סטטיסטיקות
            </Link>
            <Link
              to="/receipts"
              onClick={closeMenu}
              className="text-[#c7ae75] hover:text-white font-bold py-2 border-b border-white/5"
            >
              קבלות
            </Link>

            <div className="pt-4 border-t border-[#c7ae75]/20">
              
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 text-red-500 py-2 rounded-lg font-bold"
              >
                התנתק מהמערכת
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
