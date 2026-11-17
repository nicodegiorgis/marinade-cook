/**
 * recipe-view.js
 * The split-view recipe page: live scaling list on one side, step-by-step
 * cook mode on the other. All maths lives in Scaler and CookSession.
 */

import { el, clear, text, Dom } from '../dom.js';
import { ICONS } from '../icons.js';
import { Scaler, gramsValue } from '../../core/scaler.js';
import { CookSession } from '../../core/cook-session.js';

/**
 * One recipe page. Rebuilds nothing on input: it updates the existing boxes
 * so the box being typed in keeps focus and its exact text.
 */
export class RecipeView {
	#container;
	#recipe;
	#deps;
	#scaler;
	#session;
	#unitsInput = null;
	#rows = [];
	#cook = {};
	#wakeBadge = null;

	/**
	 * @param {HTMLElement} container Where to render.
	 * @param {object} deps Dependencies.
	 * @param {object} deps.recipe Validated recipe.
	 * @param {import('../../data/progress-store.js').ProgressStore} deps.progressStore Progress.
	 * @param {import('../router.js').Router} deps.router Router.
	 * @param {import('../../platform/wake-lock.js').WakeLock} deps.wakeLock Screen wake lock.
	 */
	constructor(container, deps) {
		this.#container = container;
		this.#recipe = deps.recipe;
		this.#deps = deps;
		const saved = deps.progressStore.get(deps.recipe.id);
		this.#scaler = new Scaler(deps.recipe, saved);
		this.#session = new CookSession(deps.recipe.ingredients.length, saved.step);
	}

	/**
	 * Draws the page and asks for the screen to stay on.
	 * @returns {void}
	 */
	render() {
		this.#wakeBadge = el('span', { className: 'wake-badge', text: 'Screen stays on', hidden: true });
		clear(this.#container);
		this.#container.append(
			el('header', { className: 'app-header' }, [
				el('button', {
					type: 'button',
					className: 'icon-button',
					attrs: { 'aria-label': 'Back to recipes' },
					on: { click: () => this.#deps.router.toList() },
				}, [Dom.icon(ICONS.back)]),
				el('h1', { className: 'app-header__title app-header__title--recipe', text: this.#recipe.name }),
				this.#wakeBadge,
				el('button', {
					type: 'button',
					className: 'button button--secondary button--small',
					text: 'Reset batch',
					on: { click: () => this.#reset() },
				}),
			]),
			el('main', { className: 'recipe-layout' }, [
				this.#buildScalePanel(),
				this.#buildCookPanel(),
			]),
		);
		this.#refresh();
		this.#deps.wakeLock.setListener((active) => {
			if (this.#wakeBadge !== null) {
				this.#wakeBadge.hidden = !active;
			}
		});
		this.#deps.wakeLock.enable();
	}

	/**
	 * Releases the wake lock when leaving the page.
	 * @returns {void}
	 */
	destroy() {
		this.#deps.wakeLock.setListener(() => {});
		this.#deps.wakeLock.disable();
		this.#wakeBadge = null;
	}

	/**
	 * @returns {HTMLElement}
	 */
	#buildScalePanel() {
		this.#unitsInput = this.#amountInput('units-input', {
			input: (e) => {
				if (this.#scaler.setUnits(e.target.value)) {
					this.#changed();
				}
			},
			blur: () => this.#refresh(),
		});
		const unitsRow = el('div', { className: 'scale-units' }, [
			el('label', { className: 'scale-units__label', htmlFor: 'units-input' }, [
				el('span', { className: 'scale-units__word', text: 'Units' }),
				el('span', { className: 'scale-units__base', text: `${this.#recipe.yieldUnits} →` }),
			]),
			this.#unitsInput,
		]);

		this.#rows = this.#recipe.ingredients.map((ing, i) => this.#buildRow(ing, i));
		const notes = this.#recipe.notes.length === 0 ? null : el('section', {
			className: 'scale-notes',
			attrs: { 'aria-label': 'Recipe notes' },
		}, [
			el('h2', { className: 'scale-notes__title', text: 'Notes' }),
			el('ul', {}, this.#recipe.notes.map((n) => el('li', { text: n }))),
		]);

		return el('section', { className: 'scale-panel', attrs: { 'aria-label': 'Amounts' } }, [
			unitsRow,
			el('ol', { className: 'scale-list' }, this.#rows.map((r) => r.root)),
			notes,
		]);
	}

	/**
	 * @param {{name: string, note: string[]}} ing Ingredient.
	 * @param {number} i Position.
	 * @returns {{root: HTMLElement, input: HTMLInputElement}}
	 */
	#buildRow(ing, i) {
		const id = `amount-${i}`;
		const unit = el('span', { className: 'scale-row__unit', text: 'g' });
		const input = this.#amountInput(id, {
			input: (e) => {
				if (this.#scaler.setIngredientAmount(i, e.target.value)) {
					this.#changed();
				}
			},
			blur: () => this.#refresh(),
		});
		const jump = el('button', {
			type: 'button',
			className: 'scale-row__name',
			attrs: { 'aria-label': `Go to step ${i + 1}: ${ing.name}` },
			on: { click: () => this.#jump(i) },
		}, [
			el('span', { className: 'scale-row__step', text: String(i + 1) }),
			el('span', { className: 'scale-row__text' }, [
				el('span', { className: 'scale-row__label', text: ing.name }),
				...ing.note.map((n) => el('span', { className: 'scale-row__note', text: n })),
			]),
		]);
		const root = el('li', { className: 'scale-row' }, [
			jump,
			el('label', { className: 'visually-hidden', htmlFor: id, text: `${ing.name} amount` }),
			el('div', { className: 'scale-row__amount' }, [input, unit]),
		]);
		return { root, input };
	}

	/**
	 * @param {string} id Element id.
	 * @param {Object<string, function>} on Event handlers.
	 * @returns {HTMLInputElement}
	 */
	#amountInput(id, on) {
		const input = el('input', {
			type: 'text',
			id,
			className: 'input amount-input',
			autocomplete: 'off',
			attrs: { inputmode: 'decimal', enterkeyhint: 'done', spellcheck: 'false' },
			on: {
				keydown: (e) => {
					if (e.key === 'Enter') {
						input.blur();
					}
				},
				...on,
			},
		});
		if (on.focus === undefined) {
			input.addEventListener('focus', () => this.#selectAll(input));
		}
		return input;
	}

	/**
	 * @returns {HTMLElement}
	 */
	#buildCookPanel() {
		const c = this.#cook;
		c.step = el('p', { className: 'cook-panel__step' });
		c.progress = el('progress', { className: 'cook-panel__progress', max: 1, value: 0 });
		c.name = el('h2', { className: 'cook-panel__name' });
		c.amount = el('p', { className: 'cook-panel__amount', attrs: { 'aria-live': 'polite' } });
		c.note = el('p', { className: 'cook-panel__note' });
		c.next = el('p', { className: 'cook-panel__next' });
		c.back = el('button', {
			type: 'button',
			className: 'button button--secondary cook-panel__back',
			attrs: { 'aria-label': 'Back one step' },
			text: '← Back',
			on: { click: () => this.#step(() => this.#session.back()) },
		});
		c.pour = el('button', {
			type: 'button',
			className: 'button button--main cook-panel__pour',
			text: 'Poured →',
			on: { click: () => this.#step(() => this.#session.pour()) },
		});
		c.active = el('div', { className: 'cook-panel__active' }, [
			el('div', { className: 'cook-panel__meta' }, [c.step, c.progress]),
			// Name, amount and Next sit together just above the buttons, so the eye travels less.
			el('div', { className: 'cook-panel__current' }, [c.name, c.amount, c.note, c.next]),
			el('div', { className: 'cook-panel__actions' }, [c.back, c.pour]),
		]);
		c.made = el('p', { className: 'cook-panel__made' });
		c.done = el('div', { className: 'cook-panel__done', hidden: true }, [
			el('h2', { className: 'cook-panel__done-title', text: 'Batch complete' }),
			c.made,
			el('div', { className: 'cook-panel__actions' }, [
				el('button', {
					type: 'button',
					className: 'button button--secondary cook-panel__back',
					text: '← Back',
					on: { click: () => this.#step(() => this.#session.back()) },
				}),
				el('button', {
					type: 'button',
					className: 'button button--main cook-panel__pour',
					text: 'Reset batch',
					on: { click: () => this.#reset() },
				}),
			]),
		]);
		return el('section', { className: 'cook-panel', attrs: { 'aria-label': 'Cook mode' } }, [
			c.active,
			c.done,
		]);
	}

	/**
	 * Saves and redraws after the factor changed from typing.
	 * @returns {void}
	 */
	#changed() {
		this.#save();
		this.#refresh();
	}

	/**
	 * Runs a cook-mode move, then saves and redraws.
	 * @param {function(): void} move Session change.
	 * @returns {void}
	 */
	#step(move) {
		move();
		this.#save();
		this.#refresh();
	}

	/**
	 * @param {number} index Step to jump to.
	 * @returns {void}
	 */
	#jump(index) {
		this.#step(() => this.#session.jump(index));
		this.#cook.pour.focus({ preventScroll: true });
	}

	/**
	 * Clears progress and amounts. Confirms only when something was poured.
	 * @returns {void}
	 */
	#reset() {
		if (this.#session.hasProgress) {
			const ok = window.confirm('Reset this batch? Progress is cleared and amounts go back to the base yield.');
			if (!ok) {
				return;
			}
		}
		if (document.activeElement instanceof HTMLInputElement) {
			document.activeElement.blur();
		}
		this.#scaler.reset();
		this.#session.reset();
		this.#save();
		this.#refresh();
	}

	/**
	 * @returns {void}
	 */
	#save() {
		this.#deps.progressStore.set(this.#recipe.id, {
			...this.#scaler.toJSON(),
			step: this.#session.current,
		});
	}

	/**
	 * Updates every box and the cook panel from state. The focused box is left
	 * alone so the user's typing is never overwritten.
	 * @returns {void}
	 */
	#refresh() {
		const focused = document.activeElement;
		if (this.#unitsInput !== focused) {
			this.#unitsInput.value = this.#unitsText();
		}
		this.#rows.forEach((row, i) => {
			if (row.input !== focused) {
				row.input.value = gramsValue(this.#scaler.grams(i));
			}
			row.root.classList.toggle('scale-row--done', this.#session.isDone(i));
			row.root.classList.toggle('scale-row--current', this.#session.current === i);
		});
		this.#refreshCook();
	}

	/**
	 * Units box text: the typed value when units are the anchor, otherwise whole units.
	 * @returns {string}
	 */
	#unitsText() {
		if (this.#scaler.isAnchor('units')) {
			return String(Number((this.#recipe.yieldUnits * this.#scaler.factor).toFixed(2)));
		}
		return String(this.#scaler.units());
	}

	/**
	 * @returns {void}
	 */
	#refreshCook() {
		const c = this.#cook;
		const s = this.#session;
		const total = s.stepCount;
		c.active.hidden = s.isComplete;
		c.done.hidden = !s.isComplete;
		c.progress.value = s.current / total;
		if (s.isComplete) {
			const units = this.#scaler.units();
			text(c.made, `${units} ${units === 1 ? 'unit' : 'units'} made`);
			return;
		}
		const ing = this.#recipe.ingredients[s.current];
		text(c.step, `Step ${s.current + 1} of ${total}`);
		text(c.name, ing.name);
		text(c.amount, this.#scaler.format(s.current));
		text(c.note, ing.note.join(' · '));
		c.note.hidden = ing.note.length === 0;
		c.back.disabled = s.current === 0;
		if (s.next === -1) {
			text(c.next, 'Last ingredient');
		} else {
			const nextIng = this.#recipe.ingredients[s.next];
			text(c.next, `Next: ${nextIng.name} ${this.#scaler.format(s.next)}`);
		}
	}

	/**
	 * Selects the whole box so a new number replaces the old one.
	 * @param {HTMLInputElement} input Box.
	 * @returns {void}
	 */
	#selectAll(input) {
		// iOS ignores select() during focus, so wait one tick.
		window.setTimeout(() => {
			try {
				input.setSelectionRange(0, input.value.length);
			} catch {
				// Some input types do not support selection ranges.
			}
		}, 0);
	}
}
