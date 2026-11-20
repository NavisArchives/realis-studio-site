/* Realis lab motion (14 Nov 2026). Values come from the reference study in
   redesign-2026-11/ (measured, not guessed); all code here is written from scratch:
   - words: y 120% → 0, 1.7 s, stagger { amount: 0.6 }, expo.out, masked;
   - blocks: opacity 0 → 1 over 1 s, y 70 → 0 over 2 s, stagger 0.1, expo.out;
   - preview: clip-path inset(5% 10%) and scale 0.9 → full over 2.5 s, then parallax y −10% → 10%;
   - services: each item fills black and opens as you scroll past (scrub 1);
   - header: the wordmark fades in (1.4 s; the letter pop was dropped, Andy 14 Nov), links rise 20 px (0.8 s, stagger 0.1);
   - Lenis smooth scroll, lerp 0.1. */
// The type is here: the web-font stylesheet has arrived (it no longer holds the first paint, see css.js) and the faces
// the site uses have loaded. Everything that measures text waits for it (the logo's journey, the tiles), so nothing is
// measured in the fallback face and then drawn in the real one. Never waits more than 3 s.
const typeReady = (() => {
  const links = [...document.querySelectorAll('link[data-async]')];
  const css = Promise.all(links.map((l) => new Promise((res) => {
    if (l.sheet) res(); else { l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); }
  })));
  const faces = ["400 1em 'Inter Tight'", "500 1em 'Inter Tight'", "600 1em 'Inter Tight'", "700 1em 'Inter Tight'", '400 1em Outfit', '700 1em Outfit'];
  const ready = css.then(() => { links.forEach((l) => { l.media = 'all'; }); return document.fonts ? Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready) : null; });
  return Promise.race([ready, new Promise((res) => setTimeout(res, 3000))]);
})();

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const theme = new URLSearchParams(location.search).get('theme');
  if (theme) document.documentElement.dataset.theme = theme;
  const still = new URLSearchParams(location.search).has('still'); // screenshots: final state, no motion

  // Hero options (Andy, 15 Nov: « find nice ways for website and software, try different versions: first just
  // two colours, same font; then two options that make them stand out, a marker, a solid background »).
  // The two words are found in each language before the split; the lab chooses with ?hero=1|2|3 or its switch.
  const HERO_KW = { en: ['website', 'software'], fr: ['site web', 'logiciel'], nl: ['website', 'software'] };
  // Andy, 16 Nov: option 1 is his pick « for the moment » (website #9AC9DF, software #A3A3E0), so it is the default;
  // the lab's switch can still show Current (stored as '') or the other options.
  const heroPick = (() => { try { const q = new URLSearchParams(location.search).get('hero'), st = localStorage.getItem('realis-hero'); return q ?? st ?? '1'; } catch (e) { return '1'; } })();
  if (heroPick) document.documentElement.dataset.hero = heroPick;
  document.querySelectorAll('.top h1').forEach((h) => {
    (HERO_KW[document.documentElement.lang] || HERO_KW.en).forEach((k, i) => {
      h.innerHTML = h.innerHTML.replace(new RegExp(`(^|\\s)(${k})(?=[\\s.,])`), `$1<span class="kw -${'ab'[i]}">$2</span>`);
    });
  });

  // Prices strips: mark the turned words that hang a descender (g, j, p, q, y), in whatever language
  document.querySelectorAll('.pc-nm').forEach((n) => { if (/[gjpqy]/.test(n.textContent)) n.classList.add('-dsc'); });

  // Split headlines into masked words.
  document.querySelectorAll('[data-split]').forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            // A hyphenated word (Rodolphe-Alexis) gets one mask per half and a break point between,
            // so a long name wraps at its hyphen instead of widening its mask past the page.
            part.split(/(?<=-)/).forEach((bit, k) => {
              if (k) frag.appendChild(document.createElement('wbr'));
              const m = document.createElement('span'); m.className = 'w-mask';
              const w = document.createElement('span'); w.className = 'w'; w.textContent = bit;
              m.appendChild(w); frag.appendChild(m);
            });
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    // Screen readers get the sentence whole. A heading may carry it as its label; a paragraph may not
    // (aria-label is not allowed on <p>), so it gets a visually hidden copy instead (SEO mission R3, 20 Nov).
    const said = el.textContent.replace(/\s+/g, ' ').trim();
    walk(el);
    el.querySelectorAll('.w-mask').forEach((m) => m.setAttribute('aria-hidden', 'true'));
    if (/^H[1-6]$/.test(el.tagName)) el.setAttribute('aria-label', said);
    else { const vh = document.createElement('span'); vh.className = 'vh'; vh.textContent = said; el.appendChild(vh); }
  });

  // Logo letters, for the header's entrance.
  document.querySelectorAll('.hd .logo').forEach((logo) => {
    logo.querySelectorAll('b, i').forEach((x) => x.setAttribute('data-keep', ''));
    const wrap = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); [...n.textContent].forEach((ch) => { if (ch === ' ') { f.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; f.appendChild(s); }); n.replaceWith(f); }
      else if (n.nodeType === 1) wrap(n);
    });
    wrap(logo);
  });

  // Header: fixed once scrolled, hides on the way down, returns on the way up.
  const hd = document.querySelector('.hd');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    hd?.classList.toggle('-fixed', y > 0);
    hd?.classList.toggle('-visible', y > 0 && lastY > y);
    lastY = y;
  }, { passive: true });

  // Prices switch (Andy, 14 Nov: a switch, not boxes). Works with or without motion; arrow keys move.
  document.querySelectorAll('.sw').forEach((sw) => {
    const tabs = [...sw.querySelectorAll('[role="tab"]')];
    const pick = (t, focus) => {
      tabs.forEach((x, k) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; if (on) sw.style.setProperty('--i', k); });
      if (focus) t.focus();
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); pick(tabs[(k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true); } });
    });
  });

  // Prices cards (Andy, 15 Nov): press a card. v1 opens it in place (the other two leave), v2 in
  // a dialog that grows out of the card. Works without motion; Escape closes; focus comes back.
  // Screen recordings play on their own, muted and looping; under reduced motion they stay on their first frame.
  if (reduce) document.querySelectorAll('video[autoplay]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  // Videos load nothing until they are on screen, play while they are, and stop when they leave (speed pass)
  const vids = document.querySelectorAll('video[data-autoplay]');
  // When a phone refuses to play on its own (an iPhone in Low Power Mode, a data saver) or the visitor asked for
  // less motion, the poster stays and a play button sits on it; a tap plays the clip (NIRMATA M5, 19 Nov).
  const PLAY = { fr: 'Lire la vidéo', nl: 'Video afspelen' }[document.documentElement.lang] || 'Play the video';
  const tapToPlay = (v) => {
    if (v.dataset.tap || !v.parentElement) return; v.dataset.tap = '1';
    const host = v.parentElement; if (getComputedStyle(host).position === 'static') host.classList.add('vid-host');
    const img = v.closest('[role="img"]'); if (img) img.setAttribute('role', 'group');  // so the button can be reached
    const b = document.createElement('button'); b.type = 'button'; b.className = 'vid-play'; b.setAttribute('aria-label', PLAY);
    const done = () => { b.remove(); delete v.dataset.tap; };
    b.addEventListener('click', () => { if (v.preload === 'none') v.preload = 'auto'; v.muted = true; const p = v.play(); if (p) p.then(done).catch(() => { v.controls = true; done(); }); else done(); });
    v.addEventListener('playing', done, { once: true });
    host.appendChild(b);
  };
  if (vids.length && reduce) vids.forEach(tapToPlay);
  if (vids.length && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.muted = true; const p = v.play(); if (p) p.catch(() => tapToPlay(v)); }
      else v.pause();
    }), { rootMargin: '200px 0px', threshold: 0.01 });
    vids.forEach((v) => io.observe(v));
  }
  // Pages a visitor is about to open: fetched on hover or first touch (Chrome also follows the
  // Speculation-Rules header); and when a project page is idle, the next project and its picture.
  const pre = new Set();
  const prefetch = (href) => {
    if (!href || pre.has(href)) return; pre.add(href);
    const l = document.createElement('link'); l.rel = 'prefetch'; l.href = href; document.head.appendChild(l);
  };
  const internal = (a) => a && a.href && a.origin === location.origin && !a.hash && !/\/api\//.test(a.pathname) && a.pathname !== location.pathname;
  ['pointerenter', 'touchstart', 'focusin'].forEach((ev) => document.addEventListener(ev, (e) => {
    const a = e.target.closest && e.target.closest('a'); if (internal(a)) prefetch(a.href);
  }, { passive: true, capture: true }));
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  idle(() => {
    const next = document.querySelector('.mw .mw-card');
    if (!next) return;
    prefetch(next.href);
    const im = next.querySelector('img'); if (im) { im.loading = 'eager'; im.fetchPriority = 'low'; }
  });
  const moving = () => window.gsap && !reduce && !still;
  document.querySelectorAll('.pc-cards').forEach((wrap) => {
    const cards = [...wrap.querySelectorAll('.pc-card')];
    if (wrap.dataset.mode === 'inline') {
      // v1: the chosen card takes the row and the other two stay beside it as strips. Every card
      // stays in its grid track, so Flip only resizes and slides them; « absolute » is not used
      // (in Safari it parked the returning cards at the top of the page for the whole move).
      let flip = null;
      const strip = (c) => wrap.classList.contains('-one') && !c.classList.contains('-open');
      const set = (card) => {
        const was = cards.map(strip);
        const apply = () => {
          cards.forEach((c) => {
            const on = c === card, b = c.querySelector('.pc-open');
            c.classList.toggle('-open', on); b.setAttribute('aria-expanded', on); c.querySelector('.pc-more').hidden = !on;
            // the word bubble only on full cards: an open card is not a door, and on a thin strip the
            // bubble would hide the name (Andy, 15 Nov), so strips get the plain pointer
            b.dataset.cursorText = card ? '' : 'Open';
            if (b.matches(':hover')) { b.dispatchEvent(new Event('mouseleave')); b.dispatchEvent(new Event('mouseenter')); }
          });
          wrap.classList.toggle('-one', !!card);
          if (card) wrap.dataset.open = cards.indexOf(card); else delete wrap.dataset.open;  // keeps every card in its own column
        };
        if (moving() && window.Flip) {
          gsap.registerPlugin(Flip);
          const st = Flip.getState(cards);
          if (flip) flip.progress(1).kill();  // a second press mid-move starts from where the cards are
          apply();
          flip = Flip.from(st, { duration: 0.8, ease: 'expo.out' });
          // What changes shape fades in once the boxes have moved: the open card's contents, and
          // the names of cards that turn into strips or back. A name that keeps its place stays.
          const parts = [];
          cards.forEach((c, i) => {
            if (was[i] !== strip(c)) parts.push(c.querySelector('.pc-top'));
            parts.push(...c.querySelectorAll('.pc-foot, .pc-x, .pc-more > *'));
          });
          gsap.killTweensOf(parts);
          gsap.fromTo(parts, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.03, delay: 0.28, ease: 'expo.out', clearProps: 'opacity,transform' });
        } else apply();
        // On a phone the open card grows where it is: bring its top into view.
        if (card && window.matchMedia('(max-width: 767px)').matches) {
          const y = card.getBoundingClientRect().top + window.scrollY - 96;
          if (window.__lenis) window.__lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: 'smooth' });
        }
      };
      cards.forEach((c) => {
        const open = c.querySelector('.pc-open');
        open.addEventListener('click', () => { if (!c.classList.contains('-open')) set(c); });
        c.querySelector('.pc-x').addEventListener('click', () => { set(null); open.focus(); });
      });
      document.addEventListener('keydown', (e) => { const c = wrap.querySelector('.pc-card.-open'); if (e.key === 'Escape' && c) { set(null); c.querySelector('.pc-open').focus(); } });
    } else {
      cards.forEach((c) => {
        // GSAP must never measure the dialog itself: a fixed element has no offsetParent, so GSAP
        // would lift it out of the page to read its matrix, and a modal dialog moved in the DOM
        // stops being modal (no backdrop, no Escape). The sheet inside it does the growing.
        const dlg = document.getElementById(c.dataset.dialog), sheet = dlg.querySelector('.pc-sheet'), btn = c.querySelector('.pc-open');
        sheet.style.setProperty('--g', getComputedStyle(c).getPropertyValue('--g'));  // the same ground as its card
        const from = () => { const a = c.getBoundingClientRect(), b = sheet.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: '0 0' }; };
        const parts = () => sheet.querySelectorAll('.pc-top, .pc-foot, .pc-more > *, .pc-x');
        btn.addEventListener('click', () => {
          dlg.showModal(); if (window.__lenis) window.__lenis.stop();
          if (moving()) {
            gsap.fromTo(sheet, from(), { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.8, ease: 'expo.out' });
            gsap.fromTo(parts(), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, delay: 0.2, ease: 'expo.out' });
          }
        });
        let closing = false;
        const close = () => {
          if (closing || !dlg.open) return;
          const done = () => { dlg.close(); if (window.gsap) gsap.set([sheet, ...parts()], { clearProps: 'transform,opacity,transformOrigin' }); if (window.__lenis) window.__lenis.start(); btn.focus(); closing = false; };
          if (!moving()) return done();
          closing = true;
          gsap.to(parts(), { opacity: 0, duration: 0.2 });
          gsap.to(sheet, { ...from(), duration: 0.55, ease: 'expo.inOut', onComplete: done });
        };
        dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
        dlg.querySelectorAll('.pc-x, .pc-back').forEach((b) => b.addEventListener('click', close));
        dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });  // the dimmed page around the sheet
      });
    }
  });
  // A card's Contact opens the form with that interest already chosen.
  const pick = (root, want) => { if (want) root.querySelectorAll('.cf-chips .chip[data-group="interest"]').forEach((c) => { c.setAttribute('aria-pressed', String((c.dataset.v || c.textContent.trim()) === want)); }); };
  pick(document, new URLSearchParams(location.search).get('interest'));

  // Contact form: chips (several for « interested in », one budget) and plain checks. On the live
  // site the form posts to the Worker (/api/contact, which mails hello@) and moves to the thank-you
  // page; in the lab, which has no server, it opens the visitor's own mail app instead.
  const FORM_TXT = {
    en: { add: 'Please add ', name: 'your name', email: 'an email address we can answer', msg: 'a few lines about the project', fail: 'The message could not be sent. Please write to hello@realisstudio.com.',
      check: 'Checking…', send: 'Sending…', nocheck: 'The security check did not finish, so nothing was sent. Your message is still here: press Send again, or write to hello@realisstudio.com.' },
    fr: { add: 'Ajoutez ', name: 'votre nom', email: 'une adresse e-mail à laquelle répondre', msg: 'quelques lignes sur le projet', fail: 'Le message n’a pas pu être envoyé. Écrivez-nous à hello@realisstudio.com.',
      check: 'Vérification…', send: 'Envoi…', nocheck: 'Le contrôle de sécurité n’a pas abouti, rien n’a été envoyé. Votre message est toujours là : appuyez à nouveau sur Envoyer, ou écrivez à hello@realisstudio.com.' },
    nl: { add: 'Vul nog in: ', name: 'uw naam', email: 'een e-mailadres waarop we kunnen antwoorden', msg: 'een paar regels over het project', fail: 'Het bericht kon niet worden verstuurd. Schrijf ons op hello@realisstudio.com.',
      check: 'Even controleren…', send: 'Wordt verstuurd…', nocheck: 'De veiligheidscontrole is niet afgerond, er is niets verstuurd. Uw bericht staat er nog: druk opnieuw op Versturen, of schrijf naar hello@realisstudio.com.' },
  };
  const tx = FORM_TXT[document.documentElement.lang] || FORM_TXT.en;
  // Messages under the form: the address in them is a link to write to.
  const MAIL = 'hello@realisstudio.com';
  // On a phone the line under the form sits below the fold, so the message is scrolled into view (NIRMATA F8, 19 Nov).
  const show = (err, msg) => {
    err.textContent = ''; msg.split(MAIL).forEach((part, i) => { if (i) { const a = document.createElement('a'); a.href = 'mailto:' + MAIL; a.textContent = MAIL; err.append(a); } err.append(part); });
    err.hidden = false;
    const r = err.getBoundingClientRect(), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (r.bottom > innerHeight || r.top < 0) {
      const y = scrollY + r.bottom - innerHeight + 16;
      // the message itself just made the page taller: smooth scrolling must learn the new length first
      if (window.__lenis) { if (window.__lenis.resize) window.__lenis.resize(); window.__lenis.scrollTo(y, { immediate: calm, force: true }); }
      else scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
    }
  };
  // The bot check (Turnstile) can take about 10 s to hand over its token (NIRMATA, 19 Nov). Send waits for it
  // instead of posting without one; if none comes, it says so and keeps everything that was typed.
  // (A real token is hundreds of characters; anything of 20 or fewer counts as none, so test stand-ins must be longer.)
  const tokenOf = (form) => { const i = form.querySelector('[name="cf-turnstile-response"]'); return i && i.value.length > 20 ? i.value : ''; };
  const waitToken = (form, ms) => new Promise((ok) => { const t0 = Date.now(); const tick = () => { const t = tokenOf(form); if (t || Date.now() - t0 >= ms) ok(t); else setTimeout(tick, 200); }; tick(); });
  // The budget as a magnetic slider (Andy, 19 Nov: « make it a slider … a magnetic slider »). Four stops.
  // The thumb follows the finger, pulled towards the nearest stop as it comes close. On release it springs
  // to the stop the throw was heading for (velocity projected, as iOS scrolling does) and keeps the
  // finger's speed. Keys move a stop at a time, instantly. Nothing is chosen until it is touched.
  const budgetSlider = (sl) => {
    const box = sl.closest('.cf-budget'), out = box.querySelector('.cf-bud-v');
    const opts = [...box.querySelectorAll('.cf-slide-opts [data-v]')], N = opts.length - 1;
    const rail = sl.querySelector('.cf-slide-rail'), fill = sl.querySelector('.cf-slide-fill'), knob = sl.querySelector('.cf-slide-knob');
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, hint = out.textContent;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    let x = 0, v = 0, goal = 0, resp = 0.1, zeta = 1, raf = 0, last = 0, drag = null, at = -1;
    const draw = () => { const f = clamp(x / N, -0.04, 1.04); knob.style.transform = `translateX(${f * 100}%)`; fill.style.transform = `scaleX(${clamp(f, 0, 1)})`; };
    const choose = (i) => {
      if (i === at) return; at = i;
      sl.classList.remove('-unset'); out.classList.remove('-unset');
      out.textContent = opts[i].textContent; sl.dataset.v = opts[i].dataset.v;
      sl.setAttribute('aria-valuenow', String(i)); sl.setAttribute('aria-valuetext', opts[i].textContent);
      if (drag && navigator.vibrate) try { navigator.vibrate(6); } catch (e) { /* not allowed here */ }
    };
    const frame = (t) => {  // a damped spring: resp = its period in seconds, zeta 1 = no overshoot
      const dt = Math.min(0.032, last ? (t - last) / 1000 : 1 / 60); last = t;
      const k = (2 * Math.PI / resp) ** 2, c = 4 * Math.PI * zeta / resp;
      for (let s = 0; s < 4; s++) { v += (-k * (x - goal) - c * v) * dt / 4; x += v * dt / 4; }
      draw();
      if (drag || Math.abs(x - goal) > 0.001 || Math.abs(v) > 0.01) raf = requestAnimationFrame(frame);
      else { x = goal; v = 0; draw(); raf = 0; last = 0; }
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(frame); };
    // pointer → stop units, magnetised: inside 0.35 of a stop the thumb is drawn in (d·|d|/0.35, so it
    // joins the free path smoothly), and past either end it gives way like a rubber band
    const toUnits = (cx) => {
      const r = drag.r, raw = (cx - r.left) / r.width * N;
      if (raw < 0 || raw > N) { const o = raw < 0 ? raw : raw - N; return (raw < 0 ? 0 : N) + o * 0.55 / (1 + 0.55 * Math.abs(o)); }
      const k = Math.round(raw), d = raw - k;
      return Math.abs(d) < 0.35 ? k + d * Math.abs(d) / 0.35 : raw;
    };
    sl.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      drag = { r: rail.getBoundingClientRect(), h: [] }; sl.setPointerCapture(e.pointerId); sl.classList.add('-drag');
      goal = toUnits(e.clientX); resp = 0.12; zeta = 1; drag.h.push([e.timeStamp, goal]);
      choose(clamp(Math.round(goal), 0, N));
      if (calm) { x = goal; draw(); } else run();
    });
    sl.addEventListener('pointermove', (e) => {
      if (!drag) return;
      goal = toUnits(e.clientX); drag.h.push([e.timeStamp, goal]); if (drag.h.length > 6) drag.h.shift();
      choose(clamp(Math.round(goal), 0, N));
      if (calm) { x = goal; draw(); }
    });
    const up = () => {
      if (!drag) return;
      const h = drag.h, a = h[0], b = h[h.length - 1];
      const vel = h.length > 1 && b[0] > a[0] ? (b[1] - a[1]) / ((b[0] - a[0]) / 1000) : 0;  // stops per second
      drag = null; sl.classList.remove('-drag');
      const end = clamp(Math.round(goal + vel / 1000 * 0.99 / (1 - 0.99)), 0, N);  // where the throw was going
      choose(end); goal = end;
      if (calm) { x = end; v = 0; draw(); return; }
      resp = 0.34; zeta = Math.abs(vel) > 2 ? 0.8 : 1; v = vel; run();  // a little give only after a throw
    };
    sl.addEventListener('pointerup', up); sl.addEventListener('pointercancel', up);
    sl.addEventListener('keydown', (e) => {
      const to = { ArrowRight: at + 1, ArrowUp: at + 1, PageUp: at + 1, ArrowLeft: at - 1, ArrowDown: at - 1, PageDown: at - 1, Home: 0, End: N }[e.key];
      if (to === undefined) return;
      e.preventDefault(); cancelAnimationFrame(raf); raf = 0; last = 0;
      const n = clamp(to, 0, N); choose(n); x = goal = n; v = 0; draw();
    });
    sl.setAttribute('aria-valuetext', hint);
    draw();
  };
  const bindForm = (form) => {
    if (form.dataset.bound) return; form.dataset.bound = '1';
    form.querySelectorAll('.cf-slide').forEach(budgetSlider);
    form.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
      const multi = c.closest('[data-multi]');
      if (!multi) form.querySelectorAll(`.chip[data-group="${c.dataset.group}"]`).forEach((x) => { if (x !== c) x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = form.querySelector('.cf-err'); const f = form.elements;
      const bad = [];
      if (!f.name.value.trim()) bad.push([f.name, tx.name]);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) bad.push([f.email, tx.email]);
      if (!f.message.value.trim()) bad.push([f.message, tx.msg]);
      form.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
      if (bad.length) { bad.forEach(([el]) => el.setAttribute('aria-invalid', 'true')); err.textContent = tx.add + bad.map((b) => b[1]).join(', ') + '.'; err.hidden = false; bad[0][0].focus(); return; }
      err.hidden = true;
      const slid = form.querySelector('.cf-slide');
      const picked = (g) => (g === 'budget' && slid ? slid.dataset.v || '' : [...form.querySelectorAll(`.chip[data-group="${g}"][aria-pressed="true"]`)].map((x) => x.dataset.v || x.textContent).join(', '));
      if (form.getAttribute('action')) {
        if (form.dataset.sending) return; form.dataset.sending = '1';
        // Send keeps its label and size (NIRMATA F9: a longer label squeezed the slider on phones); it pulses while
        // busy, and the line under the form says « Checking… » or « Sending… » in place of its note.
        const btn = form.querySelector('[type="submit"]'), note = form.querySelector('.cf-note'), noteText = note ? note.textContent : '';
        if (note) note.setAttribute('aria-live', 'polite');
        const busy = (on, txt) => {
          if (btn) { btn.disabled = on; btn.classList.toggle('-busy', on); btn.setAttribute('aria-busy', String(on)); }
          if (note) { note.textContent = on ? txt : noteText; note.classList.toggle('-busy', on); }
          if (!on) delete form.dataset.sending;
        };
        if (form.querySelector('.cf-turnstile') && !tokenOf(form)) {
          busy(true, tx.check);
          if (!(await waitToken(form, 15000))) { busy(false); show(err, tx.nocheck); return; }
        }
        busy(true, tx.send);
        const data = new FormData(form);  // built now, so it carries the token
        if (picked('interest')) data.set('project_type', picked('interest'));
        if (picked('budget')) data.set('package', picked('budget'));
        else if (slid) data.set('package', 'Not specified');  // an untouched slider is no budget, never the lowest
        try {
          const r = await fetch(form.action, { method: 'POST', body: data, headers: { accept: 'application/json' } });
          if (!r.ok) throw new Error(String(r.status));
          location.href = form.querySelector('[name="_next"]').value;
        } catch (x) { busy(false); show(err, tx.fail); }
        return;
      }
      const body = [`Name: ${f.name.value.trim()}`, `Email: ${f.email.value.trim()}`, `Practice or company: ${f.company.value.trim() || '—'}`, `Interested in: ${picked('interest') || '—'}`, `Budget: ${picked('budget') || '—'}`, '', f.message.value.trim()].join('\n');
      const a = document.createElement('a');
      a.href = `mailto:hello@realisstudio.com?subject=${encodeURIComponent('Project: ' + f.name.value.trim())}&body=${encodeURIComponent(body)}`;
      a.click();
    });
  };
  document.querySelectorAll('.cf-form').forEach(bindForm);

  // Phones coming in (Andy, 15 Nov: « animate the phone coming in »): the three rise together from below
  // the tile, the two outer ones tucked behind the middle one, then slide out to their places. It gathers
  // speed and slows into place; once per visit, again after the tile has left the screen from the top.
  document.querySelectorAll('.trio.-cards').forEach((trio) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const [a, b, c] = trio.querySelectorAll('.screen'); if (!c) return;
    const tile = trio.closest('.it-tile');
    const mid = (el) => (b.offsetLeft + b.offsetWidth / 2) - (el.offsetLeft + el.offsetWidth / 2);
    gsap.set(b, { zIndex: 2 });
    const tl = gsap.timeline({ paused: true })
      .fromTo([a, b, c], { y: () => tile.clientHeight * 0.8 }, { y: 0, duration: 1.1, ease: 'power4.out', stagger: { each: 0.06, from: 'center' } }, 0)
      .fromTo([a, c], { x: (i) => mid(i ? c : a), scale: 0.9 }, { x: 0, scale: 1, duration: 1, ease: 'power3.inOut' }, 0.55);
    ScrollTrigger.create({ trigger: tile, start: 'top 75%', onEnter: () => tl.play() });
    ScrollTrigger.create({ trigger: tile, start: 'top bottom', onLeaveBack: () => tl.pause(0) });
    ScrollTrigger.addEventListener('refresh', () => { if (!tl.progress()) tl.invalidate().progress(1).progress(0); });
  });

  // The devices tile in three beats (Andy, 15 Nov: « show the phone with a little text, then have a pc
  // slide in and take all the space, then have the phone come back to its current position, as a pair »):
  // 1. the phone alone, whole and centred, « On mobile »; 2. the desktop pushes it out to the left and
  // fills the square, « On desktop »; 3. the phone comes back the way it left and both settle where the
  // CSS draws them, each with its label. Ease in-out on every move (it gathers speed, then slows into
  // place), ~1.1–1.3 s for the big moves, a held beat between. Reduced motion: the pair, as drawn.
  document.querySelectorAll('.dv[data-seq]').forEach((dv) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tile = dv.closest('.it-tile'), ip = dv.querySelector('.dv-ip'), mac = dv.querySelector('.dv-mac');
    const lm = dv.querySelector('.dv-lab.-m'), ld = dv.querySelector('.dv-lab.-d');
    const at = (el) => { const c = getComputedStyle(el); return { l: parseFloat(c.left), t: parseFloat(c.top) }; };
    let tl = null;
    const build = () => {
      const W = tile.clientWidth, H = tile.clientHeight, u = W / 100, P = at(ip), M = at(mac), A = at(lm), B = at(ld);
      const css = (el) => new DOMMatrix(getComputedStyle(el).transform).a;  // the scale the CSS gives the pair
      const sP = css(ip), sM = css(mac);
      const s1 = (0.66 * H) / ip.offsetHeight, w1 = ip.offsetWidth * s1, h1 = ip.offsetHeight * s1;
      const ip1 = { x: (W - w1) / 2 - P.l, y: (H - h1) / 2 + 3 * u - P.t, scale: s1 };          // beat 1
      // beat 2: the desktop large, from the left; about two thirds show, the rest runs off the right edge
      // (Andy, 15 Nov: « bigger, only showed like maybe 60 %, the 40 % hidden, overflow to the right »)
      const s2 = (1.3 * W) / mac.offsetWidth, h2 = mac.offsetHeight * s2;
      const mac2 = { x: 10 * u - M.l, y: Math.max(16 * u, (H - h2) / 2 + 4 * u) - M.t, scale: s2 };
      const push = W * 1.02;  // the desktop arrives from the right as the phone leaves on the left, one push
      const capM = { x: W / 2 - A.l, xPercent: -50, y: ip1.y + P.t - 7 * u - A.t };
      const capD = { x: 10 * u + 1.3 * u * s2 - B.l, xPercent: 0, y: mac2.y + M.t - 6 * u - B.t };  // over the lid's left edge
      const t = gsap.timeline({ paused: true, defaults: { ease: 'power3.inOut' } });
      t.set(ip, { ...ip1, autoAlpha: 1 }).set(mac, { ...mac2, x: mac2.x + push + 12 * u, autoAlpha: 0 })  // out of sight until its beat
        .set(lm, { ...capM, autoAlpha: 0 }).set(ld, { ...capD, x: capD.x + push, autoAlpha: 0 })
        .fromTo(ip, { y: ip1.y + 5 * u }, { y: ip1.y, duration: 0.9, ease: 'power3.out' }, 0)
        .fromTo(lm, { y: capM.y + 1.5 * u }, { y: capM.y, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 0.25)
        // beat 2, after a held second
        .to([ip, lm], { x: (i) => (i ? capM.x : ip1.x) - push, duration: 1.2, ease: 'power4.inOut' }, 1.9)
        .to(lm, { autoAlpha: 0, duration: 0.4, ease: 'power1.in' }, 1.9)
        .set(mac, { autoAlpha: 1 }, 1.9).to(mac, { x: mac2.x, duration: 1.2, ease: 'power4.inOut' }, 1.9)
        .to(ld, { x: capD.x, duration: 1.2, ease: 'power4.inOut' }, 1.9)
        .to(ld, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 2.6)
        // beat 3: the phone returns from the left, the desktop draws back to the right, both settle
        .to(mac, { x: 0, y: 0, scale: sM, duration: 1.3, ease: 'power4.inOut' }, 4.4)
        .to(ld, { x: 0, y: 0, xPercent: 0, duration: 1.3, ease: 'power4.inOut' }, 4.4)
        .to(ip, { x: 0, y: 0, scale: sP, duration: 1.3, ease: 'power4.inOut' }, 4.5)
        .to(lm, { x: 0, y: 0, xPercent: 0, duration: 1.3, ease: 'power4.inOut' }, 4.5)
        .to(lm, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 4.8);
      return t;
    };
    tl = build(); tl.progress(1).progress(0);  // render the first beat now, before the tile is seen
    ScrollTrigger.create({ trigger: tile, start: 'top 65%', onEnter: () => tl.play() });
    ScrollTrigger.create({ trigger: tile, start: 'top bottom', onLeaveBack: () => tl.pause(0) });
    let rw = tile.clientWidth;  // a new width rebuilds the beats from the new sizes, at the same moment
    addEventListener('resize', () => {
      if (tile.clientWidth === rw) return; rw = tile.clientWidth;
      const p = tl.progress(), on = tl.isActive(); tl.kill(); gsap.set([ip, mac, lm, ld], { clearProps: 'all' });
      tl = build(); tl.progress(1).progress(p); if (on) tl.play();
    });
  });

  // The hero keywords draw in once the words are up: the marker sweeps, the block fills (lab options 2 and 3).
  const kws = [...document.querySelectorAll('.top h1 .kw')];
  const drawKw = () => { gsap.killTweensOf(kws); gsap.fromTo(kws, { '--mk': '0%' }, { '--mk': '100%', duration: reduce ? 0 : 0.7, ease: 'power2.out', stagger: 0.28, delay: reduce ? 0 : 1.1 }); };
  if (kws.length) drawKw();
  if (kws.length && !document.querySelector('link[rel="canonical"]')) {  // lab pages only: the released site has no switch
    const bar = document.createElement('nav'); bar.className = 'herobar'; bar.setAttribute('aria-label', 'Hero options');
    // 1b: the same two hues dark enough to read at 3:1 on white (NIRMATA, 16 Nov), to compare with Andy's pick.
    bar.innerHTML = '<span>Hero</span>' + [['', 'Current'], ['1', '1 · Two colours'], ['1b', '1b · Readable'], ['2', '2 · Marker'], ['3', '3 · Solid block']].map(([h, t]) => `<button type="button" data-h="${h}">${t}</button>`).join('');
    const mark = () => bar.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String((x.dataset.h || '') === (document.documentElement.dataset.hero || ''))));
    bar.addEventListener('click', (e) => {
      const x = e.target.closest('button'); if (!x) return;
      if (x.dataset.h) document.documentElement.dataset.hero = x.dataset.h; else delete document.documentElement.dataset.hero;
      try { localStorage.setItem('realis-hero', x.dataset.h || ''); } catch (err) { /* private window */ }
      mark(); drawKw();
    });
    // Option 1, two colours: a picker for each word (Andy, 16 Nov: « I like the two colours, build me a way to
    // change the colours individually in the lab »). The choice is remembered in this browser, with its hex.
    const pick = document.createElement('span'); pick.className = 'herobar-pick';
    const saved = (() => { try { return JSON.parse(localStorage.getItem('realis-hero-colours') || '{}'); } catch (e) { return {}; } })();
    const word = (i) => (kws.find((k) => k.classList.contains(i ? '-b' : '-a')) || {}).textContent || (i ? 'software' : 'website');
    pick.innerHTML = [0, 1].map((i) => `<label><span>${word(i)}</span><input type="color" data-i="${i}"><code></code></label>`).join('');
    const root = document.documentElement, defaults = ['#9ac9df', '#a3a3e0'];
    const apply = (i, v) => { root.style.setProperty(i ? '--kw-b' : '--kw-a', v); pick.querySelectorAll('code')[i].textContent = v.toUpperCase(); };
    pick.querySelectorAll('input').forEach((inp) => {
      const i = +inp.dataset.i, v = saved[i] || defaults[i]; inp.value = v; apply(i, v);
      inp.addEventListener('input', () => { apply(i, inp.value); saved[i] = inp.value; try { localStorage.setItem('realis-hero-colours', JSON.stringify(saved)); } catch (e) { /* private window */ } });
    });
    bar.appendChild(pick);
    const showPick = () => { pick.hidden = (document.documentElement.dataset.hero || '') !== '1'; };
    bar.addEventListener('click', showPick); showPick();
    document.body.appendChild(bar); mark();
  }

  // ── Animated product tiles, to NIRMATA's timelines (15 Nov). One easing family: entrances expo.out,
  // exits power2.in, pointer and camera power2.inOut, draws power2.out, only a button release back.out(2).
  // Each beat is a label b1…bn at the table's start time. They loop while at least half on screen,
  // restart from beat 1 on the way back, and cost nothing off screen. Reduced motion: one still.
  const LANG = document.documentElement.lang || 'en';
  const EUR = new Intl.NumberFormat(LANG === 'fr' ? 'fr-BE' : LANG === 'nl' ? 'nl-BE' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  document.querySelectorAll('[data-eur]').forEach((el) => { el.textContent = EUR.format(+el.dataset.eur); });
  const demo = (root, make, still) => typeReady.then(() => {  // measured from the laid-out text, so built once the type is here
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A fresh timeline renders nothing on pause(0): after a rebuild the old loop's last frame would stay up
    // (Andy, 16 Nov: the HQ tile showed the hook over a stray month card). Draw its first frame for real.
    const fresh = (t) => t.progress(0.0001, true).progress(0, true);
    let tl = make(), seen = false, w = root.clientWidth;
    root.__tl = () => tl;
    if (calm) { tl.pause(still); return; }
    tl.pause(0); fresh(tl);
    new IntersectionObserver(([e]) => {
      if (root.__hold) return;
      const on = e.intersectionRatio >= 0.5;
      if (on && !seen) tl.restart(); else if (!on && seen) tl.pause(0);
      seen = on;
    }, { threshold: [0, 0.5] }).observe(root);
    addEventListener('resize', () => {  // new sizes, new measures: rebuilt, from beat 1
      if (root.clientWidth === w) return; w = root.clientWidth;
      tl.kill(); tl = make(); if (seen && !root.__hold) tl.restart(); else { tl.pause(0); fresh(tl); }
    });
  });
  const rel = (root, el) => { const R = root.getBoundingClientRect(), b = el.getBoundingClientRect(); return { l: b.left - R.left, t: b.top - R.top, w: b.width, h: b.height }; };
  // the pointer: enters from the bottom right and glides on a slight curve (x and y eased apart)
  const glide = (tl, ptr, from, to, at, d) => tl
    .set(ptr, { x: from.x, y: from.y, autoAlpha: 1 }, at)
    .to(ptr, { x: to.x - 1.5, duration: d, ease: 'power2.inOut' }, at)
    .to(ptr, { y: to.y - 1.5, duration: d, ease: 'sine.inOut' }, at);
  const press = (tl, el, at) => tl
    .to(el, { scale: 0.97, duration: 0.1, ease: 'power2.out' }, at)
    .to(el, { scale: 1, duration: 0.15, ease: 'back.out(2)' }, at + 0.1);

  // Service pages: the line joining the three steps draws as they come into view (still under reduced motion)
  document.querySelectorAll('.sv-line').forEach((ln) => {
    if (reduce) return;
    const phone = matchMedia('(max-width: 767px)').matches;
    gsap.fromTo(ln, phone ? { scaleY: 0 } : { scaleX: 0 }, { ...(phone ? { scaleY: 1 } : { scaleX: 1 }), ease: 'none',
      scrollTrigger: { trigger: ln.parentElement, start: 'top 80%', end: phone ? 'bottom 60%' : 'top 30%', scrub: 0.6 } });
  });

  window.RealisAd = { demo, rel, glide, press, EUR, LANG, reduce, typeReady };  // for the ad-*.js files, each owning one tile

  // The carousel post: it swipes to its next page every 2.8 s, the incoming page drifting in a little;
  // drag, the dots and the arrows work too. It waits while hovered, focused or off screen; under
  // reduced motion it stays on its cover and the arrows show.
  document.querySelectorAll('.ig-post').forEach((post) => {
    const view = post.querySelector('.igp-view'), track = post.querySelector('.igp-track'), slides = [...post.querySelectorAll('.igp-slide')];
    const dots = [...post.querySelectorAll('.igp-dots button')], groups = [...post.querySelectorAll('.igp-g')], count = post.querySelector('.igp-count'), n = slides.length;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0, timer = null, hover = false, focus = false, seen = false;
    const go = (k, dir) => {
      const prev = i; i = (k + n) % n; const d = dir || (i > prev ? 1 : -1);
      track.style.transform = `translateX(${-i * 100}%)`;
      slides.forEach((x, j) => { x.classList.toggle('-in', j === i && !calm); x.setAttribute('aria-hidden', String(j !== i)); });
      slides[i].style.setProperty('--dir', d);
      const img = slides[i].querySelector('img'); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      const s = slides[i].dataset;  // the post on screen owns the counter and the dots, as on Instagram
      groups.forEach((g) => { g.hidden = g.dataset.p !== s.p; });
      dots.forEach((x) => x.setAttribute('aria-current', String(+x.dataset.i === i)));
      count.textContent = `${+s.k + 1}/${s.n}`;
    };
    const stop = () => { clearTimeout(timer); timer = null; };
    const tick = () => { stop(); if (!calm && seen && !hover && !focus) timer = setTimeout(() => { go(i + 1, 1); tick(); }, 2800); };
    post.addEventListener('mouseenter', () => { hover = true; stop(); }); post.addEventListener('mouseleave', () => { hover = false; tick(); });
    post.addEventListener('focusin', () => { focus = true; stop(); }); post.addEventListener('focusout', () => { focus = false; tick(); });
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; seen ? tick() : stop(); }, { threshold: 0.35 }).observe(post);
    dots.forEach((b) => b.addEventListener('click', () => { go(+b.dataset.i); tick(); }));
    post.querySelector('.-prev').addEventListener('click', () => { go(i - 1, -1); tick(); });
    post.querySelector('.-next').addEventListener('click', () => { go(i + 1, 1); tick(); });
    // drag: the pages follow the finger 1:1, and a throw past a sixth of the width turns the page
    let x0 = null, dx = 0;
    view.addEventListener('pointerdown', (e) => { if (e.button) return; x0 = e.clientX; dx = 0; stop(); track.classList.add('-drag'); view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', (e) => { if (x0 === null) return; dx = e.clientX - x0; track.style.transform = `translateX(calc(${-i * 100}% + ${dx}px))`; });
    const up = () => { if (x0 === null) return; x0 = null; track.classList.remove('-drag');
      if (Math.abs(dx) > view.clientWidth / 6) go(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); else go(i, 1); tick(); };
    view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
    go(0, 1);
  });

  // Contact opens the contact page again (Andy, 19 Nov: « I don't want it pop up again. Let's just have a
  // normal contact page »). The popup that stood here since 15 Nov is gone; its page is the form.

  // Header over a photo turns white (Andy, 14 Nov): the framed hero and the closing photo.
  const hdr = document.querySelector('.hd');
  const darks = [...document.querySelectorAll('.it-hero .main.-frame, .outro, .it-say, .ig-full')];
  const tone = () => { if (!hdr) return; const r = hdr.getBoundingClientRect(); const mid = r.top + r.height / 2;
    hdr.classList.toggle('-light', darks.some((el) => { const q = el.getBoundingClientRect(); return q.top <= mid && q.bottom >= mid; })); };
  addEventListener('scroll', tone, { passive: true }); addEventListener('resize', tone); tone();

  if (!window.gsap || reduce || still) return;
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll on Lenis, driven by GSAP's ticker so ScrollTrigger stays in step.
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;  // the prices dialog stops the page while it is open
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const expo = 'expo.out';
  const words = (el, delay = 0) => gsap.fromTo(el.querySelectorAll('.w'), { y: '120%' }, { y: '0%', duration: 1.7, stagger: { amount: 0.6 }, ease: expo, delay });
  const rise = (els) => {
    gsap.set(els, { opacity: 0, y: 70 });
    ScrollTrigger.batch(els, { once: true, onEnter: (b) => { gsap.to(b, { opacity: 1, duration: 1, stagger: 0.1 }); gsap.to(b, { y: 0, duration: 2, stagger: 0.1, ease: expo }); } });
  };

  // Entrance: header, then the headline, then the lede.
  const enter = gsap.timeline({ delay: 0.1 });
  // The wordmark: the dot's journey (Andy's storyboard, approved 14 Nov; logo-motion/storyboard.png).
  document.querySelectorAll('.hd .logo').forEach((logo) => logoJourney(logo));
  if (innerWidth >= 768) enter.fromTo('.hd nav > *', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, clearProps: 'all' }, 0);
  document.querySelectorAll('[data-split]').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight) enter.add(words(el), 0.15 + i * 0.1);
    else ScrollTrigger.create({ trigger: el, once: true, start: 'top 85%', animation: words(el) });
  });
  gsap.utils.toArray('[data-rise]').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) gsap.fromTo(el, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 2, ease: expo, delay: 0.5 }); });
  rise(gsap.utils.toArray('[data-rise]').filter((el) => el.getBoundingClientRect().top >= innerHeight));

  // Preview and project hero: open from a smaller inset, then drift with the scroll.
  document.querySelectorAll('.preview .main, .p-hero .main').forEach((main) => {
    const media = main.querySelector('.media');
    if (main.classList.contains('-frame')) gsap.fromTo(main, { clipPath: 'inset(5% 10%)', opacity: 0 }, { clipPath: 'inset(0% 0%)', opacity: 1, duration: 2.5, ease: expo, delay: 0.2 });
    else gsap.fromTo(main, { clipPath: 'inset(5% 10%)', scale: 0.9, opacity: 0 }, { clipPath: 'inset(0% 0%)', scale: 1, opacity: 1, duration: 2.5, ease: expo, delay: 0.2 });
    // On a phone a project scene is shown whole (site.css), so it gets no drift that would crop it.
    if (main.closest('.p-hero') && !main.classList.contains('-stage') && matchMedia('(max-width: 767px)').matches) return;
    gsap.set(media, { scale: 1.05 });
    gsap.fromTo(media, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: main, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // Project tiles: the screen inside each tile drifts a little against the scroll.
  document.querySelectorAll('[data-par]').forEach((el) => gsap.fromTo(el, { yPercent: 4 }, { yPercent: -4, ease: 'none', scrollTrigger: { trigger: el.closest('.it-tile') || el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  // Project hero (Andy, 14 Nov): as you scroll, the framed preview grows from the page margins to
  // the full width of the screen. The section is laid out full-bleed and starts scaled down to fit
  // inside the margins; the scroll brings it to 1.
  document.querySelectorAll('.it-hero .main.-frame').forEach((main) => {
    // Grows from its natural size (inside the margins) to the full screen width as you scroll: it
    // loads exactly as laid out, so nothing jumps (Andy, 14 Nov).
    const top0 = Math.round(main.getBoundingClientRect().top + scrollY);
    // The grown frame is taller than its box: keep that room below it, or it covers the top of the
    // overview and the summary sits against the picture (Andy, 15 Nov: « give the text breathing room »).
    const room = () => { main.style.marginBottom = `${main.offsetHeight * (document.documentElement.clientWidth / main.offsetWidth - 1)}px`; };
    room(); ScrollTrigger.addEventListener('refreshInit', room);
    gsap.fromTo(main, { scale: 1 }, { scale: () => document.documentElement.clientWidth / main.offsetWidth, ease: 'none', transformOrigin: '50% 0%', immediateRender: false,
      scrollTrigger: { trigger: main, start: `top ${Math.max(1, top0 - scrollY)}px`, end: 'top 8%', scrub: true, invalidateOnRefresh: true } });
  });
  // De Lange's page stack scrolls up, a page at a time (Andy, 15 Nov). Each page sits on one column,
  // centres 48.2 % of the tile apart; the one in the middle is full size, the others 87 %. It only
  // runs while the tile is on screen.
  document.querySelectorAll('.it-tile.-stack3 .stack').forEach((stack) => {
    const pages = [...stack.querySelectorAll('img')], n = pages.length, tile = stack.closest('.it-tile');
    if (n < 4) return;
    stack.classList.add('-live');
    const st = { p: 1 };  // the second page starts in the middle, as in the still version
    const lay = () => {
      const h = tile.clientHeight;
      pages.forEach((img, k) => {
        let o = ((k - st.p) % n + n) % n; if (o >= n / 2) o -= n;  // offset from the middle, wrapped
        const d = Math.min(1, Math.abs(o));
        gsap.set(img, { yPercent: -50, y: o * 0.482 * h, scale: 1 - 0.133 * d, zIndex: 10 - Math.round(Math.abs(o) * 2) });
      });
    };
    lay(); ScrollTrigger.addEventListener('refresh', lay);
    let next = null;
    const step = () => { gsap.to(st, { p: st.p + 1, duration: 1.1, ease: 'power3.inOut', onUpdate: lay, onComplete: () => { next = gsap.delayedCall(1.5, step); } }); };
    ScrollTrigger.create({ trigger: tile, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { if (self.isActive) { if (!next) next = gsap.delayedCall(1.2, step); } else { if (next) next.kill(); next = null; gsap.killTweensOf(st); st.p = Math.round(st.p); lay(); } } });
  });
  // The social media band on scroll: the phone and the carousel post rise together (Andy, 15 Nov).
  document.querySelectorAll('.ig-wall').forEach((wall) => {
    const reel = wall.querySelector('.ig-reel'), post = wall.querySelector('.ig-post');
    if (!reel || !post) return;
    const phone = matchMedia('(max-width: 767px)').matches;
    const tl = gsap.timeline({ scrollTrigger: { trigger: wall, start: 'top 92%', end: phone ? 'top 25%' : 'center 60%', scrub: 0.9 } });
    tl.fromTo(reel, { y: 110, rotation: -4, scale: 0.92 }, { y: 0, rotation: 0, scale: 1, ease: 'power2.out', duration: 1 }, 0)
      .fromTo(post, { y: 160, scale: 0.94 }, { y: 0, scale: 1, ease: 'power2.out', duration: 1 }, 0.08);
  });
  document.querySelectorAll('.outro .bg').forEach((bg) => gsap.fromTo(bg, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // Services: the first is open; each next one fills black and opens as you scroll past it.
  const items = gsap.utils.toArray('.feat .item');
  // (Andy, 16 Nov: « this page lags »: it was scrubbed frame by frame, its height, colour and two large
  // gradient layers. Now each row changes state once, as it reaches the middle, with a CSS transition.)
  items.forEach((it, i) => {
    if (i === 0) { it.classList.add('-active'); return; }
    ScrollTrigger.create({ trigger: it, start: 'top 62%', onEnter: () => it.classList.add('-active'), onLeaveBack: () => it.classList.remove('-active') });
  });

  // Round buttons: the border draws open, the label rises (their button entrance). Not on the contact page:
  // it has its own entrance, and on a short phone its Send sat below the 90 % line, so it stayed scaled to
  // nothing until the visitor scrolled (found 19 Nov at 320×568 in French and Dutch).
  document.querySelectorAll('.round').forEach((b) => {
    if (b.closest('.cx')) return;
    const t = b.querySelector('.t');
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(b, { scaleY: 0.5, scaleX: 0 }, { scaleY: 1, scaleX: 1, duration: 1.5, ease: expo }, 0).from(t, { y: '110%', duration: 1.2, ease: expo }, 0.1);
    ScrollTrigger.create({ trigger: b, once: true, start: 'top 90%', animation: tl });
  });

  // Cursor, written from scratch (no third-party code): follows with a short lag, shrinks on links,
  // shows a word over the work, sticks to round buttons.
  if (matchMedia('(hover: hover) and (min-width: 768px)').matches) {
    const cur = document.createElement('div'); cur.className = 'cur -hidden';
    const label = document.createElement('div'); label.className = 'cur-t'; cur.appendChild(label);
    document.body.appendChild(cur);
    const x = gsap.quickTo(cur, 'x', { duration: 0.6, ease: expo }), y = gsap.quickTo(cur, 'y', { duration: 0.6, ease: expo });
    let stick = null;
    addEventListener('mousemove', (e) => {
      cur.classList.remove('-hidden');
      if (stick) { const r = stick.getBoundingClientRect(); x(r.left + r.width / 2 - (r.left + r.width / 2 - e.clientX) * 0.15); y(r.top + r.height / 2 - (r.top + r.height / 2 - e.clientY) * 0.15); }
      else { x(e.clientX); y(e.clientY); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.add('-hidden'));
    document.querySelectorAll('a, button, summary').forEach((a) => {
      a.addEventListener('mouseenter', () => { const t = a.dataset.cursorText; if (t) { label.textContent = t; cur.classList.add('-text'); } else cur.classList.add('-pointer'); if (a.hasAttribute('data-cursor-stick')) stick = a; });
      a.addEventListener('mouseleave', () => { cur.classList.remove('-text', '-pointer'); stick = null; });
    });
    document.querySelectorAll('.hqa, .vda').forEach((s) => {  // the tiles have their own pointer
      s.addEventListener('mouseenter', () => cur.classList.add('-off')); s.addEventListener('mouseleave', () => cur.classList.remove('-off'));
    });
    document.querySelectorAll('.inv, .faq, .ft, .outro, .pc-card, .pc-sheet, .it-say, .ig-full').forEach((s) => {
      s.addEventListener('mouseenter', () => cur.classList.add('-inverse'));
      s.addEventListener('mouseleave', () => cur.classList.remove('-inverse'));
    });
    document.querySelectorAll('.pc-card, .pc-sheet').forEach((s) => {
      s.addEventListener('mouseenter', () => cur.classList.add('-glass'));
      s.addEventListener('mouseleave', () => cur.classList.remove('-glass'));
    });
  }
})();

// The dot's journey (Andy's storyboard, 14 Nov), re-timed to NIRMATA's motion review (14 Nov):
// one 2.1 s timeline, squash and stretch at the contact point with constant volume (sx·sy = 1),
// a true parabola (linear x), growth only on the way down, a roll that carries the landing speed,
// « studio » appearing letter by letter behind the dot's trailing edge, and an instant hand-over
// to the real « . ». Once per session, interruptible, skipped under reduced motion.
function logoJourney(logo) {
  let seen = false;
  try { seen = sessionStorage.getItem('realis-logo') === '1'; sessionStorage.setItem('realis-logo', '1'); } catch (e) { /* storage off: play */ }
  if (seen && !/[?&]logo=replay/.test(location.search)) return;  // later page views: the logo is simply there
  const realisChs = [...logo.querySelectorAll('.ch')].filter((c) => !c.closest('b, i'));
  const studioChs = [...logo.querySelectorAll('b .ch')];
  const iCh = realisChs.find((c) => c.textContent === 'i');
  const stop = logo.querySelector('i');
  if (!iCh || !stop || !studioChs.length) return;
  gsap.set([...realisChs, ...studioChs, stop], { opacity: 0 });
  iCh.textContent = 'ı';
  // If the journey cannot be measured (a tab opened hidden has no width, so the font size is 0 and
  // the canvas is empty), the logo is shown as it is instead of staying invisible.
  const giveUp = () => { iCh.textContent = 'i'; gsap.set([...realisChs, ...studioChs, stop], { clearProps: 'opacity' }); };
  // Never a missing logo: if the fonts take longer than 1.2 s (a slow phone), it simply appears, without the journey
  let started = false;
  const late = setTimeout(() => { if (!started) { started = true; giveUp(); } }, 1200);
  typeReady.then(() => { if (started) return; started = true; clearTimeout(late); try { run(); } catch (e) { giveUp(); } });
  const run = () => {
    const fs = parseFloat(getComputedStyle(logo).fontSize);
    if (!(fs > 4)) return giveUp();
    const dpr = window.devicePixelRatio || 1, px = (v) => Math.round(v * dpr) / dpr;
    const glyph = (weight, text, minus) => {
      const c = document.createElement('canvas'); c.width = Math.ceil(4 * fs); c.height = Math.ceil(3 * fs);
      const x = c.getContext('2d', { willReadFrequently: true });
      const draw = (t) => { x.clearRect(0, 0, c.width, c.height); x.font = `${weight} ${fs}px Outfit`; x.fillText(t, fs, 2 * fs); return x.getImageData(0, 0, c.width, c.height).data; };
      const a = draw(text), b = minus ? draw(minus) : null;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
        const k = (y * c.width + xx) * 4 + 3;
        if (a[k] > 128 && !(b && b[k] > 128)) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      return { cx: (x0 + x1) / 2 - fs, cy: (y0 + y1) / 2 - 2 * fs, r: (x1 - x0 + 1) / 2, top: y0 - 2 * fs };
    };
    const L = logo.getBoundingClientRect();
    const probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    logo.appendChild(probe); const base = probe.getBoundingClientRect().top - L.top; probe.remove();
    const wI = getComputedStyle(iCh).fontWeight;
    const tg = glyph(wI, 'i', 'ı'), stem = glyph(wI, 'ı'), sg = glyph(getComputedStyle(stop).fontWeight, '.');
    const iR = iCh.getBoundingClientRect(), pR = stop.getBoundingClientRect();
    const sb = studioChs[0].getBoundingClientRect(), se = studioChs[studioChs.length - 1].getBoundingClientRect();
    const tit = { x: iR.left - L.left + tg.cx, y: base + tg.cy, r: tg.r };
    const iTop = base + stem.top;                       // the top of the i's stem: where the dot lands
    const fin = { x: px(pR.left - L.left + sg.cx), y: px(base + sg.cy), r: sg.r };
    const s0 = sb.left - L.left, R = 0.37 * fs;
    // Each letter shows once the dot's trailing edge passes its centre (the review said its right edge,
    // but the shrinking dot never fully clears the « o », which then stayed missing until the end).
    const edges = studioChs.map((c) => { const q = c.getBoundingClientRect(); return (q.left + q.right) / 2 - L.left; });
    const shown = studioChs.map(() => false);
    const dot = document.createElement('span'); dot.className = 'logo-dot'; dot.setAttribute('aria-hidden', 'true'); logo.appendChild(dot);
    const land = iTop - tit.r;                          // centre when its bottom touches the stem
    const d = { x: tit.x, y: tit.y - 1.6 * fs, r: tit.r, sx: 1, sy: 1, o: 0 };
    const draw = () => {
      dot.style.width = dot.style.height = `${2 * d.r}px`;
      d.sy = 1 / d.sx;  // volume kept at every instant: only the width is animated, the height follows
      dot.style.transform = `translate(${d.x - d.r}px, ${d.y - d.r}px) scale(${d.sx}, ${d.sy})`;  // origin: bottom centre (site.css)
      dot.style.opacity = d.o;
      studioChs.forEach((c, k) => { if (!shown[k] && d.x - d.r >= edges[k]) { shown[k] = true; gsap.to(c, { opacity: 1, duration: 0.12, ease: 'power1.out' }); } });
    };
    draw();
    const finish = () => { gsap.set([...realisChs, ...studioChs, stop], { opacity: 1 }); iCh.textContent = 'i'; dot.remove(); };
    const tl = gsap.timeline({ onUpdate: draw, onComplete: finish });
    tl.to(realisChs, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)                                  // 1
      .to(d, { o: 1, duration: 0.08, ease: 'none' }, 0.35)                                                   // 2
      .to(d, { y: land, duration: 0.36, ease: 'power1.in' }, 0.35)                                           // 3 fall
      .to(d, { sx: 0.87, duration: 0.08, ease: 'none' }, 0.63)                                     // 4 stretch before impact
      .to(d, { sx: 1.25, duration: 0.05, ease: 'power1.out' }, 0.71)                                // 5 squash on the i
      .add(() => { iCh.textContent = 'i'; }, 0.76)                                                           // 6 take-off: the i's dot, under ours
      .to(d, { sx: 0.89, duration: 0.08, ease: 'none' }, 0.76)                                     // 7 stretch on take-off
      .to(d, { sx: 1, duration: 0.08, ease: 'none' }, 0.84)
      .to(d, { x: s0 + R, duration: 0.34, ease: 'none' }, 0.76)                                              // 8 flight: linear x (Rev 1: 0.76–1.10)
      .to(d, { y: tit.y - 0.55 * fs, duration: 0.15, ease: 'power1.out' }, 0.76)
      .to(d, { y: base - R, duration: 0.19, ease: 'power1.in' }, 0.91)
      .to(d, { r: R, duration: 0.18, ease: 'power1.in' }, 0.92)                                              // 9 grow on the way down
      .to(d, { sx: 1.12, duration: 0.05, ease: 'none' }, 1.1)                                     // 10 landing squash
      .to(d, { sx: 1, duration: 0.1, ease: 'power2.out' }, 1.15)
      .to(d, { x: fin.x, duration: 1.0, ease: 'power1.out' }, 1.1)                                           // 11 roll, at the flight's speed (Rev 1)
      .to(d, { r: fin.r, y: fin.y, duration: 0.55, ease: 'power2.inOut' }, 1.55)                             // 12 shrink into the stop
      .add(finish, 2.1);                                                                                     // 14 instant hand-over
    // On a phone the same storyboard plays in under a second (NIRMATA, 19 Nov: the live smoke test saw
    // « realis s ● » for about 3 s of a prospect's first five). ?logo=full shows the approved pace.
    if (matchMedia('(max-width: 767px)').matches && !/[?&]logo=full/.test(location.search)) tl.timeScale(2.3);
    logo.__journey = { tl, d, iTop, land, fin };  // exposed for frame-by-frame review; changes nothing in the motion
    // Interruptible: the first scroll, key or click ends it at once.
    const end = () => { if (tl.progress() < 1) tl.progress(1); };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, end, { once: true, passive: true }));
  };
}
