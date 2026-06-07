// Seed an organization + its first owner.
// Usage: create-owner.ts <email> <password> [name] [orgName]
import { eq } from "drizzle-orm";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { hashPassword } from "../lib/auth";

const email = process.argv[2]?.toLowerCase();
const password = process.argv[3];
const name = process.argv[4] ?? "Owner";
const orgName = process.argv[5] ?? "Southern Roots Turf";

if (!email || !password) {
  console.error("Usage: create-owner.ts <email> <password> [name] [orgName]");
  process.exit(1);
}

const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
if (existing) {
  console.error(`User ${email} already exists (id ${existing.id})`);
  process.exit(1);
}

const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "org";
const passwordHash = await hashPassword(password);
const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

const { org, user } = await db.transaction(async (tx) => {
  const [org] = await tx
    .insert(organizationsTable)
    .values({ name: orgName, slug, plan: "trial", status: "active", trialEndsAt })
    .returning();
  const [user] = await tx
    .insert(usersTable)
    .values({ orgId: org.id, email, passwordHash, name, role: "owner" })
    .returning();
  return { org, user };
});

console.log(`Created org "${org.name}" (id ${org.id}) + owner ${user.email} (id ${user.id})`);
process.exit(0);
