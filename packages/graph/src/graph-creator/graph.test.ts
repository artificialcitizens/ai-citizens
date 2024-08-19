import test from "ava";
// import { runGraphGenerator } from "./graph.js";
import "dotenv/config";

test.skip(
  "create graph",
  async (t) => {
    // const userRequest =
    //   "Create a graph that manages a blog writer, it will need write the article, review the article, reiterate based on feedback and then send back to user for approval";
    // const graph = await runGraphGenerator(userRequest, {
    //   configurable: {
    //     thread_id: "test",
    //   },
    // });
    // t.log(graph.scaffoldedGraph);
    t.pass();
  },
  { timeout: "5m" }
);
