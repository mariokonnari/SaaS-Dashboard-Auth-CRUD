import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import { logAction } from "../utils/auditLog";
import { validate } from "../middleware/validate";
import { productSchema } from "../schemas";

const router = Router();
export const runtime = "nodejs";

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

router.post("/", requireAuth, requireRole("ADMIN"), validate(productSchema), async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  const { name, description, price } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, description, price, user: { connect: { id: req.user.id } } },
    });
    await logAction("CREATE", "Product", product.id, req.user.id, { name, price });
    res.status(201).json({ message: "Product created", product });
  } catch {
    res.status(500).json({ message: "Failed to create product" });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN"), validate(productSchema), async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, price },
    });
    await logAction("UPDATE", "Product", req.params.id, req.user!.id, { name, price });
    res.json({ message: "Product updated", product: updated });
  } catch {
    res.status(500).json({ message: "Failed to update product" });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    await logAction("DELETE", "Product", req.params.id, req.user!.id);
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;
