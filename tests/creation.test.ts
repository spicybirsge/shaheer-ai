import { test } from "node:test";
import assert from "node:assert/strict";
import { registerCreation } from "../agent/lib/creation";
test("creation does not expose session until ownership is stored", async () => {
  let saved = false;
  const response = Response.json({ sessionId: "wrun_test" }, { status: 202 });
  const result = await registerCreation(response, async (id) => {
    assert.equal(id, "wrun_test");
    await Promise.resolve();
    saved = true;
  });
  assert.equal(saved, true);
  assert.equal(result, response);
});
test("failed creation never creates an ownership record", async () => {
  const response = new Response("Unauthorized", { status: 401 });
  assert.equal(
    await registerCreation(response, async () => {
      assert.fail("must not persist failed creation");
    }),
    response,
  );
});
test("ownership persistence failures prevent a successful handoff", async () => {
  await assert.rejects(
    registerCreation(Response.json({ sessionId: "wrun_test" }), async () => {
      throw new Error("Database unavailable");
    }),
    /Database unavailable/,
  );
});
