# YouTube Parser

A set of tools for processing YouTube videos and channels, extracting metadata, transcriptions, and generating summaries.

## Features

- Process individual YouTube videos to extract metadata, transcript, and generate summaries
- Process entire YouTube channels to analyze all videos
- Extract related URLs mentioned in video descriptions
- Generate highlights from video content
- Support for both YouTube channel IDs and usernames/handles

## Video Parser

The Video Parser processes individual YouTube videos:

```typescript
import { processYouTubeVideo } from "@ai-citizens/graph";

// Process a single video
const result = await processYouTubeVideo(
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  {
    configurable: { thread_id: "unique_id" },
  }
);

console.log(result.title);
console.log(result.summary);
console.log(result.highlights);
```

## Channel Parser

The Channel Parser processes all videos from a YouTube channel:

```typescript
import { processYouTubeChannel } from "@ai-citizens/graph";

// Process a channel using channel ID
const resultById = await processYouTubeChannel("UCgNqpQrALMzm-Em3BWaQmYg", {
  configurable: { thread_id: "channel_thread_id" },
  maxResults: 10, // Process up to 10 videos
});

// Process a channel using username (with or without @ symbol)
const resultByUsername = await processYouTubeChannel("aiDotEngineer", {
  configurable: { thread_id: "channel_thread_id" },
  maxResults: 5,
});

// Process a channel using handle (with @ symbol)
const resultByHandle = await processYouTubeChannel("@aiDotEngineer", {
  configurable: { thread_id: "channel_thread_id" },
  maxResults: 5,
});

// Access the results
console.log(`Channel: ${resultById.channelTitle}`);
console.log(`Videos processed: ${resultById.videos.length}`);

// Loop through videos
resultById.videos.forEach((video) => {
  console.log(`Video: ${video.title}`);
  console.log(`Summary: ${video.summary}`);
});
```

## Example Scripts

### Process Single Channel

Run the single channel processing script:

```bash
# Process a channel by ID
npx tsx packages/graph/src/youtube-parser/examples/process-channel.ts UCgNqpQrALMzm-Em3BWaQmYg 5

# Process a channel by username
npx tsx packages/graph/src/youtube-parser/examples/process-channel.ts aiDotEngineer 5

# Process a channel by handle
npx tsx packages/graph/src/youtube-parser/examples/process-channel.ts @aiDotEngineer 5
```

The second parameter (5) is optional and specifies the maximum number of videos to process.

### Batch Process Multiple Channels

Run the batch processing script:

```bash
# Process channels from the pre-defined list (edit the script to add channels)
npx tsx packages/graph/src/youtube-parser/examples/batch-process-channels.ts

# Process channels in parallel
npx tsx packages/graph/src/youtube-parser/examples/batch-process-channels.ts parallel

# Process specific channels from command line
npx tsx packages/graph/src/youtube-parser/examples/batch-process-channels.ts sequential UCgNqpQrALMzm-Em3BWaQmYg @aiDotEngineer
```

## LangChain Tools

This package also exports structured tools for use with LangChain:

```typescript
import { youtubeGraphTool, youtubeChannelGraphTool } from "@ai-citizens/graph";

// Add the tools to your LangChain agent
const tools = [youtubeGraphTool, youtubeChannelGraphTool];
```

## Integration

This module is part of the AI Citizens project and integrates with:

- The Graph module for LangGraph state management
- The Tools module for various AI and web interaction tools

## Notes

- Processing channels with many videos may take some time.
- The YouTube API has rate limits, so be cautious when processing many channels in quick succession.
- Some videos may not have transcripts available, which will limit the summary quality.

```ts
import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";

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
    console.log("getMetadata", state);
    // Fetch metadata (title, url, etc.) from YouTube API
    // Return updated state or catch error to send to handleError node
    // if error {
    //   return {
    //     error: "Error in processing video metadata",
    // };
    // }
    return {
      title: "Test Title",
      description: "Test Description",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      transcription: "Test Transcription",
    };
  })
  .addNode("getRelatedUrls", async (state) => {
    console.log("getRelatedUrls", state);
    // Fetch related URLs
    // Return updated state
    return {
      relatedUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    };
  })
  .addNode("extractHighlights", async (state) => {
    console.log("extractHighlights", state);
    // Extract highlights from video content
    // Return updated state
    return {
      highlights: ["Highlight 1", "Highlight 2"],
    };
  })
  .addNode("generateSummary", async (state) => {
    console.log("generateSummary", state);
    // Generate summary of the video
    // Return updated state
    return {
      summary: "Test Summary",
    };
  })
  .addNode("handleMissingTranscription", async (state) => {
    console.log("Error in processing video metadata");
    // @TODO: will use a more brute force method by ripping the audio from the video and transcribing ourselves
    // we still want the meta data from the video though and will need to process in some capacity
    return {
      title: "Test Title",
      description: "Test Description",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      transcription: "Brute Forced Test Transcription",
    };
  })
  .addEdge(START, "getMetadata")
  .addEdge("getMetadata", "getRelatedUrls")
  .addEdge("getMetadata", "extractHighlights")
  .addEdge("getMetadata", "generateSummary")
  .addEdge("getRelatedUrls", END)
  .addEdge("extractHighlights", END)
  .addEdge("generateSummary", END)
  .addEdge("handleMissingTranscription", "getRelatedUrls")
  .addEdge("handleMissingTranscription", "extractHighlights")
  .addEdge("handleMissingTranscription", "generateSummary")
  .addConditionalEdges("getMetadata", (state) => {
    // Example condition: if title is empty, go to error handling node
    // else move to the next nodes
    return state.title
      ? ["getRelatedUrls", "extractHighlights", "generateSummary"]
      : "handleMissingTranscription";
  });
const youtubeGraph = youtubeGraphBuilder.compile();

export const processYouTubeVideo = async (
  videoUrl: string,
  config?: { configurable: { thread_id: string } }
): Promise<YouTubeVideoState> => {
  const initialState: Partial<YouTubeVideoState> = {
    url: videoUrl,
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
```

```ts
import { END, START, StateGraph } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

// Define the state interface
interface ChatbotState {
  messages: BaseMessage[];
  current_action: "respond" | "action";
}

// Define the graph builder
const graphBuilder = new StateGraph<ChatbotState>({
  channels: {
    messages: {
      default: () => [],
      reducer: (prev: BaseMessage[], next: BaseMessage[]) => [...prev, ...next],
    },
    current_action: {
      default: () => "respond",
      reducer: (_, next) => next,
    },
  },
});

// Add nodes to the graph
graphBuilder
  .addNode("route", (state: ChatbotState) => {
    console.log("Routing user query");
    // Mock implementation of routing logic
    const lastMessage = state.messages[state.messages.length - 1];
    const content =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);
    if (content.toLowerCase().includes("action")) {
      return { current_action: "action" };
    }
    return { current_action: "respond" };
  })
  .addNode("respond", (state: ChatbotState) => {
    console.log("Generating response");
    // Mock implementation of response generation
    return {
      messages: [new AIMessage("This is a mock response to your query.")],
    };
  })
  .addNode("action", (state: ChatbotState) => {
    console.log("Performing action");
    // Mock implementation of action execution
    return {
      messages: [new AIMessage("I have performed the requested action.")],
    };
  })
  .addEdge(START, "route")
  .addConditionalEdges("route", (state) => state.current_action as string, {
    respond: "respond",
    action: "action",
  })
  .addEdge("respond", END)
  .addEdge("action", END);

// Compile the graph
const graph = graphBuilder.compile({
  checkpointer: new MemorySaver(),
});

// Function to process user input
async function processChatInput(
  input: string,
  threadId: string
): Promise<ChatbotState> {
  const config = { configurable: { thread_id: threadId } };
  const initialState: Partial<ChatbotState> = {
    messages: [new HumanMessage(input)],
  };

  try {
    const finalState = await graph.invoke(initialState, config);
    return finalState;
  } catch (error) {
    console.error("Error processing chat input:", error);
    throw error;
  }
}

export async function runChatbot() {
  const threadId = "example-thread";
  const userInput = "Hello, how are you?";

  try {
    const result = await processChatInput(userInput, threadId);
    console.log("Final state:", result);
  } catch (error) {
    console.error("Chatbot error:", error);
  }

  const newInput = "Hello, can you help me with this action?";
  try {
    const result = await processChatInput(newInput, threadId);
    console.log("Final state:", result);
  } catch (error) {
    console.error("Chatbot error:", error);
  }
}
```

```ts
import { END, START, StateGraph } from "@langchain/langgraph";
import { PromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";

interface PlanExecuteState {
  input: string;
  plan: string[];
  pastSteps: [string, string][];
  response?: string;
}

const planExecuteGraph = new StateGraph<PlanExecuteState>({
  channels: {
    input: {
      value: (left?: string, right?: string) => right ?? left ?? "",
    },
    plan: {
      value: (x?: string[], y?: string[]) => y ?? x ?? [],
      default: () => [],
    },
    pastSteps: {
      value: (x: [string, string][], y: [string, string][]) => x.concat(y),
      default: () => [],
    },
    response: {
      value: (x?: string, y?: string) => y ?? x,
      default: () => undefined,
    },
  },
});

export const planningNode = async (state: PlanExecuteState) => {
  console.log("Planning for input:", state.input);
  const mockedPlan = [
    "1. Choose a date and venue",
    "2. Create a guest list",
    "3. Plan decorations and theme",
    "4. Arrange food and drinks",
    "5. Organize entertainment",
  ];
  return { plan: mockedPlan };
};

export const executionNode = async (state: PlanExecuteState) => {
  const currentStep = state.plan[0];
  console.log("Executing step:", currentStep);
  const mockedStepResult = `Completed: ${currentStep}`;
  return {
    plan: state.plan.slice(1),
    pastSteps: [[currentStep, mockedStepResult]],
  };
};

export const responderNode = async (state: PlanExecuteState) => {
  console.log("Generating response based on executed steps");
  const mockedResponse =
    "The surprise birthday party has been successfully planned with all necessary arrangements made.";
  return { response: mockedResponse };
};

const conditionalEdge = (state: PlanExecuteState) => {
  if (state.plan.length > 0) {
    console.log("Moving to executor");
    return "executor";
  }
  console.log("Moving to responder");
  return "responder";
};

planExecuteGraph
  .addNode("planner", planningNode)
  .addNode("executor", executionNode)
  .addNode("responder", responderNode)
  .addEdge(START, "planner")
  .addEdge("planner", "executor")
  .addConditionalEdges("executor", conditionalEdge)
  .addEdge("responder", END);

// Compile the graph
const graph = planExecuteGraph.compile();

// Function to process user input
async function processPlanExecuteInput(
  input: string
): Promise<PlanExecuteState> {
  const initialState: PlanExecuteState = {
    input,
    plan: [],
    pastSteps: [],
  };

  try {
    const finalState = await graph.invoke(initialState);
    return finalState;
  } catch (error) {
    console.error("Error processing input:", error);
    throw error;
  }
}

export async function runPlanExecuteAgent() {
  const userInput = "Plan a surprise birthday party for my best friend";

  try {
    const result = await processPlanExecuteInput(userInput);
    console.log("Final state:", result);
    console.log("Response:", result.response);
  } catch (error) {
    console.error("Planning agent error:", error);
  }
}
```
