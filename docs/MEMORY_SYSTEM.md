# Memory System

## Overview
This project uses a lightweight, file-backed memory system for user-specific ordering context.
It stores durable preferences and short-term order history so the agent can personalize behavior across sessions.

Note: The system makes the assumption that a userId will be provided at runtime to keep the focus on building an
agent and not an authentication.


## Goal
- Support agent behaviors like remembering a favorite order and retrieving recent orders.


## Storage Model
Memory is persisted in `memory-store.json` as:

- `schemaVersion`: current schema version (`1`)
- `users`: map of `userId -> UserMemory`

Each `UserMemory` contains:

- `favoriteOrder`: saved reusable order template (or `null`)
- `lastOrderId`: pointer to the most recent order ID (or `null`)
- `recentOrders`: most recent 5 order snapshots (newest first)
- `updatedAtIso`: last update timestamp

## Order Tracking Behavior
On successful `placeOrder`:

1. The system creates an order result.
2. It records an order snapshot in `recentOrders`.
3. It updates `lastOrderId` to the new order ID.
4. It deduplicates by `orderId` and caps history to 5 entries.

This flow is automatic and does not depend on the model making extra tool calls.

## Favorite Order Behavior
Favorite order is independent from last/recent orders.

- It can match a recent order, or be a separate reusable template.
- It can be saved or cleared via memory tools.

## Agent Tooling
The agent has memory-oriented tools for:

- reading user memory
- saving favorite orders
- retrieving recent orders

`userId` is injected by runtime context, so the agent should not ask the user for identity.

## Validation and Safety
- Memory payloads are validated with Zod schemas.
- Missing or invalid store content falls back to an empty store.
- Tool inputs are validated and business-rule failures are returned as typed tool errors.

## Environment Requirements
- `OPENAI_API_KEY`
- `AUTHENTICATED_USER_ID` (UUID used as memory key)

## Current Scope
The system is intentionally minimal for learning:

- single JSON store
- per-user memory map
- recent history cap of 5
