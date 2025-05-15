import { processYouTubeChannel } from "../index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using ESM pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Array of channel IDs or usernames to process - replace with your own
const CHANNEL_IDENTIFIERS = [
  // Add channel IDs or usernames here, for example:
  // "UCgNqpQrALMzm-Em3BWaQmYg", // Example channel ID
  // "aiDotEngineer", // Example username
  // "@aiDotEngineer" // Example handle with @ symbol
];

// Maximum number of videos to process per channel
const MAX_VIDEOS_PER_CHANNEL = 5;

// Directory to save results
const RESULTS_DIR = path.join(__dirname, "channel_results");

// Create results directory if it doesn't exist
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Process a single channel
 */
async function processChannel(channelIdOrUsername: string): Promise<void> {
  console.log(`\nProcessing channel ${channelIdOrUsername}...`);

  try {
    // Process the channel
    const result = await processYouTubeChannel(channelIdOrUsername, {
      configurable: {
        thread_id: `channel_${channelIdOrUsername}_${Date.now()}`,
      },
      maxResults: MAX_VIDEOS_PER_CHANNEL,
    });

    console.log(`Channel: ${result.channelTitle} (ID: ${result.channelId})`);
    console.log(`Videos processed: ${result.videos.length}`);

    // Create a safe filename by removing special characters
    const safeFileName = result.channelId.replace(/[^a-zA-Z0-9]/g, "_");

    // Save the results to a JSON file
    const outputPath = path.join(
      RESULTS_DIR,
      `channel_${safeFileName}_results.json`
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log(`Results saved to ${outputPath}`);

    return Promise.resolve();
  } catch (error) {
    console.error(`Error processing channel ${channelIdOrUsername}:`, error);
    return Promise.reject(error);
  }
}

/**
 * Process all channels in the list sequentially
 */
async function processChannelsSequentially(): Promise<void> {
  if (CHANNEL_IDENTIFIERS.length === 0) {
    console.error(
      "No channel identifiers specified in CHANNEL_IDENTIFIERS array"
    );
    return;
  }

  console.log(
    `Processing ${CHANNEL_IDENTIFIERS.length} channels sequentially, ${MAX_VIDEOS_PER_CHANNEL} videos per channel...`
  );

  // Process each channel one after another
  for (const channelIdOrUsername of CHANNEL_IDENTIFIERS) {
    try {
      await processChannel(channelIdOrUsername);
    } catch (error) {
      // Continue with next channel even if one fails
      console.error(
        `Failed to process channel ${channelIdOrUsername}, continuing with next channel...`
      );
    }
  }

  console.log("\nAll channels processed!");
}

/**
 * Process all channels in parallel
 */
async function processChannelsInParallel(): Promise<void> {
  if (CHANNEL_IDENTIFIERS.length === 0) {
    console.error(
      "No channel identifiers specified in CHANNEL_IDENTIFIERS array"
    );
    return;
  }

  console.log(
    `Processing ${CHANNEL_IDENTIFIERS.length} channels in parallel, ${MAX_VIDEOS_PER_CHANNEL} videos per channel...`
  );

  // Process all channels in parallel
  const promises = CHANNEL_IDENTIFIERS.map((channelIdOrUsername) =>
    processChannel(channelIdOrUsername).catch((error) => {
      console.error(`Failed to process channel ${channelIdOrUsername}:`, error);
      return null; // Return null for failed channels
    })
  );

  await Promise.all(promises);
  console.log("\nAll channels processed!");
}

// Main function
async function main() {
  // Get processing mode from command line argument (sequential or parallel)
  const mode = process.argv[2] || "sequential";

  // If specific channel identifiers were provided via command line, use those instead
  if (process.argv.length > 3) {
    const commandLineChannels = process.argv.slice(3);
    console.log(
      `Using ${commandLineChannels.length} channels provided via command line`
    );

    // Replace the predefined channels with the command line ones
    CHANNEL_IDENTIFIERS.length = 0;
    CHANNEL_IDENTIFIERS.push(...commandLineChannels);
  }

  if (mode === "parallel") {
    await processChannelsInParallel();
  } else {
    await processChannelsSequentially();
  }
}

// Run the example
main().catch(console.error);
