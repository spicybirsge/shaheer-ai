import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
// Lazy construction lets the public landing page build without production credentials.
const globalDb = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
};
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const client = (globalDb.sqlClient ??= postgres(process.env.DATABASE_URL, {
    max: 5,
    prepare: false,
  }));
  return drizzle(client, { schema });
}
