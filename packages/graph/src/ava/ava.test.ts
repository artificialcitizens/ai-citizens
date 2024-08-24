import test from "ava";
import { processChatInput, streamChatInput } from "./graph.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

test("runAva", async (t) => {
  const state = await processChatInput({
    input: "What is the weather in portland oregon?",
    threadId: "tst-123",
    messages: [
      new HumanMessage("Hello, my name is Alice."),
      new AIMessage("Hello Alice! It's nice to meet you. Where are you from?"),
      new HumanMessage("I live in New York City."),
      new AIMessage("New York City is a big city! What can I help you with?"),
    ],
    memories: ["Users name is unknown", "User lives in unknown"],
    goals: ["Be a good friend to the user"],
    userName: "Alice",
    assistantName: "Bob",
  });
  t.log(state);
  t.is(state.current_action, "action");
});

test.skip("runAva with new memories", async (t) => {
  const state = await processChatInput({
    input: "What is the weather in portland oregon?",
    threadId: "tst-123",
    messages: [
      new HumanMessage("Hello!"),
      new AIMessage("Hello Alice! It's nice to see you. What's new?"),
      new HumanMessage("I just had a birthday!"),
      new AIMessage("Happy birthday! What did you do for your birthday?"),
      new HumanMessage("I went to a restaurant with my friends."),
      new AIMessage("Wow, that sounds like a fun time! How old are you now?"),
      new HumanMessage("I am 31 years old."),
    ],
    memories: [
      "Users name is Alice",
      "Alice lives in New York City",
      "Alice is 30 years old",
    ],
    goals: ["Be a good friend to the user"],
    userName: "Alice",
    assistantName: "Bob",
  });
  t.log(state);
  t.is(state.current_action, "action");
});

test.skip("stream chat input", async (t) => {
  const input = "What is the weather in portland oregon?";
  const threadId = "86594";
  await streamChatInput(input, threadId);

  t.pass();
});
