import { StringOutputParser } from "@langchain/core/output_parsers";
import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";

import { getModel, Model } from "@ai-citizens/llm";

const parser = new StringOutputParser();

const modelsToEvaluate: Model[] = [
  "gpt-3.5-turbo",
  "gpt-4",
  "claude-3-opus-20240229",
  "gemma-7b-it",
];

interface EvalState {
  prompt: string;
  responses: { model: string; output: string; score: number }[];
}

const stringReducer = (left = "", right?: string): string => right ?? left;

const responseReducer = (
  left: { model: string; output: string; score: number }[] = [],
  right?: { model: string; output: string; score: number }[]
): { model: string; output: string; score: number }[] => [
  ...left,
  ...(right || []),
];

const graphState: StateGraphArgs<EvalState>["channels"] = {
  prompt: {
    default: () => "",
    value: stringReducer,
  },
  responses: {
    default: () => [],
    value: responseReducer,
  },
};

const generateResponse = async (
  prompt: string,
  model: Model
): Promise<string> => {
  const llm = await getModel({ model });
  const response = await llm.invoke(prompt);
  return parser.invoke(response);
};

const evalBuilder = new StateGraph<EvalState>({ channels: graphState });

// Add nodes for each model
for (const model of modelsToEvaluate) {
  evalBuilder.addNode(`evaluate-${model}`, async (state) => ({
    responses: [
      { model, output: await generateResponse(state.prompt, model), score: 0 },
    ],
  }));
}

// Add edges
for (const model of modelsToEvaluate) {
  // @ts-expect-error this is fine
  evalBuilder.addEdge(START, `evaluate-${model}`);
  // @ts-expect-error this is fine
  evalBuilder.addEdge(`evaluate-${model}`, END);
}

const graph = evalBuilder.compile();

export const evaluateModels = async (prompt: string) => {
  const initialState: Partial<EvalState> = { prompt };
  const finalState = await graph.invoke(initialState);
  return finalState.responses;
};
