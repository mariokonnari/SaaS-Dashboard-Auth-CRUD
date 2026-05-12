import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

dotenv.config();

const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET", "REFRESH_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

import authRoutes from "./routes/authRoutes";
import adminUserRoutes from "./routes/adminUserRoutes";
import adminInvoiceRoutes from "./routes/adminInvoiceRoutes";
import adminProductRoutes from "./routes/adminProductRoutes";
import userProductRoutes from "./routes/userProductRoutes";
import userInvoiceRoutes from "./routes/userInvoiceRoutes";
import settingsRoute from "./routes/settingsRoutes";
import { requireAuth, requireRole } from "./middleware/authMiddleware";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://saasdashboarddemo.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("tiny"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/admin/users", requireAuth, requireRole("ADMIN"), adminUserRoutes);
app.use("/api/admin/invoices", requireAuth, requireRole("ADMIN"), adminInvoiceRoutes);
app.use("/api/admin/products", requireAuth, requireRole("ADMIN"), adminProductRoutes);
app.use("/api/user/products", requireAuth, requireRole("USER"), userProductRoutes);
app.use("/api/user/invoices", requireAuth, requireRole("USER"), userInvoiceRoutes);
app.use("/api/user/settings", requireAuth, settingsRoute);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

export default app;
