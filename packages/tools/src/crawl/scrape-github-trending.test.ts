import { scrapeGithubTrending } from "./scrape-github-trending.js";
import test from "ava";
import "dotenv/config";

test("scrapeGithubTrending", async (t) => {
  const result = await scrapeGithubTrending();
  t.log(result);
  t.pass();
});
