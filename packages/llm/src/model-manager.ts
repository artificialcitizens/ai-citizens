import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

export const modelConfig = {
  anthropic: {
    models: [
      "claude-3-5-sonnet-20240620",
      "claude-3-haiku-20240307",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
    ] as const,
  },
  google: {
    models: ["gemini-1.0-pro", "gemini-1.5-flash", "gemini-1.5-pro"] as const,
  },
  groq: {
    models: [
      "gemma-7b-it",
      "gemma2-9b-it",
      "llama-3.1-8b-instant",
      "llama-3.1-70b-versatile",
      "mixtral-8x7b-32768",
    ] as const,
  },
  local: {
    models: ["hermes-2-pro-llama-3-8b"] as const,
  },
  ollama: {
    models: ["llama3.1"] as const,
  },
  openAI: {
    models: [
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-0125-preview",
      "gpt-4-turbo",
      "gpt-4o",
      "gpt-4o-mini",
    ] as const,
  },
};

export type AllModels =
  (typeof modelConfig)[keyof typeof modelConfig]["models"][number];

export const allModels = Object.values(modelConfig).flatMap(
  (config) => config.models
);

export function isAllModel(model: string): model is AllModels {
  return Object.values(modelConfig).some((config) =>
    // @ts-expect-error this could be anything
    config.models.includes(model)
  );
}
type OpenAIModel = (typeof modelConfig.openAI.models)[number];
type GroqModel = (typeof modelConfig.groq.models)[number];
type AnthropicModel = (typeof modelConfig.anthropic.models)[number];
type GoogleModel = (typeof modelConfig.google.models)[number];
type LocalModel = (typeof modelConfig.local.models)[number];
type OllamaModel = (typeof modelConfig.ollama.models)[number];
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
  model = "gpt-4o-mini",
  temperature = 0.5,
}: {
  baseUrl?: string;
  maxTokens?: number;
  model?: OpenAIModel;
  temperature?: number;
}) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new ChatOpenAI({
    configuration: { baseURL: baseUrl },
    maxTokens,
    model,
    temperature,
  });
};
export const groqModel = ({
  maxTokens = 1024,
  model = "llama-3.1-8b-instant",
  temperature = 0.5,
}: {
  maxTokens?: number;
  model?: GroqModel;
  temperature?: number;
}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new ChatGroq({
    maxTokens,
    model,
    temperature,
  });
};
export const anthropicModel = ({
  maxTokens = 1024,
  model = "claude-3-haiku-20240307",
  temperature = 0.5,
}: {
  maxTokens?: number;
  model?: AnthropicModel;
  temperature?: number;
}) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  return new ChatAnthropic({
    maxTokens,
    model,
    temperature,
  });
};

export const googleModel = ({
  maxTokens = 1024,
  model = "gemini-1.5-pro",
  temperature = 0.5,
}: {
  maxTokens?: number;
  model?: GoogleModel;
  temperature?: number;
}) => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }
  return new ChatGoogleGenerativeAI({
    maxOutputTokens: maxTokens,
    model,
    temperature,
  });
};
// Any OpenAI compatible endpoint should work here, tested with llama.cpp server
export async function localModel({
  baseURL = process.env.LOCAL_OPENAI_BASE_URL || "http://localhost:8080/v1",
  maxTokens = 1024,
  model = "hermes-2-pro-llama-3-8b",
  temperature = 0.5,
}: {
  baseURL?: string;
  maxTokens?: number;
  model?: string;
  temperature?: number;
}) {
  return new ChatOpenAI({
    configuration: { baseURL },
    maxTokens,
    model,
    temperature,
  });
}

export const ollamaModel = async ({
  baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  model = "llama3.1",
  temperature = 0.1,
}: {
  baseUrl?: string;
  model?: OllamaModel;
  temperature?: number;
}) => {
  return new ChatOllama({
    baseUrl,
    checkOrPullModel: false,
    model,
    temperature,
  });
};

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
  if (modelConfig["openAI"].models.includes(model as OpenAIModel)) {
    return openAiModel({
      baseUrl,
      maxTokens,
      model: model as OpenAIModel,
      temperature,
    });
  }

  if (modelConfig["groq"].models.includes(model as GroqModel)) {
    return groqModel({ maxTokens, model: model as GroqModel, temperature });
  }

  if (modelConfig["anthropic"].models.includes(model as AnthropicModel)) {
    return anthropicModel({
      maxTokens,
      model: model as AnthropicModel,
      temperature,
    });
  }

  if (modelConfig["google"].models.includes(model as GoogleModel)) {
    return googleModel({ maxTokens, model: model as GoogleModel, temperature });
  }

  if (modelConfig["local"].models.includes(model as LocalModel)) {
    return localModel({ baseURL: baseUrl, maxTokens, model, temperature });
  }

  if (modelConfig["ollama"].models.includes(model as OllamaModel)) {
    return ollamaModel({ model: model as OllamaModel, temperature });
  }

  throw new Error(`Unsupported model: ${model}`);
};
