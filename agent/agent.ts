import { defineAgent } from "eve";
import { gateway, wrapLanguageModel } from "ai";
import { modelMiddleware } from "./lib/model-middleware";

export default defineAgent({
  defaultTools: false,
  tool: false,
  experimental: { workflow: { retention: 0 } },
  model: wrapLanguageModel({
    model: gateway("google/gemini-2.5-flash-lite"),
    middleware: modelMiddleware,
  }),
  reasoning: "provider-default",
  modelOptions: {
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 512, includeThoughts: true },
      },
    },
  },
  modelContextWindowTokens: 1000000,
  limits: {
    sessionUsage: ({ window }) =>
      window.outputTokens >= 30000 || window.inputTokens >= 200000,
  },
});
