import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { AxiosError } from "axios";
import api from "../api/axios";

const MIN_PW = 6;

function strength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  if (pw.length < MIN_PW) return 1;
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  return score >= 2 ? 3 : score === 1 ? 2 : 1;
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Strong"] as const;
const STRENGTH_COLOR = ["", "#ef4444", "#f59e0b", "#10b981"] as const;

const inputClass =
  "w-full bg-[#111113] border border-[#27272a] text-[#fafafa] placeholder-[#52525b] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-colors";

export default function Signup() {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  const pw = strength(password);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PW) { setError(`Password must be at least ${MIN_PW} characters.`); return; }
    if (password !== confirm)      { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.post("/auth/signup", { email, password });
      navigate("/login", { state: { signupSuccess: true } });
    } catch (err: unknown) {
      const e = err as AxiosError<{ message: string }>;
      setError(e.response?.data?.message ?? "Signup failed. Please try again.");
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
          <h1 className="text-2xl font-semibold text-[#fafafa] mb-1">Create account</h1>
          <p className="text-sm text-[#71717a]">Get started — it only takes a few seconds.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/20 px-3 py-2.5 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" required className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required className={inputClass} />
            {password.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((l) => (
                    <div key={l} className="h-1 flex-1 rounded-full transition-colors duration-300"
                      style={{ background: pw >= l ? STRENGTH_COLOR[pw] : "#27272a" }} />
                  ))}
                </div>
                {pw > 0 && (
                  <p className="text-xs" style={{ color: STRENGTH_COLOR[pw] }}>
                    {STRENGTH_LABEL[pw]} password
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" required
              className={`${inputClass} ${confirm.length > 0 && confirm !== password ? "border-[#ef4444]/50 focus:ring-[#ef4444]" : ""}`}
            />
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs text-[#ef4444]">Passwords don't match</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-[#71717a] mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#fafafa] hover:text-[#3b82f6] transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
