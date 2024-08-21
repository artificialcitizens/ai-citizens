import { Command, Args } from "@oclif/core";
import { getModel, isAllModel } from "@ai-citizens/llm";
import { performSearch } from "@ai-citizens/graph";

export default class Search extends Command {
  static override description = "AI powered search";
  static override args = {
    query: Args.string({
      description: "Query to search the graph",
      required: true,
    }),
  };
  public async run(): Promise<void> {
    const { flags, args } = await this.parse(Search);
    let modelName = flags.model || "gpt-4o-mini";

    if (!isAllModel(modelName)) {
      throw new Error(`Invalid model: ${modelName}`);
    }

    const config = {
      configurable: {
        thread_id: "agent-session",
      },
    };

    const response = await performSearch(args.query, config);
    console.log(response.messages[1].content);
  }
}
