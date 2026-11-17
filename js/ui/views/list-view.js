/**
 * list-view.js
 * The recipe list: search, A to Z cards, and the settings panel.
 */

import { el, clear, Dom } from '../dom.js';
import { ICONS } from '../icons.js';
import { FilePicker } from '../file-picker.js';

/**
 * Scrollable recipe list with live search.
 */
export class ListView {
	#container;
	#deps;
	#grid = null;
	#query = '';

	/**
	 * @param {HTMLElement} container Where to render.
	 * @param {object} deps Dependencies.
	 * @param {import('../../data/recipe-store.js').RecipeStore} deps.recipeStore Recipe store.
	 * @param {import('../router.js').Router} deps.router Router.
	 * @param {number} deps.appVersion Version shown in settings.
	 * @param {import('../../data/theme-store.js').ThemeStore} deps.themeStore Saved theme choice.
	 * @param {import('../theme.js').Theme} deps.theme Applies a theme choice.
	 * @param {function(): void} deps.onImported Called after a new file is imported.
	 */
	constructor(container, deps) {
		this.#container = container;
		this.#deps = deps;
	}

	/**
	 * Draws the list.
	 * @returns {void}
	 */
	render() {
		const search = el('input', {
			type: 'search',
			id: 'recipe-search',
			className: 'input search__input',
			placeholder: 'Search',
			autocomplete: 'off',
			attrs: { autocapitalize: 'none', enterkeyhint: 'search', spellcheck: 'false' },
			on: {
				input: (event) => {
					this.#query = event.target.value;
					this.#renderGrid();
				},
			},
		});
		const settings = this.#buildSettings();
		this.#grid = el('ul', { className: 'recipe-grid' });

		clear(this.#container);
		this.#container.append(
			el('header', { className: 'app-header' }, [
				el('h1', { className: 'app-header__title', text: 'Marinades' }),
				el('div', { className: 'search' }, [
					el('label', { className: 'visually-hidden', htmlFor: 'recipe-search', text: 'Search recipes' }),
					search,
				]),
				el('button', {
					type: 'button',
					className: 'icon-button',
					attrs: { 'aria-label': 'Settings' },
					on: { click: () => settings.showModal() },
				}, [Dom.icon(ICONS.menu)]),
			]),
			el('main', { className: 'list-view' }, [this.#grid]),
			settings,
		);
		this.#renderGrid();
	}

	/**
	 * Nothing to release.
	 * @returns {void}
	 */
	destroy() {}

	/**
	 * Redraws only the cards, so the search box keeps focus while typing.
	 * @returns {void}
	 */
	#renderGrid() {
		const query = this.#query.trim().toLowerCase();
		const recipes = this.#deps.recipeStore.recipes()
			.filter((r) => r.name.toLowerCase().includes(query));
		clear(this.#grid);
		if (recipes.length === 0) {
			this.#grid.append(el('li', { className: 'recipe-grid__empty', text: 'No recipes match.' }));
			return;
		}
		for (const recipe of recipes) {
			this.#grid.append(el('li', {}, [
				el('button', {
					type: 'button',
					className: 'recipe-card',
					on: { click: () => this.#deps.router.toRecipe(recipe.id) },
				}, [
					el('span', { className: 'recipe-card__name', text: recipe.name }),
					el('span', { className: 'recipe-card__yield', text: `${recipe.yieldUnits} units` }),
				]),
			]));
		}
	}

	/**
	 * Builds the Auto / Light / Dark choice. Applies and saves on tap.
	 * @returns {HTMLFieldSetElement}
	 */
	#buildThemePicker() {
		const current = this.#deps.themeStore.get();
		const options = [
			{ mode: 'auto', label: 'Auto' },
			{ mode: 'light', label: 'Light' },
			{ mode: 'dark', label: 'Dark' },
		];
		return el('fieldset', { className: 'theme-picker' }, [
			el('legend', { className: 'theme-picker__legend', text: 'Theme' }),
			el('div', { className: 'theme-picker__options' }, options.map((o) => {
				const id = `theme-${o.mode}`;
				return el('div', { className: 'theme-picker__option' }, [
					el('input', {
						type: 'radio',
						name: 'theme',
						id,
						value: o.mode,
						className: 'theme-picker__input',
						checked: o.mode === current,
						on: {
							change: () => {
								this.#deps.themeStore.set(o.mode);
								this.#deps.theme.apply(o.mode);
							},
						},
					}),
					el('label', { className: 'theme-picker__label', htmlFor: id, text: o.label }),
				]);
			})),
			el('p', { className: 'theme-picker__hint', text: 'Auto follows the iPad’s light or dark setting.' }),
		]);
	}

	/**
	 * Builds the settings dialog. Importing a new file needs a confirm step.
	 * @returns {HTMLDialogElement}
	 */
	#buildSettings() {
		const store = this.#deps.recipeStore;
		const count = store.recipes().length;
		const date = store.importedAt();
		const dateText = date === null ? 'Unknown' : date.toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short',
		});

		const picker = new FilePicker({
			recipeStore: store,
			onImported: () => {
				dialog.close();
				this.#deps.onImported();
			},
			label: 'Choose file',
		});
		const confirmBox = el('div', { className: 'settings__confirm', hidden: true }, [
			el('p', { text: `This replaces all ${count} recipes and clears batch progress.` }),
			picker.element,
			el('button', {
				type: 'button',
				className: 'button button--secondary',
				text: 'Cancel',
				on: { click: () => toggleConfirm(false) },
			}),
		]);
		const startButton = el('button', {
			type: 'button',
			className: 'button button--secondary',
			text: 'Import new file',
			on: { click: () => toggleConfirm(true) },
		});
		const toggleConfirm = (show) => {
			confirmBox.hidden = !show;
			startButton.hidden = show;
		};

		const dialog = el('dialog', {
			className: 'settings',
			attrs: { 'aria-labelledby': 'settings-title' },
			on: { close: () => toggleConfirm(false) },
		}, [
			el('div', { className: 'settings__head' }, [
				el('h2', { id: 'settings-title', className: 'settings__title', text: 'Settings' }),
				el('button', {
					type: 'button',
					className: 'icon-button',
					attrs: { 'aria-label': 'Close settings' },
					on: { click: () => dialog.close() },
				}, [Dom.icon(ICONS.close)]),
			]),
			el('dl', { className: 'settings__facts' }, [
				el('dt', { text: 'Recipes' }), el('dd', { text: String(count) }),
				el('dt', { text: 'Imported' }), el('dd', { text: dateText }),
				el('dt', { text: 'App version' }), el('dd', { text: `v${this.#deps.appVersion}` }),
			]),
			this.#buildThemePicker(),
			startButton,
			confirmBox,
			el('p', {
				className: 'settings__note',
				text: 'Recipes are stored only on this iPad. Deleting the app from the Home Screen '
					+ 'erases them, so keep recipes.json somewhere safe.',
			}),
		]);
		return dialog;
	}
}
