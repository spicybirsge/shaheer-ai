import { test } from "node:test";
import assert from "node:assert/strict";
import { cancelOwnedRuns } from "../agent/lib/erasure";
test("erasure cancels only active owned runs and tolerates expired sessions", async () => {
  const cancelled: string[] = [];
  await cancelOwnedRuns(["active", "done", "expired"], (id) => ({
    get status() {
      return id === "expired"
        ? Promise.reject(
            Object.assign(new Error("gone"), {
              name: "WorkflowRunNotFoundError",
            }),
          )
        : Promise.resolve(id === "active" ? "running" : "completed");
    },
    cancel: async () => {
      cancelled.push(id);
    },
  }));
  assert.deepEqual(cancelled, ["active"]);
});
test("runtime failures block erasure instead of falsely reporting success", async () => {
  await assert.rejects(
    cancelOwnedRuns(["active"], () => ({
      status: Promise.resolve("running"),
      cancel: async () => {
        throw new Error("runtime unavailable");
      },
    })),
    /runtime unavailable/,
  );
});
