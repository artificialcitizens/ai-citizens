// import { RunnableConfig } from "@langchain/core/runnables";
// import {
//   END,
//   MemorySaver,
//   START,
//   StateGraph,
//   StateGraphArgs,
// } from "@langchain/langgraph";

// interface IState {
//   input: number;
//   results?: number;
// }

// const graphState: StateGraphArgs<IState>["channels"] = {
//   input: {
//     default: () => 0,
//     value: (prev?: number, next?: number) => next ?? prev ?? 0,
//   },
//   results: {
//     default: () => 0,
//     value: (prev?: number, next?: number) => next ?? prev ?? 0,
//   },
// };

// function doubleNode(state: IState, config?: RunnableConfig) {
//   console.log(config);
//   const { input } = state;
//   return { results: input * 2 };
// }

// function randomNode(state: IState, config?: RunnableConfig) {
//   console.log(config);
//   return { results: Math.random() * state.input };
// }

// function randomDivide(state: IState, config?: RunnableConfig) {
//   console.log(config);
//   const random = Math.random();
//   if (random === 0) {
//     return { results: 0 };
//   }

//   return { results: state.input / random };
// }

// function continueProgram(state: IState) {
//   if (state.results && state.results > 75) {
//     console.log("Continuing program");
//     return "double";
//   }

//   return END;
// }

// // doubles the input, then randomly multiplies, then randomly divides
// // if output is greater than 75 after final node, go back to double and start over
// const mathGraph = new StateGraph<IState>({
//   channels: graphState,
// })
//   // add the nodes
//   .addNode("double", doubleNode)
//   .addNode("random", randomNode)
//   .addNode("randomDivide", randomDivide)
//   // set the entry point from START
//   .addEdge(START, "double")
//   .addEdge("double", "random")
//   .addEdge("random", "randomDivide")
//   // the conditional edge runs and navigates to the END node if the number is greater than 75
//   .addConditionalEdges("randomDivide", continueProgram);

// // Initialize any compatible CheckPointSaver
// const memory = new MemorySaver();
// const persistentMathGraph = mathGraph.compile({ checkpointer: memory });

// // using the thread_id we can re run certain nodes using the state as it was in memory at that time

// const config = { configurable: { thread_id: "1234" }, recursionLimit: 50 };
// const inputs = {
//   input: 20,
// };

// for await (const event of await persistentMathGraph.stream(inputs, config)) {
//   console.log(event);
// }

// // export default persistentMathGraph

// // // https://smith.langchain.com/public/ae46dfc9-05ca-49cd-8beb-4d040518c3ec/r
