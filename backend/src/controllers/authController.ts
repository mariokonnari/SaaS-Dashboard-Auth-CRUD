// controllers/authController.ts
import { prisma } from "../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export const runtime = "nodejs";

export const signup = async (body: any) => {
    const { email, password, role } = body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Email already registered");

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: { email, password: hashed, role: role || "USER" },
    });

    return { id: newUser.id, email: newUser.email, role: newUser.role };
};

export const login = async (body: any) => {
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRY });
    const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRY });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
};

export const refresh = async (token: string) => {
    if (!token) throw new Error("No refresh token");

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET!) as { id: string, role: string };
    const newAccess = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRY });

    return { accessToken: newAccess };
};