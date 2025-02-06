import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { END, StateGraphArgs, START, StateGraph } from "@langchain/langgraph";
import { members, createSupervisorChain } from "./supervisor.node.js";
import { groqModel, openAiModel } from "@ai-citizens/llm";
import { barChartTool, tavilyTool } from "@ai-citizens/tools";
import { generateGraphImg } from "../../utils/generate-graph-img.js";

const llm = groqModel({
  temperature: 0.2,
  model: "llama-3.1-8b-instant",
});

interface AgentStateChannels {
  messages: BaseMessage[];
  // The agent node that last performed work
  next: string;
}

// This defines the object that is passed between each node
// in the graph. We will create different nodes for each agent and tool
const agentStateChannels: StateGraphArgs<AgentStateChannels>["channels"] = {
  messages: {
    value: (x?: BaseMessage[], y?: BaseMessage[]) => (x ?? []).concat(y ?? []),
    default: () => [],
  },
  next: {
    value: (x?: string, y?: string) => y ?? x ?? END,
    default: () => END,
  },
};
// // Recall llm was defined as ChatOpenAI above
// // It could be any other language model
// const researcherAgent = await createAgent(
//   llm,
//   [tavilyTool],
//   "You are a web researcher. You may use the Tavily search engine to search the web for" +
//     " important information, so the Chart Generator in your team can make useful plots."
// );

const researcherNode = async (
  state: AgentStateChannels,
  config?: RunnableConfig
) => {
  console.log("Running researcher node");
  const researcherAgent = llm.bindTools([tavilyTool]);
  const { messages } = state;
  const systemPrompt =
    "You are a web researcher. You may use the Tavily search engine to search the web for" +
    " important information, so the Chart Generator in your team can make useful plots.";
  const result = await researcherAgent.invoke(
    [new SystemMessage({ content: systemPrompt }), ...messages],
    config
  );
  console.log("Researcher node result", result);
  return {
    messages: [
      new HumanMessage({ content: result.content, name: "Researcher" }),
    ],
  };
};

// const chartGenAgent = await createAgent(
//   llm,
//   [barChartTool],
//   "You excel at generating bar charts. Use the researcher's information to generate the charts."
// );

const chartGenNode = async (
  state: AgentStateChannels,
  config?: RunnableConfig
) => {
  console.log("Running chart gen node");
  const chartGenAgent = llm.bindTools([barChartTool]);
  const { messages } = state;
  const systemPrompt =
    "You are a chart generator. You will be given a list of data and asked to generate a bar chart.";
  const result = await chartGenAgent.invoke(
    [new SystemMessage({ content: systemPrompt }), ...messages],
    config
  );
  console.log("Chart gen node result", result);
  return {
    messages: [
      new HumanMessage({ content: result.content, name: "ChartGenerator" }),
    ],
  };
};

export const supervisorNode = async (
  state: AgentStateChannels,
  config?: RunnableConfig
): Promise<Partial<AgentStateChannels>> => {
  const supervisorChain = await createSupervisorChain();
  const result = await supervisorChain.invoke(
    {
      messages: state.messages,
    },
    config
  );

  return {
    messages: state.messages.concat([
      new HumanMessage({ content: result, name: "Supervisor" }),
    ]),
    next: result,
  };
};
// 1. Create the graph
const workflow = new StateGraph({
  channels: agentStateChannels,
}) // 2. Add the nodes; these will do the work
  .addNode("researcher", researcherNode)
  .addNode("chart_generator", chartGenNode)
  // @ts-ignore
  .addNode("supervisor", supervisorNode);
// 3. Define the edges. We will define both regular and conditional ones
// After a worker completes, report to supervisor
members.forEach((member) => {
  if (member === "researcher" || member === "chart_generator") {
    workflow.addEdge(member, "supervisor");
  }
});
workflow.addConditionalEdges("supervisor", (x: AgentStateChannels) => x.next);

workflow.addEdge(START, "supervisor");

export const graph = workflow.compile();

// const image = generateGraphImg({ app: graph, path: "./graph.png" });
// const streamResults = graph.stream(
//   {
//     messages: [
//       new HumanMessage({
//         content: "What were the 3 most popular tv shows in 2023?",
//       }),
//     ],
//   },
//   { recursionLimit: 100 }
// );

// for await (const output of await streamResults) {
//   if (!output?.__end__) {
//     console.log(output);
//     console.log("----");
//   }
// }
