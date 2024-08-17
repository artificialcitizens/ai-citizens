import test from "ava";
import { runPlanExecuteAgent } from "./planning-agent.js";

test("planning agent", async (t) => {
  const agent = await runPlanExecuteAgent();
  t.pass();
});
