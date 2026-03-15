// ─────────────────────────────────────────────────────────────
// Signup.tsx — IMPROVED + REDESIGNED
//
// CHANGES & WHY:
//
// 1. REPLACED ALL alert() WITH inline error state — same as Login
//
// 2. ADDED password strength indicator — visual feedback as you
//    type helps users create a stronger password without guessing
//    what the rules are
//
// 3. ADDED loading state — disables the button during the API call
//
// 4. USED <Link> instead of onClick + navigate for the login link
//
// 5. TYPED catch block properly — no more `err: any`
//
// 6. DARK THEME — matches Login, Dashboard, and all other pages
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { AxiosError } from "axios";
import api from "../api/axios";

const MIN_PASSWORD_LENGTH = 6;

// Password strength helper — returns 0-3
function getPasswordStrength(pw: string): number {
  if (pw.length === 0)  return 0;
  if (pw.length < MIN_PASSWORD_LENGTH) return 1;
  const hasUpper   = /[A-Z]/.test(pw);
  const hasNumber  = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const extras = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  return extras >= 2 ? 3 : extras === 1 ? 2 : 1;
}

const STRENGTH_CONFIG = [
  { label: "",         color: "bg-white/10" },
  { label: "Weak",     color: "bg-[#ff6b6b]" },
  { label: "Fair",     color: "bg-[#ffd166]" },
  { label: "Strong",   color: "bg-[#00e5b0]" },
];

const inputClass =
  "w-full bg-[#161c2e] border border-white/7 text-white placeholder-[#6b7694] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#6c63ff] transition-colors";

export default function Signup() {
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState<string | null>(null);
  const [loading,         setLoading]         = useState(false);
  const navigate = useNavigate();

  const strength    = getPasswordStrength(password);
  const strengthCfg = STRENGTH_CONFIG[strength];

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Frontend validation — inline, not alert()
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/signup", { email, password });
      // No alert() — navigate directly to login with a success flag
      navigate("/login", { state: { signupSuccess: true } });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e17] p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#6c63ff]/10 blur-3xl pointer-events-none" />

      <motion.form
        onSubmit={handleSignup}
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
          <span className="font-bold text-white text-lg tracking-tight">Dashboard Demo App</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-[#6b7694] text-sm mt-1">Sign up to access your dashboard</p>
        </div>

        {/* Inline error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm px-4 py-2 rounded-lg"
              style={{
                color: "#ff6b6b",
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.2)",
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputClass}
            />
            {/* Password strength bar — only shows after typing */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        strength >= level ? strengthCfg.color : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                {strengthCfg.label && (
                  <p className="text-xs" style={{
                    color: strength === 1 ? "#ff6b6b" : strength === 2 ? "#ffd166" : "#00e5b0"
                  }}>
                    {strengthCfg.label} password
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`${inputClass} ${
                confirmPassword.length > 0 && confirmPassword !== password
                  ? "border-[#ff6b6b]/50"
                  : ""
              }`}
            />
            {/* Live mismatch feedback */}
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <p className="text-xs text-[#ff6b6b] mt-1">Passwords don't match</p>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ opacity: 0.88 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#6c63ff] text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Creating account…" : "Create account →"}
        </motion.button>

        {/* <Link> instead of onClick + navigate */}
        <p className="text-center text-sm text-[#6b7694]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#6c63ff] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}