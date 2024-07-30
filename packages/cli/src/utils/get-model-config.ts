import fs from "fs";
import path from "path";
import { config } from "dotenv";

const configPath = path.join(
  process.env.ACAI_CONFIG_PATH || process.cwd(),
  "acai.config.json"
);
config({
  path: [`${configPath}/.env`],
});

const modelConfigCache: Record<string, any> = {};

export function getModelConfig() {
  if (modelConfigCache[configPath]) {
    return modelConfigCache[configPath];
  }
  const configFile = fs.readFileSync(configPath, "utf8");
  const modelConfig = JSON.parse(configFile).modelConfig;
  modelConfigCache[configPath] = modelConfig;
  return modelConfig;
}
