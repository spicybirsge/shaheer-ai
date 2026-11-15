import { test } from "node:test";
import assert from "node:assert/strict";
import { NoOutputGeneratedError, ToolLoopAgent, wrapLanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { modelMiddleware } from "../agent/lib/model-middleware";

type StreamResult = Awaited<ReturnType<MockLanguageModelV4["doStream"]>>;
type Chunk = StreamResult["stream"] extends ReadableStream<infer T> ? T : never;
const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};
const finish = (
  reason: Extract<Chunk, { type: "finish" }>["finishReason"]["unified"] = "stop",
): Chunk => ({
  type: "finish",
  finishReason: { unified: reason, raw: reason },
  usage,
});

async function stream(chunks: Chunk[]) {
  const model = wrapLanguageModel({
    model: new MockLanguageModelV4({
      doStream: async () => ({
        stream: new ReadableStream<Chunk>({
          start(controller) {
            chunks.forEach((chunk) => controller.enqueue(chunk));
            controller.close();
          },
        }),
      }),
    }),
    middleware: modelMiddleware,
  });
  const result = await model.doStream({ prompt: [] });
  const received: Chunk[] = [];
  const reader = result.stream.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return received;
}

test("empty STOP becomes the SDK no-output error used by Eve recovery", async () => {
  await assert.rejects(stream([finish()]), NoOutputGeneratedError.isInstance);
});

test("reasoning or whitespace alone cannot complete a response", async () => {
  for (const type of ["reasoning-delta", "text-delta"] as const) {
    await assert.rejects(
      stream([{ type, id: "p", delta: type === "text-delta" ? "  " : "Thinking" }, finish()]),
      NoOutputGeneratedError.isInstance,
    );
  }
});

test("answers and tool calls pass through with their finish metadata", async () => {
  for (const content of [
    { type: "text-delta", id: "p", delta: "400" },
    { type: "tool-call", toolCallId: "c", toolName: "calculator", input: '{"a":1,"b":2,"operation":"add"}' },
  ] satisfies Chunk[]) {
    const chunks = [content, finish()];
    assert.deepEqual(await stream(chunks), chunks);
  }
});

test("provider failures and filtered output retain their original signals", async () => {
  const chunks: Chunk[] = [{ type: "error", error: "provider failed" }, finish()];
  assert.deepEqual(await stream(chunks), chunks);
  assert.deepEqual(await stream([finish("content-filter")]), [finish("content-filter")]);
});

test("non-streaming empty responses also trigger recovery", async () => {
  const model = wrapLanguageModel({
    model: new MockLanguageModelV4({
      doGenerate: async () => ({ content: [], finishReason: { unified: "stop", raw: "STOP" }, usage, warnings: [] }),
    }),
    middleware: modelMiddleware,
  });
  await assert.rejects(async () => await model.doGenerate({ prompt: [] }), NoOutputGeneratedError.isInstance);
});

test("the SDK tool loop surfaces an empty stream as a recoverable no-output error", async () => {
  const model = wrapLanguageModel({
    model: new MockLanguageModelV4({
      doStream: async () => ({
        stream: new ReadableStream<Chunk>({
          start(controller) {
            controller.enqueue({ type: "stream-start", warnings: [] });
            controller.enqueue(finish());
            controller.close();
          },
        }),
      }),
    }),
    middleware: modelMiddleware,
  });
  const result = await new ToolLoopAgent({ model }).stream({ prompt: "Hello" });
  await assert.rejects(async () => {
    for await (const chunk of result.fullStream) {
      if (chunk.type === "error") throw chunk.error;
    }
  }, NoOutputGeneratedError.isInstance);
});
