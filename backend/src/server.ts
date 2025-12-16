import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from "./routes/authRoutes";
import { requireAuth, requireRole } from './middleware/authMiddleware';
import adminUserRoutes from "./routes/adminUserRoutes";
import adminInvoiceRoutes from "./routes/adminInvoiceRoutes";
import adminProductRoutes from "./routes/adminProductRoutes";
import userProductRoutes from "./routes/userProductRoutes";
import userInvoiceRoutes from "./routes/userInvoiceRoutes";
import settingsRoute from "./routes/settingsRoutes";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true, }));
app.use(helmet());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/admin/users", requireAuth, requireRole("ADMIN"), adminUserRoutes);
app.use("/admin/invoices", requireAuth, requireRole("ADMIN"), adminInvoiceRoutes);
app.use("/admin/products", requireAuth, requireRole("ADMIN"), adminProductRoutes);
app.use("/user/products", requireAuth, requireRole("USER"), userProductRoutes);
app.use("/user/invoices", requireAuth, requireRole("USER"), userInvoiceRoutes);
app.use("/user/settings", requireAuth, settingsRoute);

app.get("/", (req, res) => res.send("API is running"));
app.get("/protected", requireAuth, (req, res) => {
    res.json({message: "You have access!", user: (req as any).user});
});
app.get("/admin-only", requireAuth, requireRole("ADMIN"), (req, res) => {
    res.json({message: "Admin access granted!"});
});

export default app;