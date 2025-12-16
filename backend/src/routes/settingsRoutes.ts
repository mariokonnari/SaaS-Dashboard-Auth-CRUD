import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";

export const runtime = "nodejs";

const router = Router();

router.put("/", requireAuth, async (req, res) => {

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized"});

  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    const data: any = {};
    if (email) data.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.status(200).json({ message: "Settings updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;