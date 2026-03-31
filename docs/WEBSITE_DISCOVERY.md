# Website Discovery Mode

## Overview
This project needs a discovery-based browser automation mode so the agent can work on arbitrary pizza websites,
not just the built-in Zamino test site.

Unlike deterministic selector-first flows, discovery mode makes the agent infer navigation and ordering actions from
page semantics (visible text, headings, links, controls, repeated menu patterns).

This is less reliable than hardcoded selectors, but it is a better learning path for general-purpose
agent behavior on unknown sites.

## What is Website Discovery Mode?
Website Discovery Mode is an agent behavior profile where the model:

- discovers the menu and order flow at runtime
- maps user intent to discovered menu options
- stages an order without final submission
- requires explicit user confirmation before the final submit action
- verifies and reports outcome evidence after submission

### Highlights
- Website-agnostic ordering flow driven by discovery instead of predefined selectors.
- Built on top of MCP Playwright tools, without custom per-site adapters.
- Safety constraint: never finalize checkout without explicit user confirmation.
- Structured response contract so users can see what was discovered and what is staged.

### Why discovery instead of hardcoded selectors?
Hardcoded selectors are higher reliability but are tightly coupled to a specific site and page structure.
Discovery mode increases portability across websites and teaches agent reasoning over real UI variation.

For this project, the portability and learning value are prioritized over production robustness.

### System Primitives
Website Discovery Mode requires these pieces:

- Browser tool access via available browser automation tools (currently MCP Playwright).
- A discovery-first instruction contract in the system prompt.
- A two-run confirmation protocol so final submission is user-approved.
- Domain and action guardrails to limit unsafe navigation and irreversible actions.
- Result reporting format that includes evidence of discovered and executed steps.

## Goal
- Enable ordering flows on unknown pizza websites using runtime discovery.
- Keep the agent safe by requiring explicit user confirmation for final submission.
- Capture a repeatable process that can be tested and iterated.

## Architecture
Discovery mode is behavior-level orchestration over the current MCP integration.

The core setup remains unchanged:

- Unified tool registry (`src/tools/registry.ts`) combines local and MCP tools.
- MCP tools are exposed with `mcp_playwright_*` prefix.
- Tool execution is centralized in `src/tools/execute.ts`.

The new feature is introduced primarily through instructions and runtime policy, not a new provider.

### Updated Agent Behavior
When a website URL is provided, the agent should prefer browser tools and run this loop:

1. Discover where ordering starts (menu/order/cart related pages).
2. Infer menu items and price candidates from page structure and visible text.
3. Map user intent to discovered items.
4. Stage cart/actions and stop before final submission.
5. Ask for explicit confirmation.
6. On follow-up confirmation, repeat discovery quickly, submit, verify result.

## Discovery Workflow

### Phase 1: Discover
- Start from user-provided base URL.
- Identify candidate navigation paths by semantic cues: `menu`, `order`, `pizza`, `cart`, `checkout`.
- Detect menu-like repeated item structures and extract item names/prices where possible.

### Phase 2: Plan
- Match user request to discovered menu candidates.
- If mapping confidence is low, present options and ask for clarification.
- Build a staged action plan for quantities and cart updates.

### Phase 3: Stage (no submit)
- Perform all reversible actions needed to prepare checkout.
- Stop before the final irreversible submit action.
- Return staged summary and ask for explicit approval.

### Phase 4: Confirm + Submit
- Only when user explicitly confirms (for example: `confirm`, `submit order`, `yes place it`):
  - re-open flow quickly to ensure current state
  - execute final submit action
  - verify confirmation evidence (order id, success text, confirmation page)

### Phase 5: Report
- Return outcome with:
  - selected items and quantities
  - final status (submitted or not submitted)
  - evidence (URL, visible success text, order/reference id when available)

## Guardrails
- Never finalize order submission without explicit user confirmation in the current conversation.
- Stay within the user-provided domain unless the user explicitly allows external navigation.
- Do not complete login, payment, or account creation steps unless explicitly requested.
- If required checkout fields are missing, request those values from the user.
- On ambiguity or low confidence, prefer clarification over guessing.

### Runtime-enforced guardrails
- Tool execution applies a confirmation gate for likely final-submit browser actions.
- Tool execution applies same-origin navigation enforcement once a website origin is discovered from user input.
- Guardrail violations return business rule failures instead of executing the browser action.

## Confirmation Protocol (Two-Phase)

- Phase 1: Discovery + staging only, then stop and ask confirmation.
- Phase 2: User confirms, agent submits and verifies.

In the default REPL flow, both phases happen inside a single long-lived session so discovery context is preserved.
If used in stateless one-shot mode, phase 2 may need to repeat parts of discovery before submission.

## Prompt Contract
The system prompt should instruct the model to:

- use discovery-first reasoning for website tasks
- prefer available browser automation tools for browser interaction
- produce clear staged summaries before submission
- enforce explicit confirmation before final submit
- provide verifiable evidence after submit attempts
- return website workflow fields: `discoveredMenuItems`, `requestedSelections`, `stagedActions`, `submitted`, `confirmationEvidence`

## Status

- Discovery mode spec: defined in this document.
- MCP Playwright integration: available via existing MCP provider.
- Implementation status: prompt/runtime guardrails implemented and manual evaluation completed on the Zamino website target.

### Data shape
Recommended response contract for website-order tasks:

```typescript
type DiscoveryOrderResult = {
    mode: "website_discovery";
    baseUrl: string;
    discoveredMenuItems: Array<{
        label: string;
        priceText: string | null;
        evidence: string;
    }>;
    requestedSelections: Array<{
        userText: string;
        matchedLabel: string | null;
        quantity: number;
        confidence: "high" | "medium" | "low";
    }>;
    stagedActions: string[];
    requiresUserConfirmation: boolean;
    submitted: boolean;
    confirmationEvidence: {
        url: string;
        orderIdOrReference: string | null;
        successText: string | null;
    } | null;
}
```
