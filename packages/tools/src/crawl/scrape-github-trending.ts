import { PlaywrightCrawler } from "crawlee";
import { tool } from "@langchain/core/tools";

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
      headless: false,
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
  async requestHandler({ log, page, pushData, request }) {
    log.info(`Processing ${request.url}...`);
    // A function to be evaluated by Playwright within the browser context.
    const data = await page.$$eval(".Box-row", ($trending) => {
      const scrapedData: {
        description: string;
        language: string;
        repoUrl: string;
        stars: string;
        title: string;
      }[] = [];

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const cleanString = (str: string) => str.replaceAll(/\s+/g, " ").trim();
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const cleanTitle = (str: string) =>
        str
          .replaceAll(/\s+/g, " ")
          .replaceAll(/\s*\/\s*/g, "/")
          .trim();

      for (const $trendingItem of $trending) {
        const lang = cleanString(
          $trendingItem.querySelector('[itemprop="programmingLanguage"]')
            ?.textContent ?? ""
        );
        const repoUrl = `https://github.com${
          $trendingItem.querySelector("h2 a")?.getAttribute("href") ?? ""
        }`;
        scrapedData.push({
          description: cleanString(
            $trendingItem.querySelector("p")?.textContent ?? ""
          ),
          language: lang,
          repoUrl,
          stars: cleanString(
            $trendingItem.querySelector(
              "div.f6.color-fg-muted.mt-2 > a:nth-child(2)"
            )?.textContent ?? ""
          ),
          title: cleanTitle(
            $trendingItem.querySelector("h2 a")?.textContent ?? ""
          ),
        });
      }

      return scrapedData;
    });

    // Store the results to the default dataset.
    await pushData(data);
  },
});

export const scrapeGithubTrending = async () => {
  await crawler.addRequests(["https://github.com/trending"]);
  const result = await crawler.run();
  return result;
};

export const scrapeGithubTrendingTool = tool(
  async () => {
    await scrapeGithubTrending();
    const data = await crawler.getData();
    return JSON.stringify(data, null, 2);
  },
  {
    name: "scrapeGithubTrending",
    description: "Fetch the GitHub trending page",
  }
);
