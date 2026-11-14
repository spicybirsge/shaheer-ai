import { test } from "node:test";
import assert from "node:assert/strict";
import persist from "../agent/hooks/persist";
test("token and tool progress never wait for Postgres persistence", async () => {
  const handler = persist.events["*"]!;
  const context = new Proxy(
    {},
    {
      get() {
        throw new Error("Progress must not read context or open database");
      },
    },
  ) as Parameters<typeof handler>[1];
  await assert.doesNotReject(async () => {
    await handler(
      {
        type: "content.delta",
        data: {
          partId: "reasoning",
          kind: "reasoning",
          delta: "Checking the calculation",
        },
      },
      context,
    );
    await handler(
      {
        type: "content.delta",
        data: { partId: "reasoning", delta: " before answering." },
      },
      context,
    );
    await handler(
      {
        type: "content.delta",
        data: { partId: "p", kind: "text", delta: "Hello" },
      },
      context,
    );
    await handler(
      { type: "content.delta", data: { partId: "p", delta: " world" } },
      context,
    );
  });
});
