import {ChatPromptTemplate} from '@langchain/core/prompts'

/** Generates SEO terms / related search results given a query */
/** @params searchQuery */
export const generateSeoTerms =
  ChatPromptTemplate.fromTemplate(`You are tasked with creating a list of related terms that could potentially produce greater returns from a search engine, given a specific search term. This task aims to expand the scope of a search query and uncover additional relevant results that might not appear with the original search term alone.

Here is the search term you will be working with:
<search_term>
{searchQuery}
</search_term>

To complete this task, follow these steps:

1. Analyze the given search term:
   - Identify the main topic or concept
   - Consider potential subtopics or related areas
   - Think about synonyms, broader terms, and more specific terms

2. Generate a list of related terms:
   - Include synonyms and close variations of the search term
   - Add broader category terms that encompass the search term
   - Include more specific or narrower terms related to the search term
   - Consider related concepts or associated ideas
   - Think about common phrases or collocations that include the search term

3. Provide your list of related terms in the following format:
   <output>
    <related_term>...</related_term>
    <related_term>...</related_term>
   ...
   </output>

Aim to provide at least 5 related terms, but no more than 10. Each term should be a word or short phrase, not a complete sentence.

Here are two examples to guide you:

Example 1:
<search_term>organic gardening</search_term>
<output>
<related_term>Natural pest control</related_term>
<related_term>Composting techniques</related_term>
<related_term>Heirloom seeds</related_term>
<related_term>Permaculture</related_term>
<related_term>Sustainable agriculture</related_term>
</output>

Example 2:
<search_term>artificial intelligence ethics</search_term>
<output>
<related_term>Machine learning bias</related_term>
<related_term>AI governance</related_term>
<related_term>Algorithmic fairness</related_term>
<related_term>Responsible AI development</related_term>
<related_term>Ethical implications of AI</related_term>
</output>

Remember to focus on terms that are closely related to the original search term but offer different perspectives or aspects of the topic. Strive for a balance between relevance and diversity in your list of related terms.

Begin your analysis and provide your list of related terms now.`)
