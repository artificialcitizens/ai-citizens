import { FastifyPluginAsync } from "fastify";
import { processYouTubeVideo } from "@ai-citizens/graph";

const youtube: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post<{
    Body: {
      url: string;
    };
  }>("/youtube", async function (request, reply) {
    try {
      const { url } = request.body;

      const config = {
        configurable: {
          thread_id: Date.now().toString(), // Generate unique thread ID
        },
      };

      const result = await processYouTubeVideo(url, config);

      return {
        success: true,
        data: {
          title: result.title,
          description: result.description,
          summary: result.summary,
          relatedUrls: result.relatedUrls,
          highlights: result.highlights,
          transcription: result.transcription,
        },
      };
    } catch (error) {
      reply.status(500);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  });
};

export default youtube;
