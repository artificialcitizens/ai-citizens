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
import { generateGraphImg } from "../../../utils/generate-graph-img.js";
import { ChatbotState } from "../../types.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { parseXml } from "@ai-citizens/utils";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tavilyTool, calculatorTool } from "@ai-citizens/tools";
import { youtubeGraphTool } from "../../../youtube-parser/index.js";

const tools = [tavilyTool, calculatorTool, youtubeGraphTool];
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
  DO NOT END YOUR RESPONSE WITH AN "OVERALL" OR "IN CONCLUSION" RECAP.
  `;
};

export const actionNode = async (
  state: Partial<ChatbotState>,
  config: RunnableConfig
): Promise<Partial<ChatbotState>> => {
  const { messages = [] } = state;
  const lastMessage = messages[messages.length - 1];
  console.log("Running action node: ", lastMessage.content);
  if (typeof lastMessage.content !== "string") {
    throw new Error("Last message content is not a string");
  }
  // const responseModel = anthropicModel({
  //   model: "claude-3-5-sonnet-20240620",
  // });
  // // const responseModel = await ollamaModel({
  // //   model: "phi3.5",
  // //   temperature: 0,
  // // });
  // const responseModel = groqModel({
  //   model: "llama-3.1-70b-versatile",
  //   temperature: 0,
  // });
  const responseModel = openAiModel({
    model: "gpt-4o-mini",
    temperature: 0,
  });
  const llm = groqModel({
    model: "llama-3.1-70b-versatile",
    temperature: 0,
  });
  const modelWithTools = llm.bindTools(tools);
  const toolResponse = await toolNode.invoke({
    messages: [await modelWithTools.invoke(lastMessage.content)],
  });
  console.log("Using tool: ", toolResponse.messages[0].name);
  const response = await responseModel.invoke(
    actionPrompt({
      query: lastMessage.content,
      toolResponse: toolResponse.messages[0].content,
      toolName: toolResponse.messages[0].name,
    })
  );
  return {
    messages: [new AIMessage(response)],
  };
};
