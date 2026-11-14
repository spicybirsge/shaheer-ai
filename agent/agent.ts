import { defineAgent } from "eve";
import { gateway, wrapLanguageModel } from "ai";

export default defineAgent({
  defaultTools: false,
  tool: false,
  experimental: { workflow: { retention: 0 } },
  model: wrapLanguageModel({
    model: gateway("google/gemini-2.5-flash-lite"),
    middleware: {
      specificationVersion: "v4",
      transformParams: async ({ params }) => ({
        ...params,
        maxOutputTokens: 2048,
      }),
    },
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
