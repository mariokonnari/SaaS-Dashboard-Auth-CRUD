import { Request, Response } from "express";

type Middleware = (req: Request, res: Response, next: (err?: any) => void) => void;

export default function initMiddleware(middleware: Middleware) {
  return (req: Request, res: Response) =>
    new Promise<void>((resolve, reject) => {
      middleware(req, res, (result?: any) => {
        if (result instanceof Error) return reject(result);
        return resolve();
      });
    });
}