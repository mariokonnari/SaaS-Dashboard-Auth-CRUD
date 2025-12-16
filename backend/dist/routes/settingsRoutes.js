"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../utils/prisma");
const router = (0, express_1.Router)();
router.put("/", authMiddleware_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    const { email, password } = req.body;
    if (!email && !password) {
        return res.status(400).json({ message: "Nothing to update" });
    }
    try {
        const data = {};
        if (email)
            data.email = email;
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            data.password = await bcryptjs_1.default.hash(password, salt);
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data,
        });
        res.status(200).json({ message: "Settings updated successfully", user: updatedUser });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
