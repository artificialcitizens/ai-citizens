import { StringOutputParser } from "@langchain/core/output_parsers";

import modelManager from "../model-manager.js";
import { analyzeTranscriptTemplate } from "../prompts/analyze-transcript.js";

export const run = async (transcript: string) => {
  const llm = getModel({
    model: "gpt-4o",
  });
  const prompt = analyzeTranscriptTemplate;
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  const response = await chain.invoke({ transcript });
  return response;
};
