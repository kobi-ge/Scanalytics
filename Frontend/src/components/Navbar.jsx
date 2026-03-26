import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useStore } from "../store/useStore";
import { Menu, X } from "lucide-react"; // Mobile menu icons
import "../App.css";

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper function to close menu on link click
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-[#0f1924] border-b border-[#c7ae75]/20 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="tracking-tighter">
            <img src="white.png" className="h-12 md:h-16 w-auto" alt="Logo" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 text-[#c7ae75] font-medium">
            <Link to="/" className="hover:text-[#ffffff] transition-colors">
              Dashboard
            </Link>
            <Link
              to="/statistics"
              className="hover:text-[#ffffff] transition-colors"
            >
              Statistics
            </Link>
            <Link
              to="/upload"
              className="hover:text-[#ffffff] transition-colors"
            >
              Scan Receipt
            </Link>
            <Link
              to="/manual"
              className="hover:text-[#ffffff] transition-colors"
            >
              Manual Entry
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block border-r border-[#c7ae75]/20 pr-4">
            <p className="text-xl text-[#967f4a] font-bold">
              Hello {user?.fullName}
            </p>
          </div>

          {/* Logout button (desktop) */}
          <button
            onClick={handleLogout}
            className="hidden md:block bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-red-50 hover:text-red-600 transition"
          >
            Logout
          </button>

          {/* Mobile Hamburger Button */}
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
              Dashboard
            </Link>
            <Link
              to="/statistics"
              onClick={closeMenu}
              className="text-[#c7ae75] hover:text-white font-bold py-2 border-b border-white/5"
            >
              Statistics
            </Link>
            <Link
              to="/upload"
              onClick={closeMenu}
              className="text-[#c7ae75] hover:text-white font-bold py-2 border-b border-white/5"
            >
              Scan Receipt
            </Link>
            <Link
              to="/manual"
              onClick={closeMenu}
              className="text-[#c7ae75] hover:text-white font-bold py-2 border-b border-white/5"
            >
              Manual Entry
            </Link>

            <div className="pt-4 border-t border-[#c7ae75]/20">

              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 text-red-500 py-2 rounded-lg font-bold"
              >
                Logout from system
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
