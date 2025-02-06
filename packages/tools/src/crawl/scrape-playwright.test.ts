import test from "ava";
import {
  CrawledItem,
  organizeAndSortData,
  scrapePlaywright,
} from "./scrape-playwright.js";

process.env.CRAWLEE_STORAGE_DIR = `/Users/joshua/dev/acai-monorepo/packages/tools/test-assets/storage`;

const isCrawledItems = (items: any): items is CrawledItem[] => {
  return items.every((item: any) => item.title && item.url);
};

test("scrapePlaywright", async (t) => {
  const result = await scrapePlaywright({
    urls: ["https://crawlee.dev"],
    datasetId: "crawlee-docs",
  });
  if (isCrawledItems(result.items)) {
    const organized = organizeAndSortData(result.items);
    t.log(organized);
  }
  t.pass();
});

test.skip("organizeAndSortData", (t) => {
  const testData = [
    { title: "Home", url: "https://example.com/" },
    { title: "About", url: "https://example.com/about" },
    { title: "Products", url: "https://example.com/products" },
    { title: "Product A", url: "https://example.com/products/a" },
    { title: "Product B", url: "https://example.com/products/b" },
    { title: "Blog", url: "https://example.com/blog" },
    { title: "Blog Post 2", url: "https://example.com/blog/post-2" },
    { title: "Blog Post 1", url: "https://example.com/blog/post-1" },
    { title: "Contact", url: "https://example.com/contact" },
  ];

  const result = organizeAndSortData(testData);
  t.log(result);
});
