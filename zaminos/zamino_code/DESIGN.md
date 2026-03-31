# Design System Document

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **"The Cyber-Gourmet Archetype."** 

Unlike traditional fast-food interfaces that rely on bright, high-energy primary colors and flat containers (as seen in the functional reference), this system is an editorial-grade, developer-centric take on gastronomy. It treats pizza as high-performance hardware. The aesthetic is "Terminal-Chic": high-contrast, deeply layered, and hyper-functional. We break the standard grid through intentional asymmetry, overlapping product photography on top of monospace data readouts, and using light as a tactile material rather than a decorative element.

## 2. Colors
This system leverages a monochromatic charcoal foundation punctuated by high-frequency neon accents to simulate a premium IDE (Integrated Development Environment) atmosphere.

*   **Primary (`#9cff93`) & Secondary (`#00e3fd`):** These are your "active" states and logic indicators. Use the Primary Neon Green for critical paths (Checkout, Selection) and the Secondary Neon Blue for secondary logic (Filters, Customization).
*   **Surface Hierarchy:** To move beyond the "flat box" look of traditional menus, use the following tiers:
    *   **Background (`#0e0e0e`):** The canvas.
    *   **Surface-Container-Low (`#131313`):** For large sectioning of the menu.
    *   **Surface-Container-High (`#20201f`):** For interactive cards and hover states.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Use background color shifts. For example, a pizza category header should sit on `surface-container-low`, while the individual product cards transition to `surface-container-high`.
*   **Signature Textures:** Main CTAs (like "Execute Order") should use a subtle linear gradient from `primary` to `primary-container` at a 135-degree angle. This adds a "lithium-ion" glow that flat hex codes cannot replicate.

## 3. Typography
The typography is a dialogue between human-centric geometry and machine-readable precision.

*   **Display & Headlines (Space Grotesk):** This font’s quirky, technical terminals provide the "pro" aesthetic. Use `display-lg` for hero headlines. Its wide tracking and aggressive x-height demand attention.
*   **Body & Titles (Inter):** A hyper-legible sans-serif for high-density information like ingredient lists. 
*   **The Accents (Monospace Logic):** While not explicitly in the scale, designers are encouraged to use `label-sm` with a monospace fallback for "technical specs" of the pizza (e.g., `HEAT_INDEX: 0.85`, `CAL_COUNT: 1200`). This reinforces the developer-centric brand identity.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and the physics of light, not drop shadows.

*   **The Layering Principle:** Stack containers to create importance. An "Active Cart" element should be `surface-container-highest` sitting on a `surface-dim` background.
*   **Ambient Shadows:** Use only when an element is "floating" (like a modal). Shadows must be `on-surface` color at 6% opacity with a `24px` blur. It should feel like an atmospheric glow rather than a shadow.
*   **Glassmorphism:** For floating navigation or top bars, use `surface-container` colors at 70% opacity with a `12px` backdrop-blur. This allows the high-contrast product photography to bleed through the UI, softening the technical edge.
*   **The Ghost Border:** If a boundary is required for accessibility, use `outline-variant` at 15% opacity. It should be barely perceptible—a "whisper" of a line.

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background with `on_primary` text. No border. Shape: `md` (0.375rem).
*   **Secondary:** `surface-variant` background with a "Ghost Border" of `secondary`. 
*   **Tertiary:** No background. `primary` text with an underline that appears only on hover.

### Cards & Lists (Menu Reinvention)
*   **Forbid Dividers:** Do not use lines to separate pizza items. Use `spacing-8` (2.75rem) of vertical white space or a shift from `surface` to `surface-container-low`.
*   **Visual Style:** Pizza images should be desaturated by 10% until hovered, at which point they regain full vibrance and scale by 1.05x.

### Inputs & Selection
*   **Text Fields:** Use `surface-container-lowest`. On focus, the bottom border glows with a `1px` `primary` line and a soft `primary_dim` outer glow.
*   **Chips (Toppings):** Use `label-md`. Unselected: `surface-container-high`. Selected: `primary` with `on_primary` text.
*   **Checkboxes/Radio:** Never use standard OS defaults. Use sharp `sm` corner radius squares. Checked state should emit a small `primary` outer glow to simulate a "Power On" LED.

### New Component: The "Code-Deck"
A technical spec panel for each pizza. Instead of a standard description, use a table-less layout with `label-sm` text showing attributes like `BASE_SAUCE`, `CRUST_TYPE`, and `TOPPING_ARRAY[]` in a monospace-inspired style.

## 6. Do's and Don'ts

### Do
*   **Do** use `spaceGrotesk` for all price points to make them feel like "data."
*   **Do** allow product photography to break the container bounds (overflow). This creates a premium, bespoke editorial feel.
*   **Do** use the `20` (7rem) spacing token for major section breathing room. High-end design requires "wasteful" space.

### Don't
*   **Don't** use pure black (#000000) for surfaces except for `surface_container_lowest`. It kills the depth.
*   **Don't** use standard red for errors. Use the specified `error_dim` (#d53d18) which is tuned for dark mode legibility.
*   **Don't** use rounded corners larger than `xl` (0.75rem). This brand is about precision and "pro" tools; overly round shapes feel too consumer-grade and "soft."