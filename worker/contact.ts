/**
 * The contact form posts here, and this Worker sends the mail itself.
 *
 * It used to hand the fields to FormSubmit, which stopped accepting them —
 * and which answered a refusal with HTTP 200 and `success: "false"` in the
 * body, so a form could have looked like it had sent when it had not. The
 * mail now goes out through Cloudflare's own email binding to the verified
 * address the domain already forwards to: no third party, nothing to
 * re-activate, and the browser still only ever talks to this origin.
 *
 * Turnstile is optional: without a TURNSTILE_SECRET the handler still runs and
 * still drops honeypot hits, it just does not have a challenge to check.
 */
import { buildEnquiry } from './mime.ts';

/** What Cloudflare's send_email binding needs of us. */
export interface EmailBinding {
  send(message: unknown): Promise<void>;
}

export interface ContactEnv {
  /** The address the site prints. Set in wrangler.jsonc vars. */
  CONTACT_INBOX?: string;
  /** The address the mail is sent from — a domain in this account. */
  CONTACT_FROM?: string;
  /** The verified destination the mail is delivered to. */
  CONTACT_TO?: string;
  /** Turnstile secret key. Set with `wrangler secret put TURNSTILE_SECRET`. */
  TURNSTILE_SECRET?: string;
  /** The send_email binding, declared in wrangler.jsonc. */
  MAIL?: EmailBinding;
}

/** Hands one finished message to whatever is carrying mail. */
export type SendMail = (mime: string, to: string, from: string) => Promise<void>;

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Fields a person fills in. Everything else on the form is bookkeeping. */
const REQUIRED = ['name', 'email', 'message'] as const;

/** Guided answers are optional, but when present they are useful context in
 * the enquiry email. Keeping the list here means arbitrary client fields are
 * still never forwarded. */
const OPTIONAL = ['company', 'language', 'audience', 'package', 'project_type'] as const;

/** Good enough to catch typos; real validation is the reply bouncing. */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

const MAX_FIELD = 5000;

function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

/** A reply the fetch path can read, or a redirect for the no-JS path. */
function reply(request: Request, status: number, body: Record<string, unknown>, redirectTo?: string): Response {
  if (!wantsJson(request) && redirectTo && status === 200) {
    return Response.redirect(redirectTo, 303);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function passesTurnstile(
  token: string | null,
  secret: string,
  ip: string | null,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY, { method: 'POST', body });
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  } catch {
    return false;
  }
}

/**
 * Handles one submission. `fetchImpl` and `send` are injectable so the tests
 * can run the whole path without reaching the network or sending mail.
 */
export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetchImpl: typeof fetch = fetch,
  send?: SendMail,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, 400, { ok: false, error: 'malformed' });
  }

  const value = (name: string) => {
    const raw = form.get(name);
    return typeof raw === 'string' ? raw.trim() : '';
  };

  // The honeypot is hidden from people and irresistible to bots. A filled one
  // gets a cheerful 200 and goes nowhere: telling a bot it failed only teaches
  // it to try again.
  const next = value('_next') || undefined;
  if (value('_honey')) return reply(request, 200, { ok: true }, next);

  const missing = REQUIRED.filter((field) => !value(field));
  if (missing.length) return reply(request, 422, { ok: false, error: 'missing', fields: missing });
  if (!LOOKS_LIKE_EMAIL.test(value('email'))) {
    return reply(request, 422, { ok: false, error: 'email' });
  }
  if ([...REQUIRED, ...OPTIONAL].some((field) => value(field).length > MAX_FIELD)) {
    return reply(request, 413, { ok: false, error: 'too-long' });
  }

  if (env.TURNSTILE_SECRET) {
    const ok = await passesTurnstile(
      form.get('cf-turnstile-response') as string | null,
      env.TURNSTILE_SECRET,
      request.headers.get('cf-connecting-ip'),
      fetchImpl,
    );
    if (!ok) return reply(request, 403, { ok: false, error: 'challenge' });
  }

  const inbox = env.CONTACT_INBOX;
  const to = env.CONTACT_TO || inbox;
  const from = env.CONTACT_FROM || (inbox ? `form@${inbox.split('@')[1]}` : '');
  if (!to || !from) return reply(request, 500, { ok: false, error: 'no-inbox' });

  // Only the fields worth mailing. Anything else the client sent is dropped
  // rather than passed on.
  const extra = OPTIONAL.filter((field) => value(field)).map(
    (field) => [field, value(field)] as [string, string],
  );

  const message = buildEnquiry(
    {
      name: value('name'),
      email: value('email'),
      message: value('message'),
      extra,
      subject: value('_subject'),
    },
    { from, to },
  );

  const carry = send ?? binding(env.MAIL);
  try {
    await carry(message, to, from);
  } catch {
    return reply(request, 502, { ok: false, error: 'upstream' });
  }

  return reply(request, 200, { ok: true }, next);
}

/**
 * The real carrier. `cloudflare:email` only exists inside the Worker, so it
 * is reached for at the moment of sending rather than at the top of the file
 * — which keeps this module loadable by the tests.
 */
function binding(mail: EmailBinding | undefined): SendMail {
  return async (mime, to, from) => {
    if (!mail) throw new Error('no mail binding');
    const { EmailMessage } = (await import('cloudflare:email')) as {
      EmailMessage: new (from: string, to: string, raw: string) => unknown;
    };
    await mail.send(new EmailMessage(from, to, mime));
  };
}
