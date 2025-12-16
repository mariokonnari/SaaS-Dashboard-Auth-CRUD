import { VercelRequest, VercelResponse } from "@vercel/node";
import { login } from "../../controllers/authController";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    try {
        const result = await login(req.body);

        res.setHeader("Access-Control-Allow-Origin", "*"); // adjust if needed
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message });
    }
}