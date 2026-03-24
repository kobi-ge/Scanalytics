import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useStore } from "./store/useStore";
import api from "./services/api";

// ייבוא קומפוננטות
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadReceipt from "./pages/UploadReceipt";
import ManualEntry from "./pages/ManualEntry";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";

const PrivateRoute = ({ children }) => {
  const { user } = useStore();
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  const { user, setUser, logout } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await api.get("/users/me");
          setUser(response.data);
        } catch (err) {
          logout();
        }
      }
      setIsInitializing(false);
    };
    checkAuth();
  }, [setUser, logout]);

  if (isInitializing)
    return (
      <div className="h-screen bg-navy flex items-center justify-center text-gold font-bold">
        טוען מערכת...
      </div>
    );

  return (
    <BrowserRouter>
      <div
        className="min-h-screen bg-[#f1f5f9] flex flex-row-reverse"
        dir="rtl"
      >
        <div className="flex-1 flex flex-col min-w-0">
          {/* נבבר עליון (Header) */}
          {user && <Navbar />}

          <main className="p-8 overflow-y-auto">
            <Routes>
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/" />}
              />
              <Route
                path="/register"
                element={!user ? <Register /> : <Navigate to="/" />}
              />

              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <PrivateRoute>
                    <UploadReceipt />
                  </PrivateRoute>
                }
              />
              <Route
                path="/manual"
                element={
                  <PrivateRoute>
                    <ManualEntry />
                  </PrivateRoute>
                }
              />
              <Route
                path="/statistics"
                element={
                  <PrivateRoute>
                    <Statistics />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
