import { Router, type IRouter } from "express";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db, usersTable, organizationsTable, authTokensTable } from "@workspace/db";
import { verifyPassword, hashPassword, signToken } from "../lib/auth";
import { sendEmail } from "../lib/resend";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TRIAL_DAYS = 14;
const TOKEN_TTL_HOURS = 24;
const appUrl = (): string => process.env.APP_URL ?? "http://localhost:5173";

// Create a single-use token (reset | verify) and return its value.
async function createToken(orgId: number, userId: number, type: "reset" | "verify"): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  await db.insert(authTokensTable).values({ orgId, userId, type, token, expiresAt });
  return token;
}

async function sendVerifyEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${appUrl()}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: "Verify your Southern Roots Turf email",
    html: `<p>Hi ${name},</p><p>Confirm your email to finish setting up your account:</p><p><a href="${link}">Verify email</a></p>`,
  }).catch((err) => logger.warn({ err }, "Verify email send failed"));
}

async function sendResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${appUrl()}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: "Reset your Southern Roots Turf password",
    html: `<p>Hi ${name},</p><p>Reset your password (link expires in ${TOKEN_TTL_HOURS}h):</p><p><a href="${link}">Reset password</a></p><p>If you didn't request this, ignore this email.</p>`,
  }).catch((err) => logger.warn({ err }, "Reset email send failed"));
}

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

    // Best-effort email verification (no-op until RESEND_API_KEY is set).
    const verifyToken = await createToken(org.id, user.id, "verify");
    await sendVerifyEmail(user.email, user.name, verifyToken);

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

// ── POST /auth/forgot-password ── always 200 (don't reveal who has an account)
const ForgotBody = z.object({ email: z.string().email() });

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.email.toLowerCase()));
    if (user) {
      const token = await createToken(user.orgId, user.id, "reset");
      await sendResetEmail(user.email, user.name, token);
      // In dev (no email provider) surface the token so the flow is testable.
      if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
        res.json({ ok: true, devToken: token });
        return;
      }
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Forgot-password failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /auth/reset-password ──
const ResetBody = z.object({ token: z.string().min(1), password: z.string().min(8) });

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(authTokensTable)
      .where(
        and(
          eq(authTokensTable.token, parsed.data.token),
          eq(authTokensTable.type, "reset"),
          gt(authTokensTable.expiresAt, new Date())
        )
      );
    if (!row || row.usedAt) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId));
    await db.update(authTokensTable).set({ usedAt: new Date() }).where(eq(authTokensTable.id, row.id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Reset-password failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /auth/verify-email ──
const VerifyBody = z.object({ token: z.string().min(1) });

router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const parsed = VerifyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(authTokensTable)
      .where(
        and(
          eq(authTokensTable.token, parsed.data.token),
          eq(authTokensTable.type, "verify"),
          gt(authTokensTable.expiresAt, new Date())
        )
      );
    if (!row || row.usedAt) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }
    await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, row.userId));
    await db.update(authTokensTable).set({ usedAt: new Date() }).where(eq(authTokensTable.id, row.id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Verify-email failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
