import { getAuth } from "@/lib/auth";
import { database } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getQuota } from "@/lib/quota";
import { and, desc, eq } from "drizzle-orm";
export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const list = await database()
    .select({ id: chats.id, title: chats.title })
    .from(chats)
    .where(and(eq(chats.userId, session.user.id), eq(chats.deleted, false)))
    .orderBy(desc(chats.updatedAt))
    .limit(100);
  return Response.json({ chats: list, quota: await getQuota(session.user.id) });
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
