import {ChatPromptTemplate} from '@langchain/core/prompts'

/**
 * Creates a comprehensive prompt given a users initial prompt for an LLM
 *
 * @params userInput
 */
export const generateLLMPrompt =
  ChatPromptTemplate.fromTemplate(`You are tasked with creating a comprehensive prompt for a language model based on a user's input. Your goal is to expand upon the user's prompt, providing clear and detailed instructions that will guide the language model to produce the desired output.

Here is the user's prompt:
<user_prompt>
{userInput}
</user_prompt>

Follow these steps to create a comprehensive prompt:

1. Analyze the user's prompt and identify the main task or question being asked.

2. Expand on the prompt by providing more context, specific instructions, and any necessary background information that will help the language model understand the task better.

3. Define all variables using single curly braces, like this: {variable_name}. Ensure that each variable is clearly explained and its purpose is evident in the context of the prompt.

4. Instruct the language model to return any pertinent data or information using XML tags. Specify the names of these tags based on the type of information being requested. For example:
   <result></result>
   <explanation></explanation>
   <analysis></analysis>

5. Structure the prompt in a logical order, typically following these steps:
   a. Introduction and context
   b. Specific instructions
   c. Input variables (if any)
   d. Output format requirements
   e. Additional guidelines or constraints

6. If appropriate, include one or two examples of expected input and output to further clarify the task.

7. Ensure that the prompt is clear, concise, and free of ambiguity. Use simple language and avoid jargon unless it's necessary for the task.

8. Double-check that all variables are properly defined and that the required XML tags are clearly specified.

Write your comprehensive prompt inside <prompt> tags. Remember to maintain consistency in tone and style throughout the prompt, and make sure all instructions are clear and actionable for the language model.
`)
