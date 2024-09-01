import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import inquirer from "inquirer";
import { exec } from "node:child_process";
import { Args, Command, Flags } from "@oclif/core";
import { processChatInput } from "@ai-citizens/graph";

export default class Agent extends Command {
  static override args = {
    configPath: Args.string({
      description: "Optional path for the config file",
      required: false,
    }),
  };

  static override examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> /custom/path",
  ];

  static override flags = {
    force: Flags.boolean({
      char: "f",
      description: "Overwrite existing config file",
    }),
  };
  static override description =
    "Interactive AI agent to generate and execute commands based on natural language input";

  private lastCommandOutput = "";

  public async run(): Promise<void> {
    const { flags } = await this.parse(Agent);

    const chatLoop = async () => {
      // @ts-ignore
      const { userInput } = await inquirer.prompt([
        {
          message: "User:",
          name: "userInput",
          type: "input",
        },
      ]);

      if (userInput.toLowerCase() === "exit") {
        this.log("Agent session ended. Goodbye!");
        return;
      }

      try {
        const llmResponse = await processChatInput({
          input: userInput,
          threadId: "1",
          messages: [],
          memories: [],
          goals: [],
          userName: "Josh",
          assistantName: "Ava",
        });

        const message = llmResponse?.messages[llmResponse.messages.length - 1];
        if (typeof message.content === "string") {
          this.log("Ava: ", message.content);
        }

        await chatLoop();
      } catch (error) {
        this.error(`${error}`);
      }
    };

    this.log("Agent Initialized. Type exit to quit.");
    await chatLoop();
  }
}
