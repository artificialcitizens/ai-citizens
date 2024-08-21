# @ai-citizens/ava

## 0.0.15

### Patch Changes

- Updated dependencies [be414a4]
  - @ai-citizens/tools@0.0.4
  - @ai-citizens/graph@0.0.5

## 0.0.14

### Patch Changes

- e94e513: fixes react ink build issue

## 0.0.13

### Patch Changes

- 5e85f22: ## New Features

  - Introduced an AI-powered search command in the CLI for enhanced user querying.
  - Added a new module for search functionality, making it publicly accessible.
  - Developed comprehensive search mechanisms and state management for structured responses.
  - Launched a calculator tool for basic arithmetic operations with input validation.
  - Expanded web search capabilities with the addition of a new Tavily search tool.

  ## Documentation

  - Created a README file detailing the voter registration search feature, improving user guidance.

  ## Tests

  - Adds Ava testing
  - Implemented unit tests for search functions to ensure reliability and correctness.
  - Added tests for the calculator tool to validate arithmetic operations.

- Updated dependencies [5e85f22]
  - @ai-citizens/graph@0.0.4
  - @ai-citizens/tools@0.0.3
  - @ai-citizens/llm@0.0.6

## 0.0.12

### Patch Changes

- f7c70c7: ## New Features

  - Introduced enhanced functionalities for a chatbot and a planning agent using state graphs.
  - Added a new barChartTool for generating bar charts and a basicWebSearch function for web searches.

  ## Bug Fixes

  - Adjusted PostgreSQL connection settings to ensure proper connectivity with the updated port.

  ## Documentation

  - Updated guidelines for creating graphs, emphasizing state management and error handling.

  ## Tests

  - Added unit tests for various functionalities, including the chatbot, planning agent, and bar chart generation.

  ## Chores

  - Updated package configurations and dependencies to improve project setup and testing capabilities.

  ## Changes

  | File(s)                                     | Change Summary                                                                                                         |
  | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
  | `.gitignore`                                | Added entries for temporary files and test assets; removed redundant entries.                                          |
  | `docker-compose.yaml`                       | Removed `tmpfs` for PostgreSQL, added persistent storage configuration.                                                |
  | `migrations/*.sql`                          | Introduced new migration files to create and populate tables for document management.                                  |
  | `package.json`                              | Added new scripts for testing, database management, and environment configuration; updated dependencies.               |
  | `packages/cli/package.json`                 | Updated testing framework configurations and added new dependencies for React and CLI enhancements.                    |
  | `packages/cli/src/commands/test/graph.ts`   | Enhanced command to process input types and manage configurations more effectively.                                    |
  | `packages/cli/src/ui/test.tsx`              | Implemented a React component for shape-based counter applications; added dynamic data fetching.                       |
  | `packages/graph/*`                          | Introduced checkpoint management through `PostgresSaver`, added state graphs for chatbot and planning functionalities. |
  | `packages/tools/package.json`               | Integrated D3.js and Zod for data visualization and validation; enhanced testing setup.                                |
  | `packages/tools/src/generate/bar-chart.ts`  | Created a tool for generating bar charts using D3.js and canvas API; includes input validation.                        |
  | `packages/tools/src/retrieve/web-search.ts` | Added web search functionality with input validation; placeholder implementation for search logic.                     |

  ## Sequence Diagram(s)

  ```mermaid
  sequenceDiagram
      participant User
      participant CLI
      participant Database
      participant Graph

      User->>CLI: Input command
      CLI->>Graph: Process input
      Graph->>Database: Query for data
      Database-->>Graph: Return data
      Graph-->>CLI: Return processed result
      CLI-->>User: Display result
  ```

  ```mermaid
  sequenceDiagram
      participant User
      participant Chatbot
      participant PlanningAgent

      User->>Chatbot: Send query
      Chatbot->>Chatbot: Process query
      Chatbot-->>User: Respond

      User->>PlanningAgent: Request plan
      PlanningAgent->>PlanningAgent: Generate steps
      PlanningAgent-->>User: Provide plan
  ```

- Updated dependencies [f7c70c7]
  - @ai-citizens/prompts@0.0.2
  - @ai-citizens/graph@0.0.3
  - @ai-citizens/tools@0.0.2
  - @ai-citizens/utils@0.0.3
  - @ai-citizens/llm@0.0.5

## 0.0.11

### Patch Changes

- b7eaf1a: ## Enhancements

  - Introduced user-specific information in the chat system for personalized interactions.
  - Enhanced chat command configuration with a detailed system prompt for improved engagement.
  - Added a new integration configuration file for Coderabbit, allowing for customizable settings and automated features.
  - Improved graph generation process with user feedback integration for dynamic updates.

  ## Bug Fixes

  - Improved error handling for configuration file reading and parsing.
  - Chores
  - Updated configuration management to optimize performance and reduce unnecessary processing in production environments.

- Updated dependencies [b7eaf1a]
  - @ai-citizens/graph@0.0.2

## 0.0.10

### Patch Changes

- 88c8e39: improve init handling

## 0.0.9

### Patch Changes

- b230327: additional cli improvements, new graphs and functionality
- Updated dependencies [b230327]
  - @ai-citizens/prompts@0.0.1
  - @ai-citizens/graph@0.0.1
  - @ai-citizens/tools@0.0.1
  - @ai-citizens/utils@0.0.2
  - @ai-citizens/llm@0.0.4

## 0.0.8

### Patch Changes

- ac74a4c: updates config pathing and logic

## 0.0.7

### Patch Changes

- 78aa8ed: adds utils, additional model handling improvements
- Updated dependencies [78aa8ed]
  - @ai-citizens/utils@0.0.1
  - @ai-citizens/llm@0.0.3

## 0.0.6

### Patch Changes

- 2c5f067: update to include cjs build
- Updated dependencies [2c5f067]
  - @ai-citizens/llm@0.0.2

## 0.0.5

### Patch Changes

- 7558677: update build process

## 0.0.4

### Patch Changes

- f9898a4: update readme

## 0.0.3

### Patch Changes

- a4230eb: updates tsconfig

## 0.0.2

### Patch Changes

- 1358ce5: updates build pipeline
- b387826: update build pipeline

## 0.0.1

### Patch Changes

- Initial release of ava and llm packages
- Updated dependencies
  - @ai-citizens/llm@0.0.1
