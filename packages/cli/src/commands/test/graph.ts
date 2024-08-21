import { Args, Command, Flags } from "@oclif/core";
import {
  processYouTubeVideo,
  runGraphGenerator,
  resumeGraphGenerator,
  updateGraphState,
} from "@ai-citizens/graph";
import inquirer from "inquirer";
import { HumanMessage } from "@langchain/core/messages";
import { test } from "@ai-citizens/tools";
// import { testElectric } from "../../ui/test.jsx";

export default class TestGraph extends Command {
  static override args = {
    type: Args.string({ description: "type of graph to run" }),
  };

  static override description = "describe the command here";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: "f" }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(TestGraph);
    const config = {
      configurable: {
        thread_id: "123",
      },
    };
    if (args.type === "youtube") {
      const parsedVideo = await processYouTubeVideo(
        "https://youtu.be/ZaD_IoNhmXg?si=AMrXm08vqxkP48UW",
        config
      );
      console.log(parsedVideo);
    }

    if (args.type === "graph" || !args.type) {
      const config = {
        configurable: {
          thread_id: "2123",
        },
      };

      const parsedGraphState = await runGraphGenerator(
        "generate a graph for a chatbot",
        config
      );
      this.log(parsedGraphState.scaffoldedGraph);

      // User interaction loop
      const { userInput }: { userInput: string } = await inquirer.prompt([
        {
          type: "input",
          name: "userInput",
          message: "Enter your feedback (or 'exit' to quit):",
        },
      ]);

      if (userInput.toLowerCase() === "exit") {
        process.stdout.write("\nGraph generation ended. Goodbye!\n");
        return;
      }
      if (userInput) {
        const updatedGraphState = {
          ...parsedGraphState,
          qaResult: {
            hasErrors: true,
            errorMessages: [],
          },
          messages: [...parsedGraphState.messages, new HumanMessage(userInput)],
        };

        // Resume graph generation with user input
        updateGraphState(updatedGraphState, config);
      }
      const resumedGraphState = await resumeGraphGenerator(config);
      console.log(resumedGraphState.scaffoldedGraph);
    }

    if (args.type === "pg-vector") {
      await test();
    }

    // if (args.type === "electric") {
    //   testElectric();
    // }
  }
}
