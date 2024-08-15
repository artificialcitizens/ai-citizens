import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// import {ChatOpenAI} from '@langchain/openai'
/**
 * Transform the query to produce a better question.
 *
 * @param {GraphState} state: {question: string} The current state of the graph.
 * @returns {Promise} The new state object.
 */
export async function transformQuery({
  state,
  model,
}: {
  state: { question: string };
  model: any;
}): Promise<{ question: string; improvedQuestion: string }> {
  const { question } = state;
  // console.log('---TRANSFORM QUERY---')
  // Pull in the prompt
  const prompt = ChatPromptTemplate.fromTemplate(
    `You are generating a question that is well optimized for semantic search retrieval.
  Look at the input and try to reason about the underlying sematic intent / meaning.
  Here is the initial question:
  \n ------- \n
  {question} 
  \n ------- \n
  Formulate an improved question: `
  );

  // // Grader
  // const model = new ChatOpenAI({
  //   modelName: "gpt-4-0125-preview",
  //   streaming: true,
  //   temperature: 0,
  // });

  // Prompt
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const betterQuestion = await chain.invoke({ question });

  return {
    question,
    improvedQuestion: betterQuestion,
  };
}
