import { ChatPromptTemplate } from "@langchain/core/prompts";
import fs from "fs";

const scaffoldLangGraph = ChatPromptTemplate.fromTemplate(
  `
You are an AI assistant tasked with creating a LangGraph based on a user's request. You will be provided with LangGraph documentation, examples of graph structures, and a specific user request. Your goal is to create a well-structured graph that meets the user's requirements.

First, review the LangGraph documentation:

<langgraph_docs>
{langgraph_docs}
</langgraph_docs>

Now, consider these examples of graph structures:

<examples>
{examples}
</examples>

The user has made the following request for a LangGraph:

<user_request>
{user_request}
</user_request>

Your task is to create the graph the user is requesting. Follow these guidelines:

1. Analyze the user's request carefully to understand the required nodes and edges.
2. Plan out the necessary nodes and edges for the graph, ensuring they are organized chronologically or logically.
3. Add all nodes and edges to the graph builder at once, rather than incrementally.
4. Use strict typing and type checking to ensure the graph works as expected.
5. Annotate logic as needed to explain the graph to the user.
6. Mock out the functions of the nodes in comments and return test data where applicable.

When creating your graph, follow this structure:

1. Start with importing necessary modules and defining any required types.
2. Create the graph builder and add all nodes and edges.
3. Include type annotations and guards for each node.
4. Add comments to explain the logic and purpose of each node.
5. Provide mock implementations or test data for node functions where appropriate.

Present your complete graph implementation inside <graph> tags. Ensure that your implementation is well-commented and follows Python best practices.

After the graph implementation, provide a brief explanation of how the graph works and how it fulfills the user's request. Include this explanation inside <explanation> tags.

Remember to adhere to strict typing, use appropriate error handling, and organize your code in a clear and logical manner.
`
);

export const scaffoldLangGraphPrompt = (userRequest: string) => {
  const langgraphDocs = fs.readFileSync("./langgraph-docs.txt", "utf-8");
  const examples = fs.readFileSync("./examples.txt", "utf-8");
  return scaffoldLangGraph.format({
    langgraph_docs: langgraphDocs,
    examples: examples,
    user_request: userRequest,
  });
};
