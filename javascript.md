---
paths:
  - "js/**/*.js"
  - "sw.js"
  - "tests/**/*.js"
---

# JavaScript style

## Structure
- ES modules only. Use named exports and no default exports. Import with relative paths and the `.js` extension (`import { Scaler } from './core/scaler.js';`).
- **One class per file**, with the file in kebab-case and the class in PascalCase (`cook-session.js` holds `CookSession`).
- Classes hold state and behaviour. Small pure helpers can be exported functions in the same file as the class that uses them.
- Use private fields (`#factor`) for internal state. Expose state only through methods or getters.
- **Layers:** `js/core/` never touches `document`, `window`, or storage, so it can run in Node tests. `js/data/` only does persistence. `js/ui/` only does DOM work. `js/platform/` wraps browser APIs. `main.js` wires them together.
- Views get their dependencies through the constructor (stores, scaler, router). No global singletons.

## Formatting
- Indent with tabs. Use single quotes, semicolons, and a maximum line length of about 100.
- Use `const` by default and `let` only when reassigned. Never use `var`.
- Use strict equality (`===`). No implicit type coercion.
- Use early returns instead of deep nesting.

## Comments
Every file starts with a header block:
```js
/**
 * scaler.js
 * Turns a recipe plus a target (units or one ingredient amount) into
 * rounded display amounts. Pure logic: no DOM, no storage.
 */
```
Every class and every public method gets JSDoc with `@param`, `@returns`, and types:
```js
/**
 * Sets the factor from an ingredient the user has a limited amount of.
 * @param {number} index Ingredient position in the recipe.
 * @param {number} grams Amount available, in grams.
 * @returns {number} The new factor.
 */
```
- Inline comments explain **why** (for example "iOS greys out .json without text/plain"), not what the line does.
- No commented-out code. No em dashes.

## Safety
- Never use `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or `document.write` with any data. Build nodes with the helpers in `js/ui/dom.js`.
- No `eval`, `new Function`, or string timers.
- Wrap storage and browser API calls in `try/catch`. Fail quietly where the spec says so (wake lock), and show a clear message where the user must act (import).

## Errors
- Throw `Error` objects with clear messages. The validator collects every problem and returns them as a list (recipe name plus field), so the user sees everything at once.
