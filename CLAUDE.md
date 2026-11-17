# Marinade Cook

An offline iPad web app (PWA) for scaling and cooking bulk marinade batches. There's a recipe list, a split-view recipe page (live scaling on the left, step-by-step cook mode on the right), and recipes imported from a private JSON file that stays on the device.

**Full product spec:** `docs/spec.md`. Read it before any feature work, and update it when a decision changes.

## Hard rules (always apply)

1. **Never commit real recipe data.** `recipes.json` and `*.private.json` are gitignored. Never create, generate, or commit them, and never weaken `.gitignore`. Use `sample-recipes.json` (made-up data only) for development and tests.
2. **No network calls.** No CDNs, fonts, analytics, or third-party requests. Everything works offline.
3. **Imported data is untrusted.** Validate it before saving. Render it with `textContent` and DOM APIs, never `innerHTML`.
4. **No frameworks, no build step, no runtime dependencies.** Use plain HTML, CSS, and vanilla JavaScript (ES modules).
5. **Big tap targets.** It's used with gloves and wet hands (sizes in `docs/spec.md`, section 9).
6. **No em dashes** in UI text, docs, comments, or commit messages.
7. **Never mention any workplace** in code, docs, or commits.

## Tech stack

- HTML, CSS, and JavaScript ES modules, loaded with `<script type="module">`.
- A service worker (`sw.js`) for offline use, and `manifest.json` for Home Screen install.
- Storage: localStorage or IndexedDB, wrapped by the store classes.
- Hosting: GitHub Pages from `main` at the root. The site lives under a subpath, so **all paths are relative**.
- Tests: the built-in Node test runner (`node --test`), with zero dependencies.

## Architecture

```
index.html            single page, CSP meta tag, loads js/main.js
manifest.json         PWA manifest
sw.js                 service worker (must stay at root for scope)
css/style.css         all styles
js/main.js            entry point: wires stores, router, views
js/core/              pure logic, no DOM (unit tested)
  scaler.js           Scaler: factor maths, rounding, formatting
  recipe-validator.js RecipeValidator: schema checks for imported files
  cook-session.js     CookSession: step state (current, done, next, reset)
js/data/              persistence
  recipe-store.js     RecipeStore: save/load imported recipes
  progress-store.js   ProgressStore: per-recipe factor and cook progress
js/ui/                DOM layer
  dom.js              safe element helpers (el(), text(), clear())
  router.js           Router: hash routes #/ and #/r/<id>
  views/              ImportView, ListView, RecipeView
js/platform/          browser APIs
  wake-lock.js        WakeLock wrapper
  sw-register.js      service worker registration and update prompt
tests/                *.test.js for js/core
sample-recipes.json   fake data
docs/spec.md          detailed product spec
```

Data flows one way: **stores → core → views**. The core never touches the DOM. Views never do maths.

## Code style (summary)

- **Indentation is tabs** (see `.editorconfig`).
- **One class per file**, named after the file (`recipe-store.js` holds `RecipeStore`). Use named exports, no default exports.
- Every file starts with a header comment saying what it's for. Every class and public method gets a JSDoc comment. Inline comments explain **why**, not what.
- Detailed rules load automatically from `.claude/rules/` when you work on matching files.

## Commands

```bash
node --test        # run unit tests
python3 -m http.server    # serve locally at http://localhost:8000
```

## Workflow

- One task per session, usually one GitHub issue. Open a pull request when done, and list anything not verified.
- Before any release, use the `release` skill (`.claude/skills/release/`). It runs the tests, bumps the service worker cache version, and checks that no private data is staged.
- If a task changes a decision, update `docs/spec.md` (and this file if needed) in the same pull request.
- If something in the spec is unclear, check `docs/spec.md` section 12 (open questions) and ask. Don't guess.
