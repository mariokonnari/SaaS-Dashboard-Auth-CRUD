import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import type { AxiosError } from "axios";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("role", res.data.user.role);
      navigate(res.data.user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Logo mark */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#3b82f6] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-[#fafafa] text-sm tracking-tight">Nexus</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#fafafa] mb-1">Sign in</h1>
          <p className="text-sm text-[#71717a]">Welcome back. Enter your credentials to continue.</p>
        </div>

        {/* Demo shortcuts */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setEmail("admin@demo.com"); setPassword("admin"); }}
            className="flex-1 text-xs py-2 px-3 rounded-lg border border-[#27272a] bg-[#111113] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46] transition-colors font-medium"
          >
            Admin demo
          </button>
          <button
            type="button"
            onClick={() => { setEmail("user@demo.com"); setPassword("user"); }}
            className="flex-1 text-xs py-2 px-3 rounded-lg border border-[#27272a] bg-[#111113] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46] transition-colors font-medium"
          >
            User demo
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/20 px-3 py-2.5 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full bg-[#111113] border border-[#27272a] text-[#fafafa] placeholder-[#52525b] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#111113] border border-[#27272a] text-[#fafafa] placeholder-[#52525b] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        <p className="text-center text-sm text-[#71717a] mt-6">
          No account?{" "}
          <Link to="/signup" className="text-[#fafafa] hover:text-[#3b82f6] transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
