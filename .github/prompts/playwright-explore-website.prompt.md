---
agent: agent
description: "Website exploration for testing using chrome-devtools MPC"
tools:
  [
    "changes",
    "search/codebase",
    "edit/editFiles",
    "fetch",
    "problems",
    "runCommands",
    "runTasks",
    "search",
    "search/searchResults",
    "runCommands/terminalLastCommand",
    "runCommands/terminalSelection",
    "testFailure",
  ]
model: GPT-5 mini (copilot)
---

# Website Exploration for Testing

Your goal is to explore the website and identify key functionalities.

## Specific Instructions

1. Navigate to the provided URL using the chrome-devtools MPC Server. Server dev is actually running. If no URL is provided, ask the user to provide one.
2. Identify and interact with 3-5 core features or user flows.
3. Document the user interactions, relevant UI elements (and their locators), and the expected outcomes.
4. Close the browser context upon completion.
5. Provide a concise summary of your findings.
6. Propose and generate test cases based on the exploration.
