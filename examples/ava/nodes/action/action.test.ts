import { actionNode } from "./action.node.js";
import { HumanMessage } from "@langchain/core/messages";
import test from "ava";

test("action node", async (t) => {
  // const state = await actionNode(
  //   { messages: [new HumanMessage("what is 4 + 5")] },
  //   {
  //     configurable: {
  //       thread_id: "tst-123",
  //     },
  //   }
  // );
  // t.log(state.messages);
  // const state2 = await actionNode(
  //   { messages: [new HumanMessage("what is the weather in portland oregon")] },
  //   {
  //     configurable: {
  //       thread_id: "tst-123weather",
  //     },
  //   }
  // );
  // t.log(state2.messages);
  const state3 = await actionNode(
    {
      messages: [
        new HumanMessage(
          "What are the trending github repos related to AI and LLMs?"
        ),
      ],
    },
    {
      configurable: {
        thread_id: "tst-123weather",
      },
    }
  );
  t.log(state3?.messages[state3?.messages.length - 1].content);
  t.pass();
});
