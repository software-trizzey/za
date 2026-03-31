# Project Za

Build an agent that can order a pizza

- can create a demo pizza site (clone dominos or something)
    - use something like [Google Stitch](https://stitch.withgoogle.com/) to build the design for this
- then the agent can interactively order a pizza from the website
- after ordering, the user can mark a pizza as their favourite
- then in a future session the user can say "order my favorite pizza" and the agent will use the pizza from earlier

Concepts this demonstratres:
- build an agentic system and apply it to a real world usecase

Some constraints:
- Must be handcoded: I find this the best way to internalize concepts. Probably due to active vs passive learning.
- Minimal harness: to keep things simple and not overbuild. This was inspired by [Pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) and [Mini-coder](https://github.com/sacenox/mini-coder/blob/main/mini-coder-idea.md)
- Use a familiar stack: then learning becomes about the concepts instead programming language syntax


## What is Agent?

First off I need to define what i'm building.

**Components:**
- **Large Language Model (LLM):** how the system thinks. It accepts a task and outputs a result like text or images.
    - It's stateless which means it doesn't remember things. Each interaction is a brand new instance.
- **Loopable session:** instead of one-off questions, the agent runs continuously until the task is complete.
    - Observe -> Think -> Act -> Repeat
- **Context window:** this is its working memory system which determines what the model can "see" at any given momemnt.
    - Managing context correctly is critical to building useful agents.
- **Tool access:** how the agent can engage with the world. This is the game changing behaviour that makes them useful.
    - Tools allow it to read and write files, surf the web, process images, etc.
- **System prompt:** this specifies the persona of the agent and defines its purpose

The goal of this project is to become intimately familiar with these five primitives.

## Tech stack
- [Bun](https://bun.com/docs) for runtime and dependancy management
- LLM access: OpenAI, Claude, Local coding models etc

Once the core primitives have been built I can add fancy stuff like coloring, MCP, Skills, etc.

