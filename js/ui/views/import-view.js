/**
 * import-view.js
 * First-run screen, shown when no recipes are stored.
 */

import { el, clear, Dom } from '../dom.js';
import { ICONS } from '../icons.js';
import { FilePicker } from '../file-picker.js';

/**
 * "Add your recipes" screen with one big import button.
 */
export class ImportView {
	#container;
	#deps;

	/**
	 * @param {HTMLElement} container Where to render.
	 * @param {object} deps Dependencies.
	 * @param {import('../../data/recipe-store.js').RecipeStore} deps.recipeStore Recipe store.
	 * @param {function(): void} deps.onImported Called after a successful import.
	 * @param {boolean} deps.showInstallHint True in a plain Safari tab on iPad or iPhone.
	 */
	constructor(container, deps) {
		this.#container = container;
		this.#deps = deps;
	}

	/**
	 * Draws the screen.
	 * @returns {void}
	 */
	render() {
		const picker = new FilePicker({
			recipeStore: this.#deps.recipeStore,
			onImported: this.#deps.onImported,
			label: 'Import recipes',
		});
		const hint = this.#deps.showInstallHint
			? el('p', { className: 'import-view__hint', attrs: { role: 'note' } }, [
				el('strong', { text: 'Add to Home Screen first, then import. ' }),
				'The Home Screen app keeps its own storage, separate from Safari. ',
				'Tap Share, then Add to Home Screen, and open the app from its icon.',
			])
			: null;
		clear(this.#container);
		this.#container.append(
			el('main', { className: 'import-view' }, [
				el('div', { className: 'import-view__icon' }, [Dom.icon(ICONS.recipe)]),
				el('h1', { className: 'import-view__title', text: 'Add your recipes' }),
				el('p', { className: 'import-view__line', text: 'Pick your recipes.json file. It stays on this device.' }),
				hint,
				picker.element,
			]),
		);
	}

	/**
	 * Nothing to release.
	 * @returns {void}
	 */
	destroy() {}
}
