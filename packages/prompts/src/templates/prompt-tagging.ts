import {ChatPromptTemplate} from '@langchain/core/prompts'

/**
 * Creates a comprehensive prompt given a users initial prompt for an LLM
 *
 * @params prompt
 */
export const generatePromptTags =
  ChatPromptTemplate.fromTemplate(`You are tasked with creating a set of tags for a given prompt. These tags will be used for easy semantic search and recall of the prompt later. Your goal is to analyze the prompt and generate relevant tags that capture its key concepts, intent, and potential applications.

Here is the prompt you need to analyze:

<prompt>
{prompt}
</prompt>

Please provide your output in the following format:
<summary></summary>
<tags><tag></tag>
...
</tags>

Follow these steps to complete the task:

1. Create a brief, descriptive title for the prompt. This should be a concise phrase that captures the main purpose or theme of the prompt. Place this title within the <title> tags.

2. Write a short summary of the prompt, highlighting its main points and objectives. This summary should be no more than 2-3 sentences long. Place this summary within the <summary> tags.

3. Generate a list of relevant tags for the prompt. Consider the following aspects when creating tags:
   - The main topic or subject of the prompt
   - The type of task or action required (e.g., analysis, generation, classification)
   - Key concepts or themes mentioned
   - Potential applications or use cases
   - Relevant fields or domains (e.g., natural language processing, content creation, data analysis)
   - Any specific techniques or methodologies mentioned

4. Create as many tags as you think are sufficient to accurately represent the prompt's content and intent. Typically, this might be between 5-15 tags, but use your judgment based on the complexity and breadth of the prompt.

5. Each tag should be a single word or short phrase (no more than 2-3 words). Place each tag within its own <tag> tags inside the <tags> section.

Examples of good tags might include:
- "text-generation"
- "sentiment-analysis"
- "prompt-engineering"
- "data-classification"
- "creative-writing"
- "code-generation"
- "language-model"
- "task-specific"
- "content-moderation"

Remember to enclose your entire output within the specified XML tags, providing a title, summary, and a comprehensive set of tags that will facilitate easy search and recall of this prompt in the future.`)
