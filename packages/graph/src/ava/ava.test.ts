import test from "ava";
import { routeNode } from "./route.node.js";
import { processChatInput, streamChatInput } from "./graph.js";
import { responseNode } from "./response.node.js";
import { actionNode } from "./action.node.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatbotState } from "./types.js";
import { memoryNode } from "./memory.node.js";
import { parseAndUpdateMemories } from "./memory.node.js";
import { Memory } from "./types.js";
import { v4 as uuidv4 } from "uuid";

test.skip("runAva", async (t) => {
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
  });
  t.log(state);
  t.is(state.current_action, "respond");
});

test("runAva with new memories", async (t) => {
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

test.skip("route node", async (t) => {
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

test.skip("response node", async (t) => {
  const state = await responseNode(
    { user_query: "Hello" },
    {
      configurable: {
        thread_id: "tst-123",
      },
    }
  );
  t.log(state);
});

test.skip("action node", async (t) => {
  const state = await actionNode(
    { messages: [new HumanMessage("what is 4 + 5")] },
    {
      configurable: {
        thread_id: "tst-123",
      },
    }
  );
  t.log(state.messages);
  const state2 = await actionNode(
    { messages: [new HumanMessage("what is the weather in portland oregon")] },
    {
      configurable: {
        thread_id: "tst-123weather",
      },
    }
  );
  t.log(state2.messages);
  t.pass();
});

test("memory node", async (t) => {
  const initialState: Partial<ChatbotState> = {
    messages: [
      new HumanMessage("Hello, my name is Alice."),
      new AIMessage("Hello Alice! It's nice to meet you. Where are you from?"),
      new HumanMessage("I live in New York City."),
    ],
    memories: ["this is a mock memory"],
  };

  const config = {
    configurable: {
      thread_id: "memory-test-123",
    },
  };

  const updatedState = await memoryNode(initialState, config);
  t.log(updatedState.memories);
  t.pass();
  // t.truthy(updatedState.memories);
  // t.is(updatedState.memories.length, 2);

  // const nameMemory = updatedState.memories.find((m) =>
  //   m.content.includes("Alice")
  // );
  // t.truthy(nameMemory);
  // t.is(nameMemory.type, "long-term");

  // const locationMemory = updatedState.memories.find((m) =>
  //   m.content.includes("New York City")
  // );
  // t.truthy(locationMemory);
  // t.is(locationMemory.type, "short-term");

  // t.log(updatedState.memories);
});

test("parseAndUpdateMemories with string memories", (t) => {
  const memoryAnalysis = `
      <memory>User's name is Robert</memory>
      <memory>User's favorite color is blue</memory>
      <memory>User is from New York</memory>
  `;

  const updatedMemories = parseAndUpdateMemories(memoryAnalysis);

  t.is(updatedMemories.length, 3, "Should have 3 memories after update");
  t.true(
    updatedMemories.includes("User's name is Robert"),
    "Should update the name"
  );
});

test("parseAndUpdateMemories with empty current memories", (t) => {
  const currentMemories: string[] = [];

  const memoryAnalysis = `
      <memory>User's name is Alice</memory>
      <memory>User is a software engineer</memory>
  `;

  const updatedMemories = parseAndUpdateMemories(memoryAnalysis);

  t.is(updatedMemories.length, 2, "Should add all new memories");
  t.true(
    updatedMemories.includes("User's name is Alice"),
    "Should add name memory"
  );
  t.true(
    updatedMemories.includes("User is a software engineer"),
    "Should add profession memory"
  );
});

test("parseAndUpdateMemories with empty analysis", (t) => {
  const memoryAnalysis = `
  `;

  const updatedMemories = parseAndUpdateMemories(memoryAnalysis);

  t.deepEqual(
    updatedMemories,
    [],
    "Should return an empty array when analysis is empty"
  );
});
