// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../services/api";
import { useStore } from "../store/useStore";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // החזרנו את הסטייט
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      useStore.getState().fetchInsightsData();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "פרטי התחברות שגויים");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 border rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">התחברות</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="אימייל"
          className="w-full p-2 border rounded"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="סיסמה"
          className="w-full p-2 border rounded"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "היכנס"}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600 border-t pt-4">
        אין לך חשבון?{" "}
        <Link
          to="/register"
          className="text-blue-600 font-bold hover:underline"
        >
          צור חשבון חדש כאן
        </Link>
      </div>
    </div>
  );
}
