import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import jobsRouter from "./jobs";
import subcontractorsRouter from "./subcontractors";
import dashboardRouter from "./dashboard";
import escalationsRouter from "./escalations";
import kpiRouter from "./kpi";
import auditRouter from "./audit";
import notificationsRouter from "./notifications";
import dispatchRouter from "./dispatch";
import clientRouter from "./client";
import workerRouter from "./worker";
import invoicesRouter from "./invoices";
import matchingRouter from "./matching";
import customersRouter from "./customers";
import quotesRouter from "./quotes";
import workersRouter from "./workers";
import workerApiRouter from "./worker-api";
import agentsRouter from "./agents";
import webhooksRouter from "./webhooks";
import billingRouter from "./billing";
import publicRouter from "./public";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

// Multi-tenant: every business route REQUIRES a valid token so we know which
// organization the request belongs to. Tenant isolation depends on this.
const protect = [requireAuth];
const ownerOnly = [requireAuth, requireRole("owner", "dispatcher")];

// ── Public routes (no auth) ──────────────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);
router.use(webhooksRouter);
router.use(publicRouter); // unauthenticated per-org lead capture

// ── Protected routes (require a valid tenant token) ───────────────────────
router.use(...protect, billingRouter);
// NOTE: client/worker portals need their own auth before those apps work again.
router.use(...protect, clientRouter);
router.use(...protect, workerRouter);
router.use(...protect, dashboardRouter);
router.use(...protect, kpiRouter);
router.use(...protect, auditRouter);
router.use(...protect, notificationsRouter);
router.use(...protect, escalationsRouter);
router.use(...protect, dispatchRouter);
router.use(...protect, invoicesRouter);
router.use(...protect, matchingRouter);
router.use(...protect, jobsRouter);
router.use(...protect, subcontractorsRouter);
router.use(...protect, customersRouter);
router.use(...protect, quotesRouter);
router.use(...protect, workersRouter);
router.use(...protect, workerApiRouter);

// ── Owner/dispatcher only: manual agent triggers are powerful ─────────────
router.use(...ownerOnly, agentsRouter);

export default router;
