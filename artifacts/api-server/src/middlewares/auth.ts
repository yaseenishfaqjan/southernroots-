import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthTokenPayload } from "../lib/auth";
import { logger } from "../lib/logger";

export interface AuthedRequest extends Request {
  user?: AuthTokenPayload;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.token ?? null;
}

// Requires a valid JWT. Attaches the decoded payload to req.user.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    logger.warn({ err }, "Invalid auth token");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Requires req.user.role to be one of the allowed roles. Use after requireAuth.
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
