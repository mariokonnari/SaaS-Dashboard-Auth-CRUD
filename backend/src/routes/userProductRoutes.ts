import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth } from "../middleware/authMiddleware";
import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

const router = Router();

/**
 * GET only the products created by the logged-in user
 */
router.get("/", requireAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({message: "Not authenticated"});
    }

    try {
        const products = await prisma.product.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
    });

    res.json(products);
    } catch (err) {
        console.error("User product fetch error:", err);
        res.status(500).json({ message: "Failed to fetch user products" });
    }
});

/**
 * CREATE a new product belonging to the logged-in user
 */
router.post("/", requireAuth, async (req, res) => {
  const { name, description, price } = req.body;

  if (!req.user) {
        return res.status(401).json({message: "Not authenticated"});
    }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        userId: req.user.id,
      },
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error("User product create error:", err);
    res.status(500).json({ message: "Failed to create product", error: err });
  }
});

/* Update a product, only if it belongs to them */
router.put("/:id", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const { name, description, price } = req.body;

  try {
    // Find product and check ownership
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product || product.userId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Update product
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, price },
    });

    res.json({ message: "Product updated", product: updated });
  } catch (err) {
    console.error("User product update error:", err);
    res.status(500).json({ message: "Failed to update product", error: err });
  }
});

/**
 * DELETE a user’s product (but only if it belongs to them)
 */
router.delete("/:id", requireAuth, async (req, res) => {

    if (!req.user) {
        return res.status(401).json({message: "Not authenticated"});
    }

    try {
        // Ensure user owns this product
        const product = await prisma.product.findUnique({
        where: { id: req.params.id },
    });

    if (!product || product.userId !== req.user.id) {
        return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.product.delete({
        where: { id: req.params.id },
    });

    res.json({ message: "Product deleted" });
    } catch (err) {
        console.error("User product delete error:", err);
        res.status(500).json({ message: "Failed to delete product", error: err });
    }
});

export default router;