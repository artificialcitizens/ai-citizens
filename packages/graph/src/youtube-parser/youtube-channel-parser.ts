import Innertube, { YTNodes } from "youtubei.js";
import { processYouTubeVideo } from "./youtube-parser.js";
import { z } from "zod";
import { StructuredTool, tool } from "@langchain/core/tools";

/**
 * Interface for video metadata returned from a channel
 */
interface VideoMetadata {
  id: string;
  title: string;
  url: string;
}

/**
 * Interface for the result of processing a channel
 */
interface ChannelProcessResult {
  channelId: string;
  channelTitle: string;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    summary: string;
    highlights: string[];
    relatedUrls: string[];
    transcription: string;
  }>;
  error?: string;
}

const youtubeChannelSchema = z.object({
  channelIdOrUsername: z
    .string()
    .describe("The YouTube channel ID or username to process all videos from."),
  maxResults: z
    .number()
    .optional()
    .describe("Optional: Maximum number of videos to process (defaults to 10)"),
});

/**
 * Exports a structured tool for processing all videos from a YouTube channel
 */
export const youtubeChannelGraphTool: StructuredTool<
  typeof youtubeChannelSchema
> = tool(
  async ({ channelIdOrUsername, maxResults = 10 }) => {
    const result = await processYouTubeChannel(channelIdOrUsername, {
      configurable: { thread_id: "temp_channel_tool" },
      maxResults,
    });

    return {
      channelId: result.channelId,
      channelTitle: result.channelTitle,
      videoCount: result.videos.length,
      videos: result.videos.map((video) => ({
        id: video.id,
        title: video.title,
        url: video.url,
        summary: video.summary,
      })),
    };
  },
  {
    name: "youtube-channel-parser",
    description: "Process all videos from a YouTube channel.",
    schema: youtubeChannelSchema,
  }
);

/**
 * Normalizes a channel identifier by:
 * - Removing @ prefix from usernames
 * - Determining if it's a channel ID (starts with UC) or a username
 * @param channelIdOrUsername The channel ID or username
 * @returns Normalized identifier object
 */
function normalizeChannelIdentifier(channelIdOrUsername: string): {
  type: "id" | "username";
  value: string;
} {
  // Remove @ symbol if present
  const normalized = channelIdOrUsername.startsWith("@")
    ? channelIdOrUsername.substring(1)
    : channelIdOrUsername;

  // Check if it's a channel ID (typically starts with UC)
  // This is a simple heuristic - YT channel IDs are 24 characters and start with UC
  if (/^UC[\w-]{22}$/.test(normalized)) {
    return { type: "id", value: normalized };
  }

  // Otherwise treat as username
  return { type: "username", value: normalized };
}

/**
 * Fetches all videos from a YouTube channel
 * @param channelIdOrUsername The YouTube channel ID or username
 * @param maxResults Maximum number of videos to fetch
 * @returns Array of video metadata objects
 */
export async function fetchChannelVideos(
  channelIdOrUsername: string,
  maxResults: number = 10
): Promise<{
  channelId: string;
  channelTitle: string;
  videos: VideoMetadata[];
}> {
  try {
    // Initialize the Innertube client
    const youtube = await Innertube.create();

    // Normalize the channel identifier
    const identifier = normalizeChannelIdentifier(channelIdOrUsername);

    let channelId: string;
    let channelTitle = "Unknown Channel";
    let channelContent;

    // Fetch channel based on ID or username
    if (identifier.type === "id") {
      channelId = identifier.value;
      try {
        // Try to get channel by ID
        channelContent = await youtube.getChannel(channelId);
      } catch (error) {
        console.error(`Error getting channel by ID ${channelId}:`, error);
        throw new Error(`Channel with ID ${channelId} not found`);
      }
    } else {
      // Try to get channel by username
      try {
        // First search for the channel
        const search = await youtube.search(identifier.value, {
          type: "channel",
        });

        // Get the first channel from search results
        const searchChannel = search.results.find(
          (result) => result instanceof YTNodes.Channel
        ) as YTNodes.Channel | undefined;

        if (!searchChannel) {
          throw new Error(
            `Channel with username ${identifier.value} not found`
          );
        }

        // Get the channel content using the ID from search
        channelId = searchChannel.id;
        channelTitle = searchChannel.author?.name || "Unknown Channel";
        channelContent = await youtube.getChannel(channelId);
      } catch (error) {
        console.error(
          `Error getting channel by username ${identifier.value}:`,
          error
        );
        throw new Error(`Channel with username ${identifier.value} not found`);
      }
    }

    if (!channelContent) {
      throw new Error(
        `Could not fetch content for channel ${channelIdOrUsername}`
      );
    }

    // Extract channel title from the header (safely)
    if (channelContent.header) {
      // Safely access nested properties to avoid type errors
      if (
        "title" in channelContent.header &&
        channelContent.header.title?.text
      ) {
        channelTitle = channelContent.header.title.text;
      } else if ("author" in channelContent && channelContent.author?.name) {
        channelTitle = channelContent.author.name;
      }
    }

    // Get the videos tab (where videos are listed)
    const videosTab = await channelContent.getVideos();

    if (!videosTab || !videosTab.videos || videosTab.videos.length === 0) {
      return { channelId, channelTitle, videos: [] };
    }

    // Map the videos to a simpler structure, handling different video types
    const videos: VideoMetadata[] = [];

    for (const video of videosTab.videos.slice(0, maxResults)) {
      // Ensure we can access the properties safely regardless of video type
      if ("id" in video && video.id && "title" in video && video.title) {
        const videoId = typeof video.id === "string" ? video.id : "";
        const videoTitle =
          typeof video.title === "string"
            ? video.title
            : video.title.text || "Untitled Video";

        videos.push({
          id: videoId,
          title: videoTitle,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
    }

    return { channelId, channelTitle, videos };
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    throw error;
  }
}

/**
 * Process all videos from a YouTube channel
 * @param channelIdOrUsername The YouTube channel ID or username
 * @param options Configuration options
 * @returns Results from processing all videos in the channel
 */
export async function processYouTubeChannel(
  channelIdOrUsername: string,
  options: {
    configurable: { thread_id: string };
    maxResults?: number;
  }
): Promise<ChannelProcessResult> {
  try {
    // Fetch videos from the channel
    const { channelId, channelTitle, videos } = await fetchChannelVideos(
      channelIdOrUsername,
      options.maxResults || 10
    );

    // Process each video
    const processedVideos = await Promise.all(
      videos.map(async (video) => {
        try {
          const result = await processYouTubeVideo(video.url, {
            configurable: {
              thread_id: `${options.configurable.thread_id}_${video.id}`,
            },
          });

          return {
            id: video.id,
            title: result.title || video.title,
            url: video.url,
            summary: result.summary,
            highlights: result.highlights,
            relatedUrls: result.relatedUrls,
            transcription: result.transcription,
          };
        } catch (error) {
          // If a single video fails, continue processing others
          console.error(`Error processing video ${video.id}:`, error);
          return {
            id: video.id,
            title: video.title,
            url: video.url,
            summary: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
            highlights: [],
            relatedUrls: [],
            transcription: "",
          };
        }
      })
    );

    return {
      channelId,
      channelTitle,
      videos: processedVideos,
    };
  } catch (error) {
    // Return a partial result with error information
    return {
      channelId: channelIdOrUsername,
      channelTitle: "Error",
      videos: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
