# Marinade Cook: product spec

This is the detailed spec. `CLAUDE.md` holds the summary and the hard rules.

## 1. What this is

An iPad sits on the kitchen bench and works like a cookbook:

1. A main page lists all recipes.
2. Tapping a recipe opens its page. The user can type the number of units to make, **or** the amount on hand of any ingredient (for example "only 1200 g of oil"), and every other quantity rescales.
3. A cook mode walks through the ingredients one at a time. Tapping a big button after pouring each one moves to the next.

## 2. Decisions already made (do not reopen)

| Topic | Decision | Why |
|---|---|---|
| Layout | **Split view.** The scaling list is on the left and the current cook-mode ingredient is on the right, both on one screen. | The full recipe stays visible while pouring. |
| Delivery | **Offline Progressive Web App**, installed to the iPad Home Screen | It must work with no wifi or data. |
| Hosting | **GitHub Pages** from this public repo | It's free, and the code holds no private data. |
| Stack | Plain HTML, CSS, and vanilla JS. No framework, build step, or CDN. | It's transparent, works offline, and is easy to audit. |

## 3. Privacy model

- The repo contains **only the app**. The real data is `recipes.json`, which the owner keeps on their own devices and moves to the iPad directly (for example by AirDrop).
- The user taps **Import recipes**. Data is stored **only in local browser storage on that iPad**. Nothing is sent anywhere.
- The README explains that public code and private data are kept apart on purpose.
- A strict CSP meta tag: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'`. No inline scripts or inline styles.
- A failed import shows a clear error and keeps the existing data.

## 4. Screens

There's one page with three views. Use hash routes (`#/`, `#/r/<id>`) so the back gesture and refresh work.

### 4.1 First run: import
Shown when no recipes are stored.
- An icon, the heading "Add your recipes", and the line "Pick recipes.json from Files. It stays on this iPad."
- One large **Import recipes** button, a styled `<input type="file">`.
- If the import succeeds, go to the list. If it fails, show the error inline.
- In a plain Safari tab (not installed), show "Add to Home Screen first, then import" (see section 8).

### 4.2 Recipe list
- Header: "Marinades", plus a search box that filters as you type and ignores case.
- **All recipes in one scrollable list, sorted A to Z.** No "+ N more" tiles.
- Each card shows the name and the base yield ("100 units").
- 3 columns in landscape, 2 in portrait, scrolling vertically.
- The settings icon opens: Import new file (with a confirm step), the import date, the recipe count, the app version, and a note that deleting the app erases the recipes.

### 4.3 Recipe page (split view)
Header: back, the recipe name as the title, and **Reset batch**.

**Left panel: scaling list**
- Top row: **Units**, with the base yield, then an arrow, then an editable box (it starts at the base yield).
- One row per ingredient, in recipe order (the pouring order): the name and an editable amount box.
- Typing into **any** box rescales everything else live (section 5).
- An ingredient's `note` shows small, under its name. Recipe `notes[]` show in a block at the bottom.
- Done rows are struck through and muted, and the current row is highlighted. Tapping a row jumps cook mode to it.

**Right panel: cook mode**
- "Step 2 of 8" and a thin progress bar.
- The current ingredient's name, large. Its amount, **very large** (readable from about a metre away).
- "Next: sugar 1.5 kg".
- A smaller **Back** (←) button and a big **Poured →** button.
- At the end: "Batch complete", the units made, and **Reset batch**.

**Portrait:** stacked, with the cook panel on top and the scaling list below.

**Reset batch** clears progress and puts amounts back to the base yield. Confirm only if progress is more than 0.

**Persistence:** each recipe's factor and progress are saved, so reopening the app resumes the batch.

## 5. Scaling logic

- All data is in **grams**, liquids included.
- The state for each recipe is one number, `factor`:
  - typing N units sets `factor = N / yieldUnits`
  - typing an amount A for ingredient i sets `factor = A / ingredient[i].grams`
- Displayed units are `yieldUnits * factor`, rounded **down** to a whole unit.
- Leave the box being typed in alone and re-render all the others. Update on `input`.
- **Rounding, always up:**
  - under 20 g: 1 g
  - 20 to 199 g: 5 g
  - 200 to 1999 g: 10 g
  - 2000 g and over: 50 g
  - The anchor shows exactly what was typed.
- **Display:** g. From 1000 g up, kg with up to 2 decimals and no trailing zeros (`1.5 kg`). **No ml or L.** Keep this in one formatter.
- Inputs use `inputmode="decimal"`, not `type="number"`. Accept a comma as the decimal separator. Ignore empty or zero values, and keep the last valid factor.
- Optional "Total / Per bucket" toggle: amount ÷ `batchBuckets`, with the same rounding (open question 3).

## 6. Data format: `recipes.json`

```json
{
  "schemaVersion": 1,
  "source": "free text, optional",
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

Validation:
- `schemaVersion === 1`, and `recipes` is a non-empty array.
- Each recipe has a unique non-empty `id`, a non-empty `name`, and a `yieldUnits` integer of at least 1.
- Each recipe has at least 1 ingredient. Each ingredient has a non-empty `name` and a `grams` number above 0 (decimals are allowed).
- `note` and `notes` are optional: a string, or an array of strings.
- Errors name the recipe and the field.

## 7. Files

See the architecture in `CLAUDE.md`. Add `icons/` (icon-192.png, icon-512.png, apple-touch-icon.png at 180 px) and a README.

## 8. Offline and iOS details

- **Service worker:** pre-cache the app shell under a versioned cache name (`marinade-cook-vN`). Serve it cache-first and delete old caches on `activate`. Show "Update available, tap to reload" when a new worker is waiting.
- **Manifest:** `display: "standalone"`, `start_url: "./"`, `scope: "./"`, name "Marinades", theme and background colours. Add `apple-mobile-web-app-capable` and `apple-touch-icon`.
- **Subpath hosting:** relative paths everywhere, and a relative service worker scope.
- **iOS Home Screen storage is separate from Safari's.** Import must happen inside the installed app. Detect it with `navigator.standalone` or `matchMedia('(display-mode: standalone)')`.
- **Storage:** call `navigator.storage.persist()` where available.
- **File picker:** use `accept=".json,application/json,text/plain"` (iOS greys out `.json` otherwise), and read with `file.text()`.
- **Wake lock:** request `navigator.wakeLock.request('screen')` on the recipe page. Re-request it on `visibilitychange`, release it on leaving, and fail silently. Show "Screen stays on" only when it's active.
- `touch-action: manipulation` on buttons, no text selection on buttons, and no hover-only UI.

## 9. Look and feel

- Tap targets: buttons at least 64 px tall. **Poured** around 88 px or more, full panel width. List rows at least 56 px. A wide gap between Back and Poured.
- Text: amount boxes at least 22 px, and the cook-mode amount at least 64 px.
- High contrast, flat and plain. No gradients, no shadows.
- **Colour palette** (warm yellow and deep purple, chosen by the owner):

  | Token | Hex | Use |
  |---|---|---|
  | `--color-cream` | `#F8F1E6` | Page background |
  | `--color-butter` | `#F9DE85` | Header bar, cards, list rows |
  | `--color-orange` | `#E9943F` | Current ingredient highlight, progress bar fill |
  | `--color-purple` | `#4A2A87` | Headings, accents, focus ring, icons |
  | `--color-ink` | `#241B4E` | Body text, main **Poured** button background |
  | `--color-charcoal` | `#474545` | Secondary text, borders |
  | `--color-on-dark` | `#FFFFFF` | Text on ink or purple buttons |

  - Main buttons: `--color-ink` background, white text, fully rounded (pill) corners.
  - Secondary buttons (Back, Reset): transparent, with a 2 px `--color-ink` border, ink text, pill corners.
  - Inputs: white background, 2 px `--color-charcoal` border, a `--color-purple` border on focus.
  - Done rows: strikethrough in `--color-charcoal`. Current row: `--color-orange` background with ink text.
  - Dark mode: `--color-ink` page background, butter-yellow text, purple surfaces, and the main button in butter with ink text. Check every text and background pair against WCAG AA (at least 4.5:1).
- Follow the system light or dark theme. UI text is in English.

## 10. Deployment (for the README)

1. **Settings → Pages →** "Deploy from a branch", `main`, `/ (root)`.
2. On the iPad, open `https://<username>.github.io/marinade-cook/` in Safari.
3. Share → **Add to Home Screen**.
4. Open it **from the Home Screen icon** and import `recipes.json` from Files.
5. Test in airplane mode.

## 11. Acceptance checklist

- [ ] No real recipe data in the repo.
- [ ] The first-run import works, and a bad file gives a clear error without overwriting data.
- [ ] The list is A to Z, scrolls, and search filters it.
- [ ] Units and ingredient anchors both rescale correctly, and the anchor keeps its typed value.
- [ ] Rounding and kg formatting follow section 5. No ml anywhere.
- [ ] Cook mode: Poured, Back, row jump, done and current states all work.
- [ ] Batch complete and Reset batch work. Progress survives reopening the app.
- [ ] Works offline after the first load.
- [ ] Wake lock works where supported.
- [ ] Landscape is split, and portrait is stacked. No overflow on 10.2" to 13" iPads.
- [ ] No `innerHTML` with imported data, and no CSP console errors.
- [ ] `node --test tests/` passes.

## 12. Open questions (ask, don't guess)

1. Main orientation: sideways or upright?
2. UI language: English or Spanish?
3. Amounts per bucket, full batch, or switchable? Should cook mode go bucket by bucket?
4. Lock amounts once cooking has started?
5. kg from 1000 g, or always g?

## 13. Later (not v1)

A shopping list across recipes, substitution ratio rules, batch history, and "today's batch" with several recipes.
