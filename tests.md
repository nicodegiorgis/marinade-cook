---
paths:
  - "tests/**/*.js"
  - "js/core/**/*.js"
---

# Testing rules

- Use the built-in Node test runner only: `import { test } from 'node:test'` and `import assert from 'node:assert/strict'`. No test libraries.
- Run with `node --test tests/`. The root `package.json` has only `"type": "module"` and a `test` script, with **zero dependencies**.
- Name each test file after the module it covers (`tests/scaler.test.js`).
- Only `js/core/` is unit tested, because it has no DOM.
- Required coverage:
  - `Scaler`: scaling by units, scaling by an anchor ingredient (the anchor keeps its exact value), units rounded down, every rounding band edge (19/20, 199/200, 1999/2000 g), always rounding up, kg formatting (`1000 → 1 kg`, `1500 → 1.5 kg`, `2050 → 2.05 kg`), comma decimal input, and ignoring zero or empty input.
  - `RecipeValidator`: a valid file passes, plus each rule in `docs/spec.md` section 6 failing with a message that names the recipe and field.
  - `CookSession`: next, back, jump, done state, complete, and reset.
- Use only fake data in tests ("Test Marinade A"). Never real recipes.
- When you fix a bug in `js/core/`, add a test that would have caught it.
