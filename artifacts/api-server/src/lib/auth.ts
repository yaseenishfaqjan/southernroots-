import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: number;
  orgId: number;
  email: string;
  role: string;
  workerId: number | null;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET (or SESSION_SECRET) must be set to at least 32 characters before issuing tokens"
    );
  }
  return secret;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
