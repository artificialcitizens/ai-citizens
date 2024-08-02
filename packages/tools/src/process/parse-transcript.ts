import { StringOutputParser } from "@langchain/core/output_parsers";

import { getModel } from "@ai-citizens/llm";
import { analyzeTranscriptTemplate } from "@ai-citizens/prompts";

export const parseTranscript = async (transcript: string) => {
  const llm = await getModel({
    model: "gpt-4o",
  });
  const prompt = analyzeTranscriptTemplate;
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const response = await chain.invoke({ transcript });
  return response;
};
