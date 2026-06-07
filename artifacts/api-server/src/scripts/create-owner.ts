// Seed the first owner account.
// Usage: node --env-file=../../.env --import tsx/esm ./src/scripts/create-owner.ts <email> <password> [name]
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "../lib/auth";

const email = process.argv[2]?.toLowerCase();
const password = process.argv[3];
const name = process.argv[4] ?? "Owner";

if (!email || !password) {
  console.error("Usage: create-owner.ts <email> <password> [name]");
  process.exit(1);
}

const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
if (existing) {
  console.error(`User ${email} already exists (id ${existing.id})`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const [created] = await db
  .insert(usersTable)
  .values({ email, passwordHash, name, role: "owner" })
  .returning();

console.log(`Created owner ${created.email} (id ${created.id})`);
process.exit(0);
