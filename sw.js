/**
 * sw.js
 * Service worker: pre-caches the app shell so the app works with no network.
 * Stays at the repo root so its scope covers the whole app. Never caches
 * recipe data, which lives only in local storage after import.
 */

const CACHE_VERSION = 'marinade-cook-v2';

/** Every file the app needs, relative so it works under the GitHub Pages subpath. */
const APP_SHELL = [
	'./',
	'./index.html',
	'./manifest.json',
	'./css/style.css',
	'./icons/icon-192.png',
	'./icons/icon-512.png',
	'./icons/apple-touch-icon.png',
	'./js/main.js',
	'./js/app-version.js',
	'./js/core/scaler.js',
	'./js/core/recipe-validator.js',
	'./js/core/cook-session.js',
	'./js/data/recipe-store.js',
	'./js/data/progress-store.js',
	'./js/data/theme-store.js',
	'./js/ui/dom.js',
	'./js/ui/icons.js',
	'./js/ui/file-picker.js',
	'./js/ui/router.js',
	'./js/ui/theme.js',
	'./js/ui/views/import-view.js',
	'./js/ui/views/list-view.js',
	'./js/ui/views/recipe-view.js',
	'./js/platform/wake-lock.js',
	'./js/platform/sw-register.js',
	'./js/platform/display-mode.js',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		const names = await caches.keys();
		await Promise.all(names
			.filter((name) => name.startsWith('marinade-cook-') && name !== CACHE_VERSION)
			.map((name) => caches.delete(name)));
		await self.clients.claim();
	})());
});

self.addEventListener('message', (event) => {
	// Only the page's "Update available" tap may swap versions, never automatically.
	if (event.data !== null && typeof event.data === 'object' && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== self.location.origin) {
		return;
	}
	if (/(^|\/)(sample-)?recipes\.json$/.test(url.pathname) || url.pathname.endsWith('.private.json')) {
		return;
	}
	event.respondWith((async () => {
		const cache = await caches.open(CACHE_VERSION);
		// ignoreSearch so ./?source=homescreen style launches still hit the cache.
		const cached = await cache.match(request, { ignoreSearch: true });
		if (cached !== undefined) {
			return cached;
		}
		try {
			return await fetch(request);
		} catch (err) {
			if (request.mode === 'navigate') {
				const shell = await cache.match('./index.html');
				if (shell !== undefined) {
					return shell;
				}
			}
			throw err;
		}
	})());
});
