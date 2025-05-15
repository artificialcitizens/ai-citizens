import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import notifier from "node-notifier";

// Create server instance
const server = new McpServer({
  name: "cursor-tools",
  version: "0.0.1",
});

// Register notification tool
server.tool(
  "notify",
  "Send a notification on macOS",
  {
    title: z.string().describe("The title of the notification"),
    message: z.string().describe("The message body of the notification"),
    sound: z
      .boolean()
      .optional()
      .describe("Whether to play a sound with the notification"),
  },
  async ({ title, message, sound = true }) => {
    const TIMEOUT_MS = 5000; // 5 second timeout

    try {
      const result = await Promise.race([
        new Promise((resolve, reject) => {
          notifier.notify(
            {
              title,
              message,
              sound,
              timeout: 10, // notification timeout in seconds
            },
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            }
          );
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Notification timed out")),
            TIMEOUT_MS
          )
        ),
      ]);

      return {
        content: [
          {
            type: "text",
            text: "Notification sent successfully",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to send notification: ${error.message}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Cursor Tools MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
