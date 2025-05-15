import { scrapeReddit, scrapeRedditTool } from "./scrape-reddit.js";
import test from "ava";

test.skip("scrapeReddit", async (t) => {
  const result = await scrapeReddit({
    subreddits: ["comfyui"],
    limit: 10,
    sortBy: "top",
    timeRange: "week",
  });
  t.log(result);
  t.pass();
});

test("scrapeRedditTool", async (t) => {
  const result = await scrapeRedditTool.invoke({
    subreddits: ["comfyui"],
    sortBy: "top",
    timeRange: "week",
  });
  t.log(result);
  t.pass();
});
