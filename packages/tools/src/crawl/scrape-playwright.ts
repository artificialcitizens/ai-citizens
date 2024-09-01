import { Dataset, PlaywrightCrawler } from "crawlee";

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
  // Use the requestHandler to process each of the crawled pages.
  async requestHandler({ enqueueLinks, log, page, request }) {
    const title = await page.title();
    log.info(`Title of ${request.loadedUrl} is '${title}'`);

    // Save results as JSON to ./storage/datasets/default
    await Dataset.pushData({ title, url: request.loadedUrl });

    // Extract links from the current page
    // and add them to the crawling queue.
    await enqueueLinks();
  },
  // Uncomment this option to see the browser window.
  // headless: false,
});

export const scrapePlaywright = async ({ urls }: { urls: string[] }) => {
  const result = await crawler.run(urls);
  return result;
};
