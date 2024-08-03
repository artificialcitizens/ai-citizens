import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import {
  anthropicModel,
  getModel,
  googleModel,
  groqModel,
  ollamaModel,
} from "@ai-citizens/llm";

const parser = new StringOutputParser();
// @TODO: Update to be data driven
// Define the state interfaces
interface MoAState {
  aggregatorResponses: { id: string; response: string }[][];
  finalResponse: string;
  inputPrompt: string;
  proposerResponses: { id: string; response: string }[];
}

// Reducer for string properties
export function stringReducer(left: string = "", right?: string): string {
  return right ?? left;
}

// Reducer for array of objects
//example: [{id: "a", response: "b"}, {id: "c", response: "d"}] => [{id: "a", response: "b"}, {id: "c", response: "d"}]
export function objectArrayReducer(
  left: { id: string; response: string }[] = [],
  right?: { id: string; response: string }[]
): { id: string; response: string }[] {
  const leftIdxById: Record<string, number> = {};
  for (const [i, val] of left.entries()) {
    leftIdxById[val.id] = i;
  }

  const merged = [...left];
  if (right)
    for (const val of right) {
      const existingIdx = leftIdxById[val.id];
      if (existingIdx === undefined) {
        merged.push(val);
      } else {
        merged[existingIdx] = val;
      }
    }

  return merged;
}

// Reducer for array of arrays
//example: [["a", "b"], ["c", "d"]] => ["a", "b", "c", "d"]
export function arrayOfArraysReducer(
  left: { id: string; response: string }[][] = [],
  right?: { id: string; response: string }[][]
): { id: string; response: string }[][] {
  if (!right) return left;
  return [...left, ...right];
}

export const arrayReducer = (left: any[] = [], right?: any[]): any[] => {
  return [...left, ...right];
};
// Update the graphState with specific reducers
const graphState: StateGraphArgs<MoAState>["channels"] = {
  aggregatorResponses: {
    default: () => [],
    value: arrayOfArraysReducer,
  },
  finalResponse: {
    default: () => "",
    value: stringReducer,
  },
  inputPrompt: {
    default: () => "",
    value: stringReducer,
  },
  proposerResponses: {
    default: () => [],
    value: arrayReducer,
  },
};
async function generateResponseWithModel1(prompt: string): Promise<string> {
  const model = await getModel({ model: "gpt-4o" });

  const response = await model.invoke(prompt);

  const parsedResponse = await parser.invoke(response);

  return parsedResponse;
}

async function generateResponseWithModel2(prompt: string): Promise<string> {
  const model = googleModel({});

  const response = await model.invoke(prompt);

  const parsedResponse = await parser.invoke(response);

  return parsedResponse;
}

async function generateResponseWithModel3(prompt: string): Promise<string> {
  const model = anthropicModel({});

  const response = await model.invoke(prompt);

  const parsedResponse = await parser.invoke(response);

  return parsedResponse;
}

async function generateResponseWithModel4(prompt: string): Promise<string> {
  const model = groqModel({ model: "gemma-7b-it" });

  const response = await model.invoke(prompt);

  const parsedResponse = await parser.invoke(response);

  return parsedResponse;
}

const template = `
You are an AI assistant tasked with synthesizing multiple responses into a single coherent response. Your goal is to analyze the given responses, extract the most relevant information, and generate a comprehensive and well-structured response.
Here are the responses you need to synthesize:
{responses}
Please provide a synthesized response that combines the key points from the given responses while maintaining clarity and coherence. The synthesized response should be in your own words and not exceed 200 words.
`;
const promptTemplate = new PromptTemplate({
  inputVariables: ["responses"],
  template,
});
// Function to synthesize responses from multiple sources
async function synthesizeResponses(responses: string[]): Promise<string> {
  const model = anthropicModel({
    model: "claude-3-haiku-20240307",
  });
  const formattedResponses = responses
    .map((response, index) => `Response ${index + 1}: ${response}`)
    .join("\n");
  const prompt = await promptTemplate.format({ responses: formattedResponses });
  const gradingResponse = await model.invoke(prompt);
  const synthesizedResponse = await parser.invoke(gradingResponse);
  return synthesizedResponse;
}

async function secondSynthesisResponse(responses: string[]): Promise<string> {
  const model = groqModel({ model: "gemma2-9b-it" });
  const formattedResponses = responses
    .map((response, index) => `Response ${index + 1}: ${response}`)
    .join("\n");
  const prompt = await promptTemplate.format({ responses: formattedResponses });
  const gradingResponse = await model.invoke(prompt);
  const synthesizedResponse = await parser.invoke(gradingResponse);
  return synthesizedResponse;
}

async function finalSynthesizedResponse(responses: string[]): Promise<string> {
  const model = await ollamaModel({ model: "llama3.1" });
  const formattedResponses = responses
    .map((response, index) => `Response ${index + 1}: ${response}`)
    .join("\n");
  const prompt = await promptTemplate.format({ responses: formattedResponses });
  const gradingResponse = await model.invoke(prompt);
  const synthesizedResponse = await parser.invoke(gradingResponse);
  return synthesizedResponse;
}

// Define the proposer graph
const proposerBuilder = new StateGraph<MoAState>({ channels: graphState });
proposerBuilder
  .addNode("proposerAgent1", async (state) => {
    const response = await generateResponseWithModel1(state.inputPrompt);
    return {
      proposerResponses: [{ id: uuidv4(), response }],
    };
  })
  .addNode("proposerAgent2", async (state) => {
    const response = await generateResponseWithModel2(state.inputPrompt);
    return {
      proposerResponses: [{ id: uuidv4(), response }],
    };
  })
  .addNode("proposerAgent3", async (state) => {
    const response = await generateResponseWithModel3(state.inputPrompt);
    return {
      proposerResponses: [{ id: uuidv4(), response }],
    };
  })
  .addNode("proposerAgent4", async (state) => {
    const response = await generateResponseWithModel4(state.inputPrompt);
    return {
      proposerResponses: [{ id: uuidv4(), response }],
    };
  })
  .addEdge(START, "proposerAgent1")
  .addEdge(START, "proposerAgent2")
  .addEdge(START, "proposerAgent3")
  .addEdge(START, "proposerAgent4")
  .addEdge("proposerAgent1", END)
  .addEdge("proposerAgent2", END)
  .addEdge("proposerAgent3", END)
  .addEdge("proposerAgent4", END);

// Define the aggregator graph
const aggregatorBuilder = new StateGraph<MoAState>({ channels: graphState });
aggregatorBuilder
  .addNode("aggregatorAgent1", async (state) => {
    const synthesizedResponse = await synthesizeResponses(
      state.proposerResponses.map((r) => r.response)
    );
    return {
      aggregatorResponses: [[{ id: uuidv4(), response: synthesizedResponse }]],
    };
  })
  .addNode("aggregatorAgent2", async (state) => {
    const synthesizedResponse = await secondSynthesisResponse(
      state.proposerResponses.map((r) => r.response)
    );
    return {
      aggregatorResponses: [[{ id: uuidv4(), response: synthesizedResponse }]],
    };
  })
  .addNode("finalAggregator", async (state) => {
    const allResponses = state.aggregatorResponses
      .flat()
      .map((r) => r.response);
    const finalResponse = await finalSynthesizedResponse(allResponses);
    return {
      finalResponse,
    };
  })
  .addEdge(START, "aggregatorAgent1")
  .addEdge(START, "aggregatorAgent2")
  .addEdge("aggregatorAgent1", "finalAggregator")
  .addEdge("aggregatorAgent2", "finalAggregator")
  .addEdge("finalAggregator", END);

// Define the parent graph
const parentBuilder = new StateGraph<MoAState>({ channels: graphState });
parentBuilder
  .addNode("proposer", proposerBuilder.compile())
  .addNode("aggregator", aggregatorBuilder.compile())
  .addEdge(START, "proposer")
  .addEdge("proposer", "aggregator")
  .addEdge("aggregator", END);

const graph = parentBuilder.compile();

// // Set the input prompt
// const initialState: Partial<MoAState> = {
//   inputPrompt: 'Who is the Muffin Man?',
// }

// // Run the graph
// const finalState = await graph.invoke(initialState)

// // Get the final output
// const {finalResponse} = finalState

// console.log('Final output:', finalResponse)
// // console.log('Final state:', finalState)

export const moaResponse = async (prompt: string) => {
  const initialState: Partial<MoAState> = {
    inputPrompt: prompt,
  };
  const { finalResponse } = await graph.invoke(initialState);
  return finalResponse;
};
