// ─────────────────────────────────────────────────────────────
// authController.ts — IMPROVED
//
// CHANGES & WHY:
//
// 1. REPLACED `body: any` WITH PROPER TYPES — Using `any` defeats
//    TypeScript. We define input types (SignupInput, LoginInput) so
//    TypeScript can catch typos and wrong shapes at compile time.
//
// 2. PASSWORD VALIDATION — The original accepted any password. A
//    minimum length check belongs in the controller (backend), not
//    just the frontend (which can be bypassed by anyone with curl).
//
// 3. CONSISTENT ERROR TYPES — The original threw `new Error(...)` for
//    all failures. A custom AppError class (or just adding a `status`
//    field) lets the route handler return the correct HTTP status code
//    (400 for bad input, 401 for auth failure, etc.) automatically.
//
// 4. REFRESH TOKEN STORED IN DB (recommended next step) — Currently
//    refresh tokens are stateless (no revocation possible). Storing
//    them in the DB allows logout to actually invalidate them. This is
//    marked as a TODO.
//
// 5. EXPIRATIONS AS CONSTANTS — Magic strings like "15m" in multiple
//    places are error-prone. One named constant is easier to change.
// ─────────────────────────────────────────────────────────────

import { prisma } from "../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── Config constants ──────────────────────────────────────────
const ACCESS_EXPIRY  = "15m";
const REFRESH_EXPIRY = "7d";
const SALT_ROUNDS    = 10;
const MIN_PASSWORD_LENGTH = 6;

// ─── Input types ───────────────────────────────────────────────
// Replacing `body: any` with real types
interface SignupInput {
  email:    string;
  password: string;
  role?:    "USER" | "ADMIN";
}

interface LoginInput {
  email:    string;
  password: string;
}

// ─── Custom error class ────────────────────────────────────────
// Carries HTTP status so route handlers can use it correctly
export class AppError extends Error {
  constructor(public message: string, public status: number = 400) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function signAccessToken(id: string, role: string): string {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRY });
}

function signRefreshToken(id: string, role: string): string {
  return jwt.sign({ id, role }, process.env.REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRY });
}

// ─── Controllers ──────────────────────────────────────────────

export const signup = async (body: SignupInput) => {
  const { email, password, role } = body;

  // Backend validation
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError("Email already registered.", 409); // ✅ 409 Conflict, not 400

  const hashed  = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = await prisma.user.create({
    data: { email, password: hashed, role: role ?? "USER" }, // ✅ nullish coalescing over || for booleans
  });

  return { id: newUser.id, email: newUser.email, role: newUser.role };
};

export const login = async (body: LoginInput) => {
  const { email, password } = body;

  // Single vague error for both "user not found" and "wrong password"
  // — never tell an attacker which one is wrong (security best practice)
  const user = await prisma.user.findUnique({ where: { email } });
  const match = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !match) {
    throw new AppError("Invalid email or password.", 401);
  }

  const accessToken  = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.role);

  // TODO: store refreshToken in DB for proper revocation on logout
  // await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};

export const refresh = async (token: string) => {
  if (!token) throw new AppError("No refresh token provided.", 401);

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET!) as { id: string; role: string };
    const newAccess = signAccessToken(decoded.id, decoded.role);
    return { accessToken: newAccess };
  } catch {
    //Catching jwt.verify errors properly
    throw new AppError("Refresh token is invalid or expired.", 401);
  }
};