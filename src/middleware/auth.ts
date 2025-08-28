import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../modules/env";
import { firebaseAuth } from "../modules/firebase";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  // Prefer Firebase verification when configured
  if (firebaseAuth) {
    firebaseAuth
      .verifyIdToken(token)
      .then((decoded) => {
        const email = (decoded as any).email as string | undefined;
        const name = (decoded as any).name as string | undefined;
        req.user = { id: decoded.uid, email: email || "", name: name || "" };
        next();
      })
      .catch(() => {
        // Fallback to local JWT for backward compatibility
        try {
          const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; name: string };
          req.user = { id: payload.sub, email: payload.email, name: payload.name };
          next();
        } catch {
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      });
    return;
  }  
}
