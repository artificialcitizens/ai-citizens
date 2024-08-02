import {StringOutputParser} from '@langchain/core/output_parsers'

import modelManager from '../model-manager.js'
import {extractRelevantLinks} from '../prompts/index.js'

export const run = async (content: string) => {
  const llm = modelManager.anthropicModel({
    model: 'claude-3-5-sonnet-20240620',
  })
  const prompt = extractRelevantLinks
  const chain = prompt.pipe(llm).pipe(new StringOutputParser())
  const response = await chain.invoke({content})
  return response
}
