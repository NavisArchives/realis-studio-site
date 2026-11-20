// Launch guard (NIRMATA finding 11): every address the live site answered on 14 Nov 2026
// must still answer after the rebrand: as a page or file of the new build, or as a 301
// from the real Worker handler to a page or file that exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import worker, { movedPath } from '../worker/index.ts';

const dist = (p: string) => new URL(`../dist${p}`, import.meta.url).pathname;
const served = (p: string) => (p.endsWith('/') ? existsSync(dist(`${p}index.html`)) : existsSync(dist(p)) && statSync(dist(p)).isFile());
const live = readFileSync(new URL('./fixtures/live-urls-2026-11-14.txt', import.meta.url), 'utf8')
  .split('\n').filter((l) => l && !l.startsWith('#'));

const env = { ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } } as never;

test(`all ${live.length} live addresses still answer after the rebrand`, async () => {
  const broken: string[] = [];
  for (const path of live) {
    if (movedPath(path) === null) {
      if (!served(path)) broken.push(`${path} → 404`);
      continue;
    }
    const res = await worker.fetch(new Request(`https://realisstudio.com${path}`), env);
    const to = new URL(res.headers.get('location') ?? '', 'https://realisstudio.com').pathname;
    if (res.status !== 301 || !served(to)) broken.push(`${path} → ${res.status} ${to}`);
  }
  assert.deepEqual(broken, []);
});

test('the moves the rebrand added', () => {
  assert.equal(movedPath('/lab/v2/projects/recall/'), '/projects/recall/');
  assert.equal(movedPath('/lab/v1/'), '/');
  assert.equal(movedPath('/lab/'), '/');
  assert.equal(movedPath('/og/home-fr.png'), '/og.png');
  assert.equal(movedPath('/og.png'), null);
  assert.equal(movedPath('/labels/'), null);
});

test('projects renamed before the rebuild send Google on to their page (SEO R6, 20 Nov)', () => {
  assert.equal(movedPath('/projects/report-review/'), '/projects/vidimus/');
  assert.equal(movedPath('/fr/projets/report-review/'), '/fr/projets/vidimus/');
  assert.equal(movedPath('/nl/projecten/report-review'), '/nl/projecten/vidimus/');
  assert.equal(movedPath('/work/report-review/'), '/projects/vidimus/');
  assert.equal(movedPath('/projects/alexis-rodolphe/'), '/projects/rodolphe-alexis-van-impe/');
  assert.equal(movedPath('/nl/projecten/alexis-rodolphe/'), '/nl/projecten/rodolphe-alexis-van-impe/');
  assert.equal(movedPath('/projects/vidimus/'), null);
  for (const p of ['/projects/vidimus/', '/fr/projets/vidimus/', '/nl/projecten/rodolphe-alexis-van-impe/']) assert.ok(served(p), p);
});
