/**
 * recipe-store.js
 * Saves and loads the imported recipes in local browser storage. Nothing
 * leaves the device. Imports are validated before anything is overwritten.
 */

import { RecipeValidator } from '../core/recipe-validator.js';

const STORAGE_KEY = 'marinade-cook:recipes';

/**
 * Persistence for the imported recipe file.
 */
export class RecipeStore {
	#storage;
	#validator;
	#cache = null;

	/**
	 * @param {Storage} storage Usually window.localStorage.
	 * @param {RecipeValidator} [validator] Schema checker.
	 */
	constructor(storage, validator = new RecipeValidator()) {
		this.#storage = storage;
		this.#validator = validator;
	}

	/**
	 * Validates file text and, only if it is valid, replaces the stored recipes.
	 * @param {string} text Raw contents of recipes.json.
	 * @returns {{ok: boolean, errors: string[]}}
	 */
	importText(text) {
		const result = this.#validator.validateText(text);
		if (!result.ok) {
			return { ok: false, errors: result.errors };
		}
		const record = { importedAt: new Date().toISOString(), data: result.data };
		try {
			this.#storage.setItem(STORAGE_KEY, JSON.stringify(record));
		} catch (err) {
			return { ok: false, errors: [`Could not save on this device (${err.message}).`] };
		}
		this.#cache = record;
		return { ok: true, errors: [] };
	}

	/**
	 * Whether any recipes are stored.
	 * @returns {boolean}
	 */
	hasRecipes() {
		return this.recipes().length > 0;
	}

	/**
	 * All stored recipes sorted A to Z by name.
	 * @returns {Array<object>}
	 */
	recipes() {
		const record = this.#load();
		if (record === null) {
			return [];
		}
		return [...record.data.recipes].sort((a, b) => {
			return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
		});
	}

	/**
	 * Finds one recipe by id.
	 * @param {string} id Recipe id.
	 * @returns {object|null}
	 */
	find(id) {
		return this.recipes().find((r) => r.id === id) ?? null;
	}

	/**
	 * When the current file was imported.
	 * @returns {Date|null}
	 */
	importedAt() {
		const record = this.#load();
		return record === null ? null : new Date(record.importedAt);
	}

	/**
	 * Reads and re-validates the stored record, so a damaged store is ignored.
	 * @returns {{importedAt: string, data: object}|null}
	 */
	#load() {
		if (this.#cache !== null) {
			return this.#cache;
		}
		let record;
		try {
			record = JSON.parse(this.#storage.getItem(STORAGE_KEY));
		} catch {
			return null;
		}
		if (record === null || typeof record !== 'object') {
			return null;
		}
		const result = this.#validator.validate(record.data);
		if (!result.ok) {
			return null;
		}
		this.#cache = { importedAt: String(record.importedAt), data: result.data };
		return this.#cache;
	}
}
