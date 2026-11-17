---
paths:
  - "sw.js"
  - "manifest.json"
  - "js/platform/**/*.js"
  - "index.html"
---

# Offline and PWA rules

- `sw.js` stays at the repo root so its scope covers the whole app.
- `CACHE_VERSION` is a constant at the top of `sw.js` (`marinade-cook-v1`). Bump it on every release that changes any cached file. The `release` skill does this.
- `APP_SHELL` lists every file the app needs, with relative paths (`./index.html`, `./js/main.js`, ...). **When you add, rename, or delete a file, update `APP_SHELL`**, or the app breaks offline.
- Never cache `recipes.json` or `sample-recipes.json`. Data comes only from the user's import.
- Install: pre-cache `APP_SHELL`. Activate: delete caches that don't match `CACHE_VERSION`. Fetch: cache-first for same-origin GET requests, and ignore everything else.
- Don't call `skipWaiting()` automatically. The page shows "Update available, tap to reload", and only then posts a message telling the worker to skip waiting. That way a batch in progress isn't interrupted.
- All paths are relative, because GitHub Pages serves the app from `/marinade-cook/`.
- iOS notes (see `docs/spec.md` section 8): Home Screen storage is separate from Safari's, wake lock may be missing, and the file picker needs `text/plain` in `accept`.
