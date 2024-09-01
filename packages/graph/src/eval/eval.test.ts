import { evaluateModels } from "./index.js";
import test from "ava";
import "dotenv/config";

test("evaluateModels", async (t) => {
  const responses = await evaluateModels("What is the capital of the moon?");
  t.log(responses);
  t.pass();
});
