/**
 * sw-register.js
 * Registers the service worker and offers updates. The new worker only takes
 * over when the user taps, so a batch in progress is never interrupted.
 */

/**
 * Service worker registration plus the "Update available" prompt.
 */
export class SwRegister {
	#onUpdateReady;
	#reloading = false;

	/**
	 * @param {function(function(): void): void} onUpdateReady Called with an
	 *   apply() function when a new version is waiting.
	 */
	constructor(onUpdateReady) {
		this.#onUpdateReady = onUpdateReady;
	}

	/**
	 * Registers ./sw.js. Does nothing where service workers are unavailable.
	 * @returns {Promise<void>}
	 */
	async register() {
		if (!('serviceWorker' in navigator)) {
			return;
		}
		try {
			// Relative URL and scope, because GitHub Pages serves the app from a subpath.
			const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (this.#reloading) {
					window.location.reload();
				}
			});
			if (reg.waiting !== null && navigator.serviceWorker.controller !== null) {
				this.#offer(reg.waiting);
			}
			reg.addEventListener('updatefound', () => this.#watch(reg.installing));
		} catch {
			// Offline support is lost, but the app still works online.
		}
	}

	/**
	 * Asks the browser for storage that is not evicted under pressure.
	 * @returns {Promise<boolean>} True if granted.
	 */
	async persistStorage() {
		try {
			if (navigator.storage !== undefined && navigator.storage.persist !== undefined) {
				return await navigator.storage.persist();
			}
		} catch {
			// Not supported: data still lives in normal local storage.
		}
		return false;
	}

	/**
	 * @param {ServiceWorker|null} worker Installing worker.
	 * @returns {void}
	 */
	#watch(worker) {
		if (worker === null) {
			return;
		}
		worker.addEventListener('statechange', () => {
			// No controller means first install, which needs no prompt.
			if (worker.state === 'installed' && navigator.serviceWorker.controller !== null) {
				this.#offer(worker);
			}
		});
	}

	/**
	 * @param {ServiceWorker} worker Waiting worker.
	 * @returns {void}
	 */
	#offer(worker) {
		this.#onUpdateReady(() => {
			this.#reloading = true;
			worker.postMessage({ type: 'SKIP_WAITING' });
		});
	}
}
