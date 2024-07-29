import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

const modelConfig = {
  anthropic: [
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
  ] as const,
  google: ["gemini-1.0-pro", "gemini-1.5-flash", "gemini-1.5-pro"] as const,
  groq: [
    "gemma-7b-it",
    "gemma2-9b-it",
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768",
  ] as const,
  local: ["hermes-2-pro-llama-3-8b"] as const,
  ollama: ["llama3.1"] as const,
  openAI: [
    "gpt-3.5-turbo",
    "gpt-4",
    "gpt-4-0125-preview",
    "gpt-4-turbo",
    "gpt-4o",
  ] as const,
};

type OpenAIModel = (typeof modelConfig.openAI)[number];
type GroqModel = (typeof modelConfig.groq)[number];
type AnthropicModel = (typeof modelConfig.anthropic)[number];
type GoogleModel = (typeof modelConfig.google)[number];
type LocalModel = (typeof modelConfig.local)[number];
type OllamaModel = (typeof modelConfig.ollama)[number];
export type Model =
  | AnthropicModel
  | GoogleModel
  | GroqModel
  | LocalModel
  | OllamaModel
  | OpenAIModel;

export const openAiModel = ({
  baseUrl = "https://api.openai.com/v1",
  maxTokens = 1024,
  model = "gpt-3.5-turbo",
  temperature = 0.9,
}: {
  baseUrl?: string;
  maxTokens?: number;
  model?: OpenAIModel;
  temperature?: number;
}) =>
  new ChatOpenAI({
    configuration: { baseURL: baseUrl },
    maxTokens,
    model,
    temperature,
  });

export const groqModel = ({
  maxTokens = 1024,
  model = "mixtral-8x7b-32768",
  temperature = 0.5,
}: {
  maxTokens?: number;
  model?: GroqModel;
  temperature?: number;
}) =>
  new ChatGroq({
    maxTokens,
    model,
    temperature,
  });

export const anthropicModel = ({
  maxTokens = 1024,
  model = "claude-3-sonnet-20240229",
  temperature = 0.5,
}: {
  maxTokens?: number;
  model?: AnthropicModel;
  temperature?: number;
}) =>
  new ChatAnthropic({
    maxTokens,
    model,
    temperature,
  });

export const googleModel = ({
  maxTokens = 1024,
  model = "gemini-1.5-pro",
  temperature = 0.5,
}: {
  maxTokens?: number;
  model?: GoogleModel;
  temperature?: number;
}) =>
  new ChatGoogleGenerativeAI({
    maxOutputTokens: maxTokens,
    model,
    temperature,
  });
// Any OpenAI compatible endpoint should work here, tested with llama.cpp server
export const localModel = ({
  baseURL = "http://localhost:8080/v1",
  maxTokens = 1024,
  model = "hermes-2-pro-llama-3-8b",
  temperature = 0.5,
}: {
  baseURL?: string;
  maxTokens?: number;
  model?: string;
  temperature?: number;
}) =>
  new ChatOpenAI({
    configuration: { baseURL },
    maxTokens,
    model,
    temperature,
  });

export const ollamaModel = ({
  baseUrl = "http://localhost:11434",
  model = "llama3.1",
  temperature = 0.1,
}: {
  baseUrl?: string;
  model?: OllamaModel;
  temperature?: number;
}) => new ChatOllama({ baseUrl, checkOrPullModel: false, model, temperature });

export const getModel = ({
  baseUrl,
  maxTokens = 1024,
  model,
  temperature = 0.5,
}: {
  baseUrl?: string;
  maxTokens?: number;
  model: Model;
  temperature?: number;
}) => {
  if (modelConfig.openAI.includes(model as OpenAIModel)) {
    return openAiModel({
      baseUrl,
      maxTokens,
      model: model as OpenAIModel,
      temperature,
    });
  }

  if (modelConfig.groq.includes(model as GroqModel)) {
    return groqModel({ maxTokens, model: model as GroqModel, temperature });
  }

  if (modelConfig.anthropic.includes(model as AnthropicModel)) {
    return anthropicModel({
      maxTokens,
      model: model as AnthropicModel,
      temperature,
    });
  }

  if (modelConfig.google.includes(model as GoogleModel)) {
    return googleModel({ maxTokens, model: model as GoogleModel, temperature });
  }

  if (modelConfig.local.includes(model as LocalModel)) {
    return localModel({ baseURL: baseUrl, maxTokens, model, temperature });
  }

  if (modelConfig.ollama.includes(model as OllamaModel)) {
    return ollamaModel({ model: model as OllamaModel, temperature });
  }

  throw new Error(`Unsupported model: ${model}`);
};
