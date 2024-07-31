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
  AVA_CONFIG_PATH = "AVA_CONFIG_PATH",
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
      // Skip AVA_CONFIG_PATH
      if (key !== ApiKeys.AVA_CONFIG_PATH && !config[key]) {
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
    const envPath = configPath + "/ava.env";
    let env = this.readExistingConfig(envPath);

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

      // Add AVA_CONFIG_PATH to the config
      updatedConfig[ApiKeys.AVA_CONFIG_PATH] = configPath;

      // Ensure all ApiKeys are present in the config, even if empty
      const configContent = Object.values(ApiKeys)
        .map((key) => `${key}=${updatedConfig[key] || ""}`)
        .join("\n");

      fs.writeFileSync(envPath, configContent);
      this.log(
        `Ava config file ${
          Object.keys(env).length > 0 ? "updated" : "created"
        } at: ${envPath}`
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
