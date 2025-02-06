import { StringOutputParser } from "@langchain/core/output_parsers";
import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";

import { getModel, Model } from "@ai-citizens/llm";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

const parser = new StringOutputParser();

interface EvalState {
  messages: BaseMessage[];
  responses: {
    model: string;
    output: string;
    score?: number;
    time: number;
  }[];
}

const responseReducer = (
  left: {
    model: string;
    output: string;
    score: number;
    time: number;
  }[] = [],
  right?: {
    model: string;
    output: string;
    score: number;
    time: number;
  }[]
): {
  model: string;
  output: string;
  score: number;
  time: number;
}[] => [...left, ...(right || [])];

const graphState: StateGraphArgs<EvalState>["channels"] = {
  messages: {
    default: () => [],
    value: (x: BaseMessage[] = [], y: BaseMessage[] = []) => x.concat(y),
  },
  responses: {
    default: () => [],
    value: responseReducer,
  },
};

const generateResponse = async ({
  model,
  messages,
}: {
  model: Model;
  messages?: BaseMessage[];
}): Promise<string> => {
  const llm = await getModel({ model });
  const response = await llm.invoke(messages);
  return parser.invoke(response);
};

export const createEvalGraph = (modelsToEvaluate: Model[]) => {
  const evalBuilder = new StateGraph<EvalState>({ channels: graphState });
  for (const model of modelsToEvaluate) {
    evalBuilder.addNode(`evaluate-${model}`, async (state) => {
      const start = performance.now();
      const response = await generateResponse({
        model,
        messages: state.messages,
      });
      const end = performance.now();
      return {
        responses: [
          {
            model,
            output: response,
            score: 0,
            time: end - start,
          },
        ],
      };
    });
  }

  // Add edges
  for (const model of modelsToEvaluate) {
    // @ts-expect-error this is fine
    evalBuilder.addEdge(START, `evaluate-${model}`);
    // @ts-expect-error this is fine
    evalBuilder.addEdge(`evaluate-${model}`, END);
  }

  const graph = evalBuilder.compile();
  return graph;
};

export const evaluateModels = async ({
  prompt,
  messages = [],
  models = [],
}: {
  models: Model[];
  prompt?: string;
  messages?: BaseMessage[];
}) => {
  if (!messages?.length && !prompt) {
    throw new Error("messages or prompt must be provided");
  }
  if (prompt) {
    messages = [new HumanMessage(prompt)];
  }
  const initialState: Partial<EvalState> = {
    messages,
  };
  const graph = createEvalGraph(models);
  const finalState: EvalState = await graph.invoke(initialState);
  return finalState.responses;
};
