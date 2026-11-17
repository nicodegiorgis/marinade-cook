/**
 * router.js
 * Hash routes (#/ and #/r/<id>), so the back gesture and refresh both work.
 */

/**
 * Maps the location hash to a route and notifies a listener on change.
 */
export class Router {
	#onChange;
	#handler = () => this.#onChange(this.current());

	/**
	 * @param {function({name: string, id?: string}): void} onChange Called with the new route.
	 */
	constructor(onChange) {
		this.#onChange = onChange;
	}

	/**
	 * Starts listening and renders the current route once.
	 * @returns {void}
	 */
	start() {
		window.addEventListener('hashchange', this.#handler);
		this.#handler();
	}

	/**
	 * Parses the current hash.
	 * @returns {{name: string, id?: string}} name is 'list' or 'recipe'.
	 */
	current() {
		const match = /^#\/r\/(.+)$/.exec(window.location.hash);
		if (match === null) {
			return { name: 'list' };
		}
		try {
			return { name: 'recipe', id: decodeURIComponent(match[1]) };
		} catch {
			return { name: 'list' };
		}
	}

	/**
	 * Opens a recipe page.
	 * @param {string} id Recipe id.
	 * @returns {void}
	 */
	toRecipe(id) {
		window.location.hash = `#/r/${encodeURIComponent(id)}`;
	}

	/**
	 * Goes to the list. Uses history when possible so the back gesture stays tidy.
	 * @returns {void}
	 */
	toList() {
		if (window.location.hash === '' || window.location.hash === '#/') {
			this.#handler();
			return;
		}
		window.location.hash = '#/';
	}
}
