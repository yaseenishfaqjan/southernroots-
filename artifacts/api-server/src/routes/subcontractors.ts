import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subcontractorsTable } from "@workspace/db";
import {
  CreateSubcontractorBody,
  GetSubcontractorParams,
  UpdateSubcontractorParams,
  UpdateSubcontractorBody,
  DeleteSubcontractorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subcontractors", async (_req, res): Promise<void> => {
  const subs = await db.select().from(subcontractorsTable);
  res.json(
    subs.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/subcontractors", async (req, res): Promise<void> => {
  const parsed = CreateSubcontractorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sub] = await db.insert(subcontractorsTable).values(parsed.data).returning();
  res.status(201).json({ ...sub, createdAt: sub.createdAt.toISOString() });
});

router.get("/subcontractors/:id", async (req, res): Promise<void> => {
  const params = GetSubcontractorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sub] = await db
    .select()
    .from(subcontractorsTable)
    .where(eq(subcontractorsTable.id, params.data.id));

  if (!sub) {
    res.status(404).json({ error: "Subcontractor not found" });
    return;
  }

  res.json({ ...sub, createdAt: sub.createdAt.toISOString() });
});

router.patch("/subcontractors/:id", async (req, res): Promise<void> => {
  const params = UpdateSubcontractorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubcontractorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(subcontractorsTable)
    .set(parsed.data)
    .where(eq(subcontractorsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Subcontractor not found" });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/subcontractors/:id", async (req, res): Promise<void> => {
  const params = DeleteSubcontractorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(subcontractorsTable)
    .where(eq(subcontractorsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Subcontractor not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
