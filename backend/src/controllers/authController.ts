import {Request, Response} from "express";
import { prisma } from "../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export const signup = async (req: Request, res: Response) => {
    try {
        const {email, password, role} = req.body;

        const existingUser = await prisma.user.findUnique({
            where: {email},
        });

        if (existingUser) {
            return res.status(400).json({message: "Email already registered"});
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashed,
                role: role || "USER",
            },
        });

        res.status(201).json({
            message: "User created",
            user: {id: newUser.id, email: newUser.email, role: newUser.role},
        });
    } catch (err) {
        res.status(500).json({message: "Signup failed", error: err});
    }
};

export const login = async(req: Request, res: Response) => {
    try {
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({
            where: {email},
        });

        if(!user) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        const accessToken = jwt.sign(
            {id: user.id, role: user.role},
            process.env.JWT_SECRET!,
            {expiresIn: ACCESS_EXPIRY}
        );

        const refreshToken = jwt.sign(
            {id: user.id, role: user.role},
            process.env.REFRESH_SECRET!,
            {expiresIn: REFRESH_EXPIRY}
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7*24*60*60*1000,
        });

        res.json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({message: "Login failed", error: err});
    }
};

export const refresh = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) return res.status(401).json({message: "No refresh token"});

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET!) as {id: number};

        const newAccess = jwt.sign(
            {id: decoded.id},
            process.env.JWT_SECRET!,
            {expiresIn: ACCESS_EXPIRY}
        );

        res.json({accessToken: newAccess});
    } catch (err) {
        return res.status(401).json({message: "Invalid Token"});
    }
};