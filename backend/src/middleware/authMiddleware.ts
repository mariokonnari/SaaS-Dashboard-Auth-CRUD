// ─────────────────────────────────────────────────────────────
// authMiddleware.ts — IMPROVED
//
// CHANGES & WHY:
//
// 1. TYPED `req.user` PROPERLY — Using `req as any` is a red flag.
//    We extend Express's Request type via declaration merging so
//    `req.user` is type-safe everywhere it's accessed.
//
// 2. ADDED RequestHandler TYPE — Using Express's built-in RequestHandler
//    type for the return type gives better type inference.
//
// 3. SPLIT ERROR RESPONSES — 401 (not authenticated) vs 403 (forbidden)
//    are meaningfully different. The original used them inconsistently.
//    401 = "who are you?", 403 = "I know who you are, you can't do this."
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

// Extend Express's Request type globally so req.user is typed
// everywhere — no more `(req as any).user`
declare global {
  namespace Express {
    interface Request {
      user?: {
        id:   string;
        role: string;
      };
    }
  }
}

// ─── requireAuth ───────────────────────────────────────────────
// Checks for a valid JWT in the Authorization header.
// Sets req.user on success, returns 401 otherwise.
export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    // 401 = unauthenticated (no credentials at all)
    res.status(401).json({ message: "No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    req.user = decoded; // now properly typed, no cast needed
    next();
  } catch (err) {
    // 401 still — token exists but is invalid/expired
    res.status(401).json({ message: "Token is invalid or expired." });
  }
};

// ─── requireRole ───────────────────────────────────────────────
// Must be used AFTER requireAuth in the middleware chain.
// Returns 403 if the authenticated user doesn't have the right role.
export const requireRole = (role: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This shouldn't happen if requireAuth runs first, but defensive:
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    if (req.user.role !== role) {
      // ✅ 403 = authenticated but not authorized
      res.status(403).json({ message: "You do not have permission to access this resource." });
      return;
    }

    next();
  };
};