import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

//Get all products (ADMIN ONLY)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: {createdAt: "desc"}
        });
        res.json(products)
    } catch (err) {
        res.status(500).json({message: "Failed to fetch products"});
    }
});

//Get a single product by ID
router.get("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: {id: req.params.id}
        });

        if (!product) return res.status(404).json({message: "Product not found"});

        res.json(product);
    } catch (err) {
        res.status(500).json({message: "Failed to fetch product", error: err});
    }
});

//Create a new product
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
    console.log("REQ.BODY:", req.body);
    
    const { name, description, price } = req.body;

    if (!req.user) {
        return res.status(401).json({message: "Not authenticated"});
    }

    try {
        const product = await prisma.product.create({
            data: { name, description, price, user: { connect: { id: req.user.id }}}
        });
        res.status(201).json({message: "Product created", product});
    } catch (err) {
        res.status(500).json({message: "Failed to create product", error: err });
    }
});

//Update a product
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const {name, description, price} = req.body;

    try {
        const updated = await prisma.product.update({
            where: {id: req.params.id},
            data: {name, description, price}
        });
        res.json({message:"Product updated", product: updated});
    } catch (err) {
        res.status(500).json({message: "Failed to update product", error: err});
    }
});

//Delete a product
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id}
        });
        res.json({message: "Product deleted"});
    } catch (err) {
        res.status(500).json({message:"Failed to delete product", error: err});
    }
});

export default router;