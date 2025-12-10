import { Router } from "express";
import { prisma } from "../utils/prisma";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

//Get all users (ADMIN ONLY)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });

        res.json(users);
    } catch (err) {
        res.status(500).json({message: "Server error", errror: err });
    }
});

//Change a user's role
router.patch("/:id/role", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { role } = req.body;

    if (!["ADMIN", "USER"].includes(role)) {
        return res.status(400).json({message: "Invalid role"});
    }

    try {
        const updated = await prisma.user.update({
            where: {id: req.params.id},
            data: {role},
        });

        res.json({message: "Role updated", user: updated});
    } catch (err) {
        res.status(500).json({message: "Error updating role", error: err});
    }
});

//Delete user
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id },
        });

        res.json({message: "User deleted"});
    } catch (err) {
        res.status(500).json({message: "Error deleting user", error: err });
    }
});

export default router;