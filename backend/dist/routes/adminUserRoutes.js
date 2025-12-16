"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
//Get all users (ADMIN ONLY)
router.get("/", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", errror: err });
    }
});
//Change a user's role
router.patch("/:id/role", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    const { role } = req.body;
    if (!["ADMIN", "USER"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const updated = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: { role },
        });
        res.json({ message: "Role updated", user: updated });
    }
    catch (err) {
        res.status(500).json({ message: "Error updating role", error: err });
    }
});
//Delete user
router.delete("/:id", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        await prisma_1.prisma.user.delete({
            where: { id: req.params.id },
        });
        res.json({ message: "User deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err });
    }
});
exports.default = router;
