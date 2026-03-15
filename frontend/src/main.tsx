// ─────────────────────────────────────────────────────────────
// main.tsx — UPDATED
//
// CHANGE: Wrap the app in <ToastProvider> so every component can
// call useToast() to show notifications and confirmation dialogs.
//
// This is the ONLY change needed here — everything else stays the same.
// ─────────────────────────────────────────────────────────────

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/i18n";
import { ToastProvider } from "./components/Toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);