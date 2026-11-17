/**
 * recipe-validator.js
 * Checks an imported recipes file against the schema in docs/spec.md section 6
 * and returns a clean copy with only known fields. Pure logic: no DOM, no storage.
 */

/**
 * @param {*} value Candidate.
 * @returns {boolean} True for a string with visible characters.
 */
function isNonEmptyString(value) {
	return typeof value === 'string' && value.trim() !== '';
}

/**
 * @param {*} value Candidate.
 * @returns {boolean} True for a plain object (not null, not an array).
 */
function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validates imported recipe data. Every problem is collected, so the user can
 * fix the whole file in one go.
 */
export class RecipeValidator {
	/**
	 * Validates parsed JSON.
	 * @param {*} data Parsed contents of recipes.json.
	 * @returns {{ok: boolean, errors: string[], data: (object|null)}} data is a
	 *   clean copy when ok is true, otherwise null.
	 */
	validate(data) {
		const errors = [];
		if (!isPlainObject(data)) {
			return this.#fail(['File: must be a JSON object with "schemaVersion" and "recipes".']);
		}
		if (data.schemaVersion !== 1) {
			errors.push('File: "schemaVersion" must be 1.');
		}
		if (data.unit !== undefined && data.unit !== 'g') {
			errors.push('File: "unit" must be "g" (all amounts are grams).');
		}
		const bucketsOk = data.batchBuckets === undefined
			|| (Number.isInteger(data.batchBuckets) && data.batchBuckets >= 1);
		if (!bucketsOk) {
			errors.push('File: "batchBuckets" must be a whole number of at least 1.');
		}
		if (data.source !== undefined && typeof data.source !== 'string') {
			errors.push('File: "source" must be text.');
		}
		if (!Array.isArray(data.recipes) || data.recipes.length === 0) {
			errors.push('File: "recipes" must be a list with at least one recipe.');
			return this.#fail(errors);
		}

		const seenIds = new Set();
		const recipes = data.recipes.map((recipe, i) => {
			return this.#checkRecipe(recipe, i, seenIds, errors);
		});

		if (errors.length > 0) {
			return this.#fail(errors);
		}
		const clean = { schemaVersion: 1, unit: 'g', recipes };
		if (data.batchBuckets !== undefined) {
			clean.batchBuckets = data.batchBuckets;
		}
		if (data.source !== undefined) {
			clean.source = data.source;
		}
		return { ok: true, errors: [], data: clean };
	}

	/**
	 * Parses JSON text, then validates it.
	 * @param {string} text Raw file contents.
	 * @returns {{ok: boolean, errors: string[], data: (object|null)}}
	 */
	validateText(text) {
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch (err) {
			return this.#fail([`File: not valid JSON (${err.message}).`]);
		}
		return this.validate(parsed);
	}

	/**
	 * @param {*} recipe Candidate recipe.
	 * @param {number} i Position in the list.
	 * @param {Set<string>} seenIds Ids already used.
	 * @param {string[]} errors Collected problems.
	 * @returns {object|null} Clean recipe, or null when it is not an object.
	 */
	#checkRecipe(recipe, i, seenIds, errors) {
		const hasName = isPlainObject(recipe) && isNonEmptyString(recipe.name);
		const label = hasName ? `Recipe "${recipe.name}" (#${i + 1})` : `Recipe #${i + 1}`;
		if (!isPlainObject(recipe)) {
			errors.push(`${label}: must be an object.`);
			return null;
		}
		if (!isNonEmptyString(recipe.id)) {
			errors.push(`${label}: "id" must be non-empty text.`);
		} else if (seenIds.has(recipe.id)) {
			errors.push(`${label}: "id" "${recipe.id}" is used by another recipe.`);
		} else {
			seenIds.add(recipe.id);
		}
		if (!hasName) {
			errors.push(`${label}: "name" must be non-empty text.`);
		}
		if (!Number.isInteger(recipe.yieldUnits) || recipe.yieldUnits < 1) {
			errors.push(`${label}: "yieldUnits" must be a whole number of at least 1.`);
		}
		const notes = this.#checkNotes(recipe.notes, `${label}: "notes"`, errors);

		if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
			errors.push(`${label}: "ingredients" must be a list with at least one ingredient.`);
			return null;
		}
		const ingredients = recipe.ingredients.map((ing, j) => {
			return this.#checkIngredient(ing, `${label}: ingredient ${j + 1}`, errors);
		});
		return {
			id: recipe.id,
			name: recipe.name,
			yieldUnits: recipe.yieldUnits,
			ingredients,
			notes,
		};
	}

	/**
	 * @param {*} ing Candidate ingredient.
	 * @param {string} label Prefix naming the recipe and ingredient.
	 * @param {string[]} errors Collected problems.
	 * @returns {object|null} Clean ingredient.
	 */
	#checkIngredient(ing, label, errors) {
		if (!isPlainObject(ing)) {
			errors.push(`${label}: must be an object.`);
			return null;
		}
		const named = isNonEmptyString(ing.name) ? `${label} "${ing.name}"` : label;
		if (!isNonEmptyString(ing.name)) {
			errors.push(`${label}: "name" must be non-empty text.`);
		}
		if (typeof ing.grams !== 'number' || !Number.isFinite(ing.grams) || ing.grams <= 0) {
			errors.push(`${named}: "grams" must be a number above 0.`);
		}
		const note = this.#checkNotes(ing.note, `${named}: "note"`, errors);
		return { name: ing.name, grams: ing.grams, note };
	}

	/**
	 * Checks an optional note field and normalises it to a list of strings.
	 * @param {*} value A string, a list of strings, or undefined.
	 * @param {string} label Prefix naming the recipe and field.
	 * @param {string[]} errors Collected problems.
	 * @returns {string[]}
	 */
	#checkNotes(value, label, errors) {
		if (value === undefined) {
			return [];
		}
		if (typeof value === 'string') {
			return value.trim() === '' ? [] : [value];
		}
		if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
			return value.filter((v) => v.trim() !== '');
		}
		errors.push(`${label} must be text or a list of text.`);
		return [];
	}

	/**
	 * @param {string[]} errors Problems found.
	 * @returns {{ok: boolean, errors: string[], data: null}}
	 */
	#fail(errors) {
		return { ok: false, errors, data: null };
	}
}
