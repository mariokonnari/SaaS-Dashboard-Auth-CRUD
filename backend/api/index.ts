import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

dotenv.config();

// Fail fast if required env vars are missing — catches misconfigured deployments immediately
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET", "REFRESH_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

import authRoutes from "../src/routes/authRoutes";
import adminUserRoutes from "../src/routes/adminUserRoutes";
import adminInvoiceRoutes from "../src/routes/adminInvoiceRoutes";
import adminProductRoutes from "../src/routes/adminProductRoutes";
import userProductRoutes from "../src/routes/userProductRoutes";
import userInvoiceRoutes from "../src/routes/userInvoiceRoutes";
import settingsRoute from "../src/routes/settingsRoutes";
import { requireAuth, requireRole } from "../src/middleware/authMiddleware";

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://saasdashboarddemo.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Request logging ───────────────────────────────────────────────────────────
// 'tiny' format: method, URL, status, response time — enough for debugging without noise
app.use(morgan("tiny"));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limit on auth endpoints to block brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// General API limit — generous enough for normal use
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", requireAuth, requireRole("ADMIN"), adminUserRoutes);
app.use("/api/admin/invoices", requireAuth, requireRole("ADMIN"), adminInvoiceRoutes);
app.use("/api/admin/products", requireAuth, requireRole("ADMIN"), adminProductRoutes);
app.use("/api/user/products", requireAuth, requireRole("USER"), userProductRoutes);
app.use("/api/user/invoices", requireAuth, requireRole("USER"), userInvoiceRoutes);
app.use("/api/user/settings", requireAuth, settingsRoute);

// ── Health check ──────────────────────────────────────────────────────────────
// Returns uptime and timestamp so uptime monitors can verify the service is alive
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

export default app;
