"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
//GET all invoices (ADMIN ONLY)
router.get("/", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        const invoices = await prisma_1.prisma.invoice.findMany({
            include: {
                user: {
                    select: { id: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(invoices);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch invoices", error: err });
    }
});
//GET invoices by user ID (filter)
router.get("/user/:userId", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        const invoices = await prisma_1.prisma.invoice.findMany({
            where: { userId: req.params.userId },
            orderBy: { createdAt: "desc" }
        });
        res.json(invoices);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch invoices", error: err });
    }
});
//Create invoice
router.post("/", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    const { userId, amount, description } = req.body;
    try {
        const invoice = await prisma_1.prisma.invoice.create({
            data: {
                userId,
                amount,
                description
            }
        });
        res.json({ message: "Invoice created", invoice });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to create invoice", error: err });
    }
});
//Update invoice
router.put("/:id", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    const { userId, amount, description } = req.body;
    try {
        const updated = await prisma_1.prisma.invoice.update({
            where: { id: req.params.id },
            data: { userId, amount, description }
        });
        res.json({ message: "Invoice updated", invoice: updated });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update invoice", error: err });
    }
});
//DELETE invoices by ID
router.delete("/:id", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        await prisma_1.prisma.invoice.delete({
            where: { id: req.params.id },
        });
        res.json({ message: "Invoice deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete invoices", error: err });
    }
});
exports.default = router;
