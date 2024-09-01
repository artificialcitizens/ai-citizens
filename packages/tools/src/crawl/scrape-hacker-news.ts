import { PlaywrightCrawler } from "crawlee";

// Create an instance of the PlaywrightCrawler class - a crawler
// that automatically loads the URLs in headless Chrome / Playwright.
const crawler = new PlaywrightCrawler({
  // This function is called if the page processing failed more than maxRequestRetries+1 times.
  failedRequestHandler({ log, request }) {
    log.info(`Request ${request.url} failed too many times.`);
  },

  launchContext: {
    // Here you can set options that are passed to the playwright .launch() function.
    launchOptions: {
      headless: true,
    },
  },

  // This function will be called for each URL to crawl.
  // Here you can write the Playwright scripts you are familiar with,
  // with the exception that browsers and pages are automatically managed by Crawlee.
  // The function accepts a single parameter, which is an object with a lot of properties,
  // the most important being:
  // - request: an instance of the Request class with information such as URL and HTTP method
  // Stop crawling after several pages
  maxRequestsPerCrawl: 50,

  // - page: Playwright's Page object (see https://playwright.dev/docs/api/class-page)
  async requestHandler({ enqueueLinks, log, page, pushData, request }) {
    log.info(`Processing ${request.url}...`);

    // A function to be evaluated by Playwright within the browser context.
    const data = await page.$$eval(".athing", ($posts) => {
      const scrapedData: { href: string; rank: string; title: string }[] = [];

      // We're getting the title, rank and URL of each post on Hacker News.
      for (const $post of $posts) {
        scrapedData.push({
          href: $post.querySelector(".title a")?.getAttribute("href") ?? "",
          rank: $post.querySelector(".rank")?.textContent ?? "",
          title: $post.querySelector(".title a")?.textContent ?? "",
        });
      }

      return scrapedData;
    });

    log.info(JSON.stringify(data, null, 2));
    // Store the results to the default dataset.
    await pushData(data);

    // Find a link to the next page and enqueue it if it exists.
    const infos = await enqueueLinks({
      selector: ".morelink",
    });

    if (infos.processedRequests.length === 0)
      log.info(`${request.url} is the last page!`);
  },
});

export const scrapeNews = async () => {
  await crawler.addRequests(["https://news.ycombinator.com/"]);
  const result = await crawler.run();
  return result;
};
