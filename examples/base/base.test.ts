import test from "ava";
import { runChatbot } from "./base.js";

test("runChatbot", async (t) => {
  await runChatbot();
  t.pass();
});
