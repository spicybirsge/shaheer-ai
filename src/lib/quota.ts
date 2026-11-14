import { sql } from 'drizzle-orm';
import { database } from './db';
import { dailyUsage } from './db/schema';
export const DAILY_LIMIT = 20;
export async function reserveMessage(userId: string) {
  // Postgres computes the UTC date, and the conditional UPSERT serializes competing requests.
  const rows = await database().insert(dailyUsage).values({ userId, day: sql`to_char(now() at time zone 'UTC', 'YYYY-MM-DD')`, count: 1 })
    .onConflictDoUpdate({ target: [dailyUsage.userId, dailyUsage.day], set: { count: sql`${dailyUsage.count} + 1` }, setWhere: sql`${dailyUsage.count} < ${DAILY_LIMIT}` }).returning();
  return rows.length > 0;
}
export async function getQuota(userId: string) {
  const rows = await database().select().from(dailyUsage).where(sql`${dailyUsage.userId} = ${userId} and ${dailyUsage.day} = to_char(now() at time zone 'UTC', 'YYYY-MM-DD')`);
  return { remaining: Math.max(0, DAILY_LIMIT - (rows[0]?.count ?? 0)), limit: DAILY_LIMIT, resetsAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString() };
}
