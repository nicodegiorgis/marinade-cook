/**
 * recipe-validator.test.js
 * Unit tests for RecipeValidator against docs/spec.md section 6.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RecipeValidator } from '../js/core/recipe-validator.js';

const validator = new RecipeValidator();

/**
 * Builds a fresh valid file so each test can break one thing.
 * @returns {object}
 */
function validFile() {
	return {
		schemaVersion: 1,
		source: 'Test data',
		unit: 'g',
		batchBuckets: 2,
		recipes: [
			{
				id: 'test-marinade-a',
				name: 'Test Marinade A',
				yieldUnits: 100,
				ingredients: [
					{ name: 'Oil', grams: 5000 },
					{ name: 'Star seasoning', grams: 18.5, note: 'remove before storing' },
				],
				notes: ['Method: mix everything cold'],
			},
			{
				id: 'test-marinade-b',
				name: 'Test Marinade B',
				yieldUnits: 40,
				ingredients: [{ name: 'Vinegar', grams: 800 }],
			},
		],
	};
}

/**
 * Asserts the result failed with a message containing every fragment.
 * @param {object} result Validator result.
 * @param {...string} fragments Expected text.
 */
function assertError(result, ...fragments) {
	assert.equal(result.ok, false);
	assert.equal(result.data, null);
	const found = result.errors.some((e) => fragments.every((f) => e.includes(f)));
	assert.ok(found, `expected an error with ${fragments.join(' + ')}, got ${result.errors}`);
}

test('a valid file passes and is normalised', () => {
	const result = validator.validate(validFile());
	assert.equal(result.ok, true);
	assert.deepEqual(result.errors, []);
	assert.equal(result.data.recipes.length, 2);
	assert.deepEqual(result.data.recipes[0].ingredients[1].note, ['remove before storing']);
	assert.deepEqual(result.data.recipes[1].notes, []);
});

test('unknown fields are dropped', () => {
	const file = validFile();
	file.recipes[0].extra = '<img src=x>';
	const result = validator.validate(file);
	assert.equal('extra' in result.data.recipes[0], false);
});

test('invalid JSON text fails clearly', () => {
	assertError(validator.validateText('{ nope'), 'File', 'not valid JSON');
	assert.equal(validator.validateText(JSON.stringify(validFile())).ok, true);
});

test('not an object fails', () => {
	assertError(validator.validate([1, 2]), 'File', 'JSON object');
	assertError(validator.validate(null), 'File');
});

test('schemaVersion must be 1', () => {
	const file = validFile();
	file.schemaVersion = 2;
	assertError(validator.validate(file), 'File', 'schemaVersion');
});

test('recipes must be a non-empty list', () => {
	const file = validFile();
	file.recipes = [];
	assertError(validator.validate(file), 'File', 'recipes');
	delete file.recipes;
	assertError(validator.validate(file), 'File', 'recipes');
});

test('id must be non-empty', () => {
	const file = validFile();
	file.recipes[0].id = '  ';
	assertError(validator.validate(file), 'Test Marinade A', '"id"');
});

test('id must be unique', () => {
	const file = validFile();
	file.recipes[1].id = 'test-marinade-a';
	assertError(validator.validate(file), 'Test Marinade B', '"id"', 'another recipe');
});

test('name must be non-empty', () => {
	const file = validFile();
	file.recipes[1].name = '';
	assertError(validator.validate(file), 'Recipe #2', '"name"');
});

test('yieldUnits must be a whole number of at least 1', () => {
	for (const bad of [0, 2.5, '100', -1, undefined]) {
		const file = validFile();
		file.recipes[0].yieldUnits = bad;
		assertError(validator.validate(file), 'Test Marinade A', '"yieldUnits"');
	}
});

test('at least one ingredient', () => {
	const file = validFile();
	file.recipes[1].ingredients = [];
	assertError(validator.validate(file), 'Test Marinade B', '"ingredients"');
});

test('ingredient name must be non-empty', () => {
	const file = validFile();
	file.recipes[0].ingredients[0].name = '';
	assertError(validator.validate(file), 'Test Marinade A', 'ingredient 1', '"name"');
});

test('ingredient grams must be a number above 0', () => {
	for (const bad of [0, -5, '500', null, Infinity]) {
		const file = validFile();
		file.recipes[0].ingredients[0].grams = bad;
		assertError(validator.validate(file), 'Test Marinade A', 'ingredient 1 "Oil"', '"grams"');
	}
});

test('note and notes must be text or a list of text', () => {
	const file = validFile();
	file.recipes[0].ingredients[1].note = 5;
	file.recipes[0].notes = ['ok', 3];
	const result = validator.validate(file);
	assertError(result, 'Test Marinade A', 'Star seasoning', '"note"');
	assertError(result, 'Test Marinade A', '"notes"');
});

test('collects every problem at once', () => {
	const file = validFile();
	file.recipes[0].yieldUnits = 0;
	file.recipes[1].ingredients[0].grams = 0;
	const result = validator.validate(file);
	assert.equal(result.errors.length, 2);
});

test('unit must be g', () => {
	const file = validFile();
	file.unit = 'ml';
	assertError(validator.validate(file), 'File', '"unit"');
});
