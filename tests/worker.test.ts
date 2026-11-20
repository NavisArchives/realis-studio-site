import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, movedPath } from '../worker/index.ts';

const to = (input: string, scheme?: string) => canonicalUrl(new URL(input), scheme)?.toString() ?? null;

test('http and www redirect to the https apex, keeping path and query', () => {
  assert.equal(to('http://realisstudio.com/fr/?x=1'), 'https://realisstudio.com/fr/?x=1');
  assert.equal(to('https://www.realisstudio.com/projects/recall/'), 'https://realisstudio.com/projects/recall/');
  assert.equal(to('http://www.realisstudio.com/'), 'https://realisstudio.com/');
  assert.equal(to('https://realisstudio.com/', 'http'), 'https://realisstudio.com/');
});

test('the canonical origin and other hosts are served as-is', () => {
  assert.equal(to('https://realisstudio.com/about/'), null);
  assert.equal(to('https://realisstudio.com/about/', 'https'), null);
  assert.equal(to('https://realis-studio.example.workers.dev/'), null);
  assert.equal(to('http://localhost:4322/'), null);
});

test('the old /work/ addresses are sent on to /projects/, in every language', () => {
  assert.equal(movedPath('/work/'), '/projects/');
  assert.equal(movedPath('/work/recall/'), '/projects/recall/');
  assert.equal(movedPath('/work'), '/projects/');
  assert.equal(movedPath('/fr/work/recall/'), '/fr/projets/recall/');
  assert.equal(movedPath('/nl/work/'), '/nl/projecten/');
});

test('the old French and Dutch studio page addresses move to their own words', () => {
  assert.equal(movedPath('/fr/about/'), '/fr/');
  assert.equal(movedPath('/nl/about/'), '/nl/');
  assert.equal(movedPath('/fr/about'), '/fr/');
  assert.equal(movedPath('/fr/a-propos/'), '/fr/');
});

test('paths that did not move are left alone', () => {
  assert.equal(movedPath('/projects/recall/'), null);
  assert.equal(movedPath('/about/'), '/');
  assert.equal(movedPath('/lab/v2/about/'), '/');
  assert.equal(movedPath('/nl/vertrouwen/'), '/nl/');
  assert.equal(movedPath('/projects/recall/'), null);
  assert.equal(movedPath('/'), null);
  // The images keep their folder: only the pages moved.
  assert.equal(movedPath('/images/work/recall/hero.jpg'), null);
});
