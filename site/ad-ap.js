/* Approval portal, the animated tile (ad C). Its own file (one builder per tile); the shared helpers come from site.js as window.RealisAd. */
(() => {
  if (!window.RealisAd || !window.gsap) return;
  const { demo, rel, glide, press, reduce } = window.RealisAd;

  // C. Approval portal, to NIRMATA's storyline (24.5 s): « Your new website. Did you approve every word? »
  // docks as the header → Missions → a field approved, 10 → 11 → a word is edited and its approval is
  // cleared, 11 → 10 → read again and approved again → every field approved, the page ticked, French
  // published → the header answers « Every word, yes. » → the end card.
  // The counts are the portal's own sample data (« 10 champs approuvés sur 27 », page-3 / mobile captures).
  document.querySelectorAll('.apa').forEach((root) => {
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    // masked words, split after translation; a no-break space (French « mot ? ») keeps its pair together
    const words = (el) => { el.innerHTML = el.textContent.trim().split(/[ \t\n]+/).map((x) => `<span class="apa-wm"><span class="apa-w">${x}</span></span>`).join(' '); return [...el.querySelectorAll('.apa-w')]; };
    const hq = $('.apa-hq'), ha = $('.apa-ha'), lines = [...hq.children], hookW = lines.flatMap((l) => words(l));
    const panel = $('.apa-panel'), plab = $('.apa-panel .apa-lab'), rows = $$('.apa-row'), kine = $('.apa-row.-kine');
    const others = rows.filter((r) => r !== kine), tags = $$('.apa-row em'), kineKids = [...kine.children];
    const sheet = $('.apa-sheet'), shParts = [...$('.apa-sh-in').children], bar = $('.apa-sheet .apa-bar i'), kB = $$('.apa-sheet .apa-k b');
    const field = $('.apa-field'), rd = $('.apa-rd'), wd = $('.apa-wd'), caret = $('.apa-caret');
    const mod = $('.apa-sheet .-mod'), ok = $('.apa-sheet .-ok'), okT = ok.firstElementChild, chip = $('.apa-sheet .apa-chip'), chipCk = chip.querySelector('.ck path');
    const page = $('.apa-page'), pParts = [...page.children], pBar = $('.apa-page .apa-bar i'), pN = $('.apa-page .apa-n');
    const fRows = $$('.apa-fields li'), fCk = $$('.apa-fields .ck path'), box = $('.apa-box'), boxCk = box.querySelector('.ck path');
    const st = $('.apa-st'), stDot = $('.apa-st i'), st1 = $('.apa-st .s1'), st2 = $('.apa-st .s2');
    const caps = $$('.apa-cap > span'), end = $('.apa-end'), sign = $('.apa-sign'), note = $('.apa-note'), ptr = $('.ptr');
    const endW = words(end);
    // the edit: « Deux » deleted letter by letter, « Trois » typed (the field stays French, as captured)
    const TYPE = ['Deux', 'Deu', 'De', 'D', '', 'T', 'Tr', 'Tro', 'Troi', 'Trois'];
    const ty = { k: 0 }, cnt = { v: 11 };
    const typeTo = () => { wd.textContent = TYPE[Math.min(9, Math.floor(ty.k + 1e-6))]; };
    const BLUE = 'rgb(147, 197, 240)', LIFT = 'rgb(29, 49, 80)', SHEET = 'rgb(20, 36, 62)';

    const make = () => {
      gsap.set([hq, ha, panel, ...rows, sheet, page, mod, ok], { clearProps: 'transform' });
      gsap.set(sheet, { clearProps: 'left,top,width,height,borderRadius,backgroundColor' });
      gsap.set(ok, { clearProps: 'left,width,backgroundColor' });
      const W = root.clientWidth, H = root.clientHeight, u = W / 100;
      const Dq = rel(root, hq), K = rel(root, kine), S = rel(root, sheet), okR = rel(root, ok), bxR = rel(root, box);
      const okL = ok.offsetLeft, okW = ok.offsetWidth, chL = chip.offsetLeft, chW = chip.offsetWidth;
      // the hook is the docked header scaled up: as large as its longer line allows (86cqw), centred in the tile
      const k = Math.min(1.5, (0.86 * W) / Math.max(...lines.map((l) => l.offsetWidth))), yc = H * 0.48 - Dq.t - (Dq.h * k) / 2;
      const lift = 0.7 * u, enter = { x: W + 8, y: H * 0.9 };
      const kPt = { x: K.l + K.w * 0.3, y: K.t + K.h * 0.34 - lift }, okPt = { x: okR.l + okR.w * 0.5, y: okR.t + okR.h * 0.58 };
      const bxPt = { x: bxR.l + bxR.w * 0.55, y: bxR.t + bxR.h * 0.6 };
      const tl = gsap.timeline({ repeat: -1, paused: true });

      // the state every loop starts from
      tl.set([ha, panel, plab, ...rows, ...tags, sheet, ...shParts, chip, caret, page, ...pParts, ...fRows, st2, end, sign, note, ptr], { autoAlpha: 0 }, 0)
        .set(hq, { autoAlpha: 1, x: 0, y: yc, scale: k, transformOrigin: '0 0' }, 0).set(hookW, { yPercent: 105 }, 0).set(ha, { y: 0, scale: 1 }, 0)
        .set(caps, { yPercent: 105, autoAlpha: 1 }, 0).set(endW, { yPercent: 105 }, 0)
        .set(kine, { y: 0, scale: 1, backgroundColor: 'rgba(29, 49, 80, 0)', '--sh': 0 }, 0).set(kineKids, { autoAlpha: 1 }, 0)
        .set(sheet, { left: K.l, top: K.t - lift, width: K.w, height: K.h, borderRadius: 2 * u, backgroundColor: LIFT, y: 0 }, 0)
        .set(bar, { scaleX: 0 }, 0).set(kB, { yPercent: 0 }, 0)
        .set(field, { '--ring': 0 }, 0).set(rd, { '--rd': '0%', '--ra': 1 }, 0).set(wd, { '--w': '0%', '--wa': 1 }, 0)
        .set([mod, ok, okT], { autoAlpha: 1, y: 0, scale: 1 }, 0).set(ok, { left: okL, width: okW, backgroundColor: BLUE }, 0)
        .set(chip, { scale: 1 }, 0).set(chipCk, { strokeDashoffset: 16 }, 0)
        .set(pBar, { scaleX: 11 / 27 }, 0).set(fCk, { strokeDashoffset: 16 }, 0).set(boxCk, { strokeDashoffset: 16 }, 0)
        .set(box, { backgroundColor: 'rgba(147, 197, 240, 0)', '--ring': 1, scale: 1 }, 0)
        .set(st1, { autoAlpha: 1 }, 0).set(stDot, { backgroundColor: '#7d8aa0' }, 0).set(st, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }, 0)
        .call(() => { ty.k = 0; typeTo(); cnt.v = 11; pN.textContent = '11'; }, null, 0);

      // a field approved: « Approuver » moves into the chip « Approuvé et enregistré ✓ », 10 → 11 of 27
      const approve = (t) => tl
        .to(okT, { autoAlpha: 0, duration: 0.12, ease: 'power2.in' }, t)
        .to(mod, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, t)
        .to(ok, { left: chL, width: chW, backgroundColor: 'rgba(147, 197, 240, 0)', duration: 0.4, ease: 'expo.out' }, t)
        .to(chip, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out' }, t + 0.15).set(ok, { autoAlpha: 0 }, t + 0.4)
        .to(chipCk, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, t + 0.25)
        .to(kB, { yPercent: -100, duration: 0.4, ease: 'power2.out' }, t + 0.15)
        .to(bar, { scaleX: 11 / 27, duration: 0.4, ease: 'power2.out' }, t + 0.15);

      // 1 Hook: the question alone, word by word; then it docks as the header (expo.inOut 0.6 s)
      tl.addLabel('s1', 0).to(hookW, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.15);
      tl.to(hq, { y: 0, scale: 1, duration: 0.6, ease: 'expo.inOut' }, 1.95);

      // 2 Missions: the rows draw in; the pointer comes to « Kiné du sport », which lifts, and opens it
      tl.addLabel('s2', 2.6)
        .fromTo(panel, { y: 5 * u, scale: 0.98, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: 'expo.out' }, 2.6)
        .to(note, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 2.7)
        .to(plab, { autoAlpha: 1, duration: 0.5, ease: 'expo.out' }, 2.75)
        .fromTo(rows, { x: -3 * u, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.08 }, 2.85)
        .fromTo(tags, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.08 }, 3.0);
      glide(tl, ptr, enter, kPt, 3.95, 0.8);
      tl.to(kine, { backgroundColor: LIFT, duration: 0.15, ease: 'power2.out' }, 4.75)
        .to(kine, { y: -lift, '--sh': 1, duration: 0.5, ease: 'expo.out' }, 4.8);
      press(tl, kine, 5.1);
      tl.to(kineKids, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 5.2);

      // 3 Approve: the row opens into its field (shared element); « Approuver » → approved, 10 → 11
      tl.addLabel('s3', 5.4)
        .set(sheet, { autoAlpha: 1 }, 5.4).set(kine, { autoAlpha: 0 }, 5.4)
        .to(sheet, { left: S.l, top: S.t, width: S.w, height: S.h, borderRadius: 3.2 * u, backgroundColor: SHEET, duration: 0.8, ease: 'expo.inOut' }, 5.4)
        .to([...others, plab], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 5.4).set(panel, { autoAlpha: 0 }, 6.2)
        .fromTo(shParts, { y: 1.5 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, 5.95)
        .to(bar, { scaleX: 10 / 27, duration: 0.5, ease: 'power2.out' }, 6.15);
      glide(tl, ptr, kPt, okPt, 6.7, 0.7);
      press(tl, ok, 7.45);
      approve(7.6);
      tl.to(ptr, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 8.2);

      // 4 Tension: a word of that field is edited; its approval is cleared, 11 → 10
      tl.addLabel('s4', 8.6)
        .to(field, { '--ring': 1, duration: 0.3, ease: 'power2.out' }, 8.7)
        .set(caret, { autoAlpha: 1 }, 8.85)
        .fromTo(ty, { k: 0 }, { k: 4, duration: 0.32, ease: 'none', onUpdate: typeTo, immediateRender: false }, 9.15)
        .fromTo(ty, { k: 4 }, { k: 9, duration: 0.45, ease: 'none', onUpdate: typeTo, immediateRender: false }, 9.55)
        .to(wd, { '--w': '100%', duration: 0.3, ease: 'power2.out' }, 10.05)
        .to(chip, { autoAlpha: 0, scale: 0.96, duration: 0.3, ease: 'power2.in' }, 10.3)
        .to(kB, { yPercent: 0, duration: 0.4, ease: 'power2.out' }, 10.45)
        .to(bar, { scaleX: 10 / 27, duration: 0.4, ease: 'power2.out' }, 10.45)
        .set(ok, { left: okL, width: okW, backgroundColor: BLUE }, 10.6).set(okT, { autoAlpha: 1 }, 10.6).set(chipCk, { strokeDashoffset: 16 }, 10.6)
        .fromTo([mod, ok], { y: 1.2 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.05, immediateRender: false }, 10.6)
        .set(caret, { autoAlpha: 0 }, 10.55).set(caret, { autoAlpha: 1 }, 11.05).set(caret, { autoAlpha: 0 }, 11.55);

      // 5 Action: the practitioner reads the new wording (a sweep) and approves it again, 10 → 11
      tl.addLabel('s5', 11.8)
        .to(field, { '--ring': 0, duration: 0.3, ease: 'power2.out' }, 11.8)
        .to(rd, { '--rd': '100%', duration: 0.7, ease: 'power2.inOut' }, 11.85);
      glide(tl, ptr, enter, okPt, 12.3, 0.6);
      press(tl, ok, 12.95);
      approve(13.1);
      tl.to(rd, { '--ra': 0, duration: 0.4, ease: 'power2.out' }, 13.3).to(wd, { '--wa': 0, duration: 0.4, ease: 'power2.out' }, 13.3)
        .to(ptr, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 13.7);

      // 6 Tick: every field approved (11 → 27), the pointer ticks the page; French is published only after
      tl.addLabel('s6', 14.0)
        .to(sheet, { y: -2 * u, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 14.0)
        .fromTo(page, { y: 4 * u, scale: 0.98, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: 'expo.out' }, 14.2)
        .fromTo(pParts, { y: 1.2 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, 14.3)
        .fromTo(fRows, { x: -2 * u, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.07 }, 14.4)
        .fromTo(cnt, { v: 11 }, { v: 27, duration: 0.8, ease: 'power2.out', immediateRender: false, onUpdate: () => { pN.textContent = Math.round(cnt.v); } }, 14.55)
        .to(pBar, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, 14.55)
        .to(fCk, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out', stagger: 0.12 }, 14.65);
      glide(tl, ptr, enter, bxPt, 15.25, 0.65);
      press(tl, box, 15.95);
      tl.to(box, { backgroundColor: BLUE, '--ring': 0, duration: 0.2, ease: 'power2.out' }, 16.0)
        .to(boxCk, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, 16.05)
        .to(st1, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 16.6)
        .to([stDot, st], { backgroundColor: (i) => (i ? 'rgba(147, 197, 240, 0.16)' : BLUE), duration: 0.3, ease: 'power2.out' }, 16.7)
        .to(st2, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 16.75)
        .to(ptr, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 16.95);

      // 7 Resolution: the header answers its question
      tl.addLabel('s7', 17.4)
        .to(hq, { y: -u, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 17.4)
        .fromTo(ha, { y: 1.5 * u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, 17.6);

      // 8 End card: clear to the blue; the line rises word by word, the small line below; then round again
      tl.addLabel('s8', 20.4)
        .to([ha, page], { scale: 0.98, autoAlpha: 0, duration: 0.45, ease: 'power2.in', stagger: 0.04 }, 20.4)
        .to(note, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 20.4)
        .set(end, { autoAlpha: 1 }, 20.9).to(endW, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 20.9)
        .fromTo(sign, { y: u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, 21.7)
        .addLabel('loop', 24.0).to([end, sign], { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 24.0);

      // the captions, only where the picture can't say it: land 0.25 s into their scene, leave with it
      [[8.6, 11.8], [14.0, 17.4]].forEach(([a, b], i) => tl
        .to(caps[i], { yPercent: 0, duration: 0.6, ease: 'expo.out' }, a + 0.25)
        .to(caps[i], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, b - 0.25));
      return tl;
    };
    // reduced motion: one still, the answer over the published page (scene 7)
    // the still is seeked without callbacks: its final numbers, set once the tile is built (demo() waits for the type)
    demo(root, make, 18.6).then(() => { if (reduce) { ty.k = 9; typeTo(); pN.textContent = '27'; } });
  });

})();
