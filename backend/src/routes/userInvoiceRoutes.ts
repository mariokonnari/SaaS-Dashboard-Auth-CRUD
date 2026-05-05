import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { invoiceSchema } from "../schemas";

const router = Router();
export const runtime = "nodejs";

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    res.json(invoices);
  } catch {
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

router.post("/", requireAuth, validate(invoiceSchema), async (req: Request, res: Response) => {
  const { amount, description } = req.body;
  try {
    const invoice = await prisma.invoice.create({
      data: { userId: req.user!.id, amount: Number(amount), description },
    });
    res.status(201).json(invoice);
  } catch {
    res.status(500).json({ message: "Failed to create invoice" });
  }
});

router.put("/:id", requireAuth, validate(invoiceSchema), async (req: Request, res: Response) => {
  const { amount, description } = req.body;
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== req.user!.id) {
      return res.status(404).json({ message: "Invoice not found or not authorized" });
    }
    const updated = await prisma.invoice.update({
      where: { id },
      data: { amount: Number(amount), description },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update invoice" });
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== req.user!.id) {
      return res.status(404).json({ message: "Invoice not found or not authorized" });
    }
    await prisma.invoice.delete({ where: { id } });
    res.json({ message: "Invoice deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete invoice" });
  }
});

export default router;
