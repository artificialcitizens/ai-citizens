import { ChatbotState } from "../../types.js";
import { anthropicModel, groqModel, ollamaModel } from "@ai-citizens/llm";
import { parseXml } from "@ai-citizens/utils";

const memoryComparisonPrompt = ({
  conversation,
  existingMemories,
}: {
  conversation: string;
  existingMemories: string;
}) => `You are the memory of a digital assistant, analyze the conversation and existing memories and manage the memories by updating, adding, or removing memories.

Here is the current conversation:
<conversation>
${conversation}
</conversation>

Here are the existing memories:
<existing_memories>
${existingMemories}
</existing_memories>

Carefully analyze the conversation and existing memories. Look for new information, changes to existing information, and outdated or irrelevant information. Consider the following:

1. New facts or details that should be added as new memories
2. Existing memories that need to be updated with new information
3. Memories that are no longer relevant or have been contradicted and should be removed
4. Memories that remain unchanged and are still relevant

Guidelines for updating, adding, and removing memories:
1. Update memories when new information provides more detail or corrects existing information.
2. Add new memories for significant new information not covered in existing memories.
3. Remove memories that are directly contradicted by new information or are no longer relevant to the AI assistant's knowledge base. This includes memories that are updated with new information.
4. Keep memories unchanged if they are still accurate and relevant.
5. Do not add memories that are based information that will expire or become irrelevant soon.
After your analysis, provide your recommendations in the following format:

Do not store memories about Actions taken by the AI assistant. Only store memories about information in relation to the user and goals
<memory>
...
</memory>
<memory>
...
</memory>
<memory>
...
</memory>
..etc

Removing any memories that are not relevant, but ensuring that important information is not lost.

Ensure that your recommendations are accurate, consistent, and reflect the most up-to-date information from the conversation. Be thorough in your analysis, but avoid creating redundant or overly specific memories. If you're unsure about a particular memory, it's better to keep it unchanged rather than potentially losing important information.
Be careful not to lose any important information and keep the details intact and as accurate as possible.
Before providing your final recommendations, use a <scratchpad> to think through your analysis and decision-making process. This will help you organize your thoughts and ensure a comprehensive review of the conversation and existing memories.

After your scratchpad analysis, present your final recommendations using the format specified above. Remember to include all relevant memories in their appropriate categories (updated, new, removed, or unchanged).`;

export async function memoryNode(
  state: Partial<ChatbotState>,
  config: { configurable: { thread_id: string } }
): Promise<Partial<ChatbotState>> {
  const { messages, memories } = state;
  const llm = anthropicModel({
    model: "claude-3-5-sonnet-20240620",
    temperature: 0,
  });
  // const llm = groqModel({
  //   model: "llama-3.1-70b-versatile",
  //   temperature: 0,
  // });
  // Prepare the conversation history
  const conversation = messages
    ?.map((msg) => `${msg._getType()}: ${msg.content}`)
    .join("\n");
  // Prepare existing memories
  const existingMemories = memories
    ?.map((mem) => `<memory>${mem}</memory>`)
    .join("\n");

  const prompt = memoryComparisonPrompt({
    conversation,
    existingMemories,
  });
  // Generate memory recommendations
  const memoryAnalysis = await llm.invoke(prompt);
  if (typeof memoryAnalysis.content !== "string") {
    throw new Error("Memory analysis is not a string");
  }
  // Parse the LLM output and update memories accordingly
  const updatedMemories = parseAndUpdateMemories(memoryAnalysis.content);

  return {
    memories: updatedMemories,
  };
}

export function parseAndUpdateMemories(memoryAnalysis: string): string[] {
  const parsedMemories = parseXml(memoryAnalysis);

  const { memory } = parsedMemories;
  return memory || [];
}
