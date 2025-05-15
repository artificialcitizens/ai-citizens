import { processYouTubeChannel } from "../index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using ESM pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Example usage of the channel processor
async function main() {
  // Check if channel ID or username was provided as command line argument
  const channelIdOrUsername = process.argv[2];

  if (!channelIdOrUsername) {
    console.error(
      "Please provide a YouTube channel ID or username as a command line argument"
    );
    console.error("Examples:");
    console.error(
      "  Channel ID: node process-channel.js UCgNqpQrALMzm-Em3BWaQmYg"
    );
    console.error("  Username: node process-channel.js aiDotEngineer");
    console.error("  Handle: node process-channel.js @aiDotEngineer");
    process.exit(1);
  }

  // Optional: specify max number of videos to process
  const maxResults = process.argv[3] ? parseInt(process.argv[3], 10) : 10;

  console.log(
    `Processing channel ${channelIdOrUsername} (max ${maxResults} videos)...`
  );

  try {
    // Process the channel
    const result = await processYouTubeChannel(channelIdOrUsername, {
      configurable: { thread_id: `channel_${Date.now()}` },
      maxResults,
    });

    console.log(`Channel: ${result.channelTitle} (ID: ${result.channelId})`);
    console.log(`Videos processed: ${result.videos.length}`);

    // Create a safe filename by removing special characters
    const safeFileName = result.channelId.replace(/[^a-zA-Z0-9]/g, "_");

    // Save the results to a JSON file
    const outputPath = path.join(
      __dirname,
      `channel_${safeFileName}_results.json`
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`Results saved to ${outputPath}`);

    // Print summaries of each video
    if (result.videos.length > 0) {
      console.log("\nVideo Summaries:");
      result.videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title} (${video.id})`);
        console.log(`   Summary: ${video.summary.substring(0, 150)}...`);
      });
    } else {
      console.log("\nNo videos found or processed.");
    }
  } catch (error) {
    console.error("Error processing channel:", error);
  }
}

// Run the example
main().catch(console.error);
