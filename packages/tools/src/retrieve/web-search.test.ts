import test from "ava";
import { basicWebSearch } from "./web-search.js";

test("basicWebSearch", async (t) => {
  const result = await basicWebSearch.invoke({
    query: "What is the weather in Tokyo?",
  });
  t.log(result);
  t.is(
    result,
    "It's sunny in San Francisco, but you better look out if you're a Gemini 😈."
  );
});
