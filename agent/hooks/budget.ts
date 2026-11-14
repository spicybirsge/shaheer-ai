import { defineHook } from "eve/hooks";
import { defineState } from "eve/context";
const budget = defineState("shaheer.turn-budget", () => ({
  turnId: "",
  calls: 0,
}));
export default defineHook({
  events: {
    "model.requested"(_event, ctx) {
      const turnId = ctx.turn?.id ?? "";
      const previous = budget.get();
      const calls = previous.turnId === turnId ? previous.calls + 1 : 1;
      budget.update(() => ({ turnId, calls }));
      if (calls > 4)
        ctx.cancel(
          "This response reached its computation limit. Please send a follow-up.",
        );
    },
  },
});
