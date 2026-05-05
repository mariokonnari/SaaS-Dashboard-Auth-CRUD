import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import { logAction } from "../utils/auditLog";
import { validate } from "../middleware/validate";
import { invoiceSchema } from "../schemas";

const router = Router();
export const runtime = "nodejs";

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch {
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

router.get("/user/:userId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch {
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

router.post("/", requireAuth, requireRole("ADMIN"), validate(invoiceSchema), async (req, res) => {
  const { userId, amount, description } = req.body;
  try {
    const invoice = await prisma.invoice.create({
      data: { userId, amount, description },
    });
    await logAction("CREATE", "Invoice", invoice.id, req.user!.id, { amount, description });
    res.status(201).json({ message: "Invoice created", invoice });
  } catch {
    res.status(500).json({ message: "Failed to create invoice" });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN"), validate(invoiceSchema), async (req, res) => {
  const { userId, amount, description, status } = req.body;
  try {
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { userId, amount, description, ...(status && { status }) },
    });
    await logAction("UPDATE", "Invoice", req.params.id, req.user!.id, { amount, description, status });
    res.json({ message: "Invoice updated", invoice: updated });
  } catch {
    res.status(500).json({ message: "Failed to update invoice" });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    await logAction("DELETE", "Invoice", req.params.id, req.user!.id);
    res.json({ message: "Invoice deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete invoice" });
  }
});

export default router;
