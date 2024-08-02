import fs from "fs";
import path from "path";

const configPath = path.join(
  process.env.AVA_CONFIG_PATH || process.cwd(),
  "ava.config.json"
);

const modelConfigCache: Record<string, any> = {};

export function getModelConfig() {
  if (modelConfigCache[configPath]) {
    return modelConfigCache[configPath];
  }
  const configFile = fs.readFileSync(configPath, "utf8");
  const modelConfig = JSON.parse(configFile).modelConfig;

  const filteredModelConfig = Object.entries(modelConfig).reduce<
    Record<string, string[]>
  >((acc, [provider, config]) => {
    if (
      typeof config === "object" &&
      config !== null &&
      "models" in config &&
      Array.isArray(config.models)
    ) {
      acc[provider] = config.models;
    }
    return acc;
  }, {});

  modelConfigCache[configPath] = filteredModelConfig;
  return filteredModelConfig;
}
