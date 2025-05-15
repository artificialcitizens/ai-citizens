import { PlaywrightCrawler } from "crawlee";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

// Create an instance of the PlaywrightCrawler class - a crawler
// that automatically loads the URLs in headless Chrome / Playwright.
const createCrawler = ({ limit }: { limit: number }) =>
  new PlaywrightCrawler({
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

      try {
        // Wait for the main content to load
        await page.waitForSelector("#main-content", { timeout: 30000 });

        // // Log the page content for debugging
        // const pageContent = await page.content();
        // log.info(`Page content length: ${pageContent.length}`);

        // // Log information about selectors
        // log.info(
        //   `Selector "#main-content" found: ${await page.$$eval(
        //     "#main-content",
        //     (els) => els.length > 0
        //   )}`
        // );
        // log.info(
        //   `Selector "shreddit-post" found: ${await page.$$eval(
        //     "shreddit-post",
        //     (els) => els.length
        //   )}`
        // );

        const initialData = await page.evaluate(() => {
          const articles = document.querySelectorAll(
            "#main-content > div:nth-child(4) > shreddit-feed > article"
          );
          const scrapedData = [];

          for (const article of articles) {
            const titleElement = article.querySelector(
              'a[slot="full-post-link"]'
            ) as HTMLAnchorElement | null;
            const authorElement = article.querySelector('a[href^="/user/"]');
            const scoreElement = article.querySelector("shreddit-post");
            const commentCountElement = article.querySelector("shreddit-post");
            const thumbnailElement = article.querySelector("faceplate-img");
            const shredditPostElement = article.querySelector("shreddit-post");

            scrapedData.push({
              title: titleElement ? titleElement.textContent?.trim() ?? "" : "",
              author: authorElement
                ? authorElement.textContent?.trim() ?? ""
                : "",
              score: scoreElement?.getAttribute("score") ?? "",
              commentCount:
                commentCountElement?.getAttribute("comment-count") ?? "",
              url: titleElement ? titleElement.href : "",
              contentHref:
                shredditPostElement?.getAttribute("content-href") ?? "",
              thumbnail: thumbnailElement?.getAttribute("src") ?? "",
              subreddit:
                shredditPostElement?.getAttribute("subreddit-prefixed-name") ??
                "",
              postId: shredditPostElement?.getAttribute("id") ?? "",
            });
          }
          return scrapedData;
        });

        // Scroll and wait for more content to load
        await page.evaluate(async () => {
          const scrollStep = 1000;
          const scrollDelay = 1000;
          const maxScrolls = 10;

          for (let i = 0; i < maxScrolls; i++) {
            window.scrollBy(0, scrollStep);
            await new Promise((resolve) => setTimeout(resolve, scrollDelay));
          }
        });
        const data = await page.evaluate(
          ({ evaluateLimit }: { evaluateLimit: number }) => {
            const articles = document.querySelectorAll("shreddit-post");

            const scrapedData = [];
            const filteredArticles = Array.from(articles).slice(
              0,
              evaluateLimit
            );
            filteredArticles.forEach((article, index) => {
              const titleElement = article.querySelector(
                'a[slot="full-post-link"]'
              ) as HTMLAnchorElement | null;
              const authorElement = article.querySelector('a[href^="/user/"]');
              const url = titleElement?.href ?? "";

              const scrapedItem = {
                title: titleElement?.textContent?.trim() ?? "",
                author: authorElement?.textContent?.trim() ?? "",
                upvotes: article.getAttribute("score") ?? "",
                commentCount: article.getAttribute("comment-count") ?? "",
                contentHref: article.getAttribute("content-href") ?? "",
                url,
                thumbnail:
                  article.querySelector("faceplate-img")?.getAttribute("src") ??
                  "",
                subreddit:
                  article.getAttribute("subreddit-prefixed-name") ?? "",
                postId: article.getAttribute("id") ?? "",
              };

              scrapedData.push(scrapedItem);
            });

            return scrapedData;
          },
          {
            evaluateLimit: limit - initialData.length,
          }
        );

        const finalData = [...initialData, ...data];
        pushData(finalData);
      } catch (error) {
        log.error(`Error processing ${request.url}: ${error}`);
      }
    },
  });

export const scrapeReddit = async ({
  subreddits,
  sortBy = "hot",
  timeRange = "hour",
  /**
   * max number of posts to scrape
   * (maximum 50)
   */
  limit = 50,
}: {
  subreddits: string[];
  sortBy?: "hot" | "top" | "new" | "rising";
  timeRange?: "hour" | "day" | "week" | "month" | "year" | "all";
  limit?: number;
}) => {
  const crawler = createCrawler({ limit });
  await crawler.addRequests(
    subreddits.map(
      (subreddit) =>
        `https://www.reddit.com/r/${subreddit}/${sortBy}/?t=${timeRange}`
    )
  );
  await crawler.run();
  const data = crawler.getData();
  return data;
};

export const scrapeRedditSchema = z.object({
  subreddits: z.array(z.string()).describe("The subreddits to scrape"),
  sortBy: z.enum(["hot", "top", "new", "rising"]).describe("The sort order"),
  timeRange: z
    .enum(["hour", "day", "week", "month", "year", "all"])
    .describe("The time range"),
});

export const scrapeRedditTool = tool(
  async ({ subreddits, sortBy, timeRange }) => {
    const result = await scrapeReddit({
      subreddits,
      sortBy,
      timeRange,
      limit: 10,
    });
    return JSON.stringify(result, null, 2);
  },
  {
    name: "scrapeReddit",
    description: "Search top posts from a given subreddit",
    schema: scrapeRedditSchema,
  }
);
