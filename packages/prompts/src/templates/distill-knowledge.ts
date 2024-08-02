import {ChatPromptTemplate} from '@langchain/core/prompts'

/**
 * Distills key knowledge from a given context
 * @params context
 */
export const distillKnowledge =
  ChatPromptTemplate.fromTemplate(`You are tasked with distilling key knowledge from a given context. Your goal is to extract and summarize the most important information in a clear, concise format that would be easy for a language model to understand and learn from.

Here is the context to analyze:

<context>
{context}
</context>

Please read the context carefully to fully understand the key information and knowledge it contains. It is important to retain key technical details as you will be summarizing frameworks and concepts from the context.

First, use a <scratchpad> section to think through how to distill and summarize the most important knowledge from the context. Consider the following:

1. What are the main ideas, concepts, or frameworks presented?
2. What key facts or details are crucial to understanding these concepts?
3. How can you structure this information in a clear, logical manner?
4. What unnecessary details or fluff can be removed while retaining the core knowledge?

<scratchpad>
[Your analysis goes here]
</scratchpad>

Based on your analysis, please output the distilled knowledge from the context in a <distilled_knowledge> section. Follow these guidelines:

1. Capture the core information in a succinct, well-organized manner.
2. Use clear, concise language optimized for language model comprehension.
3. Structure the information logically, using bullet points, numbered lists, or short paragraphs as appropriate.
4. Include key technical details and definitions where necessary.
5. Aim for completeness in covering the main ideas, but prioritize brevity and clarity.

<distilled_knowledge>
[Your distilled knowledge goes here]
</distilled_knowledge>

Remember, the goal is to create a summary that a language model could easily learn from and apply to related tasks or questions.
`)
