import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import { getModelConfig } from "../utils/get-model-config.js";
import * as llm from "@ai-citizens/llm";

const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a helpful assistant`],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

export default class Chat extends Command {
  static override flags = {
    model: Flags.string({
      description: "The model to use",
      required: false,
    }),
    modelSelect: Flags.boolean({
      description: "Select a model",
      required: false,
      char: "m",
    }),
  };
  static override description = "Interactive chat with the AI assistant";

  // New method to handle model selection
  public async selectModel(
    modelConfig: Record<string, string[]>
  ): Promise<string> {
    // First, select the model provider
    const { selectedProvider } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedProvider",
        message: "Select a model provider:",
        choices: Object.keys(modelConfig),
      },
    ]);

    // Then, select the specific model from the chosen provider
    const { selectedModel } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedModel",
        message: `Select a ${selectedProvider} model:`,
        choices: modelConfig[selectedProvider],
      },
    ]);

    return selectedModel;
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Chat);

    let modelName = flags.model || "gpt-4o-mini";
    if (!llm.isAllModel(modelName)) {
      this.log(
        `------------------------------------------------\n\n Invalid model: ${modelName} \n\n Use the --modelSelect || -m flag to select a model\n\n------------------------------------------------`
      );
    }

    if (flags.modelSelect) {
      const modelConfig = getModelConfig();
      modelName = await this.selectModel(modelConfig);
    }

    if (!llm.isAllModel(modelName)) {
      throw new Error(`Invalid model: ${modelName}`);
    }

    const model = await llm.getModel({ model: modelName });

    const parser = new StringOutputParser();
    const chain = prompt.pipe(model);

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
        sessionId: "abc2",
      },
    };

    const chatLoop = async () => {
      const { userInput } = await inquirer.prompt([
        {
          message: "User:",
          name: "userInput",
          type: "input",
        },
      ]);

      if (userInput.toLowerCase() === "exit") {
        process.stdout.write("\nChat ended. Goodbye!\n");
        return;
      }

      process.stdout.write("Ava: ");
      try {
        for await (const chunk of await withMessageHistory.stream(
          { input: userInput },
          config
        )) {
          const parsedChunk = await parser.invoke(chunk);
          process.stdout.write(parsedChunk);
        }

        process.stdout.write("\n");
        await chatLoop();
      } catch (error) {
        console.error("Error:", error);
      }
    };

    await chatLoop();
  }
}
