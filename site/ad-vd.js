/* Vidimus, the animated tile (ad B, the 16:9 mini ad), to NIRMATA's storyline (15 Nov), 24.5 s in eight scenes:
   a question docks as the header, the report's pages and what must be checked, three agents read it, they check
   each other, the overview, a person approves every finding, the header is answered, the end card.
   Its own file (one builder per tile); the shared helpers come from site.js as window.RealisAd. */
(() => {
  if (!window.RealisAd || !window.gsap) return;
  const { demo, rel, glide, press } = window.RealisAd;
  const SEVC = { h: 'rgba(229, 83, 75, 0.26)', m: 'rgba(227, 160, 8, 0.3)', l: 'rgba(140, 150, 146, 0.32)' }, OKC = 'rgba(47, 160, 100, 0.3)';

  document.querySelectorAll('.vda').forEach((root) => {
    const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => [...r.querySelectorAll(s)];
    // words for the masked rises, split after translation so each language keeps its own words (a no-break
    // space, as in « juste ? », keeps its word together)
    const words = (el) => {
      const ws = el.textContent.trim().split(/[ \t\n]+/); el.textContent = '';
      return ws.map((w, i) => {
        const m = document.createElement('span'), s = document.createElement('span');
        m.className = 'vda-wm'; s.className = 'vda-w'; s.textContent = w; m.appendChild(s); el.appendChild(m);
        if (i < ws.length - 1) el.appendChild(document.createTextNode(' '));
        return s;
      });
    };
    const qA = $('.vda-q.-a'), qB = $('.vda-q.-b'), qC = $('.vda-q.-c');
    const wA = words(qA), wB = words(qB), wC = words(qC), wL = words($('.vda-ln'));
    const sl = $('.vda-sl'), sg = $('.vda-sg'), note = $('.vda-note'), ptr = $(':scope > .ptr');
    const row = $(':scope > .vda-row'), pgs = $$(':scope > .vda-row > .vda-pg'), tags = $$('.vda-tg'), tagDots = tags.map((t) => $('i', t));
    const ags = $$(':scope > .vda-ag');
    const ovw = $('.vda-ovw'), oh = $('.vda-oh'), up = $('.vda-up'), rows = $$('.vda-or', ovw);
    const tals = $$('.vda-os > span, .vda-ok > span', ovw), gh = $('.vda-gh');
    const solo = $(':scope > .vda-solo'), lens = $(':scope > .vda-lens'), soloPage = $(':scope > .vda-solo > .vda-pp:not(.-clean)'), clean = $(':scope > .vda-solo > .vda-pp.-clean');
    const cnt = $('.vda-cnt'), strip = $('.vda-strip'), ckC = $('.vda-ck circle'), ckP = $('.vda-ck path');
    const cards = $$('.vda-cd'), caps = $$('.vda-cap'), capSpans = caps.map((c) => $('span', c));

    // the agents' marks: a thin line under each word an agent flags, in its model's colour, and the badge
    // the finding gets when several agree (2/3, 3/3)
    const COL = ags.map((a) => a.style.getPropertyValue('--ac'));
    const spots = [];
    pgs.forEach((pg, pi) => {
      const ov = $('.vda-ov', pg);
      $$('mark[data-f], .vd-x', pg).forEach((el, j) => {
        const f = el.dataset.f ? +el.dataset.f : 0, ag = el.dataset.a.split('').map(Number), id = f ? `f${f}` : `x${pi}${j}`;
        ag.forEach((a) => { const b = document.createElement('i'); b.className = 'vda-bar'; b.dataset.k = `${id}a${a}`; b.style.setProperty('--ac', COL[a]); ov.appendChild(b); });
        if (f) { const b = document.createElement('b'); b.className = `vda-bdg -${[...el.classList].find((c) => /^-[hml]$/.test(c)).slice(1)}`; b.dataset.k = `${id}b`; b.textContent = `${ag.length}/${ags.length}`; ov.appendChild(b); }
        spots.push({ pi, el, f, ag, id });
      });
    });
    const all = (k) => $$(`[data-k="${k}"]`);  // an element and its copies in the loupes
    // each loupe magnifies a copy of what it passes over: the pages for the agents, page 1 for the decision
    ags.forEach((ag) => $('.vda-lin', ag).appendChild(row.cloneNode(true)));
    $('.vda-lin', lens).appendChild(solo.cloneNode(true));
    const lins = $$('.vda-lin');
    const bars = $$('.vda-bar'), bdgs = $$(':scope > .vda-row .vda-bdg'), rowMarks = $$(':scope > .vda-row mark');
    const soloMk = (f) => $$(`.vda-solo mark[data-f="${f}"]`), digits = $$('.vda-solo .vd-dg b');
    const onPage1 = new Set(spots.filter((s) => s.pi === 0 && s.f).map((s) => s.f));

    const make = () => {
      const moved = [qA, qB, qC, row, ...pgs, ...ags, ...tags, ovw, ...rows, cnt, solo, lens, ...cards, ...cards.map((c) => $('.vda-go', c))];
      gsap.set(moved, { clearProps: 'transform' });
      const W = root.clientWidth, H = root.clientHeight, u = W / 100, mob = H > W, R0 = root.getBoundingClientRect();
      lins.forEach((l) => { l.style.width = `${W}px`; l.style.height = `${H}px`; });
      const cs = getComputedStyle(root), dock = parseFloat(cs.getPropertyValue('--dock')), dx = parseFloat(cs.getPropertyValue('--dx')) * u, dy = parseFloat(cs.getPropertyValue('--dy')) * u;

      // the hook: both sentences centred and large; docked: small, top left, on one line (two on a phone)
      const a = { w: qA.offsetWidth, h: qA.offsetHeight }, b = { w: qB.offsetWidth, h: qB.offsetHeight };
      const k = Math.min(1, (W * 0.88) / Math.max(a.w, b.w)), top = (H - (a.h + b.h) * k) / 2 - (mob ? 0 : H * 0.02);
      const hookA = { x: (W - a.w * k) / 2, y: top, scale: k }, hookB = { x: (W - b.w * k) / 2, y: top + a.h * k, scale: k };
      const dockA = { x: dx, y: dy, scale: dock }, dockC = { x: dx, y: dy, scale: dock * (mob ? 1.3 : 1.45) };
      const dockB = mob ? { x: dx, y: dy + a.h * dock * 0.94, scale: dock } : { x: dx + (a.w + a.h * 0.19) * dock, y: dy, scale: dock };

      // where each mark sits on its page, in per cent so the loupes' copies match
      const gap = (mob ? 1.15 : 0.5) * u, off = (mob ? 0.25 : 0.12) * u;
      spots.forEach((s) => {
        // the badge pins the mark's main line (its widest), at its end, raised like a superscript
        const P = $('.vda-pp', pgs[s.pi]).getBoundingClientRect(), rs = [...s.el.getClientRects()].filter((r) => r.width > 1), r0 = rs[0];
        const rl = rs.reduce((m, r) => (r.width > m.width ? r : m), rs[0]);
        const pc = (v, d) => `${(v / d) * 100}%`;
        s.ag.forEach((ai, i) => all(`${s.id}a${ai}`).forEach((el) => Object.assign(el.style, { left: pc(r0.left - P.left, P.width), top: pc(r0.bottom - P.top + off + i * gap, P.height), width: pc(r0.width, P.width) })));
        s.dy = s.ag.map((_, i) => -(off + i * gap + r0.height / 2));
        if (s.f) {  // kept inside the page: a pin at the right edge leans left
          const bw = all(`${s.id}b`)[0].offsetWidth, bx = Math.min(rl.right - P.left, P.width * 0.985 - bw * 0.65);
          all(`${s.id}b`).forEach((el) => Object.assign(el.style, { left: pc(bx, P.width), top: pc(rl.top - P.top - 0.12 * u, P.height) }));
        }
        s.pt = { x: r0.left - R0.left + Math.min(r0.width, P.width * 0.32) / 2, y: r0.top - R0.top + r0.height / 2 };
      });

      const tl = gsap.timeline({ repeat: -1, paused: true });
      // ── the state every loop starts from
      tl.set([qA, qB], { autoAlpha: 1 }, 0).set(qA, hookA, 0).set(qB, hookB, 0).set(qC, { ...dockC, autoAlpha: 0 }, 0)
        .set([...wA, ...wB, ...wC, ...wL, ...capSpans], { yPercent: 105 }, 0).set(caps, { autoAlpha: 1 }, 0)
        .set([...pgs, ...tags, ...ags, ovw, ...rows, ...tals, gh, solo, lens, cnt, ...cards, clean, sl, sg, note, ptr], { autoAlpha: 0 }, 0)
        .set(row, { scale: 1, autoAlpha: 1 }, 0).set(tagDots, { scale: 0 }, 0).set(rowMarks, { '--w': '0%' }, 0).set(oh, { autoAlpha: 1 }, 0)
        .set(cards, { x: 0 }, 0).set(cnt, { x: 0, y: 0, scale: 1 }, 0)
        .set(bars, { scaleX: 0, y: 0, autoAlpha: 1, transformOrigin: '0% 50%' }, 0).set(bdgs, { xPercent: -35, yPercent: -100, transformOrigin: '35% 100%', scale: 0.6, autoAlpha: 0 }, 0)
        .set(soloPage, { autoAlpha: 1 }, 0).set(digits, { yPercent: 0 }, 0).set($('.vda-end'), { autoAlpha: 1 }, 0)
        .set([strip, up], { yPercent: 0 }, 0).set(ckC, { strokeDasharray: 66, strokeDashoffset: 66 }, 0).set(ckP, { strokeDasharray: 16, strokeDashoffset: 16 }, 0)
        .set(cards.map((c) => $('.vda-go', c)), { autoAlpha: 1, scale: 1 }, 0).set(cards.map((c) => $('.vda-ap', c)), { autoAlpha: 0 }, 0)
        .set(cards.map((c) => $('.vda-ap .ck path', c)), { strokeDashoffset: 16 }, 0);
      [1, 2, 7, 8, 9, 11].forEach((f) => tl.set(soloMk(f), { '--c': SEVC[soloMk(f)[0].classList.contains('-h') ? 'h' : soloMk(f)[0].classList.contains('-m') ? 'm' : 'l'] }, 0));
      const capIn = (i, at) => tl.to(capSpans[i], { yPercent: 0, duration: 0.6, ease: 'expo.out' }, at);
      const capOut = (i, at) => tl.to(caps[i], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, at);

      // ── 1 · Hook (0.0–2.6): the question alone, word by word, then it docks as the header
      tl.addLabel('s1', 0).to([...wA, ...wB], { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.15)
        // the first sentence docks first; the second follows and rises only once the way is clear
        .to(qA, { ...dockA, duration: 0.5, ease: 'power2.inOut' }, 1.95)
        .to(qB, { x: dockB.x, scale: dockB.scale, duration: 0.6, ease: 'power2.inOut' }, 1.95).to(qB, { y: dockB.y, duration: 0.53, ease: 'power2.inOut' }, 2.07);

      // ── 2 · The burden (2.6–5.6): the report's pages stream in across the width; what must be checked lights up
      tl.addLabel('s2', 2.6).to(note, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 2.6);
      const fan = pgs.map((pg, i) => {
        if (!mob) return { x: 0, y: 0, rotation: 0, scale: 1 };
        const r = rel(root, pg), c = [[33, 77], [50, 107], [67, 137]][i];
        return { x: c[0] * u - (r.l + r.w / 2), y: c[1] * u - (r.t + r.h / 2), rotation: [-5, -0.5, 4][i], scale: 0.6 };
      });
      pgs.forEach((pg, i) => {
        const from = mob ? { ...fan[i], y: fan[i].y + H * 0.55, autoAlpha: 0 } : { x: W * 0.92 + i * W * 0.1, y: 0, rotation: 4 - i * 2, scale: 1, autoAlpha: 0 };
        tl.fromTo(pg, from, { ...fan[i], autoAlpha: 1, duration: 1.1, ease: 'expo.out', immediateRender: false }, 2.6 + i * 0.12);
      });
      tags.forEach((t, i) => tl.fromTo(t, { y: 1.2 * u, scale: 0.92, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, 3.4 + i * 0.22)
        .to(tagDots[i], { scale: 1, duration: 0.3, ease: 'power2.out' }, 3.6 + i * 0.22));
      tl.to(tags, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, 5.25);  // gone before the agents arrive
      if (mob) tl.to(pgs, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.6, ease: 'power2.inOut' }, 5.6);  // the pages gather, page 1 in front

      // ── 3 · Agents (5.6–9.2): three loupes read the report in parallel and mark what they find
      tl.addLabel('s3', 5.6); capIn(0, 5.85); capOut(0, 8.9);
      const Z = mob ? 1.75 : 1.9, D = ags[0].offsetWidth, Rr = D / 2;
      const lim = mob ? [56 * u, 150 * u] : [11.6 * u, 33 * u], clampY = (y) => Math.max(lim[0], Math.min(lim[1], y));
      // in three rounds each agent reads one part (a page; on a phone, a third of page 1) while the others read
      // the other two, then they move on, so every part is read by all three, in parallel
      const T0 = mob ? 6.25 : 5.85, span = mob ? 2.55 : 3.0, win = span / 3;
      const P0 = rel(root, $('.vda-pp', pgs[0])), cuts = [0, 0.36, 0.56, 1];
      const inPart = (s, r) => (mob ? s.pi === 0 && s.pt.y >= P0.t + P0.h * cuts[r] && s.pt.y < P0.t + P0.h * cuts[r + 1] : s.pi === r);
      const partBox = (r) => (mob ? { l: P0.l, w: P0.w, t: P0.t + P0.h * cuts[r], h: P0.h * (cuts[r + 1] - cuts[r]) } : rel(root, $('.vda-pp', pgs[r])));
      ags.forEach((ag, ai) => {
        const lin = $('.vda-lin', ag), p = { x: 0, y: 0 };
        const put = () => { ag.style.left = `${p.x - Rr}px`; ag.style.top = `${p.y - Rr}px`; lin.style.transform = `translate(${Rr - p.x * Z}px, ${Rr - p.y * Z}px) scale(${Z})`; };
        const pts = [];
        for (let w = 0; w < 3; w++) {
          const r = (ai + w) % 3, bx = partBox(r), t0 = T0 + w * win;
          const list = spots.filter((s) => inPart(s, r) && s.ag.includes(ai)).sort((m, n) => m.pt.y - n.pt.y || m.pt.x - n.pt.x);
          const stops = list.length ? list.map((s) => ({ x: s.pt.x, y: clampY(s.pt.y), s })) : [{ x: bx.l + bx.w * 0.5, y: clampY(bx.t + bx.h * 0.5) }];
          const step = stops.length > 1 ? (win - 0.4) / (stops.length - 1) : 0;
          stops.forEach((q, i) => pts.push({ ...q, t: t0 + 0.28 + step * i }));
        }
        const first = pts[0], entry = { x: first.x - 2 * u, y: clampY(first.y - 2 * u) };
        const appear = mob ? 6.0 : 5.6;
        tl.fromTo(p, { x: entry.x, y: entry.y }, { x: entry.x, y: entry.y, duration: T0 - appear, ease: 'none', onUpdate: put, immediateRender: false }, appear)
          .fromTo(ag, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, appear + ai * 0.08);
        let prev = { ...entry, t: T0 };
        pts.forEach((q) => {
          const d = Math.max(0.08, q.t - prev.t - 0.05);
          tl.fromTo(p, { x: prev.x, y: prev.y }, { x: q.x, y: q.y, duration: d, ease: 'power1.inOut', onUpdate: put, immediateRender: false }, q.t - d);
          if (q.s) tl.to(all(`${q.s.id}a${ai}`), { scaleX: 1, duration: 0.22, ease: 'power2.out' }, q.t - 0.04);
          prev = q;
        });
        tl.to(ag, { scale: 0.8, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 8.9);
      });

      // ── 4 · Cross-check (9.2–12.6): one agent's marks fade; shared ones merge into one mark with a badge
      tl.addLabel('s4', 9.2); capIn(1, 9.45); capOut(1, 12.3);
      tl.to(row, { scale: 1.02, duration: 3.4, ease: 'power2.inOut' }, 9.2);
      spots.filter((s) => !s.f).forEach((s) => tl.to(all(`${s.id}a${s.ag[0]}`), { scaleX: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.in', transformOrigin: '100% 50%' }, 9.3));
      spots.filter((s) => s.f).forEach((s) => s.ag.forEach((ai, i) => tl.to($$(`:scope > .vda-row [data-k="${s.id}a${ai}"]`), { y: s.dy[i], autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, 9.35)));
      tl.to(rowMarks, { '--w': '100%', duration: 0.45, ease: 'power2.out', stagger: 0.02 }, 9.55);
      const order = [...spots].filter((s) => s.f).sort((m, n) => m.pi - n.pi || m.pt.y - n.pt.y);
      order.forEach((s, i) => tl.to($$(`:scope > .vda-row [data-k="${s.id}b"]`), { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'expo.out' }, 9.95 + i * 0.05));

      // ── 5 · Tension (12.6–15.2): the overview, 13 findings, critical first
      tl.addLabel('s5', 12.6); capIn(2, 12.85); capOut(2, 14.9);
      tl.to(pgs, { y: -1 * u, autoAlpha: 0, duration: 0.3, ease: 'power2.in', stagger: 0.05 }, 12.6)
        .fromTo(ovw, { y: 2.4 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, 12.75)
        .to(up, { yPercent: -(13 / 14) * 100, duration: 0.9, ease: 'power2.out' }, 12.9)  // 0 → 13, landing on the exact count
        .to(tals, { autoAlpha: 1, duration: 0.4, ease: 'expo.out', stagger: 0.07 }, 13.0)
        .fromTo(rows, { y: 0.6 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', stagger: 0.04, immediateRender: false }, 13.1);

      // ── 6 · Action (15.2–18.6): a person approves #1, the page changes in place; then every other finding
      tl.addLabel('s6', 15.2); capIn(3, 15.45); capOut(3, 18.3);
      const r1 = rel(root, rows[0]), cR = rel(root, cards[0]);
      tl.set(gh, { left: r1.l, top: r1.t, width: r1.w, height: r1.h, autoAlpha: 1 }, 15.2)
        .to([oh, ...rows], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 15.2).to(ovw, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 15.25)
        .to(gh, { left: cR.l, top: cR.t, width: cR.w, height: cR.h, duration: 0.5, ease: 'expo.out' }, 15.2)
        .set(cards[0], { autoAlpha: 1 }, 15.62).to(gh, { autoAlpha: 0, duration: 0.1, ease: 'power2.in' }, 15.62)
        .fromTo(solo, { x: 6 * u, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, 15.3)
        .fromTo(cnt, { y: 0.8 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, 15.4);
      // the loupe over « via 5 », magnifying the page so the change can be read
      const dg = rel(root, $(':scope > .vda-solo .vd-dg')), LD = lens.offsetWidth, LR = LD / 2, LZ = mob ? 2.3 : 2.3;
      const lc = { x: dg.l + dg.w * 0.5 + 0.8 * u, y: dg.t + dg.h * 0.5 };
      lens.style.left = `${lc.x - LR}px`; lens.style.top = `${lc.y - LR}px`;
      $('.vda-lin', lens).style.transform = `translate(${LR - lc.x * LZ}px, ${LR - lc.y * LZ}px) scale(${LZ})`;
      tl.fromTo(lens, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'expo.out', immediateRender: false }, 15.65);
      const go1 = $('.vda-go', cards[0]), okR = rel(root, go1);
      glide(tl, ptr, { x: W + 8, y: H * (mob ? 0.97 : 0.88) }, { x: okR.l + okR.w * 0.42, y: okR.t + okR.h * 0.62 }, 15.7, 0.6); press(tl, go1, 16.3);
      // the button gives way to its « Approved » chip, one after the other, never both at once
      const approve = (c, at, quick) => tl.to($('.vda-go', c), { autoAlpha: 0, duration: quick ? 0.04 : 0.12, ease: 'power2.in' }, at)
        .to($('.vda-ap', c), { autoAlpha: 1, duration: quick ? 0.06 : 0.22, ease: 'power2.out' }, at + (quick ? 0.04 : 0.12))
        .to($('.vda-ap .ck path', c), { strokeDashoffset: 0, duration: quick ? 0.08 : 0.3, ease: 'power2.out' }, at + (quick ? 0.05 : 0.16));
      const step = (n, at, d = 0.18) => tl.to(strip, { yPercent: -(n / 14) * 100, duration: d, ease: 'power2.out' }, at);
      approve(cards[0], 16.42, false);
      tl.to(digits, { yPercent: -100, duration: 0.35, ease: 'power2.out' }, 16.45).to(soloMk(1), { '--c': OKC, duration: 0.35, ease: 'power2.out' }, 16.45);
      step(1, 16.45);
      tl.to([lens, ptr], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 16.75);
      // the run: #2 to #13, each card a beat faster than the last (0.21 s down to 0.09 s, 1.8 s in all), the count to 0
      let t = 16.8;
      cards.slice(1).forEach((c, i) => {
        const d = 0.21 - (0.12 * i) / 11, prevC = cards[i];
        tl.to(prevC, { x: -2.5 * u, autoAlpha: 0, duration: Math.min(0.12, d * 0.7), ease: 'power2.in' }, t)
          .fromTo(c, { x: 2.5 * u, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: Math.min(0.14, d * 0.8), ease: 'expo.out', immediateRender: false }, t);
        approve(c, t + d * 0.45, true); step(i + 2, t + d * 0.45, Math.min(0.18, d * 0.85));
        const f = +c.dataset.f; if (onPage1.has(f)) tl.to(soloMk(f), { '--c': OKC, duration: 0.2, ease: 'power2.out' }, t + d * 0.45);
        t += d;
      });

      // ── 7 · Resolution (18.6–20.4): 0, with a check; the page clean; the header answered
      tl.addLabel('s7', 18.6).to(cards[12], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 18.6);
      const nR = rel(root, cnt), ck = $('.vda-ck'), ckW = ck.getBoundingClientRect().width + parseFloat(getComputedStyle(ck).marginRight);
      const K = mob ? 1.45 : 1.75, gw = (ckW + nR.w) * K, cx = mob ? 50 * u : 29 * u, cy = mob ? 166 * u : 25 * u;
      tl.to(cnt, { x: cx - gw / 2 + ckW * K - nR.l, y: cy - (nR.t + nR.h / 2), scale: K, duration: 0.6, ease: 'power2.inOut' }, 18.65)
        .to(ckC, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, 19.0).to(ckP, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, 19.25)
        .fromTo(clean, { y: 0.5 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.inOut', immediateRender: false }, 18.75)
        .to(soloPage, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, 18.75)
        .to([qA, qB], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 18.75).set(qC, { autoAlpha: 1 }, 19.0)
        .to(wC, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.08 }, 19.0);

      // ── 8 · End card (20.4–24.0): the line word by word, the markets line, the name; then round again
      tl.addLabel('s8', 20.4).to([solo, cnt, qC, note], { autoAlpha: 0, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, 20.4)
        .to(wL, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 20.65)
        .fromTo(sl, { y: 0.8 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, 21.25)
        .fromTo(sg, { y: 0.6 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, 21.45);
      tl.addLabel('loop', 24.0).to($('.vda-end'), { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 24.0);
      return tl;
    };
    // everything is measured from the laid-out text, so the timeline is built once the type has loaded
    // (reduced motion: one still, the overview of the 13 findings under the question)
    const start = () => demo(root, make, 14.8);
    if (document.fonts && document.fonts.load) Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 16px 'Inter Tight'`))).then(start, start);
    else start();
  });
})();
