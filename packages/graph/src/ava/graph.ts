import { END, START, StateGraph } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { ChatbotState, avaGraphBuilder } from "./types.js";
import { routeNode } from "./route.node.js";
import { responseNode } from "./response.node.js";
import { actionNode } from "./action.node.js";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { v4 as uuidv4 } from "uuid";
import { memoryNode } from "./memory.node.js";

// Add nodes to the graph
avaGraphBuilder
  .addNode("route", routeNode)
  .addNode("respond", responseNode)
  .addNode("action", actionNode)
  .addNode("memory", memoryNode)
  .addEdge(START, "route")
  .addConditionalEdges("route", (state) => state.current_action, {
    respond: "respond",
    action: "action",
  })
  .addEdge("respond", "memory")
  .addEdge("action", "memory")
  .addEdge("memory", END);

// Compile the graph
const graph = avaGraphBuilder.compile({
  checkpointer: new MemorySaver(),
  // @ts-expect-error stupid typing
  // interruptBefore: ["action"],
});

// Function to process user input
export async function processChatInput({
  input,
  threadId,
  messages,
  memories,
}: {
  input: string;
  threadId: string;
  messages: BaseMessage[];
  memories: string[];
}): Promise<ChatbotState> {
  const config = { configurable: { thread_id: threadId } };
  const initialState: Partial<ChatbotState> = {
    user_query: input,
    messages,
    memories,
  };

  try {
    const finalState = await graph.invoke(initialState, config);
    return finalState;
  } catch (error) {
    console.error("Error processing chat input:", error);
    throw error;
  }
}

export async function streamChatInput(
  input: string,
  threadId: string
): Promise<IterableReadableStream<ChatbotState>> {
  const config = {
    configurable: {
      thread_id: threadId,
      stream_events: true,
      streamMode: "updates",
    },
  };
  const initialState: Partial<ChatbotState> = {
    user_query: input,
    messages: [],
  };

  try {
    for await (const chunk of await graph.stream(initialState, config)) {
      for (const [node, values] of Object.entries(chunk)) {
        console.log(`Receiving update from node: ${node}`);
        console.log(values);
        console.log("\n====\n");
      }
    }
    return new IterableReadableStream<ChatbotState>();
  } catch (error) {
    console.error("Error streaming chat input:", error);
    throw error;
  }
}
