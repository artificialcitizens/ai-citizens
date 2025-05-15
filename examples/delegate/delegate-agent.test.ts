import test from "ava";
// import { runDelegateAgent } from "./delegate-agent.js";
// import { testSupervisor } from "./supervisor.node.js";
// import { graph } from "./graph.js";
import { HumanMessage } from "@langchain/core/messages";

test.skip("test supervisor node", async (t) => {
  // const result = await testSupervisor({ input: "write a report on birds." });
  // t.log(result);
  // t.is(result, "researcher");
  // const result2 = await testSupervisor({ input: "draw a diagram on birds." });
  // t.log(result2);
  // t.is(result2, "chart_generator");
  t.pass();
});

test.skip("test graph", async (t) => {
  // const result = await graph.invoke({
  //   messages: [
  //     new HumanMessage({
  //       content:
  //         "write a bar chart about the rise in crime in portland oregon over the last 5 years.",
  //     }),
  //   ],
  // });
  // t.log(result);
  t.pass();
});
