/**
 * scaler.js
 * Turns a recipe plus a target (units or one ingredient amount) into
 * rounded display amounts. Pure logic: no DOM, no storage.
 */

/** Tiny tolerance so float noise (1200.0000001) never pushes a value up a whole step. */
const EPSILON = 1e-9;

/** Rounding bands from docs/spec.md section 5, smallest first. */
const ROUNDING_BANDS = [
	{ below: 20, step: 1 },
	{ below: 200, step: 5 },
	{ below: 2000, step: 10 },
	{ below: Infinity, step: 50 },
];

/**
 * Rounds a gram amount up to the step of its band.
 * @param {number} grams Raw scaled amount in grams.
 * @returns {number} Rounded amount in grams.
 */
export function roundUpGrams(grams) {
	const band = ROUNDING_BANDS.find((b) => grams < b.below);
	const rounded = Math.ceil(grams / band.step - EPSILON) * band.step;
	return Math.max(rounded, band.step);
}

/**
 * The number part of a gram amount: a plain number with no thousands
 * separator, and decimals (up to 2) only when the value has them.
 * @param {number} grams Amount in grams.
 * @returns {string} For example "5000" or "8.5".
 */
export function gramsValue(grams) {
	return String(Number(grams.toFixed(2)));
}

/**
 * Formats a gram amount, for example "5000 g" or "8.5 g". The only amount
 * formatter in the app: always grams, never kg, ml or L.
 * @param {number} grams Amount in grams.
 * @returns {string} Display string.
 */
export function formatGrams(grams) {
	return `${gramsValue(grams)} g`;
}

/**
 * Parses what the user typed into an amount or units box. Accepts a comma as
 * the decimal separator and an optional "g" suffix.
 * @param {string} text Raw input text.
 * @returns {{value: number, unit: (string|null)}|null} Parsed value, or null if
 *   empty, zero, or not a number.
 */
export function parseAmount(text) {
	if (typeof text !== 'string') {
		return null;
	}
	const cleaned = text.trim().replace(',', '.').toLowerCase();
	const match = /^(\d+(?:\.\d*)?|\.\d+)\s*(g)?$/.exec(cleaned);
	if (match === null) {
		return null;
	}
	const value = Number(match[1]);
	if (!Number.isFinite(value) || value <= 0) {
		return null;
	}
	return { value, unit: match[2] === undefined ? null : match[2] };
}

/**
 * Holds the scale factor for one recipe and works out every display amount.
 * The anchor is whatever the user typed into last (units or one ingredient);
 * it keeps its exact value while everything else is rounded.
 */
export class Scaler {
	#recipe;
	#factor = 1;
	#anchor = { kind: 'base', index: -1 };

	/**
	 * @param {{yieldUnits: number, ingredients: Array<{grams: number}>}} recipe Validated recipe.
	 * @param {{factor?: number, anchor?: {kind: string, index: number}}} [state] Saved state.
	 */
	constructor(recipe, state = {}) {
		this.#recipe = recipe;
		if (Number.isFinite(state.factor) && state.factor > 0) {
			this.#factor = state.factor;
		}
		if (this.#isValidAnchor(state.anchor)) {
			this.#anchor = { kind: state.anchor.kind, index: state.anchor.index };
		}
	}

	/**
	 * The current scale factor (1 means the base yield).
	 * @returns {number}
	 */
	get factor() {
		return this.#factor;
	}

	/**
	 * The box the factor came from, so views can leave it alone.
	 * @returns {{kind: string, index: number}} kind is 'base', 'units' or 'ingredient'.
	 */
	get anchor() {
		return { ...this.#anchor };
	}

	/**
	 * Whether nothing has been typed yet (or the batch was reset), so the
	 * recipe is at its base amounts and the units box stays empty.
	 * @returns {boolean}
	 */
	get isBase() {
		return this.#anchor.kind === 'base';
	}

	/**
	 * Sets the factor from a typed number of units.
	 * @param {string} text What the user typed.
	 * @returns {boolean} True if the value was valid and applied.
	 */
	setUnits(text) {
		const parsed = parseAmount(text);
		if (parsed === null || parsed.unit !== null) {
			return false;
		}
		this.#factor = parsed.value / this.#recipe.yieldUnits;
		this.#anchor = { kind: 'units', index: -1 };
		return true;
	}

	/**
	 * Sets the factor from an ingredient the user has a limited amount of.
	 * @param {number} index Ingredient position in the recipe.
	 * @param {string} text What the user typed, in grams.
	 * @returns {boolean} True if the value was valid and applied.
	 */
	setIngredientAmount(index, text) {
		const ingredient = this.#recipe.ingredients[index];
		const parsed = parseAmount(text);
		if (ingredient === undefined || parsed === null) {
			return false;
		}
		this.#factor = parsed.value / ingredient.grams;
		this.#anchor = { kind: 'ingredient', index };
		return true;
	}

	/**
	 * Puts the factor back to the base yield.
	 * @returns {void}
	 */
	reset() {
		this.#factor = 1;
		this.#anchor = { kind: 'base', index: -1 };
	}

	/**
	 * Whole units this batch makes, rounded down.
	 * @returns {number}
	 */
	units() {
		return Math.floor(this.#recipe.yieldUnits * this.#factor + EPSILON);
	}

	/**
	 * The amount to pour for one ingredient. At base every amount is the exact
	 * value from the file; once something is typed, the anchor ingredient keeps
	 * its exact typed value and every other one is rounded up.
	 * @param {number} index Ingredient position in the recipe.
	 * @returns {number} Grams.
	 */
	grams(index) {
		const source = this.#recipe.ingredients[index].grams;
		// The file is the recipe as written; rounding is only for scaled batches.
		if (this.isBase) {
			return source;
		}
		const raw = source * this.#factor;
		if (this.isAnchor('ingredient', index)) {
			return raw;
		}
		return roundUpGrams(raw);
	}

	/**
	 * Formatted amount for one ingredient, for example "1500 g".
	 * @param {number} index Ingredient position in the recipe.
	 * @returns {string}
	 */
	format(index) {
		return formatGrams(this.grams(index));
	}

	/**
	 * Whether a box is the one the factor came from.
	 * @param {string} kind 'base', 'units' or 'ingredient'.
	 * @param {number} [index=-1] Ingredient position, for kind 'ingredient'.
	 * @returns {boolean}
	 */
	isAnchor(kind, index = -1) {
		return this.#anchor.kind === kind && this.#anchor.index === index;
	}

	/**
	 * Plain state to save, restored through the constructor.
	 * @returns {{factor: number, anchor: {kind: string, index: number}}}
	 */
	toJSON() {
		return { factor: this.#factor, anchor: this.anchor };
	}

	/**
	 * @param {*} anchor Candidate saved anchor.
	 * @returns {boolean}
	 */
	#isValidAnchor(anchor) {
		if (anchor === null || typeof anchor !== 'object') {
			return false;
		}
		if (anchor.kind === 'units' || anchor.kind === 'base') {
			return anchor.index === -1;
		}
		return anchor.kind === 'ingredient'
			&& Number.isInteger(anchor.index)
			&& anchor.index >= 0
			&& anchor.index < this.#recipe.ingredients.length;
	}
}
