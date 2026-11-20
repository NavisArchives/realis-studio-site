// Tells the search engines that share IndexNow — Bing, and through it
// DuckDuckGo, Ecosia, Yahoo and ChatGPT search, plus Yandex, Seznam and
// Naver — that the site's pages exist and have changed, so they crawl them
// now rather than whenever they next happen by. Google does not take part;
// it is told through Search Console instead.
//
// The key proves the request comes from the site: it is the name and the
// content of a file at the site's root. Run after every deploy. A failure
// here is reported and never fails the deploy that has already happened.
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'realisstudio.com';
const keyFile = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));

try {
  if (!keyFile) throw new Error('no IndexNow key file in public/');
  const key = readFileSync(`public/${keyFile}`, 'utf8').trim();
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
  });
  // 200: taken. 202: accepted, the key is being checked. Anything else is
  // worth reading but not worth failing over.
  console.log(`IndexNow: ${res.status} ${res.statusText} — ${urlList.length} URLs submitted`);
} catch (err) {
  console.log(`IndexNow: not submitted (${err.message})`);
}
