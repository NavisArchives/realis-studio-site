/* Headquarters, the animated tile (ad A, the storyline). Its own file (one builder per tile); the shared helpers come from site.js as window.RealisAd. */
(() => {
  if (!window.RealisAd || !window.gsap) return;
  const { demo, rel, glide, press, EUR } = window.RealisAd;

  // A. Headquarters as a storyline (NIRMATA, 15 Nov), 14 beats (labels b1…b14 at each start): a question →
  // HQ answers it → it spots money not yet invoiced → two clicks fix it → the answer is complete. 23.9 s in
  // HQ's flow; Andy's flow adds the email (+2.4 s from b11 on: 26.3 s).
  const B0 = [0, 2.6, 3.2, 5.6, 6.4, 8.6, 10.4, 11.6, 12.8, 15.4, 17.6, 19.8, 20.3, 23.4], L0 = 23.9, MAIL = 2.4;
  const BLUE = '#a9c8f0', INK = '#0f1a2e', NAVY = 'rgba(8, 17, 32, 0.42)', OR = '#f0a04b', SOFT = '#7ea6d8';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // words in masks, split after translation so each language keeps its own (on plain spaces only: the
  // French « ? » and « : » keep their no-break space)
  const split = (el) => { el.innerHTML = el.textContent.trim().split(/ +/).map((x) => `<span class="hqa-wm"><span class="hqa-w">${x}</span></span>`).join(' '); };

  document.querySelectorAll('.hqa').forEach((root) => {
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const ptr = $('.ptr'), q = $('.hqa-q'), ans = $('.hqa-ans');
    split(q);
    const qw = $$('.hqa-q .hqa-w');
    // the calendar
    const yr = $('.hqa-yr'), cells = $$('.hqa-grid .hqa-c'), nov = $('.hqa-grid .-nov');
    const fill = nov.querySelector('.hqa-fill'), novT = nov.querySelector('span'), dot = nov.querySelector('.hqa-dot');
    // the month card and its button
    const card = $('.hqa-card'), mt = $('.hqa-mt'), ring = $('.hqa-ring'), track = $('.hqa-tr'), segs = $$('.hqa-sg'), segO = $('.hqa-sg.-o');
    const tot = $('.hqa-tot b'), totS = $('.hqa-tot span'), totE = $('.hqa-tot em');
    const lis = $$('.hqa-leg li'), liO = $('.hqa-leg li.-o'), dotO = liO.querySelector('i'), stA = $('.hqa-sa'), stB = $('.hqa-sb');
    const btnC = $('.hqa-btn.-c'), c1 = btnC.querySelector('.hqa-b1'), c2 = btnC.querySelector('.hqa-b2'), spin = $('.hqa-spin');
    // the invoice
    const doc = $('.hqa-doc'), toast = $('.hqa-toast'), ckT = toast.querySelector('.hqa-ck path');
    const btnS = $('.hqa-btn.-s'), s1 = btnS.querySelector('.hqa-b1'), s2 = btnS.querySelector('.hqa-b2'), s3 = btnS.querySelector('.hqa-b3');
    const ckS = s3 && s3.querySelector('.hqa-ck path');
    // which flow (ad_hq.py FLOW): 'hq' = HQ's own (draft → Issue invoice → number → Mark sent → Sent), or 'andy'
    const hq = root.dataset.flow !== 'andy', pills = $$('.hqa-pill span'), num = $('.hqa-dn.-hq');
    const some = (a) => a.filter(Boolean);
    const B = B0.map((t, i) => (i >= 10 && !hq ? t + MAIL : t)), LOOP = L0 + (hq ? 0 : MAIL);
    // the email (Andy's flow): the card, its Send, the plane that flies off and its dotted trail
    const mail = $('.hqa-mail'), msend = $('.hqa-ms'), fly = $('.hqa-fly'), fp = $('.hqa-fp'), dotsG = $('.hqa-dots');
    // the line
    const end = $('.hqa-end'), sig = $('.hqa-sig');
    split($('.hqa-slogan'));
    const words = $$('.hqa-slogan .hqa-w');

    totE.textContent = `+ ${EUR.format(+totE.dataset.eur)}`;
    const C = 2 * Math.PI * 42, sum = segs.reduce((a, s) => a + +s.dataset.v, 0);
    let acc = 0;
    const arcs = segs.map((s) => { const len = (C * +s.dataset.v) / sum; const a = { s, len: Math.max(0, len - 1.4) }; s.style.strokeDashoffset = -acc; acc += len; return a; });
    const full = +tot.dataset.eur, blue = full - +segO.dataset.v, cnt = { v: 0 };
    const say = () => { tot.textContent = EUR.format(Math.round(cnt.v)); };

    const make = () => {
      // measure from a clean layout (a rebuild can land mid-move)
      gsap.set(card, { clearProps: 'left,top,width,height,right,bottom,transform' });
      gsap.set([q, ...cells, ...lis, doc, btnC, btnS], { clearProps: 'transform' });
      const W = root.clientWidth, H = root.clientHeight, u = W / 100;
      const cN = rel(root, nov), cF = rel(root, card), at = { x: cN.l + cN.w * 0.52, y: cN.t + cN.h * 0.6 };
      const qr = rel(root, q), dock = { y: 6 * u - qr.t, scale: 6.2 / 8.4 };  // the header: 6.2cqw type, 6cqw from the top
      const bc = rel(root, btnC), bs = rel(root, btnS), ro = rel(root, liO), dc = rel(root, doc);
      const back = { x: ro.l + ro.w / 2 - (dc.l + dc.w / 2), y: ro.t + ro.h / 2 - (dc.t + dc.h / 2), scale: ro.w / dc.w };
      // the flight: a gentle cubic curve from the email's centre to beyond the top right corner; the plane
      // icon points up and right (−45°), so it turns with the curve's tangent, a little
      let fl = null;
      if (mail) {
        gsap.set([mail, msend], { clearProps: 'transform' });
        const mr = rel(root, mail), sr = rel(root, msend), P0 = { x: mr.l + mr.w / 2, y: mr.t + mr.h / 2 };
        const P1 = { x: P0.x + 0.26 * W, y: P0.y - 0.02 * H }, P2 = { x: P0.x + 0.5 * W, y: P0.y - 0.3 * H }, P3 = { x: W + 14 * u, y: -14 * u };
        const bz = (t) => { const m = 1 - t; return { x: m * m * m * P0.x + 3 * m * m * t * P1.x + 3 * m * t * t * P2.x + t * t * t * P3.x, y: m * m * m * P0.y + 3 * m * m * t * P1.y + 3 * m * t * t * P2.y + t * t * t * P3.y }; };
        const turn = (t) => { const m = 1 - t; const dx = 3 * m * m * (P1.x - P0.x) + 6 * m * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x); const dy = 3 * m * m * (P1.y - P0.y) + 6 * m * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y); return (Math.atan2(dy, dx) * 180) / Math.PI + 45; };
        fly.setAttribute('viewBox', `0 0 ${W} ${H}`);
        dotsG.replaceChildren();
        const dots = [];
        for (let i = 1; i <= 22; i++) {
          const t = i / 23, p = bz(t), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); c.setAttribute('r', (0.55 * u).toFixed(2));
          dotsG.appendChild(c); dots.push({ c, t });
        }
        fl = { P0, bz, turn, dots, s: (9 * u) / 24, send: { x: sr.l + sr.w * 0.66, y: sr.t + sr.h * 0.62 }, p: { t: 0 } };
      }
      const tl = gsap.timeline({ repeat: -1, paused: true });
      B.forEach((t, i) => tl.addLabel(`b${i + 1}`, t));

      // the state every loop starts from
      tl.set(some([ans, yr, ...cells, card, mt, ring, track, tot, totS, totE, ...lis, stB, btnC, c2, doc, toast, btnS, s2, s3, ...pills.slice(1), num, end, sig, ptr]), { autoAlpha: 0 }, 0)
        .set(some([q, stA, c1, s1, pills[0]]), { autoAlpha: 1 }, 0).set(q, { y: 0, scale: 1, transformOrigin: '50% 0' }, 0).set(qw, { yPercent: 105 }, 0)
        .set(nov, { scale: 1 }, 0).set(fill, { scale: 0, '--fx': `${at.x - cN.l}px`, '--fy': `${at.y - cN.t}px` }, 0).set(novT, { color: '#c9d8ee' }, 0).set(dot, { backgroundColor: BLUE }, 0)
        .set(card, { left: cN.l, top: cN.t, width: cN.w, height: cN.h, right: 'auto', bottom: 'auto', x: 0, y: 0, scale: 1, backgroundColor: BLUE }, 0)
        .set(segs, { strokeDasharray: `0 ${C}` }, 0).set(segO, { strokeWidth: 8 }, 0).set([dotO, totE], { scale: 1 }, 0).set(segO, { stroke: OR }, 0).set(dotO, { backgroundColor: OR }, 0)
        .set(btnC, { y: 0, scale: 1, backgroundColor: BLUE, color: INK }, 0).set(spin, { rotation: 0, transformOrigin: '50% 50%' }, 0)
        .set(doc, { x: 0, y: 0, scale: 1, transformOrigin: '50% 50%' }, 0).set(btnS, { y: 0, scale: 1, backgroundColor: BLUE, color: INK }, 0)
        .set(some([ckS, ckT]), { strokeDashoffset: 16 }, 0).set(words, { yPercent: 105 }, 0)

        // the centre counts from zero on every loop (a repeat rewinds the counters without their onUpdate);
        // the stills under reduced motion seek with events, so they get the right figure too
        .call(() => { cnt.v = 0; say(); }, null, 0.01);
      if (fl) {
        tl.set([mail, fp, ...fl.dots.map((d) => d.c)], { autoAlpha: 0 }, 0).set([mail, msend], { x: 0, y: 0, scale: 1, transformOrigin: '50% 50%' }, 0)
          .set(fp, { svgOrigin: '0 0' }, 0);
      }

      // b1 · the hook: the question alone, large and centred, word by word, then held
      tl.to(qw, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, B[0]);
      // b2 · it docks: shrinks to the header at the top, where it stays through b8
      tl.to(q, { ...dock, duration: 0.6, ease: 'expo.inOut' }, B[1]);
      // b3 · the calendar: the year assembles; the pointer clicks November (the « today » dot)
      tl.fromTo(yr, { y: 2 * u }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, B[2]);
      cells.forEach((c, i) => tl.fromTo(c, { scale: 0.96, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, B[2] + Math.floor(i / 3) * 0.12 + (i % 3) * 0.04));
      glide(tl, ptr, { x: W + 8, y: H * 0.94 }, at, 4.4, 0.8);
      press(tl, nov, 5.2);
      tl.to(fill, { scale: 1, duration: 0.35, ease: 'power2.out' }, 5.2).to(novT, { color: INK, duration: 0.2, ease: 'power2.out' }, 5.25).to(dot, { backgroundColor: INK, duration: 0.2, ease: 'power2.out' }, 5.25);
      // b4 · zoom: the November cell grows into the month card (shared element); the rest of the year leaves
      tl.set(card, { autoAlpha: 1 }, B[3]).set(nov, { autoAlpha: 0 }, B[3] + 0.02)
        .to(card, { left: cF.l, top: cF.t, width: cF.w, height: cF.h, backgroundColor: NAVY, duration: 0.8, ease: 'expo.inOut' }, B[3])
        .to(cells.filter((c) => c !== nov), { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, B[3])
        .to(ptr, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, B[3])
        .to(yr, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, B[3] + 0.05)
        .fromTo(mt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'expo.out', immediateRender: false }, 6.05);
      // b5 · money grows: three blue segments, the centre counting up to what is invoiced
      tl.set([ring, tot], { autoAlpha: 1 }, B[4]).to([track, totS], { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, B[4])
        .fromTo(cnt, { v: 0 }, { v: blue, duration: 1.6, ease: 'power2.out', onUpdate: say, immediateRender: false }, B[4]);
      arcs.slice(0, 3).forEach((a, i) => tl.to(a.s, { strokeDasharray: `${a.len} ${C}`, duration: 0.5, ease: 'power2.out' }, B[4] + i * 0.55)
        .fromTo(lis[i], { y: 1.2 * u }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, B[4] + i * 0.55));
      // b6 · the gap: the fourth segment in orange, « Not yet invoiced », a calm pulse, three times at 2 Hz.
      // The orange stays whole (#f0a04b, never thinned over the navy): the arc swells, the dot and « + €2,600 » grow
      const pulse = { duration: 0.25, ease: 'sine.inOut', yoyo: true, repeat: 5 };
      tl.to(arcs[3].s, { strokeDasharray: `${arcs[3].len} ${C}`, duration: 0.5, ease: 'power2.out' }, B[5])
        .fromTo(liO, { y: 1.2 * u }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, B[5])
        .fromTo(totE, { y: 1.5 * u }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, 8.75)
        .to(segO, { strokeWidth: 11.5, ...pulse }, 8.9).to(dotO, { scale: 1.45, ...pulse }, 8.9).to(totE, { scale: 1.07, ...pulse }, 8.9);
      // b7 · the call to action: the card makes room, the button rises under it (« Invoice €2,600 », or Andy's
      // « Create invoice »); pressed at 11.4.
      // (It rises 0.2 s before b7, during the last pulse, so its label holds 1.2 s before it changes.)
      tl.to(card, { y: -8.2 * u, duration: 0.4, ease: 'power2.inOut' }, B[6] - 0.2)
        .fromTo(btnC, { y: 3 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, B[6] - 0.2);
      glide(tl, ptr, { x: W + 8, y: H * 0.96 }, { x: bc.l + bc.w * 0.88, y: bc.t + bc.h * 0.55 }, 10.75, 0.6);
      press(tl, btnC, 11.4);
      if (hq) {
        // b8 · busy: HQ disables the button while it drafts; it keeps its words, a spinner beside them
        tl.to(c1, { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, B[7])
          .to(btnC, { backgroundColor: 'rgba(169, 200, 240, 0.16)', color: '#e8eef8', duration: 0.3, ease: 'power2.out' }, B[7])
          .to(c2, { autoAlpha: 1, duration: 0.2, ease: 'expo.out' }, B[7] + 0.05)
          .to(spin, { rotation: 300, duration: 0.7, ease: 'none' }, B[7] + 0.05);
        // b9 · the draft (from 12.3, 0.5 s before b9: no new words while busy): the document rises, a Draft with
        // no number; HQ's toast « Draft invoice created »; « Issue invoice » under it, pressed at 14.9
        const t9 = 12.3;
        tl.to([card, btnC], { scale: 0.98, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t9).to(q, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t9)
          .to(ptr, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, t9)
          .fromTo(doc, { y: 8 * u, scale: 0.96 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, t9 + 0.1)
          .fromTo(toast, { y: -10 * u }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, t9 + 0.45)
          .to(ckT, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, t9 + 0.7)
          .fromTo(btnS, { y: 3 * u }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, t9 + 0.95);
        glide(tl, ptr, { x: W + 8, y: H * 0.98 }, { x: bs.l + bs.w * 0.88, y: bs.t + bs.h * 0.55 }, 14.3, 0.6);
        // b10 · issued: the number arrives, the pill reads « Issued », the button becomes HQ's « Mark sent »;
        // pressed at 16.55, the pill reads « Sent » (HQ shows no toast for it: the pill is its confirmation)
        press(tl, btnS, 14.9);
        tl.to(toast, { y: -4 * u, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 14.9)
          .to(pills[0], { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, 15.0).to(pills[1], { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 15.05)
          .fromTo(num, { y: 1.2 * u }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, 15.0)
          .to(s1, { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, 15.1).to(s2, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 15.15);
        press(tl, btnS, 16.55);
        tl.to(btnS, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 16.65)
          .to(pills[1], { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, 16.6).to(pills[2], { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 16.65)
          .to(ptr, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 16.85);
      } else {
        // b8 · loading: the button turns into its busy state, a spinner and « Creating invoice… »
        tl.to(c1, { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, B[7])
          .to(btnC, { backgroundColor: 'rgba(169, 200, 240, 0.16)', color: '#e8eef8', duration: 0.3, ease: 'power2.out' }, B[7])
          .to(c2, { autoAlpha: 1, duration: 0.25, ease: 'expo.out' }, B[7] + 0.05)
          .to(spin, { rotation: 600, duration: 1.25, ease: 'none' }, B[7] + 0.05);
        // b9 · the invoice: the document rises, the toast confirms it, « Send to client » appears under it.
        // (The month card leaves 0.1 s after b9, so « Creating invoice… » holds 1.2 s.)
        const t9 = B[8] + 0.1;
        tl.to([card, btnC], { scale: 0.98, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t9).to(q, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t9)
          .to(ptr, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, t9)
          .fromTo(doc, { y: 8 * u, scale: 0.96 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, t9 + 0.1)
          .fromTo(toast, { y: -10 * u }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, t9 + 0.45)
          .to(ckT, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, t9 + 0.7)
          .fromTo(btnS, { y: 3 * u }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, t9 + 0.85);
        glide(tl, ptr, { x: W + 8, y: H * 0.98 }, { x: bs.l + bs.w * 0.88, y: bs.t + bs.h * 0.55 }, 14.6, 0.6);
        // b10 · send (pressed at 15.2, 0.2 s early): the invoice slides back, the email rises in front of it
        // (From, To, Subject, one line, the PDF attached), held 1.7 s; the pointer presses its Send at 17.25
        const t10 = B[9] - 0.2, from = { x: bs.l + bs.w * 0.88 - 1.5, y: bs.t + bs.h * 0.55 - 1.5 };
        press(tl, btnS, t10);
        tl.addLabel('mail', t10 + 0.1)
          .to(toast, { y: -4 * u, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t10)
          .to(btnS, { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, t10 + 0.1)
          .to(doc, { scale: 0.88, y: -6 * u, autoAlpha: 0.5, duration: 0.5, ease: 'expo.out' }, t10 + 0.1)
          // (opaque within 0.12 s, so nothing reads through it while it rises)
          .fromTo(mail, { y: 12 * u, scale: 0.96 }, { y: 0, scale: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, t10 + 0.1)
          .to(mail, { autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, t10 + 0.1);
        glide(tl, ptr, from, fl.send, 16.75, 0.45);
        press(tl, msend, 17.25);
        // it folds into a paper plane (0.4 s), which flies off to the top right on a curve, a faint dotted
        // trail behind it that fades (0.55 s, power2.in)
        const tf = 17.5, tg = tf + 0.4;
        tl.addLabel('send', 17.25).addLabel('fold', tf).addLabel('fly', tg)
          .to(mail, { scale: 0.06, duration: 0.32, ease: 'power3.in' }, tf).to(mail, { autoAlpha: 0, duration: 0.1, ease: 'power2.in' }, tf + 0.22)
          .to(ptr, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, tf)
          .to(doc, { autoAlpha: 0.2, duration: 0.3, ease: 'power2.inOut' }, tf)  // further back: the plane reads on the navy
          .set(fp, { x: fl.P0.x, y: fl.P0.y, rotation: fl.turn(0), scale: fl.s * 0.4 }, tf)
          .to(fp, { scale: fl.s, autoAlpha: 1, duration: 0.22, ease: 'expo.out' }, tf + 0.24)
          .fromTo(fl.p, { t: 0 }, { t: 1, duration: 0.55, ease: 'power2.in', immediateRender: false,
            onUpdate: () => { const q2 = fl.bz(fl.p.t); gsap.set(fp, { x: q2.x, y: q2.y, rotation: fl.turn(fl.p.t) }); } }, tg);
        // each dot appears as the plane passes it (its eased time) and fades a moment later, so the trail thins
        // out behind the plane; the plane itself is put away once it has left the tile
        fl.dots.forEach((d) => { const a = tg + 0.55 * Math.sqrt(d.t); tl.to(d.c, { autoAlpha: 1, duration: 0.06, ease: 'none' }, a).to(d.c, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, a + 0.25); });
        tl.set(fp, { autoAlpha: 0 }, tg + 0.56)
          // sent: the invoice comes back to the front, « Sent to client ✓ » under it, held until b11
          .addLabel('sent', tg + 0.55)
          .to(doc, { scale: 1, y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' }, tg + 0.55)
          .set(btnS, { backgroundColor: 'rgba(15, 26, 46, 0.55)', color: BLUE, scale: 1 }, tg + 0.55).set(s1, { autoAlpha: 0 }, tg + 0.55).set(s3, { autoAlpha: 1 }, tg + 0.55)
          .fromTo(btnS, { y: 3 * u }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'expo.out', immediateRender: false }, tg + 0.6)
          .to(ckS, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, tg + 0.7);
      }
      // b11 · resolution (0.25 s after b11, so « Sent » / « Sent to client » holds 1.2 s): the invoice shrinks
      // back into the orange row, opaque all the way, and dissolves there (reverse shared element); the card
      // returns under it, orange turns blue, « Invoiced », the centre settles on the whole month, the header answers
      const t11 = B[10] + 0.25;
      tl.to(btnS, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, t11).to(ptr, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, t11)
        .to(doc, { ...back, duration: 0.55, ease: 'power2.inOut' }, t11).to(doc, { autoAlpha: 0, duration: 0.15, ease: 'power2.in' }, t11 + 0.4)
        .fromTo(card, { y: 0, scale: 0.98, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, t11 + 0.2)
        .to(q, { autoAlpha: 1, duration: 0.35, ease: 'expo.out' }, t11 + 0.2)
        .to(segO, { stroke: SOFT, duration: 0.6, ease: 'power2.inOut' }, t11 + 0.3).to(dotO, { backgroundColor: SOFT, duration: 0.6, ease: 'power2.inOut' }, t11 + 0.3)
        .to(stA, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, t11 + 0.3).to(stB, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, t11 + 0.45)
        .to(totE, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t11 + 0.3)
        .fromTo(cnt, { v: blue }, { v: full, duration: 0.6, ease: 'power2.inOut', onUpdate: say, immediateRender: false }, t11 + 0.3)
        .to(q, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, t11 + 0.5)
        .to(ans, { autoAlpha: 1, duration: 0.3, ease: 'power2.inOut' }, t11 + 0.55);
      // b12 · clear; b13 · the line, word by word, the signature under it; b14 · fade, and round again
      tl.to([card, ans], { scale: 0.98, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, B[11])
        .set(end, { autoAlpha: 1 }, B[12]).to(words, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, B[12])
        .fromTo(sig, { y: 2 * u }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, B[12] + 0.6)
        .to(end, { autoAlpha: 0, duration: LOOP - B[13], ease: 'power2.in' }, B[13]);
      // the timeline's own start state only renders once it plays: show it now, so the tile waits on its
      // first frame (the ground, empty), not on the line, until it is half on screen
      gsap.set(end, { autoAlpha: 0 }); gsap.set(q, { autoAlpha: 1 }); gsap.set([...qw, ...words], { yPercent: 105 });
      return tl;
    };
    const built = demo(root, make, 9.9);  // a promise: the tile is built once the type is here (typeReady, site.js)

    // Reduced motion (NIRMATA): three stills in turn, 3 s each, crossfaded: the gap, the invoice sent, the
    // answer. Only while the tile is on screen; it starts again from the first on the way back. It runs once the
    // tile is built: before, root.__tl did not exist yet and the stills threw (NIRMATA, 20 Nov).
    if (!calm) return;
    built.then(() => {
    const stills = hq ? [9.9, 17.3, 19.3] : [9.9, 19.3, 21.7];  // 9.9: between two pulses, the orange at full strength
    let i = 0, next = null;
    const show = (t) => { const tl = root.__tl(); tl.pause(); tl.seek(0, false); tl.seek(t, false); };
    const turn = () => {
      next = gsap.delayedCall(3, () => {
        if (root.__hold) return;
        gsap.to(root, { opacity: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => {
          i = (i + 1) % stills.length; show(stills[i]);
          gsap.to(root, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }); turn();
        } });
      });
    };
    show(stills[0]);
    addEventListener('resize', () => show(stills[i]));  // after site.js rebuilt the timeline for the new width
    new IntersectionObserver(([e]) => {
      if (root.__hold) return;
      if (next) { next.kill(); next = null; }
      gsap.killTweensOf(root); gsap.set(root, { opacity: 1 });
      i = 0; show(stills[0]);
      if (e.intersectionRatio >= 0.5) turn();
    }, { threshold: [0, 0.5] }).observe(root);
    });
  });
})();
