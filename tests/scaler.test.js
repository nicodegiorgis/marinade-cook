/**
 * scaler.test.js
 * Unit tests for Scaler and its rounding, parsing and formatting helpers.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scaler, roundUpGrams, formatGrams, parseAmount } from '../js/core/scaler.js';

const recipe = {
	id: 'test-marinade-a',
	name: 'Test Marinade A',
	yieldUnits: 100,
	ingredients: [
		{ name: 'Oil', grams: 5000 },
		{ name: 'Sugar', grams: 1500 },
		{ name: 'Salt', grams: 180 },
		{ name: 'Star seasoning', grams: 18 },
	],
};

test('starts at the base yield', () => {
	const s = new Scaler(recipe);
	assert.equal(s.factor, 1);
	assert.equal(s.units(), 100);
	assert.equal(s.grams(0), 5000);
	assert.equal(s.format(0), '5000 g');
	assert.equal(s.format(1), '1500 g');
	assert.equal(s.isBase, true);
});

const oddRecipe = {
	id: 'test-marinade-odd',
	name: 'Test Marinade Odd',
	yieldUnits: 50,
	ingredients: [
		{ name: 'Oil', grams: 3870 },
		{ name: 'Sugar', grams: 2260 },
		{ name: 'Salt', grams: 34 },
		{ name: 'Chilli', grams: 8.5 },
		{ name: 'Pepper', grams: 199.25 },
	],
};

test('base amounts equal the source values exactly, with no rounding', () => {
	const s = new Scaler(oddRecipe);
	assert.equal(s.isBase, true);
	assert.deepEqual(oddRecipe.ingredients.map((_, i) => s.grams(i)), [3870, 2260, 34, 8.5, 199.25]);
	assert.deepEqual(
		oddRecipe.ingredients.map((_, i) => s.format(i)),
		['3870 g', '2260 g', '34 g', '8.5 g', '199.25 g'],
	);
});

test('base amounts come back exactly after reset', () => {
	const s = new Scaler(oddRecipe);
	s.setUnits('75');
	s.reset();
	assert.deepEqual(oddRecipe.ingredients.map((_, i) => s.grams(i)), [3870, 2260, 34, 8.5, 199.25]);
});

test('rounding applies once a value is typed, even at the base yield', () => {
	const s = new Scaler(oddRecipe);
	s.setUnits('50');
	assert.equal(s.factor, 1);
	// 3870 rounds up to the 50 g step, 34 to 5 g, 8.5 to 1 g.
	assert.deepEqual(oddRecipe.ingredients.map((_, i) => s.grams(i)), [3900, 2300, 35, 9, 200]);
	s.setIngredientAmount(2, '34');
	assert.equal(s.grams(2), 34);
	assert.equal(s.grams(0), 3900);
});

test('typing units leaves the base state, even when it equals the base yield', () => {
	const s = new Scaler(recipe);
	s.setUnits('100');
	assert.equal(s.isBase, false);
	assert.equal(s.isAnchor('units'), true);
	assert.equal(s.factor, 1);
});

test('typing an ingredient amount leaves the base state', () => {
	const s = new Scaler(recipe);
	s.setIngredientAmount(0, '2500');
	assert.equal(s.isBase, false);
	assert.equal(s.units(), 50);
});

test('scales by units', () => {
	const s = new Scaler(recipe);
	assert.equal(s.setUnits('50'), true);
	assert.equal(s.factor, 0.5);
	assert.equal(s.units(), 50);
	assert.equal(s.grams(0), 2500);
	assert.equal(s.grams(1), 750);
	assert.equal(s.grams(2), 90);
	assert.equal(s.grams(3), 9);
	assert.equal(s.isAnchor('units'), true);
});

test('scales by an anchor ingredient and the anchor keeps its exact value', () => {
	const s = new Scaler(recipe);
	assert.equal(s.setIngredientAmount(0, '1234'), true);
	assert.equal(s.isAnchor('ingredient', 0), true);
	assert.equal(s.grams(0), 1234);
	assert.equal(s.format(0), '1234 g');
	// 1500 * 0.2468 = 370.2, rounded up to the next 10 g
	assert.equal(s.grams(1), 380);
});

test('anchor keeps a typed decimal', () => {
	const s = new Scaler(recipe);
	s.setIngredientAmount(3, '8,5');
	assert.equal(s.format(3), '8.5 g');
});

test('ingredient boxes take grams only', () => {
	const s = new Scaler(recipe);
	assert.equal(s.setIngredientAmount(1, '750 g'), true);
	assert.equal(s.factor, 0.5);
	assert.equal(s.setIngredientAmount(1, '0,75 kg'), false);
	assert.equal(s.factor, 0.5);
});

test('float noise does not push a value up a step', () => {
	const s = new Scaler(recipe);
	s.setIngredientAmount(0, '1200');
	// 1500 * 0.24 is 360 exactly; float maths gives 359.99999...
	assert.equal(s.grams(1), 360);
	assert.equal(s.units(), 24);
});

test('units are rounded down', () => {
	const s = new Scaler(recipe);
	s.setIngredientAmount(0, '1290');
	assert.equal(s.units(), 25);
	s.setUnits('33.9');
	assert.equal(s.units(), 33);
});

test('rounding band edges', () => {
	assert.equal(roundUpGrams(19), 19);
	assert.equal(roundUpGrams(20), 20);
	assert.equal(roundUpGrams(199), 200);
	assert.equal(roundUpGrams(200), 200);
	assert.equal(roundUpGrams(1999), 2000);
	assert.equal(roundUpGrams(2000), 2000);
});

test('rounding always goes up', () => {
	assert.equal(roundUpGrams(0.2), 1);
	assert.equal(roundUpGrams(18.01), 19);
	assert.equal(roundUpGrams(19.5), 20);
	assert.equal(roundUpGrams(21), 25);
	assert.equal(roundUpGrams(201), 210);
	assert.equal(roundUpGrams(2001), 2050);
	assert.equal(roundUpGrams(5001), 5050);
});

test('grams formatting: whole numbers, no thousands separator, no kg', () => {
	assert.equal(formatGrams(18), '18 g');
	assert.equal(formatGrams(999), '999 g');
	assert.equal(formatGrams(1000), '1000 g');
	assert.equal(formatGrams(1250), '1250 g');
	assert.equal(formatGrams(5000), '5000 g');
	assert.equal(formatGrams(125000), '125000 g');
});

test('grams formatting keeps a real decimal only', () => {
	assert.equal(formatGrams(8.5), '8.5 g');
	assert.equal(formatGrams(12.25), '12.25 g');
	assert.equal(formatGrams(360.00000001), '360 g');
});

test('every output is grams: no kg, ml or L', () => {
	const s = new Scaler(recipe);
	for (const units of ['1', '37', '100', '999']) {
		s.setUnits(units);
		recipe.ingredients.forEach((_, i) => {
			assert.match(s.format(i), /^\d+(\.\d+)? g$/);
		});
	}
});

test('comma decimal input', () => {
	assert.deepEqual(parseAmount('1,5'), { value: 1.5, unit: null });
	assert.deepEqual(parseAmount(' 2,25 g '), { value: 2.25, unit: 'g' });
	assert.equal(parseAmount('2,25 kg'), null);
	const s = new Scaler(recipe);
	s.setUnits('12,5');
	assert.equal(s.factor, 0.125);
});

test('ignores zero, empty and invalid input and keeps the last factor', () => {
	const s = new Scaler(recipe);
	s.setUnits('40');
	for (const bad of ['', '   ', '0', '0,0', 'abc', '-5', '1..2']) {
		assert.equal(s.setUnits(bad), false, `units "${bad}"`);
		assert.equal(s.setIngredientAmount(0, bad), false, `amount "${bad}"`);
	}
	assert.equal(s.factor, 0.4);
	assert.equal(parseAmount(''), null);
	assert.equal(parseAmount('0'), null);
});

test('units box does not accept a weight', () => {
	const s = new Scaler(recipe);
	assert.equal(s.setUnits('5 g'), false);
	assert.equal(s.factor, 1);
});

test('reset puts the factor back to the base yield', () => {
	const s = new Scaler(recipe);
	s.setIngredientAmount(2, '45');
	s.reset();
	assert.equal(s.factor, 1);
	assert.equal(s.isBase, true);
	assert.equal(s.isAnchor('units'), false);
});

test('restores saved state and ignores a bad anchor', () => {
	const saved = new Scaler(recipe);
	saved.setIngredientAmount(3, '9');
	const restored = new Scaler(recipe, saved.toJSON());
	assert.equal(restored.factor, 0.5);
	assert.equal(restored.isAnchor('ingredient', 3), true);

	const base = new Scaler(recipe, new Scaler(recipe).toJSON());
	assert.equal(base.isBase, true);

	const bad = new Scaler(recipe, { factor: -2, anchor: { kind: 'ingredient', index: 99 } });
	assert.equal(bad.factor, 1);
	assert.equal(bad.isBase, true);
});

test('ignores a value so big that an amount would overflow, and keeps the last factor', () => {
	const huge = `1${'0'.repeat(307)}`;
	const s = new Scaler(recipe);
	assert.equal(s.setUnits('200'), true);
	assert.equal(s.setUnits(huge), false);
	assert.equal(s.setIngredientAmount(3, huge), false);
	assert.equal(s.factor, 2);
	assert.equal(s.format(0), '10000 g');

	const restored = new Scaler(recipe, { factor: 1e306, anchor: { kind: 'units', index: -1 } });
	assert.equal(restored.factor, 1);
	assert.doesNotThrow(() => restored.format(0));
});

test('rounding never throws on a non-finite amount', () => {
	assert.doesNotThrow(() => roundUpGrams(Infinity));
	assert.doesNotThrow(() => roundUpGrams(Number.NaN));
});
