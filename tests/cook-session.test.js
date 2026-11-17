/**
 * cook-session.test.js
 * Unit tests for CookSession step state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CookSession } from '../js/core/cook-session.js';

test('starts at step 0 with no progress', () => {
	const c = new CookSession(4);
	assert.equal(c.current, 0);
	assert.equal(c.next, 1);
	assert.equal(c.hasProgress, false);
	assert.equal(c.isComplete, false);
});

test('pour moves to the next step and marks done', () => {
	const c = new CookSession(4);
	c.pour();
	assert.equal(c.current, 1);
	assert.equal(c.isDone(0), true);
	assert.equal(c.isDone(1), false);
	assert.equal(c.hasProgress, true);
});

test('next is -1 on the last step', () => {
	const c = new CookSession(3, 2);
	assert.equal(c.next, -1);
});

test('back undoes the last pour and stops at 0', () => {
	const c = new CookSession(4, 2);
	c.back();
	assert.equal(c.current, 1);
	assert.equal(c.isDone(1), false);
	c.back();
	c.back();
	assert.equal(c.current, 0);
});

test('jump moves to any step and ignores bad indexes', () => {
	const c = new CookSession(5);
	c.jump(3);
	assert.equal(c.current, 3);
	assert.equal(c.isDone(2), true);
	c.jump(1);
	assert.equal(c.isDone(2), false);
	c.jump(9);
	c.jump(-1);
	assert.equal(c.current, 1);
});

test('completes after the last pour and stays complete', () => {
	const c = new CookSession(2);
	c.pour();
	c.pour();
	assert.equal(c.isComplete, true);
	assert.equal(c.next, -1);
	c.pour();
	assert.equal(c.current, 2);
	c.back();
	assert.equal(c.isComplete, false);
});

test('reset clears progress', () => {
	const c = new CookSession(3, 3);
	c.reset();
	assert.equal(c.current, 0);
	assert.equal(c.hasProgress, false);
});

test('ignores a bad saved step', () => {
	assert.equal(new CookSession(3, 7).current, 0);
	assert.equal(new CookSession(3, 1.5).current, 0);
	assert.equal(new CookSession(3, 3).isComplete, true);
});
