import {
  END,
  MemorySaver,
  START,
  StateGraph,
  StateGraphArgs,
} from "@langchain/langgraph";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { generateGraphImg } from "../utils/generate-graph-img.js";
import { scaffoldLangGraphPrompt } from "./prompt/build-prompt.js";
import { getModel } from "@ai-citizens/llm";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { parseXml } from "@ai-citizens/utils";

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
  userRequest: string;
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
  userRequest: {
    default: () => "",
    value: (prev: string, next?: string) => next ?? prev,
  },
};

// Create the graph builder
const graphGeneratorBuilder = new StateGraph<GraphGeneratorState>({
  channels: graphGeneratorState,
});

// Add nodes to the graph
graphGeneratorBuilder
  .addNode("scaffoldGraph", async (state: GraphGeneratorState) => {
    // console.log("Scaffolding graph...");
    const systemPrompt = await scaffoldLangGraphPrompt();
    // const prompt = ChatPromptTemplate.fromMessages([
    //   new SystemMessage(systemPrompt),
    //   new HumanMessage(state.userRequest),
    // ]);
    // const modelName = "claude-3-5-sonnet-20240620";
    // const model = await getModel({
    //   model: modelName,
    // });
    // const parser = new StringOutputParser();
    // const chain = prompt.pipe(model).pipe(parser);
    // const response = await chain.invoke({ input: state.userRequest });
    // // extract graph from response from the <graph></graph> tags, we have to do this custom because the response is not in the correct format
    // const graph = response.match(/<graph>([\s\S]+)<\/graph>/)?.[1];
    const graph = "test";
    return {
      scaffoldedGraph: graph,
      messages: [
        new SystemMessage(systemPrompt),
        new HumanMessage(state.userRequest),
        new AIMessage(`Scaffolded graph:\n${graph}`),
      ],
    };
  })
  .addNode("qaCheck", async (state: GraphGeneratorState) => {
    console.log("QA checking...");
    if (state.qaResult.hasErrors) {
      // console.log(state.messages);
      // const prompt = ChatPromptTemplate.fromMessages(state.messages);
      // const modelName = "claude-3-5-sonnet-20240620";
      // const model = await getModel({
      //   model: modelName,
      // });
      // const parser = new StringOutputParser();
      // const chain = prompt.pipe(model).pipe(parser);
      // const response = await chain.invoke({ input: state.userRequest });
      // // extract graph from response from the <graph></graph> tags, we have to do this custom because the response is not in the correct format
      // const graph = response.match(/<graph>([\s\S]+)<\/graph>/)?.[1];
      const graph = "updated test";
      return {
        scaffoldedGraph: graph,
      };
    }
  })
  .addNode("planning", async (state: GraphGeneratorState) => {
    console.log("Planning next steps...");
    // Mock implementation: Generate a plan based on the scaffolded graph
    const planningResult =
      "1. Implement detailed logic for each node\n2. Add error handling\n3. Integrate with external APIs";
    return {
      planningResult,
      messages: [
        ...state.messages,
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
  interruptBefore: ["qaCheck"],
});
// const graphImg = generateGraphImg({
//   app: graphGeneratorGraph,
//   path: "./graph-generator-graph.png",
// });
// Example usage
export const runGraphGenerator = async (
  userRequest?: string,
  config?: {
    configurable: { thread_id: string };
  }
): Promise<GraphGeneratorState> => {
  let request = userRequest || "Generate a graph for a chatbot";
  const initialState: Partial<GraphGeneratorState> = {
    userRequest: request,
  };
  const finalState = await graphGeneratorGraph.invoke(initialState, config);
  return finalState;
};

export const resumeGraphGenerator = async (config?: {
  configurable: { thread_id: string };
}): Promise<GraphGeneratorState> => {
  return await graphGeneratorGraph.invoke(null, config);
};

export const updateGraphState = async (
  state: GraphGeneratorState,
  config?: {
    configurable: { thread_id: string };
  }
) => {
  graphGeneratorGraph.updateState(config, state);
};
