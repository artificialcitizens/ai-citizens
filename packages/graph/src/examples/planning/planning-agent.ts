// import { END, START, StateGraph } from "@langchain/langgraph";
// import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
// import { MemorySaver } from "@langchain/langgraph";
// import { PromptTemplate } from "@langchain/core/prompts";
// import { getModel } from "@ai-citizens/llm";
// import "dotenv/config";

// interface PlanExecuteState {
//   input: string;
//   plan: string[];
//   pastSteps: [string, string][];
//   response?: string;
// }

// const planExecuteGraph = new StateGraph<PlanExecuteState>({
//   channels: {
//     input: {
//       value: (left?: string, right?: string) => right ?? left ?? "",
//     },
//     plan: {
//       value: (x?: string[], y?: string[]) => y ?? x ?? [],
//       default: () => [],
//     },
//     pastSteps: {
//       value: (x: [string, string][], y: [string, string][]) => x.concat(y),
//       default: () => [],
//     },
//     response: {
//       value: (x?: string, y?: string) => y ?? x,
//       default: () => undefined,
//     },
//   },
// });

// // Initialize LLM
// const llm = await getModel({ model: "gpt-3.5-turbo" });

// export const planningNode = async (state: PlanExecuteState) => {
//   const plannerPrompt = PromptTemplate.fromTemplate(
//     "Given the user input: {input}\n" +
//       "Create a plan to address the user's request. Output the plan as a list of steps."
//   );
//   const plannerChain = plannerPrompt.pipe(llm);
//   const planResult = await plannerChain.invoke({ input: state.input });
//   // type assertion
//   const content =
//     typeof planResult.content === "string"
//       ? planResult.content
//       : JSON.stringify(planResult.content);
//   const plan = content.split("\n").filter((step) => step.trim() !== "");
//   console.log("Plan:", plan);
//   return { plan };
// };

// export const executionNode = async (state: PlanExecuteState) => {
//   const executorPrompt = PromptTemplate.fromTemplate(
//     "Execute the following step: {step}\n" +
//       "Provide the result of executing this step."
//   );
//   const executorChain = executorPrompt.pipe(llm);
//   const currentStep = state.plan[0];
//   const stepResult = await executorChain.invoke({ step: currentStep });
//   console.log("Step result:", stepResult);
//   return {
//     plan: state.plan.slice(1),
//     pastSteps: [[currentStep, stepResult.content]],
//   };
// };

// export const responderNode = async (state: PlanExecuteState) => {
//   const responderPrompt = PromptTemplate.fromTemplate(
//     "Based on the following executed steps:\n" +
//       "{pastSteps}\n" +
//       "Provide a final response to the user's input: {input}"
//   );
//   const responderChain = responderPrompt.pipe(llm);
//   const response = await responderChain.invoke({
//     pastSteps: state.pastSteps
//       .map(([step, result]) => `${step}: ${result}`)
//       .join("\n"),
//     input: state.input,
//   });
//   console.log("Response:", response);
//   return { response: response.content };
// };

// const conditionalEdge = (state: PlanExecuteState) => {
//   if (state.plan.length > 0) {
//     console.log("Executing step:", state.plan[0]);
//     return "executor";
//   }
//   console.log("Responding to user input:", state.input);
//   return "responder";
// };

// planExecuteGraph
//   .addNode("planner", planningNode)
//   .addNode("executor", executionNode)
//   .addNode("responder", responderNode)
//   .addEdge(START, "planner")
//   .addEdge("planner", "executor")
//   .addConditionalEdges("executor", conditionalEdge)
//   .addEdge("responder", END);

// // Compile the graph
// const graph = planExecuteGraph.compile();

// // Function to process user input
// async function processPlanExecuteInput(
//   input: string
// ): Promise<PlanExecuteState> {
//   const initialState: PlanExecuteState = {
//     input,
//     plan: [],
//     pastSteps: [],
//   };

//   try {
//     const finalState = await graph.invoke(initialState);
//     return finalState;
//   } catch (error) {
//     console.error("Error processing input:", error);
//     throw error;
//   }
// }

// export async function runPlanExecuteAgent() {
//   const userInput = "Plan a surprise birthday party for my best friend";

//   try {
//     const result = await processPlanExecuteInput(userInput);
//     console.log("Final state:", result);
//     console.log("Response:", result.response);
//   } catch (error) {
//     console.error("Planning agent error:", error);
//   }
// }

import { END, START, StateGraph } from "@langchain/langgraph";
import { PromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";

interface PlanExecuteState {
  input: string;
  plan: string[];
  pastSteps: [string, string][];
  response?: string;
}

const planExecuteGraph = new StateGraph<PlanExecuteState>({
  channels: {
    input: {
      value: (left?: string, right?: string) => right ?? left ?? "",
    },
    plan: {
      value: (x?: string[], y?: string[]) => y ?? x ?? [],
      default: () => [],
    },
    pastSteps: {
      value: (x: [string, string][], y: [string, string][]) => x.concat(y),
      default: () => [],
    },
    response: {
      value: (x?: string, y?: string) => y ?? x,
      default: () => undefined,
    },
  },
});

// Planning node: Generates a plan based on the user input
export const planningNode = async (state: PlanExecuteState) => {
  console.log("Planning for input:", state.input);
  // In a real scenario, this would use an LLM to generate a plan
  // Here, we're mocking a predefined plan for a surprise birthday party
  const mockedPlan = [
    "1. Choose a date and venue",
    "2. Create a guest list",
    "3. Plan decorations and theme",
    "4. Arrange food and drinks",
    "5. Organize entertainment",
  ];
  return { plan: mockedPlan };
};

// Execution node: Simulates executing each step of the plan
export const executionNode = async (state: PlanExecuteState) => {
  const currentStep = state.plan[0];
  console.log("Executing step:", currentStep);
  // In a real scenario, this would use an LLM to generate a detailed execution result
  // Here, we're simply marking the step as completed
  const mockedStepResult = `Completed: ${currentStep}`;
  return {
    plan: state.plan.slice(1), // Remove the executed step from the plan
    pastSteps: [[currentStep, mockedStepResult] as [string, string]],
  };
};

// Responder node: Generates a final response based on all executed steps
export const responderNode = async (state: PlanExecuteState) => {
  console.log("Generating response based on executed steps");
  // In a real scenario, this would use an LLM to generate a comprehensive response
  // based on the input and all executed steps
  // Here, we're providing a static mocked response
  const mockedResponse =
    "The surprise birthday party has been successfully planned with all necessary arrangements made.";
  return { response: mockedResponse };
};

// Conditional edge function: Determines the next node based on the current state
const conditionalEdge = (state: PlanExecuteState) => {
  if (state.plan.length > 0) {
    console.log("Moving to executor");
    return "executor"; // If there are steps left in the plan, continue executing
  }
  console.log("Moving to responder");
  return "responder"; // If all steps are executed, move to the responder
};

planExecuteGraph
  .addNode("planner", planningNode)
  .addNode("executor", executionNode)
  .addNode("responder", responderNode)
  .addEdge(START, "planner")
  .addEdge("planner", "executor")
  .addConditionalEdges("executor", conditionalEdge)
  .addEdge("responder", END);

// Compile the graph
const graph = planExecuteGraph.compile();

// Function to process user input
async function processPlanExecuteInput(
  input: string
): Promise<PlanExecuteState> {
  const initialState: PlanExecuteState = {
    input,
    plan: [],
    pastSteps: [],
  };

  try {
    const finalState = await graph.invoke(initialState);
    return finalState;
  } catch (error) {
    console.error("Error processing input:", error);
    throw error;
  }
}

export async function runPlanExecuteAgent() {
  const userInput = "Plan a surprise birthday party for my best friend";

  try {
    const result = await processPlanExecuteInput(userInput);
    console.log("Planning agent final state:", result);
    console.log("Planning agent response:", result.response);
  } catch (error) {
    console.error("Planning agent error:", error);
  }
}
