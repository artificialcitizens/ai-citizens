import fs from "fs";
import { CompiledStateGraph } from "@langchain/langgraph";

export const generateGraphImg = async ({
  app,
  path,
}: {
  app: CompiledStateGraph<any, any, any>;
  path?: string;
}) => {
  const drawableGraph = app.getGraph();
  const image = await drawableGraph.drawMermaidPng();
  const arrayBuffer = await image.arrayBuffer();
  if (!path) {
    return arrayBuffer;
  }
  fs.writeFileSync(path, Buffer.from(arrayBuffer));
};
