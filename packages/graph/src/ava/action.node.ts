import {
  getModel,
  openAiModel,
  groqModel,
  ollamaModel,
  anthropicModel,
} from "@ai-citizens/llm";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { END, StateGraphArgs, START, StateGraph } from "@langchain/langgraph";
import { PromptTemplate } from "@langchain/core/prompts";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { generateGraphImg } from "../utils/generate-graph-img.js";
import { ChatbotState } from "./types.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { parseXml } from "@ai-citizens/utils";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tavilyTool, calculatorTool } from "@ai-citizens/tools";

const tools = [tavilyTool, calculatorTool];
const toolNode = new ToolNode(tools);

const actionPrompt = ({
  query,
  toolResponse,
  toolName,
}: {
  query: string;
  toolResponse: string;
  toolName: string;
}) => {
  return `Given the following query and tool response, respond to the users question:
  Query: ${query}
  Tool Name: ${toolName}
  Tool Response: ${toolResponse}
  Using only the above information, respond to the users question as if you answering the original question, do not include the original question in your response.
  `;
};

export const actionNode = async (
  state: Partial<ChatbotState>,
  config: RunnableConfig
): Promise<Partial<ChatbotState>> => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  console.log("Running action node", lastMessage.content);
  if (typeof lastMessage.content !== "string") {
    throw new Error("Last message content is not a string");
  }
  const responseModel = groqModel({
    model: "llama-3.1-8b-instant",
    temperature: 0,
  });
  const llm = await ollamaModel({
    model: "llama3.1",
    temperature: 0,
  });
  const modelWithTools = responseModel.bindTools(tools);
  const toolResponse = await toolNode.invoke({
    messages: [await modelWithTools.invoke(lastMessage.content)],
  });
  console.log(toolResponse);
  const response = await responseModel.invoke(
    actionPrompt({
      query: lastMessage.content,
      toolResponse: toolResponse.messages[0].content,
      toolName: toolResponse.messages[0].name,
    })
  );
  console.log(response);
  return {
    messages: [new AIMessage(response)],
  };
};
