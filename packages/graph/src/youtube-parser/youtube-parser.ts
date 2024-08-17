import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import {
  extractLinks,
  fetchYoutube,
  parseTranscript,
} from "@ai-citizens/tools";
import { parseXml } from "@ai-citizens/utils";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { generateGraphImg } from "../utils/generate-graph-img.js";
import { PostgresSaver } from "../checkpointer/index.js";
// Define the YouTube video state interface
interface YouTubeVideoState {
  title: string;
  description: string;
  summary: string;
  relatedUrls: string[];
  url: string;
  highlights: string[];
  transcription: string;
  /*
    messages field for potential LLM interactions
  */
  messages: BaseMessage[];
  error: string;
}

const stringReducer = (prev: string = "", next?: string): string =>
  next ?? prev;
const arrayReducer = <T>(prev: T[] = [], next?: T[]): T[] => {
  if (!next) return prev;
  return [...prev, ...next];
};
// Update the graphState with specific reducers for YouTube video state
const youtubeGraphState: StateGraphArgs<YouTubeVideoState>["channels"] = {
  title: {
    default: () => "",
    value: stringReducer,
  },
  description: {
    default: () => "",
    value: stringReducer,
  },
  summary: {
    default: () => "",
    value: stringReducer,
  },
  relatedUrls: {
    default: () => [],
    value: (prev: string[] = [], next?: string[]): string[] => {
      if (!next) return prev;
      return [...new Set([...prev, ...next])];
    },
  },
  url: {
    default: () => "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    value: stringReducer,
  },
  highlights: {
    default: () => [],
    value: arrayReducer,
  },
  transcription: {
    default: () => "",
    value: (prev: string = "", next?: string): string => next ?? prev,
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

// Define the YouTube graph
const youtubeGraphBuilder = new StateGraph<YouTubeVideoState>({
  channels: youtubeGraphState,
});

youtubeGraphBuilder
  .addNode("getMetadata", async (state) => {
    // console.log("getMetadata", state);
    // Fetch metadata (title, url, etc.) from YouTube API
    try {
      const metadata = await fetchYoutube(state.url);

      if (metadata?.length > 0) {
        const videoData = metadata[0];
        return {
          title: videoData.metadata.title,
          description: videoData.metadata.description,
          transcription: videoData.pageContent,
        };
      }
    } catch (error) {
      // update to catch error and return state with error message to pass to handleMissingTranscription
      throw error;
    }
  })
  .addNode("getRelatedUrls", async (state) => {
    // console.log("getRelatedUrls", state);
    const { description } = state;
    const relatedUrlResponse = await extractLinks(description);
    // console.log("relatedUrlResponse", relatedUrlResponse);
    const relatedUrls = parseXml(relatedUrlResponse);
    const { scratchPad, extractedLinks } = relatedUrls;
    // will give info on how the model came to the conclusion
    // console.log("scratchPad", scratchPad);
    // @TODO: current prompt seems to be returning a single string instead of an array
    // console.log("relatedUrls", relatedUrls);
    // Fetch related URLs
    // Return updated state
    return {
      relatedUrls: extractedLinks?.length ? [extractedLinks] : [],
    };
  })
  // .addNode("extractHighlights", async (state) => {
  //   // console.log("extractHighlights", state);
  //   // Extract highlights from video content
  //   // Return updated state
  //   return {
  //     highlights: ["Highlight 1", "Highlight 2"],
  //   };
  // })
  .addNode("generateSummary", async (state) => {
    const { transcription } = state;
    const summaryResponse = await parseTranscript({
      transcript: transcription,
      modelName: "gpt-4o",
    });
    // console.log("generateSummary", summaryResponse);
    const parsedSummary = parseXml(summaryResponse);
    // console.log("parsedSummary", parsedSummary);
    const { key_insights, summary, points_of_contention } = parsedSummary;
    return {
      summary,
      highlights: [key_insights, points_of_contention],
    };
  })
  .addNode("handleMissingTranscription", async (state) => {
    return {
      title: "Brute Force Title",
      description: "Brute Force Description",
      transcription: "Brute Force Transcription",
    };
  })
  .addEdge(START, "getMetadata")
  .addEdge("getRelatedUrls", END)
  .addEdge("generateSummary", END)
  .addEdge("handleMissingTranscription", "getRelatedUrls")
  .addEdge("handleMissingTranscription", "generateSummary")
  .addConditionalEdges("getMetadata", (state) => {
    // @TODO: Need to fire additional logic if the transcription is empty
    // Example condition: if title is empty, go to error handling node
    // else move to the next nodes.
    return state.title
      ? // ? ["getRelatedUrls", "extractHighlights", "generateSummary"]
        ["getRelatedUrls", "generateSummary"]
      : "handleMissingTranscription";
  });

const checkpointer = PostgresSaver.fromConnString(
  "postgresql://postgres:password@localhost:54321/electric"
);
const youtubeGraph = youtubeGraphBuilder.compile({
  checkpointer,
});

// @TODO: Automate graph image generation and readme update
// const graphImg = generateGraphImg({
//   app: youtubeGraph,
//   path: "./youtube-graph.png",
// });
export const processYouTubeVideo = async (
  videoUrl?: string,
  config?: { configurable: { thread_id: string } }
): Promise<YouTubeVideoState> => {
  const initialState: Partial<YouTubeVideoState> = {
    url: videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  };
  const finalState = await youtubeGraph.invoke(initialState, config);
  return finalState;
};

// Example of how to use streaming
export const streamYouTubeVideoProcessing = async (
  videoUrl: string,
  config?: { configurable: { thread_id: string } }
): Promise<IterableReadableStream<YouTubeVideoState>> => {
  const initialState: Partial<YouTubeVideoState> = {
    url: videoUrl,
  };
  const stream = await youtubeGraph.stream(initialState, {
    ...config,
    configurable: { ...config?.configurable, stream_events: true },
  });
  return stream;
};
