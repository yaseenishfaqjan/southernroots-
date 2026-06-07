import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { verifyPassword, hashPassword, signToken } from "../lib/auth";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TRIAL_DAYS = 14;

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const [existing] = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.slug, slug));
    if (!existing) return slug;
    slug = `${base}-${Math.floor(Date.now() % 100000).toString(36)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// ── POST /auth/signup ── create a new organization + its first owner ────────
const SignupBody = z.object({
  orgName: z.string().min(2),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { orgName, name, email, password } = parsed.data;
  const emailLc = email.toLowerCase();

  try {
    const [taken] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, emailLc));
    if (taken) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const slug = await uniqueSlug(slugify(orgName));
    const passwordHash = await hashPassword(password);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { org, user } = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizationsTable)
        .values({ name: orgName, slug, plan: "trial", status: "active", trialEndsAt })
        .returning();
      const [user] = await tx
        .insert(usersTable)
        .values({ orgId: org.id, email: emailLc, passwordHash, name, role: "owner" })
        .returning();
      return { org, user };
    });

    const token = signToken({
      userId: user.id,
      orgId: org.id,
      email: user.email,
      role: user.role,
      workerId: user.workerId,
    });

    logger.info({ orgId: org.id, userId: user.id }, "New organization signed up");
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan, trialEndsAt: org.trialEndsAt },
    });
  } catch (err) {
    logger.error({ err }, "Signup failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /auth/login ────────────────────────────────────────────────────────
const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Ensure the org is still active.
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, user.orgId));
    if (!org || org.status !== "active") {
      res.status(403).json({ error: "Organization is not active" });
      return;
    }

    const token = signToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      role: user.role,
      workerId: user.workerId,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan, trialEndsAt: org.trialEndsAt },
    });
  } catch (err) {
    logger.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, (req: AuthedRequest, res): void => {
  res.json({ user: req.user });
});

export default router;
