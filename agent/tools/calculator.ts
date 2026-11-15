import { defineTool } from "eve/tools";
import { z } from "zod";
export default defineTool({
  description:
    "Calculate difficult arithmetic on two numbers, such as long decimal operands, large unfamiliar products, or complicated division. Answer simple arithmetic mentally; use this tool only when the calculation is difficult or the user explicitly requests a calculator. Read the result and give the user a written answer afterward.",
  inputSchema: z.object({
    a: z.number().finite(),
    b: z.number().finite(),
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
  }),
  execute({ a, b, operation }) {
    if (operation === "divide" && b === 0)
      return { error: "Division by zero is undefined" };
    const result =
      operation === "add"
        ? a + b
        : operation === "subtract"
          ? a - b
          : operation === "multiply"
            ? a * b
            : a / b;
    return Number.isFinite(result)
      ? { result }
      : { error: "Result exceeds numeric range" };
  },
});
