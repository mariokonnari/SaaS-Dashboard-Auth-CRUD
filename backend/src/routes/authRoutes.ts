import { Router, Response } from "express";
import { signup, login, refresh, AppError } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { signupSchema, loginSchema, refreshSchema } from "../schemas";

const router = Router();

function handleError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error("Unexpected auth error:", err);
  return res.status(500).json({ message: "An unexpected error occurred." });
}

router.post("/signup", validate(signupSchema), async (req, res) => {
  try {
    const newUser = await signup(req.body);
    return res.status(201).json(newUser);
  } catch (err) {
    return handleError(err, res);
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const result = await login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

router.post("/refresh", validate(refreshSchema), async (req, res) => {
  try {
    const result = await refresh(req.body.refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

export default router;
