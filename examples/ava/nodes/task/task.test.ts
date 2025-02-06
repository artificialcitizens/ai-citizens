import { taskNode } from "./task.node.js";
import test from "ava";
import "dotenv/config";

test("taskNode", async (t) => {
  const state = {
    user_query: "Order some groceries for me",
  };
  const result = await taskNode(state);
  t.log(result);
  t.pass();
});
