/* Recall, the animated tile « her screen » (classes start with rca). Its own file; the shared helpers come from
   site.js as window.RealisAd. Scene script approved by NIRMATA (16 Nov): ten scenes, 16.4 s, labels s1…s10.
   s1 the hook · s2 it docks · s3 her home screen, the reader and the remote · s4 the card lands on the reader ·
   s5 the « 06 » overlay · s6 channel 06 opens · s7 the camera pushes into the words · s8 she presses → ·
   s9 the camera pulls back (2 OF 9) · s10 the end line. The screens are the app's own, recreated (recall_page.py). */
(() => {
  /* Every recreated screen is laid out at its own full size (her screen 1440 x 810, the phone 393 x 852, the
     workspace 1280 x 720, the PIN dialog 600 wide) and scaled to its tile here: WebKit wraps text laid out at a
     few pixels far too early, so nothing is ever laid out small. */
  const fit = (el) => {
    const p = el.parentElement, k = p.clientWidth / el.offsetWidth;
    if (k > 0) el.style.setProperty('--k', k.toFixed(5));
    if (el.classList.contains('rc-dlg')) p.style.aspectRatio = `${el.offsetWidth} / ${el.offsetHeight}`;
  };
  const fits = [...document.querySelectorAll('.rc-fit')];
  fits.forEach(fit);
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => fits.forEach(fit)); fits.forEach((el) => ro.observe(el.parentElement)); }
  if (window.RealisAd) window.RealisAd.typeReady.then(() => fits.forEach(fit)); else if (document.fonts) document.fonts.ready.then(() => fits.forEach(fit));

  if (!window.RealisAd || !window.gsap) return;
  const { demo, rel, press } = window.RealisAd;
  // Andy, 20 Nov: « just remove the zoom »; the remote's → pressed twice instead, a ring at each press, two more photographs.
  // → is the key the app's strip moves forward with (the next thumbnail sits to the right), so → is shown.
  const S = [0, 2.6, 3.2, 5.0, 6.2, 7.8, 9.8, 11.4, 12.4, 13.6], LOOP = 16.4, STILLS = [9.7, 11.3, 13.0], STILL = STILLS[0];
  // the app's accents, as RGB so they tween (index.css: oklch(.78 .13 55) ring, oklch(.78 .1 55) active dot)
  const RING = 'rgb(247, 160, 98)', DOT = 'rgb(233, 166, 121)', GREY = 'rgba(255, 255, 255, 0.32)';
  // words in masks, split after translation so each language keeps its own (plain spaces only)
  const split = (el) => { el.innerHTML = el.textContent.trim().split(/ +/).map((x) => `<span class="rca-xm"><span class="rca-x">${x}</span></span>`).join(' '); };

  document.querySelectorAll('.rca').forEach((root) => {
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const q = $('.rca-q'), end = $('.rca-end'), line = $('.rca-line'), sig = $('.rca-sig'), note = $('.rca-note');
    split(q); split(line);
    const qw = $$('.rca-q .rca-x'), lw = $$('.rca-line .rca-x');
    const cam = $('.rca-cam'), tv = $('.rca-tv'), scr = $('.rca-tv .rc-scr'), bands = $$('.rca-band');
    const home = $('.rca-home'), chan = $('.rca-chan'), ov = $('.rca-ov'), dg = $('.rca-dg');
    const BD = [0, 1, 2].map((k) => $(`.rca-bd${k}`)), [bd0, bd1, bd2] = BD;
    const parts = ['.rc-hd', '.rc-eb', '.rc-ti', '.rc-acs', '.rc-des', '.rc-photo', '.rc-thumbs', '.rc-dots', '.rc-chip'].map((s) => chan.querySelector(s));
    const eb = chan.querySelector('.rc-eb');
    const WS = [0, 1, 2].map((k) => $$(`.rca-chan .rca-w${k}`)), PS = [0, 1, 2].map((k) => $(`.rca-p${k}`)), NS = [0, 1, 2].map((k) => $(`.rca-n${k}`));
    const [w0, w1, w2] = WS, [p0, p1, p2] = PS, [n0, n1, n2] = NS;
    const tbs = $$('.rca-chan .rc-tb'), dts = $$('.rca-chan .rc-dots i');
    const reader = $('.rca-reader'), ring = $('.rca-ring'), card = $('.rca-card'), remote = $('.rca-remote'), keyR = $('.rca-k.-r'), kr = $('.rca-kr');
    const caps = $$('.rca-cap');

    const make = () => {
      // measure from a clean layout (a rebuild can land mid-move)
      gsap.set([cam, q, card, tv], { clearProps: 'transform' });
      fit(scr);
      const W = root.clientWidth, H = root.clientHeight, u = W / 100, tall = H > W;
      // inside her screen, lengths are its own design pixels (the screen is scaled as a whole)
      const ringOn = `0 0 0 3px ${RING}`, ringOff = `0 0 0 0px rgba(247, 160, 98, 0)`;
      // s2: the question docks as the header (from the top centre, so its lines never change)
      // (a longer translation that wraps to more lines docks a little smaller, so it always clears the TV)
      const qr = rel(root, q), top = (tall ? 3.4 : 2.4) * u, room = rel(root, tv).t - 1.4 * u - top;
      const dockS = Math.min(tall ? 4.4 / 8.2 : 2.2 / 4.6, room / qr.h), dockY = top - qr.t;
      // s4: the card comes in from beyond the right edge
      const cr = rel(root, card), from = { x: W - cr.l + 3 * u, y: -5 * u };

      const tl = gsap.timeline({ repeat: -1, paused: true });
      S.forEach((t, i) => tl.addLabel(`s${i + 1}`, t));

      // the state every loop starts from
      tl.set([tv, reader, card, remote, ...caps, end, sig, chan, ov, bd1, bd2, ...w1, ...w2, p1, p2, n1, n2, ...bands, ring, kr], { autoAlpha: 0 }, 0)
        .set([q, cam, home, bd0, ...w0, p0, n0, note], { autoAlpha: 1 }, 0)
        .set(q, { y: 0, scale: 1, transformOrigin: '50% 0' }, 0).set(qw, { yPercent: 105 }, 0).set(lw, { yPercent: 105 }, 0)
        .set(cam, { x: 0, y: 0, scale: 1, transformOrigin: '0 0', force3D: false }, 0)
        .set([tv, reader, remote, ...parts, ...w0, ...w1], { y: 0 }, 0)
        .set(card, { x: from.x, y: from.y, rotation: 9 }, 0).set(ring, { scale: 0.4 }, 0)
        .set(keyR, { backgroundColor: 'rgba(200, 121, 65, 0)', scale: 1 }, 0)
        .set(tbs[0], { opacity: 1, boxShadow: ringOn }, 0).set([tbs[1], tbs[2]], { opacity: 0.55, boxShadow: ringOff }, 0)
        .set(dts[0], { backgroundColor: DOT }, 0).set([dts[1], dts[2]], { backgroundColor: GREY }, 0).set(kr, { scale: 1 }, 0);
      const cap = (i, a, b) => tl.fromTo(caps[i], { autoAlpha: 0, y: 0.8 * u }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out', immediateRender: false }, a)
        .to(caps[i], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, b - 0.25);

      // s1 · the hook, word by word, then held
      tl.to(qw, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.15);
      // s2 · it docks as the header, where it stays until the end line
      tl.to(q, { y: dockY, scale: dockS, duration: 0.6, ease: 'power2.inOut' }, S[1]);
      // s3 · her home screen on the TV; the reader and the remote beside it
      tl.fromTo(tv, { y: 3 * u }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', immediateRender: false }, S[2])
        .fromTo([reader, remote], { y: 2 * u }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.1, immediateRender: false }, S[2] + 0.3);
      cap(0, 3.4, 5.0);
      // s4 · the card slides in and lands on the reader at 5.9; one amber ring answers it
      tl.set(card, { autoAlpha: 1 }, S[3])
        .to(card, { x: 0, duration: 0.9, ease: 'power2.inOut' }, S[3])
        .to(card, { y: 0, rotation: -2, duration: 0.9, ease: 'sine.inOut' }, S[3])
        .fromTo(ring, { scale: 0.4, autoAlpha: 0.95 }, { scale: 2.6, autoAlpha: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, 5.9);
      cap(1, 5.2, 6.8);
      // s5 · the reader types 0 and 6: the overlay, « Opening channel 06… », held 1.6 s
      tl.fromTo(ov, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'expo.out', immediateRender: false }, S[4])
        .fromTo(dg, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, S[4]);
      // s6 · channel 06 opens: the blurred photograph behind, the header with 1 OF 9, the words, the album
      tl.to([ov, home], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, S[5])
        .set(chan, { autoAlpha: 1 }, S[5] + 0.05)
        .fromTo(parts, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.06, immediateRender: false }, S[5] + 0.1)
        .to([reader, card], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 8.6);
      cap(2, 8.2, 9.75);
      // s7, s8 · she presses → twice: a ring from the key at each press, and the next photograph of the album, its own
      // date and caption, 2 OF 9 then 3 OF 9, the ring moving along the thumbnails. The TV keeps its size and place.
      const next = (at, a, b) => {
        press(tl, keyR, at);
        tl.to(keyR, { backgroundColor: '#c87941', duration: 0.12, ease: 'power2.out' }, at)
          .to(keyR, { backgroundColor: 'rgba(200, 121, 65, 0)', duration: 0.4, ease: 'power2.in' }, at + 0.5)
          .fromTo(kr, { scale: 1, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, at)
          .to(WS[a], { autoAlpha: 0, y: -6, duration: 0.2, ease: 'power2.in' }, at + 0.15)
          .fromTo(WS[b], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out', immediateRender: false }, at + 0.35)
          .fromTo([PS[b], BD[b]], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }, at + 0.15)
          .set([PS[a], BD[a]], { autoAlpha: 0 }, at + 0.7)
          .set(NS[a], { autoAlpha: 0 }, at + 0.15).set(NS[b], { autoAlpha: 1 }, at + 0.15)
          .to(tbs[a], { opacity: 0.55, boxShadow: ringOff, duration: 0.25, ease: 'power2.out' }, at + 0.15)
          .to(tbs[b], { opacity: 1, boxShadow: ringOn, duration: 0.25, ease: 'power2.out' }, at + 0.15)
          .to(dts[a], { backgroundColor: GREY, duration: 0.25, ease: 'power2.out' }, at + 0.15)
          .to(dts[b], { backgroundColor: DOT, duration: 0.25, ease: 'power2.out' }, at + 0.15);
      };
      next(S[6], 0, 1); next(S[7], 1, 2);
      cap(3, 9.75, 13.4);
      // s10 · the end line answers the hook; « Sample data » leaves with the screen
      tl.to([q, cam, remote, note], { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, S[9])
        .set(end, { autoAlpha: 1 }, S[9] + 0.3)
        .to(lw, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, S[9] + 0.3)
        .fromTo(sig, { y: u }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, S[9] + 1.1)
        .set({}, {}, LOOP);
      return tl;
    };
    // Reduced motion: the three photographs in turn, 3 s each, crossfaded, no ring (Andy, 20 Nov), once the tile is built
    const built = demo(root, make, STILL);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    built.then(() => {
      let i = 0, nextCall = null;
      const show = (t) => { const tl = root.__tl(); tl.pause(); tl.seek(0, false); tl.seek(t, false); };
      const turn = () => {
        nextCall = gsap.delayedCall(3, () => {
          if (root.__hold) return;
          gsap.to(root, { opacity: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => {
            i = (i + 1) % STILLS.length; show(STILLS[i]);
            gsap.to(root, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }); turn();
          } });
        });
      };
      show(STILLS[0]);
      addEventListener('resize', () => show(STILLS[i]));
      new IntersectionObserver(([e]) => {
        if (root.__hold) return;
        if (nextCall) { nextCall.kill(); nextCall = null; }
        gsap.killTweensOf(root); gsap.set(root, { opacity: 1 });
        i = 0; show(STILLS[0]);
        if (e.intersectionRatio >= 0.5) turn();
      }, { threshold: [0, 0.5] }).observe(root);
    });
  });
})();
