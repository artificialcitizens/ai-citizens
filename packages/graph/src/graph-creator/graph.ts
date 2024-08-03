import {
  END,
  MemorySaver,
  START,
  StateGraph,
  StateGraphArgs,
} from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { generateGraphImg } from "../utils/generate-graph-img.js";

// Define the state interface for the graph generator
interface GraphGeneratorState {
  scaffoldedGraph: string;
  qaResult: {
    hasErrors: boolean;
    errorMessages: string[];
  };
  userApproval: boolean;
  planningResult: string;
  messages: BaseMessage[];
}

// Define the state channels with reducers
const graphGeneratorState: StateGraphArgs<GraphGeneratorState>["channels"] = {
  scaffoldedGraph: {
    default: () => "",
    value: (prev: string, next?: string) => next ?? prev,
  },
  qaResult: {
    default: () => ({ hasErrors: false, errorMessages: [] }),
    value: (prev, next?) => next ?? prev,
  },
  userApproval: {
    default: () => false,
    value: (prev: boolean, next?: boolean) => next ?? prev,
  },
  planningResult: {
    default: () => "",
    value: (prev: string, next?: string) => next ?? prev,
  },
  messages: {
    default: () => [],
    value: (prev: BaseMessage[] = [], next?: BaseMessage[]): BaseMessage[] => {
      if (!next) return prev;
      return [...prev, ...next];
    },
  },
};

// Create the graph builder
const graphGeneratorBuilder = new StateGraph<GraphGeneratorState>({
  channels: graphGeneratorState,
});

// Add nodes to the graph
graphGeneratorBuilder
  .addNode("scaffoldGraph", async (state: GraphGeneratorState) => {
    console.log("Scaffolding graph...");
    // Mock implementation: Generate a basic graph structure
    const scaffoldedGraph = `
      const exampleGraph = new StateGraph({
        channels: {
          // Add channels here
        }
      });
      
      exampleGraph
        .addNode("nodeA", (state) => { /* Logic for nodeA */ })
        .addNode("nodeB", (state) => { /* Logic for nodeB */ })
        .addEdge(START, "nodeA")
        .addEdge("nodeA", "nodeB")
        .addEdge("nodeB", END);
    `;
    return { scaffoldedGraph };
  })
  .addNode("qaCheck", async (state: GraphGeneratorState) => {
    console.log("Performing QA check...");
    // Mock implementation: Perform linting and error checking
    const hasErrors = Math.random() < 0.3; // 30% chance of errors for demonstration
    const errorMessages = hasErrors
      ? ["Linting error on line 5", "Missing type annotation for nodeB"]
      : [];
    return {
      qaResult: { hasErrors, errorMessages },
      messages: [
        new AIMessage(
          `QA Check completed. ${
            hasErrors ? "Errors found." : "No errors found."
          }`
        ),
      ],
    };
  })
  .addNode("planning", async (state: GraphGeneratorState) => {
    console.log("Planning next steps...");
    // Mock implementation: Generate a plan based on the scaffolded graph
    const planningResult =
      "1. Implement detailed logic for each node\n2. Add error handling\n3. Integrate with external APIs";
    return {
      planningResult,
      messages: [
        new AIMessage(`Planning completed. Next steps:\n${planningResult}`),
      ],
    };
  })
  .addEdge(START, "scaffoldGraph")
  .addEdge("scaffoldGraph", "qaCheck")
  .addEdge("qaCheck", "planning")
  .addEdge("planning", END);

// **Persistence**
// Human-in-the-loop workflows require a checkpointer to ensure
// nothing is lost between interactions
const checkpointer = new MemorySaver();

// Compile the graph
const graphGeneratorGraph = graphGeneratorBuilder.compile({
  checkpointer,
  // @ts-expect-error stupid typing
  interruptBefore: ["planning"],
});
const graphImg = generateGraphImg({
  app: graphGeneratorGraph,
  path: "./graph-generator-graph.png",
});
// Example usage
export const runGraphGenerator = async (
  userRequest?: string,
  config?: {
    configurable: { thread_id: string };
  }
): Promise<GraphGeneratorState> => {
  let request = userRequest || "Generate a graph for a chatbot";
  const userMessage = new HumanMessage(request);
  const initialState: Partial<GraphGeneratorState> = {
    messages: [userMessage],
  };
  const finalState = await graphGeneratorGraph.invoke(initialState, config);
  return finalState;
};

export const resumeGraphGenerator = async (config?: {
  configurable: { thread_id: string };
}): Promise<GraphGeneratorState> => {
  return await graphGeneratorGraph.invoke(null, config);
};
