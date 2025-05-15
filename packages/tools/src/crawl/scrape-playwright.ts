import { PlaywrightCrawler, Dataset } from "crawlee";

export interface CrawledItem {
  title: string;
  url: string;
}
type OrganizedData = {
  [key: string]: OrganizedData | CrawledItem[];
};

export function organizeAndSortData(items: CrawledItem[]): OrganizedData {
  const organizedData: OrganizedData = {};

  items.forEach((item) => {
    const urlParts = new URL(item.url).pathname.split("/").filter(Boolean);
    let currentLevel: OrganizedData = organizedData;

    urlParts.forEach((part, index) => {
      if (!currentLevel[part]) {
        currentLevel[part] = index === urlParts.length - 1 ? [] : {};
      }
      if (index === urlParts.length - 1) {
        (currentLevel[part] as CrawledItem[]).push(item);
      } else {
        currentLevel = currentLevel[part] as OrganizedData;
      }
    });
  });

  // Sort items within each category
  const sortRecursively = (obj: OrganizedData) => {
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        (obj[key] as CrawledItem[]).sort((a, b) => a.url.localeCompare(b.url));
      } else if (typeof obj[key] === "object") {
        sortRecursively(obj[key] as OrganizedData);
      }
    });
  };

  sortRecursively(organizedData);
  return organizedData;
}

const crawler = new PlaywrightCrawler({
  async requestHandler({ request, page, enqueueLinks, log }) {
    const title = await page.title();
    log.info(`Title of ${request.loadedUrl} is '${title}'`);
    await Dataset.pushData({ title, url: request.loadedUrl });
    await enqueueLinks();
  },
  // When you turn off headless mode, the crawler
  // will run with a visible browser window.
  headless: true,

  // Let's limit our crawls to make our tests shorter and safer.
  maxRequestsPerCrawl: 50,
});

// Add first URL to the queue and start the crawl.

export const scrapePlaywright = async ({
  urls,
  datasetId = "default",
  keyValueStoreId = "default",
}: {
  urls: string[];
  datasetId?: string;
  keyValueStoreId?: string;
}) => {
  process.env.CRAWLEE_DEFAULT_DATASET_ID = datasetId;
  process.env.CRAWLEE_DEFAULT_KEY_VALUE_STORE_ID = keyValueStoreId;
  await crawler.run(urls);
  return crawler.getData();
};
