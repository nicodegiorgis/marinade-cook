---
name: release
description: Prepare a release of Marinade Cook. Use before opening a pull request that changes any app file (html, css, js, sw.js, manifest, icons), or when asked to release, ship, or deploy.
---

# Release checklist

Run these in order, and stop and report if any step fails.

1. **Privacy check.** Make sure no private data is tracked or staged:
   ```bash
   git ls-files | grep -E '(^|/)recipes\.json$|\.private\.json$' && echo "STOP: private data tracked"
   git diff --cached --name-only | grep -E 'recipes\.json$|\.private\.json$' && echo "STOP: private data staged"
   ```
   Also confirm that `.gitignore` still lists `recipes.json` and `*.private.json`.
2. **Tests.** Run `node --test tests/` and make sure every test passes.
3. **Shell list.** Compare `APP_SHELL` in `sw.js` with the real files (html, css, js, manifest, icons). Add anything missing and remove anything deleted.
4. **Bump the version.** Increase `CACHE_VERSION` in `sw.js` by one (`v3` to `v4`), and update the app version shown in the settings panel to match.
5. **Safety scan.**
   ```bash
   grep -rnE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(' js/ && echo "Review these"
   grep -rnE 'https?://' index.html js/ css/ sw.js | grep -v localhost && echo "Check: no external requests allowed"
   grep -rn '—' . --include='*.js' --include='*.css' --include='*.html' --include='*.md' && echo "Remove em dashes"
   ```
6. **Manual check list for the pull request.** Add this to the PR description, so the owner can tick it off on the iPad:
   - Opens offline (airplane mode)
   - Units and ingredient scaling correct on one recipe
   - Cook mode through a full recipe, then reset
   - Portrait and landscape both look right
7. **Pull request.** Use a short title and a summary of the changes, list anything not verified, and include the version number.
