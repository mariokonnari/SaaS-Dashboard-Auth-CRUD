"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * GET only the products created by the logged-in user
 */
router.get("/", authMiddleware_1.requireAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(products);
    }
    catch (err) {
        console.error("User product fetch error:", err);
        res.status(500).json({ message: "Failed to fetch user products" });
    }
});
/**
 * CREATE a new product belonging to the logged-in user
 */
router.post("/", authMiddleware_1.requireAuth, async (req, res) => {
    const { name, description, price } = req.body;
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        const product = await prisma_1.prisma.product.create({
            data: {
                name,
                description,
                price,
                userId: req.user.id,
            },
        });
        res.status(201).json({ message: "Product created", product });
    }
    catch (err) {
        console.error("User product create error:", err);
        res.status(500).json({ message: "Failed to create product", error: err });
    }
});
/* Update a product, only if it belongs to them */
router.put("/:id", authMiddleware_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Not authenticated" });
    const { name, description, price } = req.body;
    try {
        // Find product and check ownership
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: req.params.id },
        });
        if (!product || product.userId !== req.user.id) {
            return res.status(403).json({ message: "Not allowed" });
        }
        // Update product
        const updated = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: { name, description, price },
        });
        res.json({ message: "Product updated", product: updated });
    }
    catch (err) {
        console.error("User product update error:", err);
        res.status(500).json({ message: "Failed to update product", error: err });
    }
});
/**
 * DELETE a user’s product (but only if it belongs to them)
 */
router.delete("/:id", authMiddleware_1.requireAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        // Ensure user owns this product
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: req.params.id },
        });
        if (!product || product.userId !== req.user.id) {
            return res.status(403).json({ message: "Not allowed" });
        }
        await prisma_1.prisma.product.delete({
            where: { id: req.params.id },
        });
        res.json({ message: "Product deleted" });
    }
    catch (err) {
        console.error("User product delete error:", err);
        res.status(500).json({ message: "Failed to delete product", error: err });
    }
});
exports.default = router;
