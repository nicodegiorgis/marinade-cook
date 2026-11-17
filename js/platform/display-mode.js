/**
 * display-mode.js
 * Tells whether the app runs from the Home Screen. On iOS the Home Screen app
 * has its own storage, separate from Safari, so import must happen there.
 */

/**
 * Detects standalone (installed) mode.
 */
export class DisplayMode {
	/**
	 * Whether the app was opened from the Home Screen icon.
	 * @returns {boolean}
	 */
	static isStandalone() {
		try {
			if (navigator.standalone === true) {
				return true;
			}
			return window.matchMedia('(display-mode: standalone)').matches;
		} catch {
			return false;
		}
	}

	/**
	 * Whether this is iOS or iPadOS Safari, where the storage split matters.
	 * iPadOS reports itself as a Mac, so touch support is checked too.
	 * @returns {boolean}
	 */
	static isAppleTouchDevice() {
		const ua = navigator.userAgent;
		return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
	}
}
