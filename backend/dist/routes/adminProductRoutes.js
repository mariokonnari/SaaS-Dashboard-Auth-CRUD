"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
//Get all products (ADMIN ONLY)
router.get("/", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        const products = await prisma_1.prisma.product.findMany({
            orderBy: { createdAt: "desc" }
        });
        res.json(products);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch products" });
    }
});
//Get a single product by ID
router.get("/:id", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: req.params.id }
        });
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        res.json(product);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch product", error: err });
    }
});
//Create a new product
router.post("/", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    console.log("REQ.BODY:", req.body);
    const { name, description, price } = req.body;
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    try {
        const product = await prisma_1.prisma.product.create({
            data: { name, description, price, user: { connect: { id: req.user.id } } }
        });
        res.status(201).json({ message: "Product created", product });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to create product", error: err });
    }
});
//Update a product
router.put("/:id", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const updated = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: { name, description, price }
        });
        res.json({ message: "Product updated", product: updated });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update product", error: err });
    }
});
//Delete a product
router.delete("/:id", authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)("ADMIN"), async (req, res) => {
    try {
        await prisma_1.prisma.product.delete({
            where: { id: req.params.id }
        });
        res.json({ message: "Product deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete product", error: err });
    }
});
exports.default = router;
