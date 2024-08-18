import { Command, Args } from "@oclif/core";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import clipboardy from "clipboardy";
import inquirer from "inquirer";
import { exec } from "node:child_process";
import { getModel, isAllModel } from "@ai-citizens/llm";
import Chat from "./chat.js";
import { getModelConfig } from "../utils/get-model-config.js";
import { XMLParser } from "fast-xml-parser";
import { performSearch } from "@ai-citizens/graph";
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};
const MAX_OUTPUT_LINES = 100;

const systemPrompt = `You are an AI assistant specialized in generating shell commands based on user input. Your task is to interpret the user's request and provide an appropriate shell command or explain why the request cannot be fulfilled with a single command.

Rules for generating commands:
1. Generate only the command itself, without any explanations or additional text.
2. Ensure the command is a valid shell command that can be executed in a standard Unix-like environment.
3. If multiple commands are needed, use appropriate operators to combine them (e.g., &&, ||, |).
4. Use common shell utilities and avoid assuming the presence of specialized tools unless explicitly mentioned by the user.
5. Prioritize safety and avoid destructive commands unless explicitly requested.

If the user asks for something that cannot be done with a single shell command:
1. Explain why it's not possible in a brief sentence.
2. Suggest alternatives or a series of commands that could achieve the desired result.

You can refer to previous command outputs when generating new commands. If the user's input references a previous output, use the information provided in the {{PREVIOUS_OUTPUT}} variable to inform your command generation.

When responding, provide your output in the following format:
<explanation>Your explanation or helpful tips go here</explanation>
<command>Your generated shell command or explanation goes here</command>

If there is any previous command output to consider, it will be provided as well.

Generate the appropriate shell command or explanation based on the user's input and any relevant previous output.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

export default class Search extends Command {
  static override description = "AI powered search";
  static override args = {
    query: Args.string({
      description: "Query to search the graph",
      required: true,
    }),
  };
  private lastCommandOutput = "";

  // private async executeCommand(command: string): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     exec(command, (error, stdout, stderr) => {
  //       if (error) {
  //         reject(new Error(`Execution error: ${error.message}`));
  //         resolve("Execution resulted in an error:\n\n" + error.message);
  //       } else {
  //         const output = this.processCommandOutput(stdout, stderr);
  //         this.log("Command output:");
  //         this.log(output);
  //         resolve(output);
  //       }
  //     });
  //   });
  // }

  // private processCommandOutput(stdout: string, stderr: string): string {
  //   let output = stdout.trim();

  //   if (stderr.trim()) {
  //     // Filter out common curl progress messages
  //     const filteredStderr = stderr
  //       .split("\n")
  //       .filter((line) => !/^\s*%/.test(line))
  //       .join("\n")
  //       .trim();

  //     if (filteredStderr) {
  //       output += `\nStderr: ${filteredStderr}`;
  //     }
  //   }

  //   return this.truncateOutput(output);
  // }

  // private truncateOutput(output: string): string {
  //   const lines = output.split("\n");
  //   if (lines.length > MAX_OUTPUT_LINES) {
  //     return (
  //       lines.slice(0, MAX_OUTPUT_LINES).join("\n") + "\n... (output truncated)"
  //     );
  //   }

  //   return output;
  // }
  public async run(): Promise<void> {
    const { flags, args } = await this.parse(Search);
    let modelName = flags.model || "gpt-4o-mini";

    // if (flags.modelSelect) {
    //   modelName = await this.selectModel(getModelConfig());
    // }

    if (!isAllModel(modelName)) {
      throw new Error(`Invalid model: ${modelName}`);
    }

    const model = await getModel({
      model: modelName,
    });

    const config = {
      configurable: {
        thread_id: "agent-session",
      },
    };

    const response = await performSearch(args.query, config);
    console.log(response.messages[1].content);
  }
}
