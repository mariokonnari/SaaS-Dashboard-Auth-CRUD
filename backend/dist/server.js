"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const adminUserRoutes_1 = __importDefault(require("./routes/adminUserRoutes"));
const adminInvoiceRoutes_1 = __importDefault(require("./routes/adminInvoiceRoutes"));
const adminProductRoutes_1 = __importDefault(require("./routes/adminProductRoutes"));
const userProductRoutes_1 = __importDefault(require("./routes/userProductRoutes"));
const userInvoiceRoutes_1 = __importDefault(require("./routes/userInvoiceRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "https://saasdashboarddemo.netlify.app",
    credentials: true,
}));
// Admin routes
app.use("/admin/users", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), adminUserRoutes_1.default);
app.use("/admin/invoices", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), adminInvoiceRoutes_1.default);
app.use("/admin/products", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), adminProductRoutes_1.default);
// User routes
app.use("/user/products", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("USER"), userProductRoutes_1.default);
app.use("/user/invoices", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("USER"), userInvoiceRoutes_1.default);
app.use("/user/settings", authMiddleware_1.requireAuth, settingsRoutes_1.default);
// Test routes
app.get("/", (req, res) => res.send("API is running"));
app.get("/protected", authMiddleware_1.requireAuth, (req, res) => {
    res.json({ message: "You have access!", user: req.user });
});
app.get("/admin-only", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), (req, res) => {
    res.json({ message: "Admin access granted!" });
});
exports.default = app;
