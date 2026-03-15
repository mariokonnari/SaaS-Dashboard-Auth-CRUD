// ─────────────────────────────────────────────────────────────
// src/components/Toast.tsx
//
// WHY THIS EXISTS:
// Every page was using alert() and confirm() — browser-native dialogs
// that block the UI, look terrible, and can't be styled. This gives
// you a proper toast notification system and a clean confirmation
// dialog that match the dark theme.
//
// HOW TO USE:
//
// 1. Wrap your app in <ToastProvider> in main.tsx:
//    <ToastProvider><App /></ToastProvider>
//
// 2. In any component:
//    const { toast, confirm } = useToast();
//
//    // Show a notification:
//    toast.success("Product created!");
//    toast.error("Something went wrong.");
//    toast.info("Changes saved.");
//
//    // Replace confirm() dialogs:
//    const ok = await confirm("Delete this product?", "This cannot be undone.");
//    if (ok) await productService.remove(id);
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";

interface ToastItem {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ConfirmState {
  open:    boolean;
  title:   string;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error:   (message: string) => void;
    info:    (message: string) => void;
  };
  confirm: (title: string, message?: string) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Config ───────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: "✓", color: "#00e5b0", bg: "rgba(0,229,176,0.10)",   border: "rgba(0,229,176,0.25)"   },
  error:   { icon: "✕", color: "#ff6b6b", bg: "rgba(255,107,107,0.10)", border: "rgba(255,107,107,0.25)" },
  info:    { icon: "ℹ", color: "#6c63ff", bg: "rgba(108,99,255,0.10)",  border: "rgba(108,99,255,0.25)"  },
};

// ─── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts,       setToasts]       = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false, title: "", message: "", resolve: null,
  });
  const counterRef = useRef(0);

  // Add a toast and auto-remove after 3.5s
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, "success"),
    error:   (msg: string) => addToast(msg, "error"),
    info:    (msg: string) => addToast(msg, "info"),
  };

  // Returns a Promise<boolean> — awaitable like the old confirm()
  const confirm = useCallback((title: string, message = ""): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, title, message, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    confirmState.resolve?.(result);
    setConfirmState({ open: false, title: "", message: "", resolve: null });
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ── Toast stack (bottom-right) ── */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const cfg = TOAST_CONFIG[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: 8,   scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium pointer-events-auto shadow-xl"
                style={{
                  background:  cfg.bg,
                  border:      `1px solid ${cfg.border}`,
                  color:       cfg.color,
                  backdropFilter: "blur(12px)",
                  minWidth: "260px",
                  maxWidth: "380px",
                }}
              >
                {/* Icon circle */}
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: cfg.border, color: cfg.color }}
                >
                  {cfg.icon}
                </span>
                <span className="text-white/90">{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Confirm dialog (replaces browser confirm()) ── */}
      <AnimatePresence>
        {confirmState.open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
              onClick={() => handleConfirmResult(false)}
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0   }}
              exit={{    opacity: 0, scale: 0.92, y: 8   }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-full max-w-sm"
            >
              <div
                className="rounded-2xl p-6 shadow-2xl"
                style={{ background: "#111624", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Warning icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
                  style={{ background: "rgba(255,107,107,0.10)" }}
                >
                  🗑️
                </div>

                <h3 className="text-white font-bold text-lg mb-2">{confirmState.title}</h3>

                {confirmState.message && (
                  <p className="text-[#6b7694] text-sm mb-6">{confirmState.message}</p>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleConfirmResult(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#6b7694] border border-white/7 hover:border-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmResult(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: "#ff6b6b" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}