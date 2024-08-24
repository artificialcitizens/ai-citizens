import {
  getModel,
  openAiModel,
  groqModel,
  ollamaModel,
} from "@ai-citizens/llm";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { END, StateGraphArgs, START, StateGraph } from "@langchain/langgraph";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { generateGraphImg } from "../utils/generate-graph-img.js";
import { ChatbotState } from "./types.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { parseXml } from "@ai-citizens/utils";

const systemPrompt = `You are an AI assistant tasked with routing user queries to the correct node based on the context. You have two possible actions:
1. Respond: Use this for simple chat.
2. Action: Use this for external information or more complex queries that require specific actions, knowledge, or processing.

Here is the conversation history, use to help determine the route:
<messages>
{messages}
</messages>

Here is the user's query:
<user_query>
{user_query}
</user_query>

Based on your analysis, determine whether to respond or action:
- If the query is a simple chat choose "respond".
- If the query requires specific actions, such as fetching information, processing, or anything beyond a simple chat, choose "action".
- If the query is a link, choose "action"

Provide your route and a brief explanation of your reasoning in the following format:

<route>
[respond/action]
</route>
DO NOT OUTPUT ANYTHING ELSE.
`;

const prompt = ChatPromptTemplate.fromMessages([["user", systemPrompt]]);

export const routeNode = async (
  state: Partial<ChatbotState>,
  config: RunnableConfig
): Promise<Partial<ChatbotState>> => {
  if (!state.user_query) {
    throw new Error("User query is required");
  }
  const formattedPrompt = await prompt.partial({
    user_query: state.user_query ?? "",
    messages: state.messages?.map((m) => m.content).join("\n") ?? "",
  });

  const llm = await ollamaModel({
    model: "phi3.5",
    temperature: 0,
  });
  const { user_query } = state;
  const response = await formattedPrompt.pipe(llm).invoke({
    user_query,
  });
  if (typeof response.content !== "string") {
    throw new Error("Invalid response content");
  }
  const {
    route = "respond",
  }: { route: "action" | "respond"; explanation: string } = parseXml(
    response.content
  );
  return {
    // clear the user query to allow for a new query in the loop
    user_query: "",
    current_action: route,
    messages: [new HumanMessage(user_query)],
  };
};
