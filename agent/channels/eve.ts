import { eveChannel } from "eve/channels/eve";
import { ForbiddenError, type AuthFn } from "eve/channels/auth";
import { and, eq } from "drizzle-orm";
import { getAuth } from "../../src/lib/auth";
import { database } from "../../src/lib/db";
import { chats } from "../../src/lib/db/schema";
import { loadOwnedHistory } from "../../src/lib/db/history";
import { reserveMessage } from "../../src/lib/quota";
import { registerCreation } from "../lib/creation";
import { restoreExpiredHistory } from "../lib/history";

const appSession: AuthFn<Request> = async (request) => {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return null;
  const url = new URL(request.url);
  const match = url.pathname.match(/\/v1\/session(?:\/([^/]+))?(?:\/(.*))?$/);
  if (!match) throw new ForbiddenError({ message: "Route unavailable" });
  const [, id, action] = match;
  if (id) {
    const [chat] = await database()
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.id, decodeURIComponent(id)),
          eq(chats.userId, session.user.id),
          eq(chats.deleted, false),
        ),
      );
    if (!chat)
      throw new ForbiddenError({ message: "Conversation unavailable" });
  }
  if (request.method === "POST") {
    if (
      request.headers.get("origin") !==
      new URL(process.env.BETTER_AUTH_URL!).origin
    )
      throw new ForbiddenError({ message: "Invalid origin" });
    if (action && action !== "cancel")
      throw new ForbiddenError({ message: "Action unavailable" });
    if (!action) {
      const raw = await request.clone().text();
      if (raw.length > 16000)
        throw new ForbiddenError({
          message: "Message too long (maximum 4000 characters)",
        });
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new ForbiddenError({ message: "Invalid message" });
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new ForbiddenError({ message: "Invalid message" });
      const allowed = new Set([
        "message",
        "inbox",
        "idempotencyKey",
        "operationId",
        "turnPolicy",
      ]);
      if (Object.keys(body).some((key) => !allowed.has(key)))
        throw new ForbiddenError({ message: "Unsupported message options" });
      if (
        typeof body.message !== "string" ||
        !body.message.trim() ||
        body.message.length > 4000
      )
        throw new ForbiddenError({
          message: "Send a text message of 1–4000 characters",
        });
      if (!(await reserveMessage(session.user.id)))
        throw new ForbiddenError({
          message:
            "Daily limit reached. Your 50 messages reset at midnight UTC.",
        });
    }
  }
  return {
    authenticator: "better-auth",
    principalId: session.user.id,
    principalType: "user",
    attributes: {},
  };
};
const channel = eveChannel({
  auth: appSession,
  uploadPolicy: "disabled",
  async onMessage({ eve }, message) {
    if (!eve.caller || typeof message !== "string")
      throw new Error("Invalid text message");
    if (eve.sessionId)
      await database()
        .update(chats)
        .set({ title: message.slice(0, 80), updatedAt: new Date() })
        .where(
          and(eq(chats.id, eve.sessionId), eq(chats.title, "New conversation")),
        );
    return { auth: eve.caller, title: message.slice(0, 80), clientContext: [] };
  },
});
export default {
  ...channel,
  routes: channel.routes.map((route) => {
    if (
      route.method === "GET" &&
      route.path === "/eve/v1/session/:sessionId/stream"
    )
      return {
        ...route,
        async handler(request, args) {
          const response = await route.handler(request, args);
          return restoreExpiredHistory(
            response,
            request,
            args.params.sessionId,
            async () => {
              const caller = await appSession(request);
              if (!caller) return [];
              return loadOwnedHistory(args.params.sessionId, caller.principalId);
            },
          );
        },
      };
    if (route.method === "POST" && route.path === "/eve/v1/session")
      return {
        ...route,
        async handler(request, args) {
          const session = await getAuth().api.getSession({
            headers: request.headers,
          });
          if (!session)
            return Response.json(
              { error: "Sign in required" },
              { status: 401 },
            );
          const response = await route.handler(request, args);
          return registerCreation(response, async (id) => {
            await database()
              .insert(chats)
              .values({ id, userId: session.user.id })
              .onConflictDoNothing();
          });
        },
      };
    return route;
  }),
} satisfies typeof channel;
