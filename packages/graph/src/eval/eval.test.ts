import { HumanMessage } from "@langchain/core/messages";
import { evaluateModels } from "./index.js";
import test from "ava";
import "dotenv/config";

// test("evaluateModels using messages", async (t) => {
//   const responses = await evaluateModels({
//     messages: [new HumanMessage("What is the capital of the moon?")],
//     models: ["gpt-4o-mini", "llama-3.1-8b-instant", "claude-3-opus-20240229"],
//   });
//   t.log(responses);
//   t.pass();
// });

test("evaluateModels using prompt", async (t) => {
  const responses = await evaluateModels({
    prompt: "What is the capital of the moon?",
    models: ["gpt-3.5-turbo", "gpt-4", "claude-3-opus-20240229", "gemma-7b-it"],
  });
  t.log(responses);
  t.pass();
});
