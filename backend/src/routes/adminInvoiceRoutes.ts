import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

export const runtime = "nodejs";

//GET all invoices (ADMIN ONLY)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                user: {
                    select: { id: true, email: true, role: true }
                }
            },
            orderBy: {createdAt: "desc"}
        });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({message: "Failed to fetch invoices", error: err});
    }
});

//GET invoices by user ID (filter)
router.get("/user/:userId", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { userId: req.params.userId },
            orderBy: {createdAt: "desc"}
        });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({message: "Failed to fetch invoices", error:err});
    }
});

//Create invoice
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const {userId, amount, description} = req.body;

    try {
        const invoice = await prisma.invoice.create({
            data: {
                userId,
                amount,
                description
            }
        });
        res.json({message: "Invoice created", invoice});
    } catch (err) {
        res.status(500).json({message: "Failed to create invoice", error: err});
    }
});

//Update invoice
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const {userId, amount, description} = req.body;

    try {
        const updated = await prisma.invoice.update ({
            where: {id:req.params.id},
            data: {userId, amount, description}
        });
        res.json({message: "Invoice updated", invoice: updated});
    } catch (err) {
        res.status(500).json({message: "Failed to update invoice", error: err})
    }
});

//DELETE invoices by ID
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        await prisma.invoice.delete({
            where: { id: req.params.id },
        });
        res.json({message: "Invoice deleted"});
    } catch (err) {
        res.status(500).json({message: "Failed to delete invoices", error:err});
    }
});

export default router;