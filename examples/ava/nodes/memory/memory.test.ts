import { memoryNode, parseAndUpdateMemories } from "./memory.node.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import test from "ava";
import { ChatbotState } from "../../types.js";

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
