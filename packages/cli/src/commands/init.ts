import { Args, Command, Flags } from "@oclif/core";
import * as fs from "fs";
import inquirer from "inquirer";

enum ApiKeys {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  TAVILY_API_KEY = "TAVILY_API_KEY",
  ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY",
  GOOGLE_API_KEY = "GOOGLE_API_KEY",
  GROQ_API_KEY = "GROQ_API_KEY",
  UNSTRUCTURED_API_KEY = "UNSTRUCTURED_API_KEY",
  LOCAL_OPENAI_BASE_URL = "LOCAL_OPENAI_BASE_URL",
  OLLAMA_BASE_URL = "OLLAMA_BASE_URL",
}

export default class Init extends Command {
  static override args = {
    configPath: Args.string({
      description: "Optional path for the config file",
      required: false,
    }),
  };

  static override description = "Initialize Ava configuration";

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

  private readExistingConfig(configPath: string): Record<string, string> {
    const config: Record<string, string> = {};
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, "utf-8");
      fileContent.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          config[key.trim()] = value.trim();
        }
      });
    }
    return config;
  }

  private async promptForMissingKeys(
    config: Record<string, string>
  ): Promise<Record<string, string>> {
    for (const key of Object.values(ApiKeys)) {
      if (!config[key]) {
        const { value } = await inquirer.prompt([
          {
            type: "input",
            name: "value",
            message: `Enter your ${key} (press Enter to skip):`,
          },
        ]);
        if (value.trim() !== "") {
          config[key] = value.trim();
        }
      }
    }
    return config;
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Init);
    const currentDir = process.cwd();
    const configPath = args.configPath || currentDir;

    let env = this.readExistingConfig(configPath + "/ava.env");

    if (Object.keys(env).length > 0 && !flags.force) {
      this.log(
        `Existing config file found at ${configPath}. Updating with missing keys.`
      );
    } else {
      env = {};
      this.log(`Creating new config file at ${configPath}.`);
    }

    try {
      const updatedConfig = await this.promptForMissingKeys(env);

      const configContent = Object.entries(updatedConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      fs.writeFileSync(configPath, configContent);
      this.log(
        `Ava config file ${
          Object.keys(env).length > 0 ? "updated" : "created"
        } at: ${configPath}`
      );
    } catch (error) {
      this.error(
        `Failed to ${
          Object.keys(env).length > 0 ? "update" : "create"
        } config file: ${error}`
      );
    }
  }
}
