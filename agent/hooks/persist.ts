import { defineHook } from "eve/hooks";
import { database } from "../../src/lib/db";
import { chats, chatEvents } from "../../src/lib/db/schema";
import { and, eq } from "drizzle-orm";

export default defineHook({
  events: {
    async "*"(event, ctx) {
      // Progress is ephemeral; persisting every token blocks the model stream on database latency.
      if (
        event.type === "content.delta" ||
        event.type === "call.input" ||
        event.type === "call.progress"
      )
        return;
      const userId = ctx.session.auth.initiator?.principalId;
      if (!userId) throw new Error("Missing chat owner");
      const db = database();
      if (event.type === "session.started")
        await db
          .insert(chats)
          .values({ id: ctx.session.id, userId })
          .onConflictDoNothing();
      await db
        .insert(chatEvents)
        .values({
          chatId: ctx.session.id,
          line: ctx.position.line,
          eventIndex: ctx.position.index,
          payload: event,
        })
        .onConflictDoNothing();
      if (event.type === "delivery.consumed") {
        const title = event.data.parts
          .filter((p) => p.kind === "text")
          .map((p) => (p.kind === "text" ? p.text : ""))
          .join(" ")
          .slice(0, 80);
        if (title)
          await db
            .update(chats)
            .set({ title })
            .where(
              and(
                eq(chats.id, ctx.session.id),
                eq(chats.title, "New conversation"),
              ),
            );
      }
      if (event.type === "turn.settled")
        await db
          .update(chats)
          .set({ updatedAt: new Date() })
          .where(eq(chats.id, ctx.session.id));
    },
  },
});
