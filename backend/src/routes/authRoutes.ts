import { Router } from "express";
import { signup, login, refresh } from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
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

router.post("/refresh", refresh);

export default router;