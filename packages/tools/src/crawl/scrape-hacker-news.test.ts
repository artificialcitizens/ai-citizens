import { scrapeNews } from "./scrape-hacker-news.js";
import test from "ava";
import "dotenv/config";

test("scrapeNews", async (t) => {
  const result = await scrapeNews();
  t.log(result);
  t.pass();
});
