import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "../src/routes/authRoutes";
import { requireAuth, requireRole } from "../src/middleware/authMiddleware";
import adminUserRoutes from "../src/routes/adminUserRoutes";
import adminInvoiceRoutes from "../src/routes/adminInvoiceRoutes";
import adminProductRoutes from "../src/routes/adminProductRoutes";
import userProductRoutes from "../src/routes/userProductRoutes";
import userInvoiceRoutes from "../src/routes/userInvoiceRoutes";
import settingsRoute from "../src/routes/settingsRoutes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://saasdashboarddemo.netlify.app"
    ],
    credentials: true
  })
);
app.use(helmet());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin/users", requireAuth, requireRole("ADMIN"), adminUserRoutes);
app.use("/api/admin/invoices", requireAuth, requireRole("ADMIN"), adminInvoiceRoutes);
app.use("/api/admin/products", requireAuth, requireRole("ADMIN"), adminProductRoutes);
app.use("/api/user/products", requireAuth, requireRole("USER"), userProductRoutes);
app.use("/api/user/invoices", requireAuth, requireRole("USER"), userInvoiceRoutes);
app.use("/api/user/settings", requireAuth, settingsRoute);

// TEST ROUTE (CRITICAL)
app.get("/api", (req, res) => {
  res.send("API is running");
});

export default app;
