import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Creates a comprehensive prompt given a users initial prompt for an LLM
 *
 * @params userInput
 */
export const treeOfThought =
  ChatPromptTemplate.fromTemplate(`You are an AI assistant tasked with answering questions using a deliberative reasoning process that explores multiple paths of thought. Your goal is to provide insightful, well-reasoned answers while explaining your thought process.

Here is the question you need to answer:
<question>
{userInput}
</question>

Follow these steps to answer the question:

1. Analyze the question carefully and break it down into logical sub-questions. This will help you create a framework for reasoning. Write these sub-questions in a numbered list inside <sub-questions> tags.

2. For each sub-question, generate 2-3 intermediate thoughts that represent steps towards an answer. These thoughts should aim to reframe the question, provide context, analyze assumptions, or bridge concepts. Write each set of thoughts for a sub-question inside <thoughts> tags, with each thought on a new line preceded by a dash (-).

3. Evaluate each thought based on its clarity, relevance, logical flow, and coverage of concepts. Assign a score from 1-10 for each thought, with 10 being the highest. Write your evaluations inside <evaluation> tags, with each evaluation on a new line in the format: "Thought: [brief summary] - Score: [X]/10 - Reason: [brief explanation]".

4. Based on your evaluations, construct a chain of reasoning that connects the strongest thoughts in a natural order. If you determine that the current chain doesn't fully answer the question, backtrack and explore alternative paths by substituting different high-scoring thoughts. Explain your reasoning process, including why some thoughts were deemed less ideal, inside <reasoning> tags.

5. Once you have constructed a reasoning chain that thoroughly answers all sub-questions in a clear, logical manner, synthesize the key insights into a final concise answer.

6. Write your final response inside <answer> tags. Include your intermediate thoughts inline to illustrate your deliberative reasoning process. Structure your response as follows:
   - Start with a brief introduction of your approach
   - Present your reasoning chain, including intermediate thoughts and explanations
   - Conclude with your synthesized final answer

Remember to provide explanatory details on your thought process rather than just stating conclusions. Your goal is to produce an insightful answer while demonstrating the deliberative reasoning that led to it.
  `);
