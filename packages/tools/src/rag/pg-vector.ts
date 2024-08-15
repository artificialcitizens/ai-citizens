/**
 * https://js.langchain.com/v0.2/docs/integrations/vectorstores/pgvector/
 */
import {
  PGVectorStore,
  DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";
import "dotenv/config";

import { v4 as uuidv4 } from "uuid";
import type { Document } from "@langchain/core/documents";

const document1: Document = {
  pageContent: "The powerhouse of the cell is the mitochondria",
  metadata: { source: "https://example.com" },
};

const document2: Document = {
  pageContent: "Buildings are made out of brick",
  metadata: { source: "https://example.com" },
};

const document3: Document = {
  pageContent: "Mitochondria are made out of lipids",
  metadata: { source: "https://example.com" },
};

const document4: Document = {
  pageContent: "The 2024 Olympics are in Paris",
  metadata: { source: "https://example.com" },
};

// await vectorStore.addDocuments(documents, { ids: ids });

// const similaritySearchResults = await vectorStore.similaritySearch(
//   "biology",
//   2,
//   filter
// );

// for (const doc of similaritySearchResults) {
//   console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`);
// }

/**
 * Add a document to the vector store
 */
export const addDocument = async ({
  vectorStore,
  documents,
  ids,
}: {
  vectorStore: PGVectorStore;
  documents: Document[];
  ids: string[];
}): Promise<void> => {
  await vectorStore.addDocuments(documents, { ids: ids });
};

export const createVectorStore = async (): Promise<PGVectorStore> => {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  // Updated config
  const config = {
    postgresConnectionOptions: {
      type: "postgres",
      host: "localhost",
      port: 54321, // Changed from 5432 to 54321
      user: "postgres",
      password: "password",
      database: "electric",
    } as PoolConfig,
    tableName: "testlangchainjs",
    columns: {
      idColumnName: "id",
      vectorColumnName: "vector",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    distanceStrategy: "cosine" as DistanceStrategy,
  };
  return await PGVectorStore.initialize(embeddings, config);
};

/**
 * Close the vector store to release resources
 */
export const closeVectorStore = async (
  vectorStore: PGVectorStore
): Promise<void> => {
  await vectorStore.end();
};

/**
 * Perform a similarity search on the vector store
 */
export const similaritySearch = async (
  vectorStore: PGVectorStore,
  query: string,
  k: number,
  filter: Record<string, string>
): Promise<Document[]> => {
  return await vectorStore.similaritySearch(query, k, filter);
};

const documents = [document1, document2, document3, document4];

const ids = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];

const filter = { source: "https://example.com" };

export const test = async () => {
  const vectorStore = await createVectorStore();
  await addDocument({ vectorStore, documents, ids });
  const results = await similaritySearch(vectorStore, "biology", 2, filter);
  for (const doc of results) {
    console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`);
  }
  await closeVectorStore(vectorStore);
};
