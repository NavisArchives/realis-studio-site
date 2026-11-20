export type Locale = 'en' | 'fr' | 'nl';

/** A run of the headline; `ink` runs are black, the rest grey. */
export interface Run {
  t: string;
  ink?: boolean;
  /** Start a new line before this run. */
  br?: boolean;
}

export interface Dictionary {
  meta: { title: string; description: string };
  nav: { home: string; about: string; services: string; work: string; contact: string; cta: string; langLabel: string };
  hero: {
    title: Run[];
    subtitle: string;
    /** The statement as two whole lines, when a copy set writes it that
        way rather than as tokens. */
    statement?: [string, string];
    /** Three facts under the statement, when a copy set has them. */
    proof?: string[];
    portraitLabel: string;
    stripAlt: string;
    primary: string;
    secondary: string;
    /** The label over the list of projects on the home page. */
    whoFor: string;
  };
  about: {
    label: string;
    /** The sentence in ink; `body` follows it in grey. */
    title: string;
    body: string[];
    portraitAlt: string;
    placeholder: string;
    link: string;
    /** The About page */
    page: {
      title: string;
      description: string;
      paragraphs: string[];
      background: string;
      since: string;
      today: string;
    };
  };
  services: {
    label: string;
    items: { title: string; tagline: string; body: string }[];
    /** The page the four of them have to themselves. */
    page: { title: [string, string]; lede: string; description: string };
    /** The packages page: what the studio sells, and how the work goes. */
    pack: {
      kicker: string;
      title: [string, string];
      lede: string;
      /** The older account of the work, as plain paragraphs. */
      how?: string[];
      /** Why the studio keeps to its fields, under the lede. */
      intro?: string;
      /**
       * The work in steps. A step with `byExample` has one sentence per
       * example on the right, in the same order, and shows the one whose tab
       * is open; `after` closes the step.
       */
      /** The three steps: a name set as a boxed subtitle with its number,
          then a paragraph whose first sentence is the lead. */
      steps?: { name: string; lead: string; body?: string; byExample?: string[]; after?: string }[];
      compare: string;
      tellMe: string;
      byType: string;
      exampleLabels: string[];
      exampleKinds: string[];
      caseStudy: string;
      visit: string;
      chooseKicker: string;
      packagesTitle: [string, string];
      packagesLede: string;
      swipe: string;
      mostChosen: string;
      whatYouGet: string;
      usefulDetail: string;
      note: string;
      packages: {
        name: string;
        /** A small technical label beside the name, e.g. CMS. */
        tech?: string;
        for: string;
        promise: string;
        outcome: string;
        included: string[];
        extra: string[];
        cta: string;
        /** What it costs, as the reader will see it: a range, a floor or a
            monthly figure. Left out, the card says nothing about money. */
        price?: string;
      }[];
      extrasKicker: string;
      extrasTitle: [string, string];
      extras: { name: string; line: string; price?: string }[];
      /** How the studio uses AI, as four short promises. */
      ai?: { kicker: string; title: [string, string]; lede: string; items: { name: string; line: string }[] };
      /** What a buyer can check before signing. */
      trust?: { kicker: string; title: [string, string]; items: { name: string; line: string }[] };
      /** Who does the work. */
      team?: {
        kicker: string;
        title: [string, string];
        lede: string;
        people: { name: string; role: string; line: string }[];
      };
      closeKicker: string;
      closeTitle: [string, string];
      closeLede: string;
      closeCta: string;
      description: string;
    };
  };
  work: {
    label: string;
    visit: string;
    view: string;
    placeholder: string;
    /** Project page */
    back: string;
    year: string;
    sector: string;
    website: string;
    comingSoon: string;
    delivered: string;
    next: string;
    shotHome: string;
    shotSection: string;
    shotPhone: string;
    /** [grey part, black part] */
    cta: [string, string];
    ctaButton: string;
    viewAll: string;
    role: string;
    type: string;
    about: string;
    desktop: string;
    mobile: string;
    /** The Work index page */
    page: { title: string; description: string; kinds: string[]; headline: string; caseStudies: string };
  };
  contact: {
    label: string;
    /** [black part, grey part] */
    title: [string, string];
    /** What the contact block on other pages is headed, when it differs
        from the contact page's own statement. */
    blockTitle?: [string, string];
    intro: string;
    fields: {
      name: string;
      email: string;
      company: string;
      optional: string;
      type: string;
      typeOptions: string[];
      message: string;
    };
    errors: { name: string; email: string; message: string };
    submit: string;
    sending: string;
    success: string;
    error: string;
    /** The letter the contact page is written as. */
    letter: {
      /** The label on the field only a robot fills in. */
      honeypot: string;
      hello: string;
      /** [before the name, after it] */
      nameIs: [string, string];
      /** [before the first pick, between the two] */
      thinking: [string, string];
      know: string;
      reach: string;
      sign: string;
      send: string;
      badge: string;
      prefer: string;
      placeholders: { name: string; email: string; message: string };
      asks: { audience: string; package: string; kind: string };
      audiences: string[];
      packages: string[];
      kinds: string[];
    };
  };
  thanks: { title: [string, string]; body: string; back: string };
  /** Titles and descriptions for search, per page, in this language. */
  seo: {
    home: { title: string; description: string };
    services: { title: string; description: string };
    projects: { title: string; description: string };
    contact: { title: string; description: string };
    /** The city and region as this language names them. */
    city: string;
    region: string;
    /** The first crumb of a breadcrumb trail. */
    homeCrumb: string;
  };
  footer: { cta: string; rights: string; credit: string; legal: string; privacy: string };
  place: { city: string };
  /** Design B's own words, beyond what the rest of the site already says. */
  b: {
    menu: string;
    sky: string;
    /** The other languages, each named in this dictionary's own language,
        so the panel can offer them as whole sentences rather than as a
        verb glued to a noun that declines differently in every one. */
    switchLang: { en: string; fr: string; nl: string };
    /** The two skies, named the same way. */
    switchDark: string;
    switchLight: string;
    tagline: string;
    langs: string;
    index: { meta: string; lede: string; archives: string };
    projects: {
      title: [string, string];
      /** Who the work is for, stacked against the right edge. */
      practices: string[];
      /** The one line under the statement on the projects page. */
      lede2: string;
      lede: string;
      rows: { k: string; v: string }[];
      list: string;
      cards: string;
    };
    project: { visit: string; unfold: string; readOn: string; about: string };
  };
}
