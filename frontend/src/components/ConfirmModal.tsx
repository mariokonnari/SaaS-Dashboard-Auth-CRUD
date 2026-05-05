import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: "#111624", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.20)" }}
            >
              <span className="text-xl">🗑️</span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
            <p className="text-sm text-[#6b7694] mb-6 leading-relaxed">{description}</p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#6b7694] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: "#ff6b6b" }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
