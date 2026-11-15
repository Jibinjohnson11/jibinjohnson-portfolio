/* jibinjohnson.in — smooth scrolling (Lenis 1.1.20, self-hosted in assets/js/vendor/lenis).
   Loaded on every page after the Lenis file (and, on the home page, after GSAP + ScrollTrigger, before hero.js).
   - One instance only (window.__lenis); off under prefers-reduced-motion or without Lenis: the page scrolls natively.
   - Mouse wheel and trackpad are smoothed; touch keeps the browser's own scrolling (syncTouch off), which is
     smoother and cheaper on phones than any JS inertia.
   - With GSAP on the page, Lenis runs on GSAP's ticker and feeds ScrollTrigger, so the scroll position, the pinned
     hero and every scrubbed tween are updated in the same frame (one animation loop instead of two).
   - In-page links (#work, …) glide with the same offset as the CSS scroll-padding under the sticky header.
     The skip link keeps the browser's own jump so keyboard focus moves with it. */
(function () {
  'use strict';
  var win = window, doc = document, root = doc.documentElement;
  if (win.__lenis || typeof win.Lenis !== 'function') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gsap = win.gsap, ST = win.ScrollTrigger, onTicker = !!(gsap && ST);

  var lenis = new win.Lenis({
    lerp: 0.1,              /* glide: ~0.1 feels responsive without floating */
    smoothWheel: true,
    syncTouch: false,       /* native touch scrolling */
    autoRaf: !onTicker,     /* GSAP's ticker drives it when GSAP is here */
    /* the mobile menu sheet scrolls by itself */
    prevent: function (node) { return !!(node.closest && node.closest('.sheet')); }
  });
  win.__lenis = lenis;

  var tick = null;
  if (onTicker) {
    gsap.registerPlugin(ST);
    lenis.on('scroll', ST.update);
    tick = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0); /* no catch-up jump after a long frame: scroll and tweens stay in step */
  }

  /* in-page links */
  var offset = function () { return -(parseFloat(getComputedStyle(root).scrollPaddingTop) || 0); };
  var onClick = function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip')) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) { e.preventDefault(); lenis.scrollTo(0); return; }
    var target = doc.getElementById(decodeURIComponent(id));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: offset() });
    if (history.pushState) history.pushState(null, '', '#' + id);
  };
  doc.addEventListener('click', onClick);

  /* back/forward cache: re-measure when the page is shown again */
  var onShow = function (e) { if (e.persisted) lenis.resize(); };
  win.addEventListener('pageshow', onShow);

  /* teardown (not needed in normal use; available for debugging) */
  win.__lenisDestroy = function () {
    doc.removeEventListener('click', onClick);
    win.removeEventListener('pageshow', onShow);
    if (tick) { gsap.ticker.remove(tick); lenis.off('scroll', ST.update); }
    lenis.destroy();
    win.__lenis = null;
  };
})();
