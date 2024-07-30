import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import { config } from "dotenv";
config({
  path: ["~/ava.env"],
});

import { getModel, isAllModel } from "@ai-citizens/llm";

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
  };
  static override description = "Interactive chat with the AI assistant";

  public async run(): Promise<void> {
    const { flags } = await this.parse(Chat);

    const modelName = flags.model || "gpt-4o-mini";

    if (!isAllModel(modelName)) {
      throw new Error(`Invalid model: ${modelName}`);
    }

    const model = await getModel({ model: modelName });

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
