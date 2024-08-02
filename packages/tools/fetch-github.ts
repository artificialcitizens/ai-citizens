import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'
import {Document} from '@langchain/core/documents'

export const run = async (dir: string, ignorePaths: string[] = []): Promise<Document[]> => {
  const loader = new GithubRepoLoader(dir, {
    branch: 'main',
    ignorePaths,
    maxConcurrency: 3,
    recursive: false,
    unknown: 'warn',
  })

  const docs = []
  for await (const doc of loader.loadAsStream()) {
    docs.push(doc)
  }

  return docs
}
