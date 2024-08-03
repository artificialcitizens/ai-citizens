import {ChatPromptTemplate} from '@langchain/core/prompts'

/**
 * Creates a series of increasingly concise entity-dense summaries of a given article
 *
 * @params article
 */
export const chainOfDensity =
  ChatPromptTemplate.fromTemplate(`You will be given an article and asked to generate increasingly concise entity-dense summaries of it. Here is the article:

<article>
{article}
</article>

Your task is to create 5 increasingly concise and entity-dense summaries of the above article. You will do this by repeating the following two-step process 5 times:

Step 1: Identify 1-3 informative entities from the article which are missing from the previously generated summary. Enclose these entities in [square brackets].

Step 2: Write a new, denser summary of identical length to the previous summary. This new summary should cover every entity and detail from the previous summary plus the newly identified missing entities.

A missing entity is defined as:
- Relevant: to the main stories in the article
- Specific: descriptive yet concise (5 words or fewer)
- Novel: not present in the previous summary
- Faithful: actually present in the article
- Anywhere: can be located anywhere in the article

Follow these guidelines when creating your summaries:
1. The first summary should be long (4-5 sentences, approximately 80 words), yet highly non-specific, containing little information beyond the entities marked as missing. Use overly verbose language and fillers (e.g., "this article discusses") to reach about 80 words.
2. Make every word count. Rewrite the previous summary to improve flow and make space for additional entities.
3. Create space by using fusion, compression, and removal of uninformative phrases like "the article discusses".
4. The summaries should become highly dense and concise, yet self-contained (easily understood without the article).
5. Missing entities can appear anywhere in the new summary.
6. Never drop entities from the previous summary. If space cannot be made, add fewer new entities.
7. Use the exact same number of words for each summary.

Present your output in the following format:

    <explanation>
        <missing_entities>
            <entity>Entity 1</entity>
            <entity>Entity 2</entity>
            <entity>Entity 3</entity>
        </missing_entities>
        <summary>Your summary here</summary>
    </explanation>
    <explanation>
        <missing_entities>
            <entity>Entity 4</entity>
            <entity>Entity 5</entity>
        </missing_entities>
        <summary>Your summary here</summary>
    </explanation>
    <explanation>
        <missing_entities>
            <entity>Entity 6</entity>
            <entity>Entity 7</entity>
            <entity>Entity 8</entity>
        </missing_entities>
        <summary>Your summary here</summary>
    </explanation>
    <explanation>
        <missing_entities>
            <entity>Entity 9</entity>
            <entity>Entity 10</entity>
        </missing_entities>
        <summary>Your summary here</summary>
    </explanation>
    <explanation>
        <missing_entities>
            <entity>Entity 11</entity>
            <entity>Entity 12</entity>
            <entity>Entity 13</entity>
        </missing_entities>
        <summary>Your summary here</summary>
    </explanation>

Begin the task now.`)
