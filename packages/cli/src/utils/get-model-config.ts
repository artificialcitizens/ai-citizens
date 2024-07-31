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

  // Filter out empty arrays from the modelConfig
  const filteredModelConfig = Object.entries(modelConfig).reduce<
    Record<string, any>
  >((acc, [key, value]) => {
    if (!Array.isArray(value) || value.length > 0) {
      acc[key] = value;
    }
    return acc;
  }, {});
  modelConfigCache[configPath] = filteredModelConfig;
  return filteredModelConfig;
}
