import { Args, Command, Flags } from "@oclif/core";
import "dotenv/config";
import fs from "node:fs";

import { convertDirToTextFile } from "@ai-citizens/utils/process";

const defaultIgnore = [
  ".DS_Store",
  "package-lock.json",
  ".angular",
  "yarn.lock",
  "pnpm-lock.yaml",
  "node_modules",
  "dist",
];

export default class Dir extends Command {
  static override args = {
    inputDir: Args.string({
      description: "input directory to convert to text file",
    }),
  };

  static override description = "Converts a directory of files to a text file";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  static override flags = {
    gitIgnore: Flags.string({
      char: "g",
      description:
        "path to .gitignore file to use for ignoring files and directories",
    }),
    ignore: Flags.string({
      char: "i",
      description: "ignore files and directories using comma separated string",
    }),
    outputFile: Flags.string({
      char: "o",
      description: "output file to write to",
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Dir);

    if (!args.inputDir) {
      this.error("Input directory is required");
    }

    if (!flags.outputFile) {
      this.error("Output file is required");
    }

    const ignore = [...defaultIgnore, ...(flags.ignore?.split(",") || [])];

    if (flags.gitIgnore) {
      ignore.push(...(await getGitIgnore(flags.gitIgnore)));
    }

    await convertDirToTextFile(args.inputDir, {
      ignore,
      outputPath: flags.outputFile,
    });
  }
}

const getGitIgnore = async (gitIgnorePath: string): Promise<string[]> => {
  try {
    if (!fs.existsSync(gitIgnorePath)) {
      console.warn(
        `Warning: .gitignore file not found at ${gitIgnorePath}. Ignoring .gitignore patterns.`
      );
      return [];
    }

    const stats = fs.statSync(gitIgnorePath);
    if (stats.isDirectory()) {
      console.warn(
        `Warning: ${gitIgnorePath} is a directory, not a file. Ignoring .gitignore patterns.`
      );
      return [];
    }

    const gitIgnore = fs.readFileSync(gitIgnorePath, "utf8");
    return gitIgnore
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.startsWith("#"));
  } catch (error) {
    console.error(
      `Error reading .gitignore file at ${gitIgnorePath}: ${error}`
    );
    return [];
  }
};
