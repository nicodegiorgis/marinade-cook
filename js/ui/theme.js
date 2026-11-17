/**
 * theme.js
 * Applies the theme choice to the page. Colours stay in css/style.css as
 * palette tokens; this only sets data-theme on <html> and keeps the
 * browser's theme-color in step.
 */

/**
 * Switches between auto, light and dark.
 */
export class Theme {
	#mode = 'auto';
	#media = null;

	/**
	 * Watches the system setting so the status bar colour follows it in auto.
	 */
	constructor() {
		try {
			this.#media = window.matchMedia('(prefers-color-scheme: dark)');
			this.#media.addEventListener('change', () => this.#syncThemeColor());
		} catch {
			// Old browsers without matchMedia listeners: auto still works through CSS.
		}
	}

	/**
	 * Applies a choice. 'auto' removes the override so CSS follows the iPad.
	 * @param {string} mode 'auto', 'light' or 'dark'.
	 * @returns {void}
	 */
	apply(mode) {
		this.#mode = mode;
		const root = document.documentElement;
		if (mode === 'light' || mode === 'dark') {
			root.dataset.theme = mode;
		} else {
			delete root.dataset.theme;
		}
		this.#syncThemeColor();
	}

	/**
	 * The current choice.
	 * @returns {string}
	 */
	get mode() {
		return this.#mode;
	}

	/**
	 * Points every theme-color meta at the header colour now in effect, read
	 * from the CSS tokens so no colour is duplicated here. Runs again when the
	 * system theme changes, which keeps auto correct.
	 * @returns {void}
	 */
	#syncThemeColor() {
		const color = getComputedStyle(document.documentElement)
			.getPropertyValue('--header-bg').trim();
		if (color === '') {
			return;
		}
		for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
			meta.content = color;
		}
	}
}
