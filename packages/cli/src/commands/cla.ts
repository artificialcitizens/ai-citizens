import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { Command, Flags } from "@oclif/core";
import clipboardy from "clipboardy";
import inquirer from "inquirer";
import { exec } from "node:child_process";
import { Model, getModel } from "@artificialcitizens/llm";
import { config } from "dotenv";
config({
  path: ["~/ava.env"],
});
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};
const MAX_OUTPUT_LINES = 100; // Adjust this value as needed

const systemPrompt = `You are an AI assistant that generates shell commands based on user input. 
Generate only the command itself, without any explanations or additional text.
If the user asks for something that cannot be done with a single shell command, explain why and suggest alternatives.
You can refer to previous command outputs when generating new commands.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

export default class CLA extends Command {
  static override flags = {
    model: Flags.string({
      description: "The model to use",
      required: false,
    }),
  };
  static override description =
    "Interactive AI agent to generate and execute commands based on natural language input";

  private lastCommandOutput = "";

  public async run(): Promise<void> {
    const { flags } = await this.parse(CLA);
    const m = (flags.model as Model) || "gpt-3.5-turbo";
    const model = getModel({
      model: m,
    });
    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    const withMessageHistory = new RunnableWithMessageHistory({
      async getMessageHistory(sessionId) {
        messageHistories[sessionId] ??= new InMemoryChatMessageHistory();
        return messageHistories[sessionId];
      },
      historyMessagesKey: "chat_history",
      inputMessagesKey: "input",
      runnable: chain,
    });

    const config = {
      configurable: {
        sessionId: "agent-session",
      },
    };

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
        this.log("Command Line Agent session ended. Goodbye!");
        return;
      }

      const fullInput = this.lastCommandOutput
        ? `cmd output: ${this.lastCommandOutput}\n${userInput}`
        : userInput;

      try {
        const generatedCommand = await withMessageHistory.invoke(
          { input: fullInput },
          config
        );
        this.log("Generated command:", generatedCommand);

        // @ts-ignore
        const { execute } = await inquirer.prompt([
          {
            choices: [
              { key: "y", name: "Yes", value: true },
              { key: "n", name: "No", value: false },
              { key: "c", name: "Copy to clipboard", value: "copy" },
            ],
            message: "Execute this command?",
            name: "execute",
            type: "expand",
          },
        ]);

        if (execute === true) {
          const output = await this.executeCommand(generatedCommand);
          if (output.includes("Execution resulted in an error")) {
            this.log("Command execution resulted in an error:", output);
            this.lastCommandOutput = "";
          } else {
            this.lastCommandOutput = this.truncateOutput(output);
          }

          await messageHistories[config.configurable.sessionId].addMessage(
            new HumanMessage(fullInput)
          );
          await messageHistories[config.configurable.sessionId].addMessage(
            new AIMessage(generatedCommand)
          );
        } else if (execute === "copy") {
          clipboardy.writeSync(generatedCommand);
          this.log("Command copied to clipboard");
          this.lastCommandOutput = "";
          // end the loop
          return;
        } else {
          this.log(
            "Command not executed, enter new request or type exit to quit."
          );
          this.lastCommandOutput = "";
        }

        await chatLoop();
      } catch (error) {
        this.error(`${error}`);
      }
    };

    this.log(
      "Welcome to the Command Line Agent. Type your command in natural language, or type exit to quit."
    );
    await chatLoop();
  }

  private async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Execution error: ${error.message}`));
          resolve("Execution resulted in an error:\n\n" + error.message);
        } else {
          const output = this.processCommandOutput(stdout, stderr);
          this.log("Command output:");
          this.log(output);
          resolve(output);
        }
      });
    });
  }

  private processCommandOutput(stdout: string, stderr: string): string {
    let output = stdout.trim();

    if (stderr.trim()) {
      // Filter out common curl progress messages
      const filteredStderr = stderr
        .split("\n")
        .filter((line) => !/^\s*%/.test(line))
        .join("\n")
        .trim();

      if (filteredStderr) {
        output += `\nStderr: ${filteredStderr}`;
      }
    }

    return this.truncateOutput(output);
  }

  private truncateOutput(output: string): string {
    const lines = output.split("\n");
    if (lines.length > MAX_OUTPUT_LINES) {
      return (
        lines.slice(0, MAX_OUTPUT_LINES).join("\n") + "\n... (output truncated)"
      );
    }

    return output;
  }
}
