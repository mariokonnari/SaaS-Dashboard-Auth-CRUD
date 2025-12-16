import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

export const runtime = "nodejs";

// GET all invoices for the logged-in user
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// POST create a new invoice for the logged-in user
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { amount, description } = req.body;

    if (!amount || !description) {
      return res.status(400).json({ message: "Amount and description are required" });
    }

    const newInvoice = await prisma.invoice.create({
      data: {
        userId,
        amount: Number(amount),
        description,
      },
    });

    res.status(201).json(newInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create invoice" });
  }
});

// PUT update an existing invoice (only own invoices)
router.put("/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, description } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice || invoice.userId !== userId) {
      return res.status(404).json({ message: "Invoice not found or not authorized" });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { amount: Number(amount), description },
    });

    res.json(updatedInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update invoice" });
  }
});

// DELETE an invoice (only own invoices)
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice || invoice.userId !== userId) {
      return res.status(404).json({ message: "Invoice not found or not authorized" });
    }

    await prisma.invoice.delete({ where: { id } });

    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
});

export default router;