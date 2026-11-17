/**
 * theme-store.js
 * Saves the theme choice (auto, light or dark) in local browser storage.
 */

const STORAGE_KEY = 'marinade-cook:theme';

/** Allowed theme choices. Auto follows the iPad's light or dark setting. */
export const THEME_MODES = Object.freeze(['auto', 'light', 'dark']);

/**
 * Persistence for the theme choice. Defaults to auto.
 */
export class ThemeStore {
	#storage;

	/**
	 * @param {Storage} storage Usually window.localStorage.
	 */
	constructor(storage) {
		this.#storage = storage;
	}

	/**
	 * The saved choice, or 'auto' when nothing valid is saved.
	 * @returns {string} 'auto', 'light' or 'dark'.
	 */
	get() {
		try {
			const saved = this.#storage.getItem(STORAGE_KEY);
			return THEME_MODES.includes(saved) ? saved : 'auto';
		} catch {
			return 'auto';
		}
	}

	/**
	 * Saves a choice. Unknown values are ignored.
	 * @param {string} mode 'auto', 'light' or 'dark'.
	 * @returns {void}
	 */
	set(mode) {
		if (!THEME_MODES.includes(mode)) {
			return;
		}
		try {
			this.#storage.setItem(STORAGE_KEY, mode);
		} catch {
			// The theme still applies for this session; it just won't be remembered.
		}
	}
}
