# Changelog

Versions here match the app version shown in settings (`APP_VERSION`) and the `CACHE_VERSION` in `sw.js` (`marinade-cook-vN`).

## Unreleased

## v4 (2026-11-17)

### Fixed

- A very large typed amount, or a damaged saved progress value, no longer crashes the recipe page.
- Fixed a rare case where quick navigation could leave the wake lock badge showing after the lock was released.
- A recipe named in a way that clashes with built-in object properties now saves its cook progress correctly.
- Updating the app no longer reuses an old cached file left over from a previous version.

## v3 (2026-11-17)

### Changed

- The app and its docs now talk about "device", or "tablet, phone or computer", instead of assuming an iPad. Install steps cover iPad and iPhone, Android and computers.

## v2 (2026-11-17)

### Added

- A Theme setting with Auto, Light and Dark choices. Auto follows the device, and the choice is remembered.

## v1 (2026-11-17)

### Added

- First release: a recipe list with search, and a split-view recipe page with live scaling on one side and step-by-step cook mode on the other.
- Import your own recipe file (a JSON file). It stays on the device and is never sent anywhere.
- Works fully offline, installable to the home screen.
- A Reset batch action for cook progress, with confirmation.
