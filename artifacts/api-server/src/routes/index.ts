import { Router, type IRouter } from "express";
import healthRouter from "./health";
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

const router: IRouter = Router();

// Legacy routes (existing)
router.use(healthRouter);
router.use(jobsRouter);
router.use(subcontractorsRouter);
router.use(dashboardRouter);
router.use(escalationsRouter);
router.use(kpiRouter);
router.use(auditRouter);
router.use(notificationsRouter);
router.use(dispatchRouter);
router.use(clientRouter);
router.use(workerRouter);
router.use(invoicesRouter);
router.use(matchingRouter);

// New AI-powered routes
router.use(customersRouter);
router.use(quotesRouter);
router.use(workersRouter);
router.use(workerApiRouter);
router.use(agentsRouter);
router.use(webhooksRouter);

export default router;
