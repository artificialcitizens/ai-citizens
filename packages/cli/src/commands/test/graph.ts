import { Args, Command, Flags } from "@oclif/core";
import { processYouTubeVideo } from "@ai-citizens/graph";

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

    if (args.type === "youtube" || !args.type) {
      const parsedVideo = await processYouTubeVideo();
      console.log(parsedVideo);
    }
  }
}
