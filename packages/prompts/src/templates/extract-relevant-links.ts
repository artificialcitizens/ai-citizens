import {ChatPromptTemplate} from '@langchain/core/prompts'

/**
 * Extracts relevant links from a given piece of content
 * @params content
 */
export const extractRelevantLinks =
  ChatPromptTemplate.fromTemplate(`You are tasked with extracting relevant links from a given piece of content. Your goal is to find links that provide additional context or information related to the main topic, while avoiding marketing or advertisement-focused links.

Here is the content you will be working with:

<content>
{content}
</content>

Follow these steps to complete the task:

1. Carefully read through the content and identify all links present.

2. For each link, evaluate its relevance to the main topic of the content. Consider the following guidelines:
   - The link should provide additional information, context, or depth to the topic discussed.
   - The link should lead to reputable sources or official websites related to the subject matter.
   - Avoid links that are primarily for marketing purposes, product promotions, or advertisements.
   - Exclude links to social media profiles unless they are directly relevant to the content's subject.

3. For links you deem relevant, format them as markdown links within <link> tags. The format should be:
   <link>[Link text](URL)</link>

4. If you're unsure about a link's relevance, use the <scratchpad> tags to think through your decision. For example:

<scratchpad>
Considering the link to "example.com/product". While it's related to the topic, it seems to be a product page rather than providing additional context. I'll exclude this link.
</scratchpad>

5. After evaluating all links, compile your final list of relevant links.

6. Present your final output within <extracted_links> tags, with each link on a new line.

Here's an example of good and bad link selections:

Good: <link>[NASA's Mars Exploration Program](https://mars.nasa.gov/)</link>
Bad: <link>[Buy Mars-themed T-shirts](https://example.com/mars-tshirts)</link>

Remember, the goal is to provide valuable, context-adding links, not to compile an exhaustive list of all links in the content.

Your final output should look like this:

<extracted_links>
<link>[Relevant link 1](URL1)</link>
<link>[Relevant link 2](URL2)</link>
<link>[Relevant link 3](URL3)</link>
</extracted_links>

If no relevant links are found, output:

<extracted_links>
</extracted_links>`)
