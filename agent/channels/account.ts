import { defineChannel, POST } from "eve/channels";
import { eq } from "drizzle-orm";
import { getAuth } from "../../src/lib/auth";
import { database } from "../../src/lib/db";
import { chats } from "../../src/lib/db/schema";
import { endOwnedSessions } from "../lib/erasure";

export default defineChannel({
  routes: [
    POST("/eve/v1/account/purge", async (request, { attachSession }) => {
      const session = await getAuth().api.getSession({
        headers: request.headers,
      });
      if (!session) return new Response(null, { status: 401 });
      if (
        request.headers.get("origin") !==
        new URL(process.env.BETTER_AUTH_URL!).origin
      )
        return new Response(null, { status: 403 });
      const owned = await database()
        .select({ id: chats.id })
        .from(chats)
        .where(eq(chats.userId, session.user.id));
      // Run in the agent process, which owns the configured Workflow backend.
      await endOwnedSessions(
        owned.map((chat) => chat.id),
        attachSession,
      );
      return Response.json({ ok: true });
    }),
  ],
});
