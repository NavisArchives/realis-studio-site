export const config = {
  name: 'Realis Studio',
  tagline: 'Fast, multilingual websites, designed and built by one studio',
  /** Public site URL, no trailing slash. Update before deploying. */
  url: 'https://realisstudio.com',
  email: 'hello@realisstudio.com',
  phone: '+32 489 09 12 85',
  /** The same number as a tel: link. */
  phoneHref: '+32489091285',
  location: 'Brussels, Belgium',
  /** Google Search Console's HTML-tag token, once the property exists. Empty
      until then; set, and every page carries the verification tag. */
  googleSiteVerification: 'REPLACE_ME' as string,
  /** Bing Webmaster Tools' token, the same way. */
  bingSiteVerification: '' as string,
  /** Under the wordmark in the header. */
  cities: 'Brussels · Berlin · Paris',
  /**
   * Where contact-form submissions are emailed, via FormSubmit (formsubmit.co).
   * No account needed: the first submission sends a one-time activation email
   * to this address; click the link in it and every later submission arrives.
   * Change the address here and re-activate once.
   */
  contactInbox: 'hello@realisstudio.com',
  /**
   * Cloudflare Turnstile site key, from the Turnstile tab of the dashboard.
   * Free. Leave empty and the form works exactly as before, without a
   * challenge; set it, and also run `wrangler secret put TURNSTILE_SECRET`,
   * and the Worker starts rejecting submissions that fail it.
   */
  turnstileSiteKey: '0x4AAAAAAFA-BP7qiL7ppyJl' as string,
  /** Images under src/assets/images. Leave undefined for striped placeholders. */
  images: {
    /** Tall hero portrait. astro:assets derives the srcset widths from it. */
    heroPortrait: '/images/hero-portrait.jpg' as string | undefined,
    /** Small 4:5 portrait in the About section. */
    portrait: '/images/portrait.jpg' as string | undefined,
  },
};
