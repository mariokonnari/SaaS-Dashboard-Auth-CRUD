export function handleCors(req: any, res: any) {
  const allowedOrigins = [
    "https://saasdashboarddemo.netlify.app",
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}