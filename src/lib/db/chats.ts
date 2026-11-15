import { and, desc, eq, sql } from "drizzle-orm";
import { database } from "./index";
import { chats } from "./schema";

const PAGE_SIZE = 30;
type Cursor = { updatedAt: string; id: string };

export function parseChatCursor(value: string | null): Cursor | undefined {
  if (value === null) return;
  try {
    if (value.length > 2048 || !/^[\w-]+$/.test(value)) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      typeof cursor?.id !== "string" ||
      !cursor.id || cursor.id.length > 256 ||
      typeof cursor.updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(cursor.updatedAt) ||
      !Number.isFinite(Date.parse(cursor.updatedAt)) ||
      new Date(cursor.updatedAt).toISOString().slice(0, 23) !== cursor.updatedAt.slice(0, 23)
    ) throw new Error();
    return { updatedAt: cursor.updatedAt, id: cursor.id };
  } catch {
    throw new Error("Invalid chat cursor");
  }
}

export async function listChats(userId: string, cursor?: Cursor, db = database()) {
  const rows = await db
    .select({
      id: chats.id,
      title: chats.title,
      // Keep Postgres microseconds: Date/ISO conversion would truncate them
      // and could skip chats between page boundaries.
      updatedAt: sql<string>`to_char(${chats.updatedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(chats)
    .where(and(
      eq(chats.userId, userId),
      eq(chats.deleted, false),
      cursor ? sql`(${chats.updatedAt}, ${chats.id}) < (${cursor.updatedAt}::timestamptz, ${cursor.id})` : undefined,
    ))
    .orderBy(desc(chats.updatedAt), desc(chats.id))
    .limit(PAGE_SIZE + 1);
  const page = rows.slice(0, PAGE_SIZE);
  const last = page.at(-1);
  return {
    chats: page.map(({ id, title }) => ({ id, title })),
    nextCursor: rows.length > PAGE_SIZE && last
      ? Buffer.from(JSON.stringify({ updatedAt: last.updatedAt, id: last.id })).toString("base64url")
      : null,
  };
}
