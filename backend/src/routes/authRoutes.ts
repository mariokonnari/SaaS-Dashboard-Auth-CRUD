// ─────────────────────────────────────────────────────────────
// authRoutes.ts — IMPROVED
//
// CHANGES & WHY:
//
// 1. REMOVED ALL console.log() — These were debug logs left in from
//    development. In production they pollute your server logs and can
//    accidentally leak sensitive data (like passwords if req.body is
//    logged before validation). Remove them when code is working.
//
// 2. REPLACED `err: any` WITH AppError-AWARE HANDLING — The original
//    always returned status 400 for every error. Now we use the
//    `status` field from AppError so each error returns the correct
//    HTTP code (400, 401, 409, etc.). This is important because
//    clients (and monitoring tools) rely on status codes.
//
// 3. FIXED LOGIN STATUS CODE — The original returned 201 (Created) for
//    a successful login. That's wrong. 201 means something was created.
//    Login should return 200 (OK) — nothing was created, just authenticated.
//    Same fix for the refresh route.
//
// 4. FIXED REFRESH ROUTE — The original passed the entire req.body to
//    refresh() instead of just the token. The controller expects a
//    string, not an object.
//
// 5. ADDED A REUSABLE ERROR HANDLER — Instead of copy-pasting the same
//    catch block in every route, one helper function handles it all.
//    Add a new route and you just call handleError(err, res).
// ─────────────────────────────────────────────────────────────

import { Router, Response } from "express";
import { signup, login, refresh, AppError } from "../controllers/authController";

const router = Router();

//Reusable error handler — no more copy-pasting catch blocks
function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    //Our own typed error — use the status it carries
    return res.status(err.status).json({ message: err.message });
  }
  //Unexpected error (e.g. database down, coding bug)
  console.error("Unexpected error:", err);
  return res.status(500).json({ message: "An unexpected error occurred." });
}

// ─── POST /auth/signup ─────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const newUser = await signup(req.body);
    return res.status(201).json(newUser); //201 is correct here — a user was created
  } catch (err) {
    return handleError(err, res);
  }
});

// ─── POST /auth/login ──────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);
    return res.status(200).json(result); //200, not 201 — nothing was created
  } catch (err) {
    return handleError(err, res);
  }
});

// ─── POST /auth/refresh ────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    //Pass just the token string, not the whole body object
    const { refreshToken } = req.body;
    const result = await refresh(refreshToken);
    return res.status(200).json(result); //200, not 201
  } catch (err) {
    return handleError(err, res);
  }
});

export default router;