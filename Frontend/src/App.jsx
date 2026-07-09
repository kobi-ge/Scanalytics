import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useStore } from "./store/useStore";
import api from "./services/api";

// ייבוא קומפוננטות
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Receipts from "./pages/Receipts";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";

const PrivateRoute = ({ children }) => {
  const { user } = useStore();
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  const { user, setUser, logout, isProcessing } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await api.get("/backend/users/me");
          setUser(response.data);
          useStore.getState().fetchInsightsData();
          useStore.getState().fetchReceiptCount();
        } catch {
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
          {user && <Navbar />}

          {isProcessing && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-gold text-navy px-8 py-4 rounded-[24px] shadow-2xl border-2 border-navy/10 font-black flex items-center gap-4 animate-in slide-in-from-top-8 duration-500">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-navy"></span>
              </div>
              <span className="tracking-tight text-lg">הנתונים שלך בעיבוד... המערכת תתעדכן אוטומטית</span>
            </div>
          )}

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
                path="/receipts"
                element={
                  <PrivateRoute>
                    <Receipts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <PrivateRoute>
                    <Navigate to="/receipts" replace />
                  </PrivateRoute>
                }
              />
              <Route
                path="/manual"
                element={
                  <PrivateRoute>
                    <Navigate to="/receipts" replace />
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
