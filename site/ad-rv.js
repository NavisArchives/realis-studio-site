/* Van Impe: his home → a click on Portfolio → his work (NIRMATA's storyboard, 10.4 s loop).
   1 · 0.0–2.2  His home, first slide (Villa Marquis 88), exactly as his site shows it, nav and all.
   2 · 2.2–4.4  His slideshow moves on the way his site does (a crossfade) to Villa BRY; the nav stays.
   3 · 4.4–6.4  The pointer goes to « Portfolio » in his nav (his hover state) and clicks.
   4 · 6.4–7.4  His Projects page wipes in; its cards rise in. (No shrink: his hero is not one of his cards.)
   5 · 7.4–9.8  One row down, his header leaving as it does on his site when you scroll.
   6 · 9.8–10.4 His home wipes back in from below, and round again. Reduced motion: his Projects page, still. */
(() => {
  if (!window.RealisAd || !window.gsap) return;
  const { demo, glide } = window.RealisAd;
  document.querySelectorAll('.rva').forEach((root) => {
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const scr = $('.rva-scr'), page = $('.rva-page'), grid = $('.rva-grid'), cards = $$('.rva-card');
    const h1 = $('.rva-home.-h1'), h2 = $('.rva-home.-h2'), hov = $('.rva-home.-h2h');
    const p = $('.ptr');
    const [lx, ly] = root.dataset.link.split(',').map(Number), scroll = +root.dataset.scroll;
    const make = () => {
      const W = scr.clientWidth, H = scr.clientHeight;
      const shut = 'inset(100% 0% 0% 0%)', open = 'inset(0% 0% 0% 0%)';
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.set(h1, { autoAlpha: 1, clipPath: open, zIndex: 1 }, 0).set([h2, hov], { autoAlpha: 0, zIndex: 1 }, 0)
        .set(page, { clipPath: shut, zIndex: 2 }, 0).set(grid, { y: 0 }, 0).set(cards, { autoAlpha: 0, y: 12 }, 0);
      if (p) tl.set(p, { autoAlpha: 0, scale: 1 }, 0);
      // 1 · his home; 2 · his slideshow's own crossfade to the next slide
      tl.addLabel('b1', 0).addLabel('b2', 2.2).to(h2, { autoAlpha: 1, duration: 1.2, ease: 'power1.inOut' }, 2.2);
      // 3 · the pointer to « Portfolio », his hover, a click
      tl.addLabel('b3', 4.4);
      if (p) {
        glide(tl, p, { x: W + 8, y: H * 0.85 }, { x: lx * W, y: ly * H }, 4.5, 0.9);
        tl.to(hov, { autoAlpha: 1, duration: 0.2, ease: 'power2.out' }, 5.35)
          .to(p, { scale: 0.88, duration: 0.1, ease: 'power2.out' }, 5.95).to(p, { scale: 1, duration: 0.15, ease: 'back.out(2)' }, 6.05)
          .to(p, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 6.5);
      }
      // 4 · his Projects page; its cards arrive as they load
      tl.addLabel('b4', 6.4).to(page, { clipPath: open, duration: 0.6, ease: 'expo.inOut' }, 6.4)
        .to(cards, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 6.75);
      // 5 · one row down
      tl.addLabel('b5', 7.4).to(grid, { y: -scroll * W, duration: 1.7, ease: 'power1.inOut' }, 7.8);
      // 6 · his home again, the same upward wipe
      tl.addLabel('b6', 9.8).set([h2, hov], { autoAlpha: 0 }, 9.8).set(h1, { clipPath: shut, zIndex: 3 }, 9.8)
        .to(h1, { clipPath: open, duration: 0.6, ease: 'expo.inOut' }, 9.8);
      return tl;
    };
    demo(root, make, 7.6);
  });
})();
