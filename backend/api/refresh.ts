import { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = "15m";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET!) as { id: string };
    const newAccess = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRY });
    res.json({ accessToken: newAccess });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
