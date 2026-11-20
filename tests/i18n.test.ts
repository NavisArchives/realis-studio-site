import { test } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/i18n/en.ts';
import { fr } from '../src/i18n/fr.ts';
import { nl } from '../src/i18n/nl.ts';

type Tree = Record<string, unknown>;

function flatten(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) return [`${path}[${value.length}]`];
    if (value && typeof value === 'object') return flatten(value as Tree, path);
    return [path];
  });
}

const reference = flatten(en as unknown as Tree).sort();

for (const [name, dict] of [['fr', fr], ['nl', nl]] as const) {
  test(`${name} dictionary has the same keys and array lengths as en`, () => {
    assert.deepEqual(flatten(dict as unknown as Tree).sort(), reference);
  });
}

test('no dictionary contains empty strings or the old studio name', () => {
  for (const dict of [en, fr, nl]) {
    const json = JSON.stringify(dict);
    assert.doesNotMatch(json, /""/);
    assert.doesNotMatch(json, /Khalis/);
  }
});
