/**
 * One enquiry, written out as an email.
 *
 * Cloudflare's email binding takes a finished RFC 5322 message rather than a
 * set of fields, so the message is built here: headers that a mail server
 * will accept, the person's own address on Reply-To so answering is one
 * keystroke, and the body in base64 because names and messages arrive in
 * three languages and will not always be ASCII.
 */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The date format a mail header wants, which is not the one Date gives. */
export function mailDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${DAYS[d.getUTCDay()]}, ${p(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} +0000`;
}

function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Anything outside plain ASCII has to be encoded before it goes in a header. */
export function headerValue(text: string): string {
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?utf-8?B?${base64(clean)}?=`;
}

/** A display name and address, as a header writes them. */
function mailbox(name: string, address: string): string {
  return name ? `${headerValue(name)} <${address}>` : address;
}

export interface Enquiry {
  name: string;
  email: string;
  message: string;
  /** Whatever the guided questions answered, in the order they were asked. */
  extra?: [string, string][];
  subject?: string;
}

export interface MailAddresses {
  /** The address the site sends from — a domain in the account. */
  from: string;
  /** The verified destination the enquiry lands in. */
  to: string;
  /** The name on the From line. */
  fromName?: string;
}

/** The whole message, ready to hand to the binding. */
export function buildEnquiry(enquiry: Enquiry, addresses: MailAddresses, now = new Date(), id = crypto.randomUUID()): string {
  const domain = addresses.from.split('@')[1] ?? 'localhost';
  const lines = [
    `From: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    ...(enquiry.extra ?? []).map(([k, v]) => `${k[0]!.toUpperCase()}${k.slice(1).replace(/_/g, ' ')}: ${v}`),
    '',
    enquiry.message,
    '',
    '—',
    'Sent from the contact form on realisstudio.com. Reply to this email to answer.',
  ];
  const body = base64(lines.join('\r\n')).replace(/(.{76})/g, '$1\r\n');

  return [
    `From: ${mailbox(addresses.fromName ?? 'Realis Studio', addresses.from)}`,
    `To: ${addresses.to}`,
    `Reply-To: ${mailbox(enquiry.name, enquiry.email)}`,
    `Message-ID: <${id}@${domain}>`,
    `Date: ${mailDate(now)}`,
    `Subject: ${headerValue(enquiry.subject || `New enquiry from ${enquiry.name}`)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n');
}
