/**
 * main.js
 * Entry point: builds the stores and platform wrappers, then shows the right
 * view for the current route.
 */

import { APP_VERSION } from './app-version.js';
import { RecipeStore } from './data/recipe-store.js';
import { ProgressStore } from './data/progress-store.js';
import { Router } from './ui/router.js';
import { el } from './ui/dom.js';
import { ImportView } from './ui/views/import-view.js';
import { ListView } from './ui/views/list-view.js';
import { RecipeView } from './ui/views/recipe-view.js';
import { WakeLock } from './platform/wake-lock.js';
import { SwRegister } from './platform/sw-register.js';
import { DisplayMode } from './platform/display-mode.js';

/**
 * Wires everything together and swaps views on route changes.
 */
class App {
	#root;
	#recipeStore;
	#progressStore;
	#router;
	#wakeLock;
	#view = null;

	/**
	 * @param {HTMLElement} root Element the views render into.
	 * @param {Storage} storage Local storage.
	 */
	constructor(root, storage) {
		this.#root = root;
		this.#recipeStore = new RecipeStore(storage);
		this.#progressStore = new ProgressStore(storage);
		this.#wakeLock = new WakeLock();
		this.#router = new Router((route) => this.#show(route));
	}

	/**
	 * Starts routing, offline support and the update prompt.
	 * @returns {void}
	 */
	start() {
		this.#router.start();
		const sw = new SwRegister((apply) => this.#showUpdateBanner(apply));
		sw.register();
		sw.persistStorage();
	}

	/**
	 * @param {{name: string, id?: string}} route Current route.
	 * @returns {void}
	 */
	#show(route) {
		if (this.#view !== null) {
			this.#view.destroy();
		}
		this.#view = this.#buildView(route);
		this.#view.render();
		window.scrollTo(0, 0);
	}

	/**
	 * @param {{name: string, id?: string}} route Current route.
	 * @returns {{render: function(): void, destroy: function(): void}}
	 */
	#buildView(route) {
		const onImported = () => {
			this.#progressStore.clear();
			this.#router.toList();
		};
		if (!this.#recipeStore.hasRecipes()) {
			return new ImportView(this.#root, {
				recipeStore: this.#recipeStore,
				onImported,
				showInstallHint: DisplayMode.isAppleTouchDevice() && !DisplayMode.isStandalone(),
			});
		}
		const recipe = route.name === 'recipe' ? this.#recipeStore.find(route.id) : null;
		if (recipe !== null) {
			return new RecipeView(this.#root, {
				recipe,
				progressStore: this.#progressStore,
				router: this.#router,
				wakeLock: this.#wakeLock,
			});
		}
		return new ListView(this.#root, {
			recipeStore: this.#recipeStore,
			router: this.#router,
			appVersion: APP_VERSION,
			onImported,
		});
	}

	/**
	 * @param {function(): void} apply Activates the waiting service worker.
	 * @returns {void}
	 */
	#showUpdateBanner(apply) {
		if (document.querySelector('.update-banner') !== null) {
			return;
		}
		document.body.append(el('button', {
			type: 'button',
			className: 'update-banner',
			text: 'Update available, tap to reload',
			on: { click: apply },
		}));
	}
}

/**
 * Returns localStorage, or an in-memory stand-in when it is blocked.
 * @returns {Storage}
 */
function getStorage() {
	try {
		const probe = 'marinade-cook:probe';
		window.localStorage.setItem(probe, '1');
		window.localStorage.removeItem(probe);
		return window.localStorage;
	} catch {
		const memory = new Map();
		return {
			getItem: (k) => (memory.has(k) ? memory.get(k) : null),
			setItem: (k, v) => memory.set(k, String(v)),
			removeItem: (k) => memory.delete(k),
		};
	}
}

new App(document.getElementById('app'), getStorage()).start();
