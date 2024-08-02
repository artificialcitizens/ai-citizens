import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { Document } from "@langchain/core/documents";

export const run = async (
  url: string
): Promise<Document<Record<string, unknown>>[]> => {
  const loader = YoutubeLoader.createFromUrl(url, {
    addVideoInfo: true,
    language: "en",
  });

  const docs = await loader.load();
  return docs;
};
