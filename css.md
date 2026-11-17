---
paths:
  - "css/**/*.css"
  - "index.html"
---

# CSS and HTML style

## CSS
- One file, `css/style.css`, split into commented sections in this order: tokens (custom properties), base, layout, components, views, utilities.
- Indent with tabs.
- Put every colour, size, and spacing value in custom properties on `:root`, with dark mode overrides under `@media (prefers-color-scheme: dark)`.
- Use class names, not IDs or element chains, for styling. Name classes in plain kebab-case by component (`.cook-panel`, `.cook-panel__amount`).
- Flat and plain: no gradients, no shadows beyond a focus ring, and one accent colour.
- Layout: CSS grid for the split view, with orientation handled by `@media (orientation: portrait)`.
- Tap targets: use the sizes in `docs/spec.md` section 9 as tokens (`--tap-min: 64px`, `--tap-main: 88px`).
- Buttons get `touch-action: manipulation` and `user-select: none`.
- Don't put inline styles in HTML, because the CSP blocks them.

## HTML
- Indent with tabs.
- Semantic elements (`header`, `main`, `nav`, `button`, `label`), each input with a `<label>`, and `aria-live="polite"` on the cook-mode amount.
- The CSP `<meta>` is the first thing in `<head>`.
- No inline scripts or `on*=` attributes. The only script is `<script type="module" src="./js/main.js">`.
