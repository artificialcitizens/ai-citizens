import { routeNode } from "./route.node.js";
import test from "ava";

test("route node", async (t) => {
  const state = await routeNode(
    { user_query: "Hello" },
    {
      configurable: {
        thread_id: "tst-123",
      },
    }
  );
  t.log(state.current_action);
  t.is(state.current_action, "respond");

  const secondState = await routeNode(
    { user_query: "fetch the latest news" },
    {
      configurable: {
        thread_id: "tst-123",
      },
    }
  );
  t.log(secondState.current_action);
  t.is(secondState.current_action, "action");
  const thirdState = await routeNode(
    { user_query: "https://www.youtube.com/watch?v=6Jfk8mJiJ9A" },
    {
      configurable: {
        thread_id: "tst-123",
      },
    }
  );
  t.log(thirdState.current_action);
  t.is(thirdState.current_action, "action");
});
