import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen, title, description, confirmLabel = "Delete", onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative z-10 w-full max-w-sm rounded-xl p-6 shadow-2xl bg-[#111113] border border-[#27272a]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mb-4">
              <AlertTriangle size={16} className="text-[#ef4444]" />
            </div>
            <h2 className="text-base font-semibold text-[#fafafa] mb-1.5">{title}</h2>
            <p className="text-sm text-[#71717a] mb-6 leading-relaxed">{description}</p>
            <div className="flex gap-3">
              <button onClick={onCancel}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#71717a] border border-[#27272a] hover:border-[#3f3f46] hover:text-[#fafafa] transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-[#ef4444] hover:bg-[#dc2626] transition-colors">
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
