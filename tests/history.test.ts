import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  Client,
  SessionStore,
  conversationOf,
  type SessionEvent,
} from "eve/client";
import { restoreExpiredHistory } from "../agent/lib/history";

const saved = (line: number, eventIndex: number, payload: SessionEvent) => ({
  line,
  eventIndex,
  payload,
  updatedAt: new Date("2026-11-15T00:00:00Z"),
});
// The same commit can hold several facts; unsaved token progress leaves line gaps.
const events = [
  saved(0, 0, { type: "session.started", data: {} }),
  saved(1, 0, { type: "delivery.admitted", data: { deliveryId: "d" } }),
  saved(1, 1, {
    type: "turn.started",
    data: { turnId: "t", follows: null, cause: { deliveryId: "d" } },
  }),
  saved(1, 2, {
    type: "delivery.consumed",
    data: { deliveryId: "d", turnId: "t", parts: [{ kind: "text", text: "Hello" }] },
  }),
  saved(12, 0, {
    type: "content.completed",
    scope: { turnId: "t" },
    data: { partId: "reasoning", kind: "reasoning", phase: "narration", value: "A short summary" },
  }),
  saved(25, 0, {
    type: "content.completed",
    scope: { turnId: "t" },
    data: { partId: "answer", kind: "text", phase: "reply", value: "Hello back" },
  }),
  saved(26, 0, {
    type: "turn.settled",
    data: { turnId: "t", outcome: "completed", reply: ["answer"] },
  }),
  saved(26, 1, {
    type: "delivery.settled",
    data: { deliveryId: "d", turnId: "t", outcome: "handled" },
  }),
  saved(27, 0, { type: "session.ended", data: { outcome: "completed" } }),
];

test("expired history replays through the actual Eve client with messages, reasoning and source positions", async () => {
  const fetch = mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const request = new Request(input);
    return restoreExpiredHistory(new Response(null, { status: 410 }), request, "chat-a", async () => events);
  });
  try {
    const client = new Client({ baseUrl: "https://example.com" });
    const snapshot = await client.sessions.attach("chat-a").snapshot();
    assert.equal(snapshot.session.streamIndex, 28);
    assert.equal(snapshot.events.length, events.length);
    assert.deepEqual(
      snapshot.events.map((event) => event.meta.position),
      events.map(({ line, eventIndex }) => ({ line, index: eventIndex })),
    );
    const conversation = conversationOf(snapshot.events);
    assert.equal(conversation.messages.length, 2);
    assert.deepEqual(
      conversation.messages[0].parts.map((part) => part.type === "text" && part.text),
      ["Hello"],
    );
    assert.deepEqual(
      conversation.messages[1].parts.map((part) =>
        (part.type === "text" || part.type === "reasoning") && part.text,
      ),
      ["A short summary", "Hello back"],
    );
    const store = new SessionStore({
      client,
      initialSession: { sessionId: "chat-a", streamIndex: 26 },
      initialEvents: snapshot.events.filter((event) => event.meta.position.line < 26),
    });
    await store.resume();
    assert.equal(store.snapshot.status, "idle");
    assert.equal(store.snapshot.events.length, events.length);
    assert.equal(store.snapshot.session?.streamIndex, 28);
    assert.deepEqual(store.snapshot.messages, conversation.messages);
  } finally {
    fetch.mock.restore();
  }
});

test("history fallback preserves cursor reads, negative offsets and private caching headers", async () => {
  for (const [cursor, lines] of [[13, [25, 26, 27]], [-2, [26, 27]], [28, []]] as const) {
    const response = await restoreExpiredHistory(
      new Response(null, { status: 404 }),
      new Request(`https://example.com/eve/v1/session/chat-a/stream?startIndex=${cursor}`),
      "chat-a", async () => events,
    );
    assert.match(response.headers.get("cache-control")!, /no-store/);
    assert.equal(response.headers.get("x-eve-stream-tail-index"), "27");
    const records = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    assert.deepEqual(records.filter((record) => record.$eve === "position").map((record) => record.next), lines);
    assert.deepEqual(records.at(-1), { $eve: "stream.ended" });
  }
});

test("live streams and authentication errors never use the archive", async () => {
  for (const status of [200, 400, 401, 403, 409, 503]) {
    const original = new Response(null, { status });
    assert.equal(await restoreExpiredHistory(original, new Request("https://example.com"), "chat-a", async () => {
      assert.fail("must not load archived content");
    }), original);
  }
  const original = new Response(null, { status: 410 });
  assert.equal(await restoreExpiredHistory(original, new Request("https://example.com"), "chat-a", async () => []), original);
});
