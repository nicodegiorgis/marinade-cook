# Marinade Cook

An offline iPad web app for scaling and cooking bulk marinade batches. It has a recipe list, a split-view recipe page (live scaling on one side, step-by-step cook mode on the other), and recipes imported from a private JSON file that never leaves the iPad.

The full product spec is in [docs/spec.md](docs/spec.md).

## Screenshots

Live app: https://nicodegiorgis.github.io/marinade-cook/

All screenshots use the made-up recipes in `sample-recipes.json`.

![Import screen](docs/screenshots/import-screen.png)

First run: import a recipe file from Files.

![Recipe list](docs/screenshots/recipe-list.png)

Recipe list, A to Z, with search.

![Recipe page at base](docs/screenshots/recipe-base.png)

Recipe page at the base yield, units box empty.

![Recipe page scaled while cooking](docs/screenshots/recipe-scaled-cooking.png)

Scaled to 250 units, cook mode on step 3 with the first two ingredients poured.

![Recipe page in dark theme](docs/screenshots/recipe-scaled-dark.png)

The same batch in the dark theme.

![Recipe page in portrait](docs/screenshots/recipe-portrait.png)

Portrait: cook mode on top, amounts below.

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
- **Recipe page:** the top row shows the base yield ("Base: 100 units") and an empty units box. Leave it empty for the base recipe, type a number of units, **or** type the amount you have of any ingredient, and every other amount rescales. Typing an ingredient amount fills the units box with the units it makes (rounded down). At base, every amount is the exact value from the file. Once you type, amounts are rounded up (1 g under 20 g, 5 g up to 199 g, 10 g up to 1999 g, 50 g from 2000 g), and the box you typed in keeps your exact value.
- Every amount is in grams, shown as a plain number (`5000 g`, `1250 g`). Typing `1200` in an ingredient box means 1200 g. A comma works as the decimal point.
- **Cook mode:** tap **Poured** after each ingredient. **Back** steps back one. Tapping an ingredient's name in the list jumps straight to it.
- **Reset batch** clears progress, returns to the base yield and empties the units box. Progress and amounts are saved per recipe, so closing the app resumes the batch.
- **Settings** (the menu button on the list) shows the recipe count, import date and app version, lets you import a new file, and has a **Theme** choice: Auto (follows the iPad's light or dark setting, the default), Light or Dark. The choice is saved on the iPad.

## v1 defaults for the open questions

These answer `docs/spec.md` section 12 for v1. Each one is easy to change later.

| Question | v1 default | Where to change it |
|---|---|---|
| Orientation | Both. Landscape is side by side, portrait is stacked with cook mode on top. | `@media (orientation: portrait)` blocks in `css/style.css`; `orientation` in `manifest.json` |
| UI language | English | Text strings in `js/ui/views/` |
| Per bucket | Full batch amounts only. No per-bucket toggle yet. `batchBuckets` is validated and kept but not used. | Would be a display option in `RecipeView` using `Scaler` |
| Lock amounts while cooking | No. Amounts stay editable during a batch. | Input handlers in `js/ui/views/recipe-view.js` |
| kg or g | Decided: always g, no kg anywhere. Decimals only when the value has one. | `formatGrams` in `js/core/scaler.js`, the only formatter |

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
node --test
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
js/data/              persistence (RecipeStore, ProgressStore, ThemeStore)
js/ui/                DOM helpers, router, theme, file picker and the three views
js/platform/          wake lock, service worker registration, display mode
tests/                node --test unit tests for js/core
sample-recipes.json   made-up data
```

### Releasing

Before a release, run the `release` skill (`.claude/skills/release/`). It checks for private data, runs the tests, checks `APP_SHELL`, and bumps `CACHE_VERSION` in `sw.js` together with `APP_VERSION` in `js/app-version.js`. When you add, rename or remove an app file, update `APP_SHELL` or the app breaks offline.
