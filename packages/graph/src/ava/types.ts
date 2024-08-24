import { BaseMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";

export type Memory = {
  id: string;
  content: string;
  entities?: Record<string, string>;
  metadata?: Record<string, unknown>;
  type: "short-term" | "long-term" | "core";
  createdAt: Date;
  lastAccessedAt: Date;
};

export interface ChatbotState {
  user_query: string;
  messages: BaseMessage[];
  current_action: "respond" | "action";
  memories: string[];
  last_interaction_at: Date;
}

export const avaGraphBuilder = new StateGraph<ChatbotState>({
  channels: {
    user_query: {
      default: () => "",
      reducer: (_, next) => next,
    },
    messages: {
      default: () => [],
      reducer: (prev: BaseMessage[], next: BaseMessage[]) => [...prev, ...next],
    },
    memories: {
      default: () => [],
      reducer: (prev: string[], next: string[]) => next,
    },
    current_action: {
      default: () => "respond",
      reducer: (_, next) => next,
    },
    last_interaction_at: {
      default: () => new Date(),
      reducer: (_, next) => next,
    },
  },
});
