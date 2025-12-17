import { Router } from "express";
import { signup, login, refresh } from "../controllers/authController";

const router = Router();

router.post("/signup", async (req, res) => {
  console.log("=== SIGNUP ATTEMPT ===");
  console.log("req.body:", req.body);

  try {
    const newUser = await signup(req.body);
    return res.status(201).json(newUser);
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("req.body", req.body);

    try {
        const user = await login(req.body);
        return res.status(201).json(user);
    } catch (err: any) {
        console.error("LOGIN ERROR: ", err.message);
        return res.status(400).json({message: err.message});
    }
});

router.post("/refresh", async (req, res) => {
  console.log("=== REFRESH TOKEN ATTEMPT ===");
  console.log("req.body:", req.body);

  try {
    const refreshed = await refresh(req.body);
    return res.status(201).json(refreshed);
  } catch (err: any) {
    console.error("REFRESH ERROR:", err.message);
    return res.status(400).json({ message: err.message });
  }
});

export default router;