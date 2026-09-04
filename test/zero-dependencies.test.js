/**
 * ⛔ ZERO RUNTIME DEPENDENCIES, AND ZERO DEPENDENCIES AT ALL.
 *
 * `docs/architecture.md` §3.1 offers this as a reason the no-framework decision
 * holds: *"the page also ships with zero runtime dependencies, which is a promise
 * about what reaches a browser."* It was true, and **nothing anywhere checked
 * it** — `npm i` something and every gate stays green while the promise quietly
 * stops being one. Found 2026-09-04 during an audit of which claims in that
 * document have instruments; ten of seventeen did.
 *
 * ⭐ IT ASSERTS THE ABSENCE OF THE KEYS, not that they are empty. `"dependencies":
 * {}` and no `dependencies` key are the same fact today and not the same fact
 * after someone adds and removes a package — and a test written as
 * `deepEqual(deps, {})` passes against a manifest that has started carrying the
 * field, which is the state that precedes carrying a package in it.
 *
 * ⚠️ AND IT CHECKS THE LOCKFILE TOO. A dependency can arrive without the manifest
 * saying so — a transitive install, a hand-edited lockfile, an `npm i --no-save`
 * committed by accident. The manifest is the intent; the lockfile is what a
 * checkout would actually get.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', ROOT), 'utf8'));

const FIELDS = ['dependencies', 'devDependencies', 'peerDependencies',
                'optionalDependencies', 'bundledDependencies', 'bundleDependencies'];

test('⛔ package.json declares no dependencies of any kind', () => {
  const present = FIELDS.filter(f => f in pkg);
  assert.deepEqual(present, [],
    `package.json now declares ${present.join(', ')}. This project's pitch is that the code a `
    + 'reader inspects is the bytes a browser receives, and architecture.md §3.1 offers zero '
    + 'dependencies as the reason the no-framework decision holds. If a dependency is genuinely '
    + 'wanted, change the document first and this test second — in that order, so the promise is '
    + 'withdrawn deliberately rather than by a package install.');
});

test('⭐ …and no lockfile has appeared to contradict it', () => {
  /* The manifest is intent; the lockfile is what a fresh checkout installs. A
     project with no dependencies has nothing to lock, so the file existing at
     all is the signal — its contents do not need reading. */
  for (const f of ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml'])
    assert.equal(existsSync(new URL(f, ROOT)), false,
      `${f} exists, so something is being installed that package.json does not declare`);
});

test('⭐⭐ …and the checker would notice if one were added', () => {
  /* THE CONTROL. Both tests above pass by finding nothing, which is exactly the
     shape that passes forever once the scan stops working — the field list could
     be misspelled, the parse could be reading the wrong file. Feed the same
     predicate a manifest that violates the rule and require rejection. */
  const bad = { name: 'x', dependencies: { lodash: '^4' } };
  assert.deepEqual(FIELDS.filter(f => f in bad), ['dependencies'],
                   'the field scan does not detect a declared dependency');

  const empty = { name: 'x', devDependencies: {} };
  assert.deepEqual(FIELDS.filter(f => f in empty), ['devDependencies'],
                   'an EMPTY dependency field is not detected — the check tests values, not keys, '
                   + 'and would miss the state that precedes a package being added');

  assert.deepEqual(FIELDS.filter(f => f in { name: 'x', scripts: {} }), [],
                   'the scan flags a manifest that declares nothing');
});
