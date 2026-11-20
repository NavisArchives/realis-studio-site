// Runs in front of the static assets (assets.run_worker_first) so that every
// request on http:// or on www. lands on the one canonical origin. Any other
// host (workers.dev, localhost) is served as-is.
import { handleContact, type ContactEnv } from './contact.ts';

const CANONICAL_HOST = 'realisstudio.com';

/** Where the contact form posts. Same origin, so no third party in the page. */
const CONTACT_PATH = '/api/contact';

/** /work/ became /projects/, and its translations followed. Anything already
    linked or indexed under the old address is sent on, keeping the rest of
    the path — so a project page lands on the same project. */
const MOVED: [RegExp, string][] = [
  [/^\/work(\/.*)?$/, '/projects'],
  [/^\/fr\/work(\/.*)?$/, '/fr/projets'],
  [/^\/nl\/work(\/.*)?$/, '/nl/projecten'],
  // The studio and trust pages were folded into the home page of each language when the
  // site was rebuilt (Nov 2026); their old addresses, in every spelling, land there.
  [/^\/(?:about|trust)(?:\/.*)?$/, ''],
  [/^\/fr\/(?:about|a-propos|confiance)(?:\/.*)?$/, '/fr'],
  [/^\/nl\/(?:about|over-ons|vertrouwen)(?:\/.*)?$/, '/nl'],
  // The old site's trial pages (/lab/v1/ … /lab/v4/, never in the sitemap)
  // land on the same page of the real site. The lab is development-only now.
  [/^\/lab(?:\/v\d+)?(\/.*)?$/, ''],
  // Projects renamed before the rebuild (SEO mission R6, 20 Nov): Vidimus was « Report review » from 14 to
  // 16 Oct 2026, and Van Impe's first page was /alexis-rodolphe/ (Sept). Google still asks for the old names.
  [/^\/projects\/report-review(\/.*)?$/, '/projects/vidimus'],
  [/^\/fr\/projets\/report-review(\/.*)?$/, '/fr/projets/vidimus'],
  [/^\/nl\/projecten\/report-review(\/.*)?$/, '/nl/projecten/vidimus'],
  [/^\/projects\/alexis-rodolphe(\/.*)?$/, '/projects/rodolphe-alexis-van-impe'],
  [/^\/fr\/projets\/alexis-rodolphe(\/.*)?$/, '/fr/projets/rodolphe-alexis-van-impe'],
  [/^\/nl\/projecten\/alexis-rodolphe(\/.*)?$/, '/nl/projecten/rodolphe-alexis-van-impe'],
];

/** Files the 2026 rebrand replaced: each old address answers with its successor.
    The per-page share cards of the old look give way to the one card. */
const REPLACED: [RegExp, string][] = [[/^\/og\/[\w-]+\.png$/, '/og.png']];

/** The address a moved path now lives at, or null when it has not moved. */
export function movedPath(pathname: string): string | null {
  for (const [from, to] of REPLACED) if (from.test(pathname)) return to;
  // Follow the map to the end, so an old address answers with one redirect, never a chain
  // (/lab/v2/about/ → /about/ → /).
  let path = pathname, moved = false;
  for (let hop = 0; hop < 4; hop++) {
    const rule = MOVED.find(([from]) => from.test(path));
    if (!rule) break;
    const m = rule[0].exec(path)!;
    path = `${rule[1]}${m[1] ?? '/'}`; moved = true;
  }
  return moved ? path : null;
}

/** The https apex URL a request should be redirected to, or null when it is already there. */
export function canonicalUrl(url: URL, visitorScheme?: string): URL | null {
  const host = url.hostname;
  if (host !== CANONICAL_HOST && host !== `www.${CANONICAL_HOST}`) return null;
  const insecure = url.protocol === 'http:' || visitorScheme === 'http';
  if (!insecure && host === CANONICAL_HOST) return null;
  const target = new URL(url.toString());
  target.protocol = 'https:';
  target.hostname = CANONICAL_HOST;
  target.port = '';
  return target;
}

interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/** Cloudflare reports the scheme the visitor used in the cf-visitor header. */
function visitorScheme(request: Request): string | undefined {
  try {
    return JSON.parse(request.headers.get('cf-visitor') ?? 'null')?.scheme;
  } catch {
    return undefined;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const target = canonicalUrl(url, visitorScheme(request));
    if (target) return Response.redirect(target.toString(), 301);
    if (url.pathname === CONTACT_PATH) return handleContact(request, env);
    const moved = movedPath(url.pathname);
    if (moved) {
      const to = new URL(url.toString());
      to.pathname = moved;
      return Response.redirect(to.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
