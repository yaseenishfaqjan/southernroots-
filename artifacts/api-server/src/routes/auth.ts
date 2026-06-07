import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { verifyPassword, signToken } from "../lib/auth";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/login — exchange email + password for a JWT
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.email.toLowerCase()));

    // Constant-ish response: same error whether the email or password is wrong.
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workerId: user.workerId,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    logger.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me — return the current authenticated user
router.get("/auth/me", requireAuth, (req: AuthedRequest, res): void => {
  res.json({ user: req.user });
});

export default router;
