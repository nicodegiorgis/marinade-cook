/**
 * wake-lock.js
 * Keeps the screen on while a recipe page is open, where the browser allows it.
 * Fails silently: older devices simply dim as usual.
 */

/**
 * Wrapper around navigator.wakeLock that re-requests after the app is hidden.
 */
export class WakeLock {
	#sentinel = null;
	#pending = null;
	#wanted = false;
	#listener = () => {};
	#visibilityHandler = () => {
		if (this.#wanted && document.visibilityState === 'visible') {
			this.#request();
		}
	};

	/**
	 * Starts watching visibility, because iOS drops the lock when the app is hidden.
	 */
	constructor() {
		document.addEventListener('visibilitychange', this.#visibilityHandler);
	}

	/**
	 * Sets the function told when the lock is gained or lost.
	 * @param {function(boolean): void} listener Called with true while the lock is held.
	 * @returns {void}
	 */
	setListener(listener) {
		this.#listener = listener;
	}

	/**
	 * @param {boolean} active Whether the lock is held.
	 * @returns {void}
	 */
	#onChange(active) {
		this.#listener(active);
	}

	/**
	 * Whether the lock is currently held.
	 * @returns {boolean}
	 */
	get active() {
		return this.#sentinel !== null && !this.#sentinel.released;
	}

	/**
	 * Asks to keep the screen on.
	 * @returns {Promise<void>}
	 */
	async enable() {
		this.#wanted = true;
		await this.#request();
	}

	/**
	 * Lets the screen dim again.
	 * @returns {Promise<void>}
	 */
	async disable() {
		this.#wanted = false;
		const sentinel = this.#sentinel;
		this.#sentinel = null;
		this.#onChange(false);
		if (sentinel === null) {
			return;
		}
		try {
			await sentinel.release();
		} catch {
			// Already released by the browser.
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	async #request() {
		if (!('wakeLock' in navigator) || this.active) {
			return;
		}
		// Share one in-flight request, so two quick calls can never take two locks
		// and leave one that nothing releases.
		if (this.#pending === null) {
			this.#pending = this.#acquire().finally(() => {
				this.#pending = null;
			});
		}
		await this.#pending;
	}

	/**
	 * @returns {Promise<void>}
	 */
	async #acquire() {
		try {
			const sentinel = await navigator.wakeLock.request('screen');
			if (!this.#wanted) {
				await sentinel.release();
				return;
			}
			this.#sentinel = sentinel;
			sentinel.addEventListener('release', () => {
				// An old lock's late release event must not hide the badge for a newer one.
				if (this.#sentinel === sentinel) {
					this.#onChange(false);
				}
			});
			this.#onChange(true);
		} catch {
			// Denied or unsupported (low battery mode, old iOS): carry on without it.
			this.#onChange(false);
		}
	}
}
