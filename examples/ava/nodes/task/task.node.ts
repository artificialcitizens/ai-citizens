import { parseXml } from "@ai-citizens/utils";
import { ChatbotState } from "../../types.js";
import { getModel } from "@ai-citizens/llm";
import { ChatPromptTemplate } from "@langchain/core/prompts";
const taskCreator = `You are an AI assistant tasked with breaking down a user's request into a list of actionable tasks. Your goal is to create a clear, concise, and logical list of steps that would be necessary to fulfill the user's request by a set of llm powered agents.

Analyze the request carefully. Consider all aspects of what the user is asking for and what would be required to complete their request by a set of llm powered agents. Think about the sequence of actions, potential challenges, and resources needed to fulfill the request.

Break down the request into a list of tasks. Each task should be:
1. Specific and actionable
2. Logically ordered
3. Comprehensive enough to cover all aspects of the request
4. Not too granular - avoid breaking tasks down into unnecessarily small steps
5. Combines multiple tasks into one if they are related

Format your task list as follows:
1. Use numbered bullet points for each main task
2. Start each task with an action verb
3. Be concise but clear
4. If a task has subtasks, use lettered sub-bullets (a, b, c, etc.)

Before presenting your task list, clearly state any assumptions you need to make about the request. These assumptions should be reasonable and based on common scenarios related to the request.

Present your assumptions (if any) within <assumptions> tags, and your final task list within <task_list> tags. Each individual task should be enclosed in <task> tags.

Now, create a task list for the given user request. Think carefully about each step that would be necessary to fulfill the request completely.`;

/**
 * Task node
 *
 * This node is responsible for generating a task for the system to perform.
 */
export const taskNode = async (
  state: Partial<ChatbotState>
): Promise<Partial<ChatbotState>> => {
  const { user_query } = state;
  const model = await getModel({
    model: "claude-3-5-sonnet-20240620",
  });
  const taskPrompt = ChatPromptTemplate.fromMessages([
    ["system", taskCreator],
    ["user", "{user_query}"],
  ]);
  const taskList = await taskPrompt.pipe(model).invoke({ user_query });

  if (!taskList.content || typeof taskList.content !== "string") {
    throw new Error("No task list returned");
  }
  console.log("taskList", taskList);
  const result = parseXml(taskList.content);
  console.log("result", result["task_list"]["task"]);
  return state;
};
