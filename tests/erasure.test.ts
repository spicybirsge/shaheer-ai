import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionNotActiveError } from "eve/sessions";
import { endOwnedSessions } from "../agent/lib/erasure";

test("erasure ends the current session owner and waits for its shutdown", async () => {
  const ended: string[] = [];
  const release = Promise.withResolvers<void>();
  let owner = "original-run";
  let finished = false;
  const erasure = endOwnedSessions(["chat-a"], (id) => ({
    async end({ reason }) {
      assert.equal(id, "chat-a");
      assert.equal(reason, "Account deletion");
      await release.promise;
      ended.push(owner);
    },
  })).then(() => {
    finished = true;
  });
  await Promise.resolve();
  assert.equal(finished, false);
  owner = "successor-run";
  release.resolve();
  await erasure;
  assert.deepEqual(ended, ["successor-run"]);
});

test("erasure tolerates inactive and expired sessions", async () => {
  await endOwnedSessions(["done", "expired"], (id) => ({
    async end() {
      if (id === "done") throw new SessionNotActiveError();
      throw Object.assign(new Error("gone"), { name: "RunExpiredError" });
    },
  }));
});

test("runtime failures and temporarily unavailable owners block erasure", async () => {
  for (const error of [
    new Error("runtime unavailable"),
    new SessionNotActiveError({ retryable: true }),
  ])
    await assert.rejects(
      endOwnedSessions(["active"], () => ({
        async end() {
          throw error;
        },
      })),
      (actual) => actual === error,
    );
});
