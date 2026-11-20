import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, type ContactEnv, type SendMail } from '../worker/contact.ts';

const ENV: ContactEnv = {
  CONTACT_INBOX: 'hello@realisstudio.com',
  CONTACT_FROM: 'REPLACE_ME@example.com',
  CONTACT_TO: 'andy@example.com',
};

/** Records the message the Worker tried to send, and whether it may. */
function postbox(fail = false) {
  const sent: { mime: string; to: string; from: string }[] = [];
  const send: SendMail = async (mime, to, from) => {
    if (fail) throw new Error('mail is down');
    sent.push({ mime, to, from });
  };
  return { sent, send };
}

/** A submission, as the form would send it. */
function post(fields: Record<string, string>, accept = 'application/json'): Request {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return new Request('https://realisstudio.com/api/contact', {
    method: 'POST',
    body,
    headers: { accept },
  });
}

const VALID = { name: 'Jo', email: 'jo@example.com', message: 'Hello' };

/** Records what the Worker sent upstream, and answers however the test says. */
function spy(response = new Response('{}', { status: 200 })) {
  const calls: { url: string; body: FormData }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), body: init?.body as FormData });
    return response;
  }) as unknown as typeof fetch;
  return { calls, impl };
}

test('a good submission is posted as an email to the inbox', async () => {
  const box = postbox();
  const res = await handleContact(post(VALID), ENV, spy().impl, box.send);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(box.sent.length, 1);
  const { mime, to, from } = box.sent[0]!;
  assert.equal(to, 'andy@example.com');
  assert.equal(from, 'REPLACE_ME@example.com');
  assert.match(mime, /^From: Realis Studio <REPLACE_ME@example\.com>\r\n/);
  assert.match(mime, /\r\nTo: andy@example\.com\r\n/);
  assert.match(mime, /\r\nReply-To: Jo <jo@example\.com>\r\n/);
  assert.match(mime, /\r\nMessage-ID: <[^>]+@example\.com>\r\n/);
  assert.match(mime, /\r\nSubject: New enquiry from Jo\r\n/);
  // The body is base64, so the message is read back out of it.
  const body = Buffer.from(mime.split('\r\n\r\n')[1]!.replace(/\r\n/g, ''), 'base64').toString('utf8');
  assert.match(body, /^From: Jo$/m);
  assert.match(body, /^Email: jo@example\.com$/m);
  assert.match(body, /^Hello$/m);
});

test('an answer that is not ASCII survives the headers and the body', async () => {
  const box = postbox();
  await handleContact(
    post({ name: 'Hélène Exemple', email: 'jo@example.com', message: 'Une clinique à Bruxelles — déjà en ligne.' }),
    ENV,
    spy().impl,
    box.send,
  );
  const { mime } = box.sent[0]!;
  assert.match(mime, /Reply-To: =\?utf-8\?B\?[A-Za-z0-9+/=]+\?= <jo@example\.com>/);
  const body = Buffer.from(mime.split('\r\n\r\n')[1]!.replace(/\r\n/g, ''), 'base64').toString('utf8');
  assert.match(body, /Une clinique à Bruxelles — déjà en ligne\./);
});

test('only the known fields are forwarded', async () => {
  const box = postbox();
  await handleContact(
    post({
      ...VALID,
      _next: 'https://realisstudio.com/thanks/',
      audience: 'Clinic or group practice',
      package: 'Website + CMS',
      project_type: 'A redesign',
      evil: 'x',
    }),
    ENV,
    spy().impl,
    box.send,
  );
  const body = Buffer.from(box.sent[0]!.mime.split('\r\n\r\n')[1]!.replace(/\r\n/g, ''), 'base64').toString('utf8');
  assert.doesNotMatch(body, /evil/);
  assert.doesNotMatch(body, /_next|thanks/);
  assert.match(body, /^Audience: Clinic or group practice$/m);
  assert.match(body, /^Package: Website \+ CMS$/m);
  assert.match(body, /^Project type: A redesign$/m);
});

test('a filled honeypot is dropped, but looks like success', async () => {
  const box = postbox();
  const res = await handleContact(post({ ...VALID, _honey: 'i am a bot' }), ENV, spy().impl, box.send);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(box.sent.length, 0, 'nothing should be sent');
});

test('missing and malformed fields are refused before sending', async () => {
  const box = postbox();
  const missing = await handleContact(post({ name: 'Jo' }), ENV, spy().impl, box.send);
  assert.equal(missing.status, 422);
  assert.deepEqual(await missing.json(), { ok: false, error: 'missing', fields: ['email', 'message'] });

  const bad = await handleContact(post({ ...VALID, email: 'not-an-email' }), ENV, spy().impl, box.send);
  assert.equal(bad.status, 422);
  assert.deepEqual(await bad.json(), { ok: false, error: 'email' });
  assert.equal(box.sent.length, 0);
});

test('an over-long field is refused', async () => {
  const box = postbox();
  const res = await handleContact(post({ ...VALID, message: 'x'.repeat(5001) }), ENV, spy().impl, box.send);
  assert.equal(res.status, 413);
  assert.equal(box.sent.length, 0);
});

test('mail that will not go is reported rather than swallowed', async () => {
  const box = postbox(true);
  const res = await handleContact(post(VALID), ENV, spy().impl, box.send);
  assert.equal(res.status, 502);
  assert.deepEqual(await res.json(), { ok: false, error: 'upstream' });
});

test('without anywhere to send, it says so rather than pretending', async () => {
  const box = postbox();
  const res = await handleContact(post(VALID), {}, spy().impl, box.send);
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { ok: false, error: 'no-inbox' });
  assert.equal(box.sent.length, 0);
});

test('with Turnstile configured, a submission without a token is refused', async () => {
  const box = postbox();
  const res = await handleContact(post(VALID), { ...ENV, TURNSTILE_SECRET: 's3cret' }, spy().impl, box.send);
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { ok: false, error: 'challenge' });
  assert.equal(box.sent.length, 0);
});

test('with Turnstile configured, a verified token goes through', async () => {
  const calls: string[] = [];
  const impl = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }) as unknown as typeof fetch;
  const box = postbox();
  const res = await handleContact(
    post({ ...VALID, 'cf-turnstile-response': 'token' }),
    { ...ENV, TURNSTILE_SECRET: 's3cret' },
    impl,
    box.send,
  );
  assert.equal(res.status, 200);
  assert.match(calls[0]!, /turnstile\/v0\/siteverify$/);
  assert.equal(box.sent.length, 1, 'the mail goes out once the challenge passes');
});

test('the no-JS path lands on the thanks page', async () => {
  const box = postbox();
  const res = await handleContact(
    post({ ...VALID, _next: 'https://realisstudio.com/thanks/' }, 'text/html'),
    ENV,
    spy().impl,
    box.send,
  );
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://realisstudio.com/thanks/');
});

test('GET is not a submission', async () => {
  const res = await handleContact(new Request('https://realisstudio.com/api/contact'), ENV);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'POST');
});
