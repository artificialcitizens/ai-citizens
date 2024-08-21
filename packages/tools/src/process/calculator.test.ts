import { calculatorTool } from "./calculator.js";
import test from "ava";

test("adds 1 and 2", async (t) => {
  const result = await calculatorTool.invoke({
    operation: "add",
    number1: 1,
    number2: 2,
  });
  t.is(result, "3");
});
