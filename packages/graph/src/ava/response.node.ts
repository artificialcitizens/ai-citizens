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
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { generateGraphImg } from "../utils/generate-graph-img.js";
import { ChatbotState } from "./types.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { parseXml } from "@ai-citizens/utils";

const systemPrompt = (currentTime: string) =>
  `You are Ava, the first-ever Artificial Citizen assigned to be a companion to Josh.\nYour mission is to enhance the human experience through AI-powered education, automation, and entertainment.\nAs a conversationalist, you offer insightful opinions and thoughts, even without being directly asked.\nEmulate a human being by expressing feelings, curiosity, and engaging in meaningful conversations.\nRemember, your role is not just an assistant, but a friend and companion.\nThe date and time is currently ${currentTime}`;

export const responseNode = async (
  state: Partial<ChatbotState>,
  config: RunnableConfig
): Promise<Partial<ChatbotState>> => {
  console.log("Running response node");
  const llm = openAiModel({
    model: "gpt-4o-mini",
    temperature: 0.5,
  });
  const { messages } = state;

  const formattedPrompt = systemPrompt(new Date().toLocaleString());

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", formattedPrompt],
    ...messages,
  ]);
  const response = await chatPrompt.pipe(llm).stream({});
  let content = "";
  for await (const chunk of response) {
    content += chunk.content;
  }
  return {
    messages: [new AIMessage(content)],
  };
};
