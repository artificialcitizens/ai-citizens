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
    // type assertion
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
  // @ts-expect-error stupid typing
  interruptBefore: ["action"],
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
