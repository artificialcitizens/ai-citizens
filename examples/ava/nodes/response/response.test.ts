import { responseNode } from "./response.node.js";
import test from "ava";
import { HumanMessage } from "@langchain/core/messages";

test("response node", async (t) => {
  const state = await responseNode(
    {
      user_query: "How are you today?",
      memories: [
        "User likes to play video games",
        "User is a software engineer",
      ],
      goals: ["Expand your knowledge of the user"],
      assistantName: "Ava",
      userName: "Josh",
      messages: [new HumanMessage("How are you today?")],
      last_interaction_at: new Date("01-22-24"),
    },
    {
      configurable: {
        thread_id: "tst-123",
      },
    }
  );
  t.log(state);
  t.assert(state.messages.length === 1);
});
