import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { tavilyTool } from "@ai-citizens/tools";
import "dotenv/config";
import { getModel } from "@ai-citizens/llm";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { parseXml } from "@ai-citizens/utils";
import { generateGraphImg } from "../utils/generate-graph-img.js";

// Define the search state interface
interface SearchState {
  query: string;
  searchResults: string[];
  lowQualitySearchResults: string[];
  sources: string[];
  keyPoints: string[];
  relatedQueries: string[];
  report: string;
  messages: BaseMessage[];
  error: string;
}

// Define reducers for each state field
const stringReducer = (prev: string = "", next?: string): string =>
  next ?? prev;
const arrayReducer = <T>(prev: T[] = [], next?: T[]): T[] => {
  if (!next) return prev;
  return [...new Set([...prev, ...next])];
};

// Define the graph state with specific reducers
const searchGraphState: StateGraphArgs<SearchState>["channels"] = {
  query: {
    default: () => "",
    value: stringReducer,
  },
  searchResults: {
    default: () => [],
    value: arrayReducer,
  },
  lowQualitySearchResults: {
    default: () => [],
    value: arrayReducer,
  },
  sources: {
    default: () => [],
    value: arrayReducer,
  },
  keyPoints: {
    default: () => [],
    value: arrayReducer,
  },
  relatedQueries: {
    default: () => [],
    value: arrayReducer,
  },
  report: {
    default: () => "",
    value: stringReducer,
  },
  messages: {
    default: () => [],
    value: arrayReducer,
  },
  error: {
    default: () => "",
    value: stringReducer,
  },
};

type TavilyResult = {
  title: string;
  content: string;
  url: string;
  score: number;
};
const searchGraphBuilder = new StateGraph<SearchState>({
  channels: searchGraphState,
});

const filterSearchResults = (
  results: TavilyResult[],
  minScore: number
): TavilyResult[] => {
  return results.filter((result) => result.score >= minScore);
};

const formatSearchResults = (
  results: TavilyResult[]
): { searchResults: string[]; sources: string[] } => {
  return results.reduce(
    (acc, result, index) => {
      acc.searchResults.push(
        `${result.title}\n\n${result.content}[${index + 1}]`
      );
      acc.sources.push(result.url);
      return acc;
    },
    { searchResults: [] as string[], sources: [] as string[] }
  );
};

export const performSearchNode = async (
  state: Partial<SearchState>
): Promise<Partial<SearchState>> => {
  console.log("Performing search for:", state.query);
  if (!state.query) {
    throw new Error("Query is required");
  }
  const results = await tavilyTool.invoke(state.query);
  const obj = JSON.parse(results);
  const filteredResults = filterSearchResults(obj, 0.5);
  const formattedResults = formatSearchResults(filteredResults);

  return {
    searchResults: formattedResults.searchResults,
    sources: formattedResults.sources,
    messages: [new HumanMessage({ content: state.query })],
  };
};

export const extractKeyPointsNode = async (
  state: Partial<SearchState>
): Promise<Partial<SearchState>> => {
  console.log("Extracting key points from search results");
  // map map the results to the sources
  const llm = await getModel({
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const promptMessage = `You will be given a user query and a piece of content that includes footnote references. Your task is to highlight key points from the content that are relevant to the user query, ensuring that you include the footnote number in any key highlights.
Here is the content with footnotes:
<content_with_footnotes>
${state.searchResults?.join("\n\n") || ""}
</content_with_footnotes>

And here is the user query:
<user_query>
${state.query || ""}
</user_query>

Your task is to:
1. Read through the content carefully.
2. Identify key points that are relevant to the user query.
3. For each key point, create a key_point that includes the relevant footnote number.
4. Format each key_point as follows: "This is a key_point[^X]" where X is the footnote number.

Here's an example of a properly formatted key_point:
<keyPoints>The Earth orbits around the Sun[^3]</keyPoints>

Please provide your key_points in the following format:
<key_points>
<key_point>First key_point[^X]</key_point>
<key_point>Second key_point[^Y]</key_point>
...
</key_points>

Where X, Y, etc. are the relevant footnote numbers.

Remember to only include information that is present in the given content and relevant to the user query. Do not add any information from your own knowledge.

Please provide your highlights now.`;

  const prompt = ChatPromptTemplate.fromMessages([
    new HumanMessage(promptMessage),
  ]);
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  // type assert response is a string
  if (typeof response.content === "string") {
    const parsed = await parseXml(response.content);
    const keyPoints = parsed.key_points;
    return {
      keyPoints: keyPoints.key_point,
    };
  } else {
    throw new Error("Response is not a string");
  }
};

export const generateRelatedQueriesNode = async (
  state: Partial<SearchState>,
  options?: RunnableConfig
): Promise<Partial<SearchState>> => {
  console.log("Generating related queries");
  const llm = await getModel({
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const promptMessage = `You are tasked with generating related queries based on a user's initial query and the corresponding search results. This will help users explore the topic further and discover additional relevant information.

Here is the user's original query:
<user_query>
${state.query || ""}
</user_query>

And here are the related search results:
<search_results>
${state.searchResults?.join("\n\n") || ""}
</search_results>

Your task is to analyze the user query and search results, then generate a set of related queries that would allow the user to explore the topic more deeply or from different angles.

Follow these steps:

1. Carefully read and understand the user's original query.
2. Review the search results, noting key themes, concepts, and related topics that appear.
3. Identify aspects of the topic that are not fully covered in the original query or search results but may be of interest to someone exploring this subject.
4. Generate 3-5 related queries that:
   a. Expand on different aspects of the original topic
   b. Explore related concepts or themes
   c. Address potential follow-up questions a user might have
   d. Cover alternative perspectives or viewpoints on the topic

5. Ensure that each related query is:
   a. Clearly worded and easy to understand
   b. Relevant to the original topic
   c. Distinct from the other generated queries
   d. Likely to provide valuable additional information

Format your response using the following XML structure:

<related_queries>
<query>First related query</query>
<query>Second related query</query>
<query>Third related query</query>
<query>Fourth related query (if applicable)</query>
<query>Fifth related query (if applicable)</query>
</related_queries>

Do not include any additional text, explanations, or commentary outside of the XML tags. Your entire response should be contained within the <related_queries> tags.`;

  const prompt = ChatPromptTemplate.fromMessages([
    new HumanMessage(promptMessage),
  ]);
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  if (typeof response.content === "string") {
    const parsed = await parseXml(response.content);
    return {
      relatedQueries: parsed.related_queries.query,
    };
  } else {
    throw new Error("Response is not a string");
  }
};

export const generateResponseNode = async (
  state: Partial<SearchState>,
  options?: RunnableConfig
): Promise<Partial<SearchState>> => {
  console.log("Generating response");
  const llm = await getModel({
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const promptMessage = `You are an AI assistant tasked with responding to a user's query and creating a brief report based on provided search results. Follow these instructions carefully:

1. You will be given a user's query and a set of search results.

2. First, read the user's query:
<query>
${state.query || ""}
</query>

3. Respond to the user's query directly and concisely based on the information available in the search results. Your response should be helpful and informative.

4. After responding to the query, create a small markdown-formatted report summarizing the key points from the search results. This report should:
   - Be concise and informative
   - Highlight the most relevant information related to the user's query
   - Be structured with appropriate headings and subheadings
   - Use bullet points or numbered lists where appropriate

5. Throughout the report, include footnote annotations to reference the search results. Use superscript numbers (e.g., [^1], [^2]) to indicate these references within the text.

6. At the end of the report, include a "References" section with the footnotes. Each footnote should correspond to a specific search result and provide a brief description or title of the source.

7. Format your entire response as follows:
   <response>
   [Your direct response to the user's query]
   </response>
   <report>
   [Your markdown-formatted report with footnote annotations]

   ## References
   [Footnotes with corresponding search result references]
   </report>

8. Ensure that your report is well-structured, easy to read, and provides valuable insights based on the search results.

Here are the search results to use for your response and report:
<search_results>
${state.searchResults?.join("\n\n") || ""}
</search_results>
<sources>
${
  state.sources
    ?.map((source, index) => `[${index + 1}] ${source}`)
    .join("\n\n") || ""
}
</sources>

Remember to maintain a professional and informative tone throughout your response and report.`;

  const prompt = ChatPromptTemplate.fromMessages([
    new HumanMessage(promptMessage),
  ]);
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  if (typeof response.content === "string") {
    const {
      response: responseContent,
      report,
    }: { response: string; report: string } = await parseXml(response.content);
    return {
      report,
      messages: [new AIMessage({ content: responseContent })],
    };
  } else {
    throw new Error("Response is not a string");
  }
};

searchGraphBuilder
  .addNode("performSearch", performSearchNode)
  .addNode("extractKeyPoints", extractKeyPointsNode)
  .addNode("generateRelatedQueries", generateRelatedQueriesNode)
  .addNode("generateResponse", generateResponseNode)
  .addEdge(START, "performSearch")
  .addEdge("performSearch", "extractKeyPoints")
  .addEdge("performSearch", "generateRelatedQueries")
  .addEdge("extractKeyPoints", "generateResponse")
  .addEdge("generateRelatedQueries", "generateResponse")
  .addEdge("generateResponse", END);

const searchGraph = searchGraphBuilder.compile();
// const graphImg = generateGraphImg({
//   app: searchGraph,
//   path: "./search-graph.png",
// });
export const performSearch = async (
  query: string,
  config: { configurable: { thread_id: string } }
): Promise<SearchState> => {
  const initialState: Partial<SearchState> = {
    query,
  };
  const finalState = await searchGraph.invoke(initialState, config);
  return finalState;
};

export const streamSearchProcess = async (
  query: string,
  config: { configurable: { thread_id: string } }
): Promise<IterableReadableStream<SearchState>> => {
  const initialState: Partial<SearchState> = {
    query,
  };
  const stream = await searchGraph.stream(initialState, {
    ...config,
    configurable: { ...config?.configurable, stream_events: true },
  });
  return stream;
};
