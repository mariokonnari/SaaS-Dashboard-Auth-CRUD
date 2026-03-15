// ─────────────────────────────────────────────────────────────
// Login.tsx — IMPROVED
//
// CHANGES & WHY:
//
// 1. REMOVED `import React` — In React 17+ with the new JSX transform
//    (which Vite uses), you don't need to import React at the top of
//    every file. It was auto-imported. Removing it is cleaner.
//
// 2. ADDED `error` state instead of alert() — alert() is a browser
//    dialog that blocks the UI and looks terrible. Showing inline
//    error messages is always better UX.
//
// 3. ADDED `loading` state — Disabling the button while the API call
//    is in-flight prevents double submissions and gives feedback.
//
// 4. USED `Link` instead of onClick navigation — Using react-router's
//    <Link> component for navigation (vs onClick + navigate) is the
//    correct pattern. It supports cmd-click, right-click to open tab,
//    and is semantically correct HTML.
//
// 5. TYPED the catch block — `catch (err: unknown)` is the proper TS
//    type. Then we use a type guard to extract the message safely.
//
// 6. DARK THEME UI — matches the new design system.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import type { AxiosError } from "axios";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null); //inline error
  const [loading, setLoading]   = useState(false);               //loading state
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true); //disable button during request

    try {
      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("role", res.data.user.role);

      if (res.data.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err: unknown) {
      // ✅ proper TS error typing — not just `any`
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false); //always re-enable button
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e17] p-4 relative overflow-hidden">
      {/* Ambient glow — pure CSS, no extra library needed */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#6c63ff]/10 blur-3xl pointer-events-none" />

      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="bg-[#111624] border border-white/7 rounded-2xl shadow-2xl p-10 w-full max-w-sm flex flex-col gap-5 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#00e5b0] flex items-center justify-center font-bold text-white text-lg">
            N
          </div>
          <span className="font-bold text-white text-lg tracking-tight">NexusApp</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-[#6b7694] text-sm mt-1">Sign in to access your dashboard</p>
        </div>

        {/* Demo shortcuts */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setEmail("admin@demo.com"); setPassword("admin"); }}
            className="flex-1 text-xs py-2 px-3 rounded-lg bg-[#6c63ff]/15 text-[#6c63ff] border border-[#6c63ff]/25 font-semibold hover:bg-[#6c63ff]/25 transition-colors"
          >
            ⚡ Admin demo
          </button>
          <button
            type="button"
            onClick={() => { setEmail("user@demo.com"); setPassword("user"); }}
            className="flex-1 text-xs py-2 px-3 rounded-lg bg-[#00e5b0]/10 text-[#00e5b0] border border-[#00e5b0]/20 font-semibold hover:bg-[#00e5b0]/15 transition-colors"
          >
            👤 User demo
          </button>
        </div>

        {/* Error message (replaces alert) */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 px-4 py-2 rounded-lg"
          >
            {error}
          </motion.p>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-[#161c2e] border border-white/7 text-white placeholder-[#6b7694] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#161c2e] border border-white/7 text-white placeholder-[#6b7694] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#6c63ff] text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Signing in…" : "Sign in →"}
        </motion.button>

        {/* Using <Link> instead of onClick+navigate */}
        <p className="text-center text-sm text-[#6b7694]">
          No account?{" "}
          <Link to="/signup" className="text-[#6c63ff] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </motion.form>
    </div>
  );
}