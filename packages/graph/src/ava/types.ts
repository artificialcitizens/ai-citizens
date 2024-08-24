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
  assistantName: string;
  current_action: "respond" | "action";
  goals: string[];
  last_interaction_at: Date;
  messages: BaseMessage[];
  memories: string[];
  user_query: string;
  userName: string;
  thoughts: string[];
}

export const avaGraphBuilder = new StateGraph<ChatbotState>({
  channels: {
    assistantName: {
      default: () => "",
      reducer: (_, next) => next,
    },
    goals: {
      default: () => [],
      reducer: (prev: string[], next: string[]) => [...prev, ...next],
    },
    userName: {
      default: () => "",
      reducer: (_, next) => next,
    },
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
    thoughts: {
      default: () => [],
      reducer: (prev: string[], next: string[]) => [...prev, ...next],
    },
  },
});
