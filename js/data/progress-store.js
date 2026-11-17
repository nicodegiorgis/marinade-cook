/**
 * progress-store.js
 * Saves each recipe's scale factor and cook-mode step, so reopening the app
 * resumes the batch.
 */

const STORAGE_KEY = 'marinade-cook:progress';

/**
 * Per-recipe batch state in local browser storage.
 */
export class ProgressStore {
	#storage;

	/**
	 * @param {Storage} storage Usually window.localStorage.
	 */
	constructor(storage) {
		this.#storage = storage;
	}

	/**
	 * Saved state for one recipe.
	 * @param {string} recipeId Recipe id.
	 * @returns {{factor?: number, anchor?: object, step?: number}}
	 */
	get(recipeId) {
		const all = this.#readAll();
		const entry = all[recipeId];
		return entry !== null && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
	}

	/**
	 * Saves state for one recipe.
	 * @param {string} recipeId Recipe id.
	 * @param {{factor: number, anchor: object, step: number}} state Batch state.
	 * @returns {void}
	 */
	set(recipeId, state) {
		const all = this.#readAll();
		all[recipeId] = state;
		try {
			this.#storage.setItem(STORAGE_KEY, JSON.stringify(all));
		} catch {
			// Losing progress is an inconvenience, not worth interrupting a pour.
		}
	}

	/**
	 * Drops all saved progress, used when a new recipe file is imported.
	 * @returns {void}
	 */
	clear() {
		try {
			this.#storage.removeItem(STORAGE_KEY);
		} catch {
			// Nothing to do: stale progress is ignored for unknown recipes anyway.
		}
	}

	/**
	 * Reads every saved entry into an object with no prototype. Recipe ids come
	 * from the imported file, so an id like "__proto__" must stay a plain key
	 * instead of reaching Object.prototype.
	 * @returns {Object<string, object>}
	 */
	#readAll() {
		const all = Object.create(null);
		let parsed;
		try {
			parsed = JSON.parse(this.#storage.getItem(STORAGE_KEY));
		} catch {
			return all;
		}
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return all;
		}
		// JSON.parse makes "__proto__" an own key, so copying keeps it.
		for (const [id, entry] of Object.entries(parsed)) {
			all[id] = entry;
		}
		return all;
	}
}
