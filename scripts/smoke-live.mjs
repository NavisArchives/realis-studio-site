// After a deploy: ask the live site for every address it answered before the
// rebrand (tests/fixtures/live-urls-2026-11-14.txt, 106 addresses) and check
// each answer against the Worker's own map. An address that did not move must
// answer 200; one that moved must answer one 301 to its new address, which
// must answer 200. Also checks that the new build is the one being served, its
// security policy, and the http:// and www. redirects.
//
//   node scripts/smoke-live.mjs [https://realisstudio.com]
//
// Read-only: GET and HEAD only, the contact form is never touched.
import { readFileSync } from 'node:fs';
import { movedPath } from '../worker/index.ts';

const BASE = (process.argv[2] ?? 'https://realisstudio.com').replace(/\/$/, '');
const HOST = new URL(BASE).host;
const live = readFileSync(new URL('../tests/fixtures/live-urls-2026-11-14.txt', import.meta.url), 'utf8')
  .split('\n').filter((l) => l && !l.startsWith('#'));
const get = (url, method = 'GET') =>
  fetch(url, { method, redirect: 'manual', headers: { 'cache-control': 'no-cache', 'user-agent': 'realis-release-smoke' } });
const failed = [];
const fail = (what) => { failed.push(what); console.log(`FAIL  ${what}`); };

// 1. The new build is the one being served (allow a minute for the edge).
let home = '';
for (let i = 0; i < 12; i++) {
  const res = await get(`${BASE}/`);
  home = res.status === 200 ? await res.text() : '';
  if (home.includes('<span class="lang" role="group"')) break;
  await new Promise((r) => setTimeout(r, 5000));
}
if (!home.includes('<span class="lang" role="group"')) fail('the home page is not the new build (no language switch)');
const csp = (await get(`${BASE}/`)).headers.get('content-security-policy') ?? '';
const scriptSrc = csp.match(/script-src([^;]*)/)?.[1] ?? '';
if (!/static\.cloudflareinsights\.com/.test(scriptSrc) || scriptSrc.includes("'unsafe-inline'")) fail(`security policy not the new one: ${csp.slice(0, 80)}…`);

// 2. Every address the old site answered.
let same = 0;
let moved = 0;
const check = async (path) => {
  const to = movedPath(path);
  const res = await get(`${BASE}${path}`, 'HEAD');
  if (to === null) {
    if (res.status === 200) same++;
    else fail(`${path}: ${res.status}, expected 200`);
    return;
  }
  const loc = new URL(res.headers.get('location') ?? '', BASE);
  if (res.status !== 301 || loc.host !== HOST || loc.pathname !== to) {
    fail(`${path}: ${res.status} → ${loc.pathname}, expected 301 → ${to}`);
    return;
  }
  const end = await get(loc.href, 'HEAD');
  if (end.status === 200) moved++;
  else fail(`${path} → ${to}: ${end.status}, expected 200`);
};
const queue = [...live];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await check(queue.shift()); }));

// 3. The canonical origin: http:// and www. land on https://realisstudio.com.
if (HOST === 'realisstudio.com') {
  for (const [from, to] of [
    ['http://realisstudio.com/fr/', 'https://realisstudio.com/fr/'],
    ['https://www.realisstudio.com/services/', 'https://realisstudio.com/services/'],
  ]) {
    const res = await get(from, 'HEAD');
    const loc = res.headers.get('location') ?? '';
    if (![301, 308].includes(res.status) || loc !== to) fail(`${from}: ${res.status} → ${loc}, expected → ${to}`);
  }
}

console.log(`\n${BASE}: ${live.length} addresses, ${same} answered in place, ${moved} moved with one 301, ${failed.length} failed.`);
process.exit(failed.length ? 1 : 0);
