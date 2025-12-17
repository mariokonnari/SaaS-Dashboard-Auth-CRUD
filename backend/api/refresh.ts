import { handleCors } from "../src/utils/cors";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { refresh } from "../src/controllers/authController";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await refresh(req.body);
    return res.status(201).json(user);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ message: err.message });
  }
}
