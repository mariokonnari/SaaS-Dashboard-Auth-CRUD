import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#6c63ff]/8 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="text-center relative z-10 max-w-md"
      >
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{ background: "rgba(108,99,255,0.10)", border: "1px solid rgba(108,99,255,0.20)" }}
        >
          <span className="text-5xl font-black text-[#6c63ff]/60 leading-none select-none">
            404
          </span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-[#6b7694] mb-8 text-base leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#6c63ff" }}
        >
          ← Back to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
