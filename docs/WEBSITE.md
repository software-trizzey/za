# Website System

## Overview
This project includes a deterministic Zamino website used as a UI-driven test target for the pizza agent.
It is intentionally built for automation reliability so the agent can parse menu data, perform checkout actions, and verify order outcomes through the browser.

Unlike direct API integrations, this website exists to validate the full agent loop against a realistic web interface:
observe -> decide -> act -> verify.

## Goal
- Provide a controlled website that demonstrates end-to-end agent behavior through UI interactions.
- Support Playwright-based automation for:
  - reading the menu
  - selecting pizzas and quantities
  - placing an order
  - confirming order completion

## Architecture
The website is served by Bun and split into server, data, config, page, and script layers.

Core files:

- `src/website/server.ts`: Bun server and route wiring
- `src/website/config.ts`: centralized website port and route constants
- `src/website/data.ts`: menu catalog and website order types
- `src/website/helpers.ts`: request parsing, order construction, response helpers
- `src/website/pages/home.html`: landing page
- `src/website/pages/menu.html`: menu, cart, and checkout UI
- `src/website/pages/confirmation.html`: order confirmation UI
- `src/website/scripts/menu.ts`: client-side menu loading and checkout flow
- `src/website/scripts/confirmation.ts`: client-side confirmation rendering
- `src/website/assets/styles.css`: shared website styling

## Route Configuration
All routes are defined in `src/website/config.ts` under `WEBSITE_ROUTES`.

Page routes:

- `/`
- `/menu`
- `/confirmation`

API routes:

- `/api/health`
- `/api/menu`
- `/api/orders`
- `/api/orders/latest`

Port configuration:

- `WEBSITE_PORT` (currently `3099`)

## Data Model
Menu items are defined in `src/website/data.ts` as `WebsiteMenuItem`:

- `id`
- `name`
- `description`
- `priceCents`
- `isAvailable`
- `category`

Order requests are sent as selections:

- `menuItemId`
- `quantity`

Order records include:

- `orderId`
- `items[]`
- `totalPriceCents`
- `createdAtIso`

## Ordering Behavior
On menu checkout:

1. The menu script collects cart selections from UI state.
2. It POSTs to `/api/orders`.
3. Server validates request shape and menu item references.
4. Server creates an order record with generated `orderId`.
5. Server stores the order in memory.
6. Client redirects to `/confirmation?orderId=...`.
7. Confirmation page fetches `/api/orders/latest` and renders result.

## In-Memory Storage
Orders are stored in process memory (`orders: WebsiteOrderRecord[]` in `src/website/server.ts`).

Implications:

- Data is available during server lifetime.
- Data resets when the server restarts.
- This is acceptable for demo/testing scope and intentionally lightweight.

## Automation Selectors (Playwright)
The UI exposes stable `data-testid` hooks for browser automation.

Representative selectors:

- `open-menu-link`
- `start-order-link`
- `menu-grid`
- `menu-item-card`
- `menu-item-name`
- `menu-item-price`
- `menu-item-quantity-input-<menuItemId>`
- `menu-item-order-button-<menuItemId>`
- `cart-count-badge`
- `cart-panel`
- `cart-items`
- `cart-item-row`
- `cart-total`
- `cart-status`
- `checkout-button`
- `order-confirmation-panel`
- `order-confirmation-id`
- `order-confirmation-meta`
- `website-order-notification`
- `website-order-notification-panel`

## Validation and Safety
Server-side checks include:

- request payload must match expected shape
- `selections` must be non-empty
- each `menuItemId` must exist
- item must be available
- quantity must be an integer >= 1

Failures return structured JSON errors (HTTP 400 for invalid orders, HTTP 404 for missing order lookups).

## Run and Verify
Run website locally:

```bash
bun run dev:website
```

Then open:

- `http://localhost:3099`
- `http://localhost:3099/menu`
- `http://localhost:3099/confirmation`

Quick health check:

```bash
curl http://localhost:3099/api/health
```

## Current Scope
The website is intentionally scoped for agent-system learning and testing:

- deterministic route and selector structure
- UI-driven ordering flow
- in-memory order persistence
- no authentication
- no payment processing
- no production hardening requirements

This scope is designed to maximize clarity for Playwright integration and tool-driven agent behavior.
