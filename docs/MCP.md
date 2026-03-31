# MCP Integration

## Overview
This project requires the Playwright MCP for browser automation and navigating pizza restaurant websites.
While just Playwright is currently required, it makes sense to build an MCP registry so other integrations can be
added as required.

## What is MCP?
MCP stands for Model Context Protocol. Similar to how LSP (Language Server Protocol) standardizes how IDEs connect to language tooling (hover, rename, autocomplete), MCP establishes how AI agents/clients talk to tools and data sources (get a ticket from Jira, pull a Sentry issue, create a PR in GitHub).

### Highlights
- Capabilities are exposed via common protocol that agents can discover and call.
- Agents can access APIs, databases, etc. without building a custom integration for each service.
- Usually handles auth/permissions and returns structured I/O so tool calls are safer and predictable.
- It's currently the primary adapter layer for integrating agents into real-world platforms and services.

### Why MCP instead of service CLI?
CLIs can be great for simple flows but don't scale well. They've also been designed with humans in mind rather than agents. This is slowly changing but for the moment MCPs provide a clean standard/interface for agents to use instead of custom wrapper logic.

MCPs can also enforce better security and can be used as a central shared service, unlike CLI integrations, which tend to require local environment setup.

### System Primitives
An MCP server requires the following pieces:

- MCP client runtime: Connects to MCP via stdio or potentially HTTP/SSE.
- Capability discovery: initializes MCP and ingests available tools/resources/prompts.
- Tool adapter layer: maps discovered tools into the agent's internal toolset so they can be called.
- Structured execution loop: lets the LLM choose when to call a tool, validates args against schema, executes, and returns structured results back to the model as context.
- Policy setup: enforces allowlists, auth, timeouts, and logging/auditability.

## Goal
- Build minimal MCP registry
- Integrate Playwright MCP https://github.com/microsoft/playwright-mcp

## Architecture
For this project we want a provider-agnostic MCP setup. To avoid building out each MCP primitive (which is an entirely different learning project) we should leverage https://ts.sdk.modelcontextprotocol.io/.

Once that's in place we can extend `src/tools/registry.ts` to combine the current locally defined toolset with what's returned via MCP.

### Updated Tool Registry

Returns a combined registry with:
- Local tools provider (readMenu, placeOrder)
- MCP tools provider (Playwright)

`src/tools/execute.ts` remains the single execution path and routes calls by provider (`local` vs `mcp`).

## Current Implementation

- Tool discovery is unified through an app-level registry in `src/tools/registry.ts`.
- The registry composes two providers:
  - local tools provider (`src/tools/providers/local/**`)
  - MCP tools provider (`src/mcp/provider.ts`)
- Tool names are prefixed to avoid collisions:
  - `internal_readMenu`
  - `mcp_playwright_navigate`
- OpenAI tool definitions are generated from the unified registry in `src/tools/adapters/openai.ts`.
- Tool execution runs through a single broker in `src/tools/execute.ts` and returns a shared success/failure envelope.
- MCP is enabled with `MCP_PLAYWRIGHT_ENABLED=true` and uses hardcoded defaults for command/args/prefix in `src/mcp/config.ts`.

### MCP Modules

- `src/mcp/config.ts`: MCP server config schema and enabled server list.
- `src/mcp/provider.ts`: MCP client connection, tool discovery, and MCP-backed tool execution.
- `src/mcp/policies.ts`: policy guardrails (allow/block tools, arg-size limit, tool-count limit).
- `src/mcp/errors.ts`: MCP error type + normalization.
- `src/mcp/response.ts`: MCP tool response parsing helpers.

### Guardrails Implemented

- Tool allowlist/blocklist support (`allowedTools`, `blockedTools`).
- Per-server timeout (`timeoutMs`).
- Argument payload size guard (`maxArgumentBytes`).
- Retry policy for transient MCP failures (`maxRetries` on timeout/unavailable).
- Max discovered tool count (`maxDiscoveredTools`).

### Lifecycle

- The registry is app-global and cached for reuse.
- Graceful shutdown is wired in `src/index.ts` for normal completion, `SIGINT`, `SIGTERM`, and fatal errors.

## Status

- Minimal MCP registry groundwork is complete.
- Next step: integrate Playwright-driven website flows for menu parsing and order placement.

### Data shape

The internal contract
```typescript
type UnifiedToolDescriptor = {
    id: string;
    name: string; // "internal_readMenu" | "mcp_playwright_navigate"
    provider: "local" | "mcp";
    description: string;
    inputSchemaJson: Record<string, unknown>;
}

type UnifiedTool = {
    descriptor: UnifiedToolDescriptor;
    execute: (args: unknown, ctx: { userId: string }) => Promise<unknown>;
}

interface ToolProvider {
    id: string;
    listTools(): Promise<UnifiedTool[]>;
    shutdown(): Promise<void>;
}
```
