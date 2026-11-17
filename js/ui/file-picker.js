/**
 * file-picker.js
 * A big button that opens the Files picker and imports the chosen file, with
 * inline errors. Used by the first-run screen and the settings panel.
 */

import { el, clear } from './dom.js';

/**
 * Styled file input plus an error list.
 */
export class FilePicker {
	#recipeStore;
	#onImported;
	#errors;
	#input;
	#root;

	/**
	 * @param {object} deps Dependencies.
	 * @param {import('../data/recipe-store.js').RecipeStore} deps.recipeStore Store to import into.
	 * @param {function(): void} deps.onImported Called after a successful import.
	 * @param {string} deps.label Button text.
	 * @param {string} [deps.className] Extra button classes.
	 */
	constructor({ recipeStore, onImported, label, className = 'button button--main' }) {
		this.#recipeStore = recipeStore;
		this.#onImported = onImported;
		this.#input = el('input', {
			type: 'file',
			className: 'file-picker__input',
			// iOS greys out .json files unless text/plain is accepted too.
			accept: '.json,application/json,text/plain',
			on: { change: () => this.#handleChange() },
		});
		this.#errors = el('div', { className: 'file-picker__errors', attrs: { 'aria-live': 'polite' } });
		this.#root = el('div', { className: 'file-picker' }, [
			el('label', { className: `${className} file-picker__button` }, [this.#input, label]),
			this.#errors,
		]);
	}

	/**
	 * The element to place in a view.
	 * @returns {HTMLElement}
	 */
	get element() {
		return this.#root;
	}

	/**
	 * Reads the chosen file and imports it. A failed import keeps existing data.
	 * @returns {Promise<void>}
	 */
	async #handleChange() {
		const file = this.#input.files[0];
		clear(this.#errors);
		if (file === undefined) {
			return;
		}
		let textContent;
		try {
			textContent = await file.text();
		} catch (err) {
			this.#showErrors([`Could not read the file (${err.message}).`]);
			return;
		} finally {
			// Clearing lets the same file be picked again after fixing it.
			this.#input.value = '';
		}
		const result = this.#recipeStore.importText(textContent);
		if (!result.ok) {
			this.#showErrors(result.errors);
			return;
		}
		this.#onImported();
	}

	/**
	 * @param {string[]} errors Problems to list.
	 * @returns {void}
	 */
	#showErrors(errors) {
		const shown = errors.slice(0, 20);
		const more = errors.length - shown.length;
		clear(this.#errors);
		this.#errors.append(
			el('p', { className: 'file-picker__errors-title', text: 'Import failed. Your saved recipes were not changed.' }),
			el('ul', { className: 'file-picker__error-list' }, shown.map((e) => el('li', { text: e }))),
			more > 0 ? el('p', { text: `And ${more} more problems.` }) : null,
		);
	}
}
