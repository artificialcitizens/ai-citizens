import fs from "fs";
import { CompiledStateGraph } from "@langchain/langgraph";

export const generateGraphImg = async ({
  app,
  path,
}: {
  app: CompiledStateGraph<any, any, any>;
  path?: string;
}) => {
  if (process.env.NODE_ENV !== "production") {
    const drawableGraph = app.getGraph();
    const image = await drawableGraph.drawMermaidPng();
    const arrayBuffer = await image.arrayBuffer();
    if (!path) {
      return arrayBuffer;
    }
    // Convert ArrayBuffer to Uint8Array and write directly
    const uint8Array = new Uint8Array(arrayBuffer);
    fs.writeFileSync(path, uint8Array);
  }
};
