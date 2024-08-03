import { StringOutputParser } from "@langchain/core/output_parsers";

import { getModel, isAllModel } from "@ai-citizens/llm";
import { analyzeTranscriptTemplate } from "@ai-citizens/prompts";

export const parseTranscript = async ({
  transcript,
  modelName = "gpt-4o",
}: {
  transcript: string;
  modelName?: string;
}) => {
  if (!isAllModel(modelName)) {
    throw new Error("Model is not supported");
  }
  const llm = await getModel({ model: modelName });
  const prompt = analyzeTranscriptTemplate;
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const response = await chain.invoke({ transcript });
  return response;
};
