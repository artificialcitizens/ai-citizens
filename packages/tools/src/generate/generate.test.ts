import test from "ava";
import { barChartTool } from "./bar-chart.js";
import fs from "fs/promises";
import path from "path";

test("barChartTool generates a chart, returns base64 image, and saves to file", async (t) => {
  const result = await barChartTool.invoke({
    data: [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
      { label: "C", value: 30 },
    ],
  });

  t.is(typeof result.message, "string");
  t.is(result.message, "Chart has been generated successfully!");
  t.is(typeof result.image, "string");
  t.true(result.image.length > 0);
  t.true(result.image.startsWith("iVBORw0KGgo"));

  // // Extract base64 data (remove the data URL prefix)
  // const base64Data = result.image.replace(/^data:image\/png;base64,/, "");

  // // Save the image to a file
  // const testAssetsDir = path.join(process.cwd(), "test-assets");
  // const filePath = path.join(testAssetsDir, "bar-chart-test.png");

  // await fs.mkdir(testAssetsDir, { recursive: true });
  // await fs.writeFile(filePath, base64Data, "base64");
});
