import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

//Protects routes - ensures user is logged in
export const requireAuth = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ message: "No token provided"});

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided"});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token"});
    }
};

//Role-based access control middleware
export const requireRole = (role: string) => {
    return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({message: "Not authenticated"});
        if (req.user.role !== role) return res.status(403).json({ message: "Forbidden"});
        next();
    };
};
