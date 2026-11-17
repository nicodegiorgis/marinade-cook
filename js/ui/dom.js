/**
 * dom.js
 * Safe element helpers. All text goes in through textContent, so imported
 * data can never be parsed as HTML.
 */

/**
 * Builds DOM nodes without HTML strings.
 */
export class Dom {
	/**
	 * Creates an element.
	 * @param {string} tag Tag name.
	 * @param {Object<string, *>} [props] className, text, attrs, on (event map),
	 *   or any other property set directly (type, value, disabled...).
	 * @param {Array<Node|string|null>} [children] Child nodes; strings become text.
	 * @returns {HTMLElement}
	 */
	static el(tag, props = {}, children = []) {
		const node = document.createElement(tag);
		for (const [key, value] of Object.entries(props)) {
			if (value === undefined || value === null) {
				continue;
			}
			if (key === 'className') {
				node.className = value;
			} else if (key === 'text') {
				node.textContent = String(value);
			} else if (key === 'attrs') {
				for (const [name, attr] of Object.entries(value)) {
					node.setAttribute(name, String(attr));
				}
			} else if (key === 'on') {
				for (const [type, handler] of Object.entries(value)) {
					node.addEventListener(type, handler);
				}
			} else {
				node[key] = value;
			}
		}
		Dom.append(node, children);
		return node;
	}

	/**
	 * Appends children, turning strings into text nodes and skipping nulls.
	 * @param {Node} parent Parent node.
	 * @param {Array<Node|string|null>} children Children.
	 * @returns {Node} The parent.
	 */
	static append(parent, children) {
		for (const child of children) {
			if (child === null || child === undefined || child === false) {
				continue;
			}
			parent.append(typeof child === 'string' ? document.createTextNode(child) : child);
		}
		return parent;
	}

	/**
	 * Sets an element's text safely.
	 * @param {Node} node Target.
	 * @param {*} value Text.
	 * @returns {Node}
	 */
	static text(node, value) {
		node.textContent = String(value);
		return node;
	}

	/**
	 * Removes every child.
	 * @param {Node} node Target.
	 * @returns {Node}
	 */
	static clear(node) {
		node.replaceChildren();
		return node;
	}

	/**
	 * Builds an inline SVG icon from a path, so icons need no file or network.
	 * @param {string} pathData SVG path "d" attribute (app constant, never data).
	 * @returns {SVGElement}
	 */
	static icon(pathData) {
		const ns = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(ns, 'svg');
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('class', 'icon');
		const path = document.createElementNS(ns, 'path');
		path.setAttribute('d', pathData);
		svg.append(path);
		return svg;
	}
}

/** Shorthand for Dom.el. */
export const el = Dom.el;
/** Shorthand for Dom.text. */
export const text = Dom.text;
/** Shorthand for Dom.clear. */
export const clear = Dom.clear;
