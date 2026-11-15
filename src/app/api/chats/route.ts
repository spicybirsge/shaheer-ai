import { getAuth } from "@/lib/auth";
import { database } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getQuota } from "@/lib/quota";
import { listChats, parseChatCursor } from "@/lib/db/chats";
import { and, eq } from "drizzle-orm";
export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  let cursor: ReturnType<typeof parseChatCursor>;
  try {
    cursor = parseChatCursor(new URL(request.url).searchParams.get("cursor"));
  } catch {
    return Response.json({ error: "Invalid chat cursor" }, { status: 400 });
  }
  const page = await listChats(session.user.id, cursor);
  return Response.json(
    { ...page, quota: await getQuota(session.user.id) },
    { headers: { "cache-control": "private, no-store" } },
  );
}
export async function DELETE(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL!).origin
  )
    return new Response(null, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response(null, { status: 400 });
  // Tombstone also prevents the still-running agent from recreating a deleted chat.
  await database()
    .update(chats)
    .set({ deleted: true })
    .where(and(eq(chats.id, id), eq(chats.userId, session.user.id)));
  return new Response(null, { status: 204 });
}
