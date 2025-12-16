import { VercelRequest, VercelResponse } from "@vercel/node";
import { signup } from "../../src/controllers/authController";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ CORS HEADERS (always first)
  res.setHeader("Access-Control-Allow-Origin", "https://saasdashboarddemo.netlify.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await signup(req.body);
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}