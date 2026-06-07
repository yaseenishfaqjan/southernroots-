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
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

// AUTH_ENABLED gates whether admin routes require a JWT. Default OFF so the
// existing dashboards keep working until their login flow is wired up. Flip to
// "true" once the frontends attach a token (see PRODUCTION_HARDENING.md).
const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";
const protect = AUTH_ENABLED ? [requireAuth] : [];
const ownerOnly = AUTH_ENABLED ? [requireAuth, requireRole("owner", "dispatcher")] : [];

// ── Public routes (no auth) ──────────────────────────────────────────────
router.use(healthRouter);
router.use(authRouter);
router.use(webhooksRouter);
router.use(clientRouter); // client portal: quote accept / service request
router.use(workerRouter); // legacy worker routes

// ── Protected routes (require auth when AUTH_ENABLED) ─────────────────────
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
