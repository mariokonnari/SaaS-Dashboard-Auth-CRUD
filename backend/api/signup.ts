import { VercelRequest, VercelResponse } from "@vercel/node";
import  { prisma }  from "../utils/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const { email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashed, role: role || "USER" },
    });

    res.status(201).json({
      message: "User created",
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err });
  }
}