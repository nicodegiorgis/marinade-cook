# Contributing to Marinade Cook

## About this project

Marinade Cook is a personal portfolio project. Issues and pull requests are
welcome, but it is maintained by one person, so replies can be slow and not
every change will be merged.

## Before you start

For anything bigger than a small fix, please open an issue first so effort
is not wasted on something that will not be merged.

Before you start, read:

- [docs/spec.md](docs/spec.md), the product spec. It records the decisions
  already made, so a change that reopens one of them is unlikely to be
  accepted without a good reason.
- [CLAUDE.md](CLAUDE.md), the project rules used for development.

## Ground rules

These are summarised from [CLAUDE.md](CLAUDE.md). That file is the source of
truth if anything here seems out of date.

- Never commit real recipe data. Use `sample-recipes.json` (made-up data)
  for development and tests. `recipes.json` and `*.private.json` are
  gitignored, and that must stay true.
- No network calls, no CDNs, fonts or analytics. The app must work fully
  offline.
- No frameworks, no build step, no runtime dependencies. Plain HTML, CSS
  and vanilla JavaScript (ES modules).
- Imported data is untrusted: validate it, and render it with `textContent`
  and DOM APIs, never `innerHTML`.
- Big tap targets, because the app is used with gloves and wet hands.
- Code style: tabs for indentation, one class per file, a header comment on
  every file, and a JSDoc comment on every class and public method.
- No em dashes in UI text, docs, comments or commit messages.

## Running things

```bash
node --test
```

```bash
python3 -m http.server
```

You need Node 20 or newer. The tests also run in GitHub Actions on every
pull request.

## Pull requests

- One change per pull request.
- Add tests for any change to `js/core`.
- If your change changes a decision in `docs/spec.md`, update that file in
  the same pull request.
- Say what you did not verify.
- If your change touches an app file (html, css, js, `sw.js`, manifest,
  icons), leave `CACHE_VERSION` and `APP_VERSION` alone. The maintainer
  bumps those at release time.
