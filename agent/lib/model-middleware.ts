import { NoOutputGeneratedError, type LanguageModelMiddleware } from "ai";

// Eve allows an empty STOP in chat turns. Surface it as the SDK's no-output
// error so Eve applies its single recovery attempt and tool-result reminder.
export const modelMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v4",
  transformParams: async ({ params }) => ({
    ...params,
    maxOutputTokens: 8192,
  }),
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    if (
      result.finishReason.unified === "stop" &&
      !result.content.some(
        (part) =>
          (part.type === "text" && part.text.trim()) || part.type === "tool-call",
      )
    )
      throw new NoOutputGeneratedError();
    return result;
  },
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    let hasAnswer = false;
    let stopped = false;
    let failed = false;
    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream({
          transform(part, controller) {
            if (
              (part.type === "text-delta" && part.delta.trim()) ||
              part.type === "tool-call"
            )
              hasAnswer = true;
            if (part.type === "finish")
              stopped = part.finishReason.unified === "stop";
            if (part.type === "error") failed = true;
            controller.enqueue(part);
          },
          flush() {
            if (stopped && !hasAnswer && !failed)
              throw new NoOutputGeneratedError();
          },
        }),
      ),
    };
  },
};
