/**
 * cook-session.js
 * Step state for cook mode. Progress is one number: every step before the
 * current one is done. Pure logic: no DOM, no storage.
 */

/**
 * Walks through a recipe's ingredients one at a time.
 */
export class CookSession {
	#stepCount;
	#current = 0;

	/**
	 * @param {number} stepCount Number of ingredients in the recipe.
	 * @param {number} [current=0] Saved step to resume at.
	 */
	constructor(stepCount, current = 0) {
		this.#stepCount = stepCount;
		if (Number.isInteger(current) && current >= 0 && current <= stepCount) {
			this.#current = current;
		}
	}

	/**
	 * Index of the step being poured. Equals stepCount once complete.
	 * @returns {number}
	 */
	get current() {
		return this.#current;
	}

	/**
	 * Total number of steps.
	 * @returns {number}
	 */
	get stepCount() {
		return this.#stepCount;
	}

	/**
	 * Index of the step after the current one, or -1 if there is none.
	 * @returns {number}
	 */
	get next() {
		const next = this.#current + 1;
		return next < this.#stepCount ? next : -1;
	}

	/**
	 * Whether every step has been poured.
	 * @returns {boolean}
	 */
	get isComplete() {
		return this.#current >= this.#stepCount;
	}

	/**
	 * Whether any step has been poured, so reset needs a confirm.
	 * @returns {boolean}
	 */
	get hasProgress() {
		return this.#current > 0;
	}

	/**
	 * Whether a step has been poured.
	 * @param {number} index Step index.
	 * @returns {boolean}
	 */
	isDone(index) {
		return index < this.#current;
	}

	/**
	 * Marks the current step poured and moves to the next.
	 * @returns {number} The new current step.
	 */
	pour() {
		if (!this.isComplete) {
			this.#current += 1;
		}
		return this.#current;
	}

	/**
	 * Goes back one step, so it can be poured again.
	 * @returns {number} The new current step.
	 */
	back() {
		if (this.#current > 0) {
			this.#current -= 1;
		}
		return this.#current;
	}

	/**
	 * Jumps straight to a step. Steps before it count as done.
	 * @param {number} index Step index.
	 * @returns {number} The new current step.
	 */
	jump(index) {
		if (Number.isInteger(index) && index >= 0 && index < this.#stepCount) {
			this.#current = index;
		}
		return this.#current;
	}

	/**
	 * Clears all progress.
	 * @returns {void}
	 */
	reset() {
		this.#current = 0;
	}
}
