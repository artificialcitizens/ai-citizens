import fs from "fs";
import path from "path";

const configPath = path.join(
  process.env.AVA_CONFIG_PATH || process.cwd(),
  "ava.config.json"
);

interface ConfigCache {
  commandsConfig?: Record<string, any>;
  userInfo?: Record<string, string>;
}

const configCache: ConfigCache = {};

function readConfig(): ConfigCache {
  if (Object.keys(configCache).length) {
    return configCache;
  }

  try {
    const configFile = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configFile);
    configCache.commandsConfig = config.commandsConfig || {};
    configCache.userInfo = config.userInfo || {};
    return configCache;
  } catch (e) {
    console.error(`Error reading config: ${e}`);
    return {};
  }
}

export function getCommandConfig(commandKey: string): any | undefined {
  const { commandsConfig } = readConfig();
  return commandsConfig?.[commandKey];
}

export function getUserInfo(): Record<string, string> | undefined {
  const { userInfo } = readConfig();
  return userInfo;
}
