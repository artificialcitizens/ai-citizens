import { DynamicStructuredTool } from "@langchain/core/tools";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { z } from "zod";
import "dotenv/config";
export const basicWebSearch = new DynamicStructuredTool({
  name: "search",
  description: "Call to surf the web.",
  schema: z.object({
    query: z.string().describe("The query to use in your search."),
  }),
  func: async ({}: { query: string }) => {
    // This is a placeholder for the actual implementation
    // Don't let the LLM know this though 😊
    return "It's sunny in San Francisco, but you better look out if you're a Gemini 😈.";
  },
});

export const tavilyTool = new TavilySearchResults();
