/**
 * The replay's lesson strip: a reader who arrives from a learn-page door
 * (`?lesson=<id>`) is told which lesson this is, what to look for, which game
 * the example is from, and how to get back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rich, boot } from './helpers/page.js';

const at = `?game=${rich.game.id}&at=1-18:40&layer=corsi&strength=all`;

test('a lesson door arrives with the lesson named, the card’s own sentence, and the way back', () => {
  const a = boot(null, null, `${at}&lesson=blocked`);
  const box = a.$('lesson');
  assert.equal(box.hidden, false, 'the strip is not shown');
  assert.match(box.innerHTML, /Lesson · The attempt that never arrived/);
  assert.match(box.innerHTML, /A body got in front of this one before it reached the goaltender/);
  assert.doesNotMatch(box.innerHTML, /__[A-Z_]+__/, 'a raw token reached the page');
  assert.match(box.innerHTML, /This example: Minnesota Wild at Buffalo Sabres, November 10, 2023/);
  assert.match(box.innerHTML, /href="\/what-you-can-see\.html#blocked">Back to the lesson/);
});

test('a lesson with a diagram sends the reader back to the diagram', () => {
  const a = boot(null, null, `${at}&lesson=icing`);
  assert.match(a.$('lesson').innerHTML, /href="\/icing\.html">Back to the lesson/);
});

test('no lesson, or one the page does not know, shows no strip', () => {
  assert.equal(boot(null, null, at).$('lesson').hidden, true);
  assert.equal(boot(null, null, `${at}&lesson=nonsense`).$('lesson').hidden, true);
});

test('Close and Play both put the strip away', () => {
  const a = boot(null, null, `${at}&lesson=icing`);
  a.$('lclose')._fire({});
  assert.equal(a.$('lesson').hidden, true, 'Close did not close it');
  const b = boot(null, null, `${at}&lesson=icing`);
  b.$('play').onclick();
  assert.equal(b.$('lesson').hidden, true, 'pressing play left it over the replay');
});
