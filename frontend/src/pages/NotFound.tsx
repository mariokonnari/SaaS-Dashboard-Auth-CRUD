import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-sm"
      >
        <p className="text-[120px] font-black text-[#27272a] leading-none select-none mb-6">
          404
        </p>
        <h1 className="text-2xl font-semibold text-[#fafafa] mb-2">Page not found</h1>
        <p className="text-sm text-[#71717a] mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors">
          ← Back to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
