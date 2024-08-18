import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";

// Define the Memory State interface
interface MemoryState {
  shortTermMemory: string[];
  longTermMemory: string[];
  currentQuery: string;
  conflictingMemories: string[];
  additionalQueries: string[];
  resolvedMemories: string[];
  error: string;
  messages: BaseMessage[];
}

// Define reducers for the state
const arrayReducer = <T>(prev: T[] = [], next?: T[]): T[] => {
  if (!next) return prev;
  return [...new Set([...prev, ...next])];
};

const stringReducer = (prev: string = "", next?: string): string =>
  next ?? prev;

// Define the graph state with reducers
const memoryGraphState: StateGraphArgs<MemoryState>["channels"] = {
  shortTermMemory: {
    default: () => [],
    value: arrayReducer,
  },
  longTermMemory: {
    default: () => [],
    value: arrayReducer,
  },
  currentQuery: {
    default: () => "",
    value: stringReducer,
  },
  conflictingMemories: {
    default: () => [],
    value: arrayReducer,
  },
  additionalQueries: {
    default: () => [],
    value: arrayReducer,
  },
  resolvedMemories: {
    default: () => [],
    value: arrayReducer,
  },
  error: {
    default: () => "",
    value: stringReducer,
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
const memoryGraphBuilder = new StateGraph<MemoryState>({
  channels: memoryGraphState,
});

// Add nodes and edges to the graph
memoryGraphBuilder
  .addNode("processQuery", async (state: MemoryState) => {
    console.log("Processing query:", state.currentQuery);
    // Mock implementation: Process the query and update short-term memory
    return {
      shortTermMemory: [
        ...state.shortTermMemory,
        `Processed: ${state.currentQuery}`,
      ],
    };
  })
  .addNode("checkConflicts", async (state: MemoryState) => {
    console.log("Checking for conflicts");
    // Mock implementation: Check for conflicts between short-term and long-term memory
    const conflicts = state.shortTermMemory.filter((mem) =>
      state.longTermMemory.some((ltm) =>
        ltm.toLowerCase().includes(mem.toLowerCase())
      )
    );
    return {
      conflictingMemories: conflicts,
    };
  })
  .addNode("resolveConflicts", async (state: MemoryState) => {
    console.log("Resolving conflicts");
    // Mock implementation: Resolve conflicts (in this case, prefer short-term memory)
    const resolved = state.conflictingMemories.map(
      (conflict) => `Resolved: ${conflict}`
    );
    return {
      resolvedMemories: resolved,
      longTermMemory: state.longTermMemory.filter(
        (mem) => !state.conflictingMemories.includes(mem)
      ),
    };
  })
  .addNode("generateAdditionalQueries", async (state: MemoryState) => {
    console.log("Generating additional queries");
    // Mock implementation: Generate additional queries based on current state
    const additionalQueries = state.shortTermMemory.map(
      (mem) => `Additional query for: ${mem}`
    );
    return {
      additionalQueries,
    };
  })
  .addNode("updateLongTermMemory", async (state: MemoryState) => {
    console.log("Updating long-term memory");
    // Mock implementation: Update long-term memory with resolved and short-term memories
    return {
      longTermMemory: [
        ...state.longTermMemory,
        ...state.resolvedMemories,
        ...state.shortTermMemory,
      ],
    };
  })
  .addNode("handleError", async (state: MemoryState) => {
    console.error("Error occurred:", state.error);
    // Mock implementation: Handle error and return a safe state
    return {
      error: `Handled: ${state.error}`,
      shortTermMemory: [],
      longTermMemory: state.longTermMemory,
    };
  })
  .addEdge(START, "processQuery")
  .addEdge("processQuery", "checkConflicts")
  .addEdge("checkConflicts", "resolveConflicts")
  .addEdge("resolveConflicts", "generateAdditionalQueries")
  .addEdge("generateAdditionalQueries", "updateLongTermMemory")
  .addEdge("updateLongTermMemory", END)
  .addConditionalEdges("checkConflicts", (state: MemoryState) => {
    return state.conflictingMemories.length > 0
      ? "resolveConflicts"
      : "generateAdditionalQueries";
  })
  .addConditionalEdges(START, (state: MemoryState) => {
    return state.error ? "handleError" : "processQuery";
  });

// Compile the graph
const memoryGraph = memoryGraphBuilder.compile();

// Function to process a query through the memory graph
export const processMemoryQuery = async (
  query: string,
  config?: { configurable: { thread_id: string } }
): Promise<MemoryState> => {
  const initialState: Partial<MemoryState> = {
    currentQuery: query,
    shortTermMemory: [],
    longTermMemory: [], // In a real implementation, this would be loaded from a persistent store
  };
  const finalState = await memoryGraph.invoke(initialState, config);
  return finalState;
};

// Function to stream the memory processing
export const streamMemoryProcessing = async (
  query: string,
  config?: { configurable: { thread_id: string } }
): Promise<IterableReadableStream<MemoryState>> => {
  const initialState: Partial<MemoryState> = {
    currentQuery: query,
    shortTermMemory: [],
    longTermMemory: [], // In a real implementation, this would be loaded from a persistent store
  };
  const stream = await memoryGraph.stream(initialState, {
    ...config,
    configurable: { ...config?.configurable, stream_events: true },
  });
  return stream;
};
