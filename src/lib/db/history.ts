import { and, asc, eq } from "drizzle-orm";
import { database } from "./index";
import { chatEvents, chats } from "./schema";

export function loadOwnedHistory(chatId: string, userId: string, db = database()) {
  return db
    .select({
      line: chatEvents.line,
      eventIndex: chatEvents.eventIndex,
      payload: chatEvents.payload,
      updatedAt: chats.updatedAt,
    })
    .from(chatEvents)
    .innerJoin(chats, eq(chats.id, chatEvents.chatId))
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.userId, userId),
        eq(chats.deleted, false),
      ),
    )
    .orderBy(asc(chatEvents.line), asc(chatEvents.eventIndex));
}
