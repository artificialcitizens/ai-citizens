import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import { getModelConfig } from "../utils/get-model-config.js";
import * as llm from "@ai-citizens/llm";
import { config } from "dotenv";
import { getCommandConfig } from "../utils/get-command-config.js";
import { getUserInfo } from "../utils/get-user-config.js";
import { PromptTemplate } from "@langchain/core/prompts";

config({
  path: [`${process.env.AVA_CONFIG_PATH}/.env`, process.cwd() + "/.env"],
});

const getCurrentTime = () => {
  return new Date().toLocaleString();
};

const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

const systemPromptTemplate = PromptTemplate.fromTemplate(
  "You are a helpful assistant for {name}.\n" +
    "Here is some known information about the user:\n" +
    "Name: {name}\n" +
    "{userInfo}\n" +
    "Current date and time: {currentTime}"
);

const chatConfig = getCommandConfig("chat");
let finalSystemPrompt = systemPromptTemplate;

if (chatConfig && chatConfig.systemPrompt) {
  finalSystemPrompt = PromptTemplate.fromTemplate(chatConfig.systemPrompt);
}

// Get user info
const userInfo = getUserInfo();
const userName = userInfo?.name || "User";
const userInfoString = userInfo
  ? Object.entries(userInfo)
      .filter(([key]) => key !== "name")
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")
  : "No additional user info available";

export default class Chat extends Command {
  static override flags = {
    model: Flags.string({
      description: "The model to use",
      required: false,
      char: "m",
    }),
    modelSelect: Flags.boolean({
      description: "Select a model",
      required: false,
      char: "s",
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

    let modelName = flags.model || chatConfig?.defaultModel || "gpt-4o-mini";
    if (!llm.isAllModel(modelName)) {
      this.log(
        `------------------------------------------------\n\n Invalid model: ${modelName} \n\n Use the --modelSelect || -s flag to select a model\n\n------------------------------------------------`
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
        // Update the current time for each message
        const currentTime = getCurrentTime();
        const formattedSystemPrompt = await finalSystemPrompt.format({
          name: userName,
          userInfo: userInfoString,
          currentTime: currentTime,
        });

        // Update the prompt with the new system message
        const updatedPrompt = ChatPromptTemplate.fromMessages([
          ["system", formattedSystemPrompt],
          ["placeholder", "{chat_history}"],
          ["human", "{input}"],
        ]);

        // Use the updated prompt for this message
        const updatedChain = updatedPrompt.pipe(model);
        const updatedWithMessageHistory = new RunnableWithMessageHistory({
          async getMessageHistory(sessionId) {
            messageHistories[sessionId] ??= new InMemoryChatMessageHistory();
            return messageHistories[sessionId];
          },
          historyMessagesKey: "chat_history",
          inputMessagesKey: "input",
          runnable: updatedChain,
        });

        for await (const chunk of await updatedWithMessageHistory.stream(
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
