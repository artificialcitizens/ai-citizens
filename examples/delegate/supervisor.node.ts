import { getModel, openAiModel, groqModel } from "@ai-citizens/llm";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { END, StateGraphArgs, START, StateGraph } from "@langchain/langgraph";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { generateGraphImg } from "../../utils/generate-graph-img.js";
import { z } from "zod";

const weatherTool = tool((_) => "no-op", {
  name: "get_current_weather",
  description: "Get the current weather",
  schema: z.object({
    location: z.string(),
  }),
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

export const members = ["researcher", "chart_generator"];

const systemPrompt =
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. Given the following user request," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results and status. When finished," +
  " respond with FINISH.";
const options = [END, ...members];

// Define the routing function
const functionDef = {
  name: "route",
  description: "Select the next role.",
  parameters: {
    title: "routeSchema",
    type: "object",
    properties: {
      next: {
        title: "Next",
        anyOf: [{ enum: options }],
      },
    },
    required: ["next"],
  },
};

const toolDef = {
  type: "function",
  function: functionDef,
} as const;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "system",
    "Given the conversation above, who should act next?" +
      " Or should we FINISH? Select one of: {options}",
  ],
]);

export const createSupervisorChain = async (): Promise<any> => {
  const formattedPrompt = await prompt.partial({
    options: options.join(", "),
    members: members.join(", "),
  });

  // const llm = openAiModel({
  //   model: "gpt-4o-mini",
  //   temperature: 0,
  // });
  const llm = groqModel({
    model: "llama-3.1-8b-instant",
    temperature: 0,
  });

  const supervisorChain = formattedPrompt
    .pipe(
      llm.bindTools([toolDef], {
        tool_choice: { type: "function", function: { name: "route" } },
      })
    )
    .pipe((x) => x.tool_calls?.[0]?.args?.next ?? "__end__");

  return supervisorChain;
};

export const testSupervisor = async ({ input }: { input: string }) => {
  const supervisorChain = await createSupervisorChain();
  const result = await supervisorChain.invoke({
    messages: [
      new HumanMessage({
        content: input,
      }),
    ],
  });
  return result;
};
