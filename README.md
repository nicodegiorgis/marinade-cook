# Marinade Cook

An offline iPad web app for scaling and cooking bulk marinade batches. It has a recipe list, a split-view recipe page (live scaling on one side, step-by-step cook mode on the other), and recipes imported from a private JSON file that never leaves the iPad.

The full product spec is in [docs/spec.md](docs/spec.md).

## Public code, private data

This repo is public and contains **only the app**. The real recipes live in `recipes.json`, which the owner keeps on their own devices and moves to the iPad directly (for example by AirDrop). The app stores imported recipes only in that iPad's local browser storage and makes no network requests at all.

- `recipes.json` and `*.private.json` are gitignored. Never commit them.
- `sample-recipes.json` holds made-up recipes for development and testing.

## Install on the iPad

1. On GitHub: **Settings → Pages →** "Deploy from a branch", `main`, `/ (root)`.
2. On the iPad, open `https://<username>.github.io/marinade-cook/` in Safari.
3. Tap Share → **Add to Home Screen**.
4. Open it **from the Home Screen icon** and tap **Import recipes** to pick `recipes.json` from Files.
   The Home Screen app has its own storage, separate from Safari, so importing in a Safari tab does not carry over.
5. Turn on airplane mode and check it still opens.

Deleting the app from the Home Screen erases its recipes. Keep `recipes.json` somewhere safe so you can import it again.

## Using it

- **List:** every recipe A to Z. Search filters as you type.
- **Recipe page:** type a number of units, **or** the amount you have of any ingredient, and every other amount rescales. Amounts are rounded up (1 g under 20 g, 5 g up to 199 g, 10 g up to 1999 g, 50 g from 2000 g). The box you typed in keeps your exact value.
- When you tap an ingredient box it switches to grams, so typing `1200` always means 1200 g. You can also type `1,2 kg`.
- **Cook mode:** tap **Poured** after each ingredient. **Back** steps back one. Tapping an ingredient's name in the list jumps straight to it.
- **Reset batch** clears progress and returns to the base yield. Progress and amounts are saved per recipe, so closing the app resumes the batch.
- **Settings** (the menu button on the list) shows the recipe count, import date and app version, and lets you import a new file.

## v1 defaults for the open questions

These answer `docs/spec.md` section 12 for v1. Each one is easy to change later.

| Question | v1 default | Where to change it |
|---|---|---|
| Orientation | Both. Landscape is side by side, portrait is stacked with cook mode on top. | `@media (orientation: portrait)` blocks in `css/style.css`; `orientation` in `manifest.json` |
| UI language | English | Text strings in `js/ui/views/` |
| Per bucket | Full batch amounts only. No per-bucket toggle yet. `batchBuckets` is validated and kept but not used. | Would be a display option in `RecipeView` using `Scaler` |
| Lock amounts while cooking | No. Amounts stay editable during a batch. | Input handlers in `js/ui/views/recipe-view.js` |
| kg or g | kg from 1000 g, up to 2 decimals (the box you typed in can show 3). | `splitGrams` in `js/core/scaler.js`, the only formatter |

## Recipe file format

```json
{
  "schemaVersion": 1,
  "unit": "g",
  "batchBuckets": 2,
  "recipes": [
    {
      "id": "test-marinade-a",
      "name": "Test Marinade A",
      "yieldUnits": 100,
      "ingredients": [
        { "name": "Oil", "grams": 5000 },
        { "name": "Star seasoning", "grams": 18, "note": "remove before storing" }
      ],
      "notes": ["Method: mix everything cold"]
    }
  ]
}
```

All amounts are grams, liquids included. A file with problems is rejected with a list of every problem (recipe and field), and the saved recipes are not changed. See `docs/spec.md` section 6 for the rules.

## Development

No dependencies, no build step. You need Node 20 or newer for the tests and Python (or any static server) to serve the app.

```bash
node --test tests/
```

```bash
python3 -m http.server
```

Then open http://localhost:8000 and import `sample-recipes.json`.

### Layout

```
index.html            single page, CSP meta tag, loads js/main.js
manifest.json         PWA manifest
sw.js                 service worker (CACHE_VERSION and APP_SHELL at the top)
css/style.css         all styles
icons/                app icons (192, 512, 180 apple-touch)
js/main.js            entry point: wires stores, router, views
js/app-version.js     version shown in settings, matches CACHE_VERSION
js/core/              pure logic, unit tested (Scaler, RecipeValidator, CookSession)
js/data/              persistence (RecipeStore, ProgressStore)
js/ui/                DOM helpers, router, file picker and the three views
js/platform/          wake lock, service worker registration, display mode
tests/                node --test unit tests for js/core
sample-recipes.json   made-up data
```

### Releasing

Before a release, run the `release` skill (`.claude/skills/release/`). It checks for private data, runs the tests, checks `APP_SHELL`, and bumps `CACHE_VERSION` in `sw.js` together with `APP_VERSION` in `js/app-version.js`. When you add, rename or remove an app file, update `APP_SHELL` or the app breaks offline.
