import { END, START, StateGraph } from "@langchain/langgraph";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import "dotenv/config";
import { generateGraphImg } from "../../utils/generate-graph-img.js";

interface Task {
  description: string;
  role: string;
}

interface DelegateState {
  input: string;
  tasks: Task[];
  completedTasks: Task[];
  currentTask?: Task;
  response?: string;
  messages: BaseMessage[];
}

const delegateGraph = new StateGraph<DelegateState>({
  channels: {
    input: {
      value: (left?: string, right?: string) => right ?? left ?? "",
    },
    tasks: {
      value: (x?: Task[], y?: Task[]) => y ?? x ?? [],
      default: () => [],
    },
    completedTasks: {
      value: (x: Task[], y: Task[]) => x.concat(y),
      default: () => [],
    },
    currentTask: {
      value: (x?: Task, y?: Task) => y ?? x,
      default: () => undefined,
    },
    response: {
      value: (x?: string, y?: string) => y ?? x,
      default: () => undefined,
    },
    messages: {
      value: (x?: BaseMessage[], y?: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  },
});

// Planning node (Supervisor): Generates a plan with tasks and roles
export const planningNode = async (state: DelegateState) => {
  console.log("Planning for input:", state.input);
  // In a real scenario, this would use an LLM to generate tasks based on the input
  // For this example, we're using predefined tasks for a surprise birthday party
  const mockedTasks: Task[] = [
    { description: "Research and suggest party themes", role: "researcher" },
    {
      description: "Create invitations and manage guest list",
      role: "organizer",
    },
    { description: "Plan party games and activities", role: "entertainer" },
    { description: "Arrange catering and refreshments", role: "organizer" },
  ];
  return { tasks: mockedTasks };
};

// Delegation node (Supervisor): Assigns the next task to the appropriate role
export const delegationNode = async (state: DelegateState) => {
  if (state.tasks.length === 0 && !state.currentTask) {
    console.log("No more tasks to delegate");
    return { currentTask: undefined, tasks: [] };
  }

  if (!state.currentTask && state.tasks.length > 0) {
    const nextTask = state.tasks[0];
    const tasks = state.tasks.slice(1);
    console.log("tasks", tasks);
    console.log(`Delegating task: ${nextTask.description} to ${nextTask.role}`);
    return {
      currentTask: nextTask,
      tasks: state.tasks.slice(1),
    };
  }

  return {};
};

// Worker Agents

// Researcher: Responsible for tasks that require information gathering and analysis
export const researcherNode = async (state: DelegateState) => {
  if (!state.currentTask || state.currentTask.role !== "researcher") {
    return {};
  }
  console.log("Researcher executing:", state.currentTask.description);
  // Mock the result
  const mockedResult =
    "Suggested themes: Retro 80s, Tropical Paradise, Superhero Extravaganza";
  return {
    completedTasks: [
      {
        ...state.currentTask,
        description: state.currentTask.description + " - " + mockedResult,
      },
    ],
    currentTask: undefined,
  };
};
// Organizer: Handles logistical tasks like managing invitations and catering
export const organizerNode = async (state: DelegateState) => {
  if (!state.currentTask || state.currentTask.role !== "organizer") {
    return {};
  }
  console.log("Organizer executing:", state.currentTask.description);
  // Simulate different organizer tasks with specific outcomes
  const mockedResult = state.currentTask.description.includes("invitations")
    ? "Created digital invitations and compiled a guest list of 30 people"
    : "Arranged catering for 30 people with a variety of dietary options";
  return {
    completedTasks: [
      {
        ...state.currentTask,
        description: state.currentTask.description + " - " + mockedResult,
      },
    ],
    currentTask: undefined,
  };
};

// Entertainer: Plans fun activities and games for the party
export const entertainerNode = async (state: DelegateState) => {
  if (!state.currentTask || state.currentTask.role !== "entertainer") {
    return {};
  }
  console.log("Entertainer executing:", state.currentTask.description);
  // Mock the result
  const mockedResult = "Planned 5 party games and a dance competition";
  return {
    completedTasks: [
      {
        ...state.currentTask,
        description: state.currentTask.description + " - " + mockedResult,
      },
    ],
    currentTask: undefined,
  };
};
// Responder node (Supervisor): Generates a final response based on all completed tasks
export const responderNode = async (state: DelegateState) => {
  console.log("Generating final response");
  const completedTasksDescription = state.completedTasks
    .map((task) => `- ${task.description}`)
    .join("\n");
  const response = `Here's a summary of the completed tasks for the surprise birthday party:\n${completedTasksDescription}`;
  return { response };
};

// Conditional edge function: Determines the next node based on the current state
const conditionalEdge = (state: DelegateState) => {
  if (state.tasks.length === 0 && !state.currentTask) {
    return "responder";
  }

  if (state.currentTask) {
    switch (state.currentTask.role) {
      case "researcher":
        return "researcher";
      case "organizer":
        return "organizer";
      case "entertainer":
        return "entertainer";
      default:
        console.log("Unknown role:", state.currentTask.role);
        return "delegator";
    }
  }

  return "delegator";
};

// Graph structure: Defines the flow of the delegate agent
delegateGraph
  .addNode("planner", planningNode)
  .addNode("delegator", delegationNode)
  .addNode("researcher", researcherNode)
  .addNode("organizer", organizerNode)
  .addNode("entertainer", entertainerNode)
  .addNode("responder", responderNode)
  .addEdge(START, "planner")
  .addEdge("planner", "delegator")
  .addConditionalEdges("delegator", conditionalEdge)
  .addEdge("researcher", "delegator")
  .addEdge("organizer", "delegator")
  .addEdge("entertainer", "delegator")
  .addEdge("responder", END);

// Compile the graph
const graph = delegateGraph.compile();

// Function to process user input through the delegate agent
async function processDelegateInput(input: string): Promise<DelegateState> {
  const initialState: DelegateState = {
    input,
    tasks: [],
    completedTasks: [],
    messages: [],
  };

  try {
    const finalState = await graph.invoke(initialState);
    return finalState;
  } catch (error) {
    console.error("Error processing input:", error);
    throw error;
  }
}

// Main function to run the delegate agent
export async function runDelegateAgent() {
  console.log("Running delegate agent");
  const userInput =
    "Plan and execute a surprise birthday party for my best friend";

  try {
    const result = await processDelegateInput(userInput);
    console.log("Final state:", result);
    console.log("Response:", result.response);
  } catch (error) {
    console.error("Delegate agent error:", error);
  }
}
const graphImg = generateGraphImg({
  app: graph,
  path: "./delegate-graph.png",
});
