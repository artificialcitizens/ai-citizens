import fs from "fs";
import path from "path";

const configPath = path.join(
  process.env.AVA_CONFIG_PATH || process.cwd(),
  "ava.config.json"
);

const commandConfigCache: Record<string, any> = {};

export function getCommandConfig(commandKey: string) {
  if (commandConfigCache[configPath]) {
    return commandConfigCache[configPath][commandKey];
  }

  try {
    const configFile = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configFile);
    const commandsConfig = config.commandsConfig || {};

    commandConfigCache[configPath] = commandsConfig;
    return commandsConfig[commandKey];
  } catch (e) {
    console.error(`Error reading command config: ${e}`);
    return null;
  }
}
