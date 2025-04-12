import { StringOutputParser } from "@langchain/core/output_parsers";

import { getModel, isAllModel } from "@ai-citizens/llm";
import { extractRelevantLinks } from "@ai-citizens/prompts";

export const extractLinks = async (
  content: string,
  model: string = "claude-3-5-sonnet-20240620"
) => {
  if (!isAllModel(model)) {
    throw new Error(`Invalid model ${model}`);
  }
  const llm = await getModel({
    model,
  });
  const prompt = extractRelevantLinks;
  const promptResult = await prompt.invoke({ content });
  const modelResult = await llm.invoke(promptResult);
  const parser = new StringOutputParser();
  const response = await parser.invoke(modelResult);
  return response;
};
