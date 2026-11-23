/* jibinjohnson.in — smooth scrolling (Lenis 1.1.20, self-hosted in assets/js/vendor/lenis).
   Loaded on every page after the Lenis file (and, on the home page, after GSAP + ScrollTrigger, before hero.js).
   - One instance only (window.__lenis); off under prefers-reduced-motion or without Lenis: the page scrolls natively.
   - Mouse wheel and trackpad are smoothed; touch keeps the browser's own scrolling (syncTouch off), which is
     smoother and cheaper on phones than any JS inertia.
   - With GSAP on the page, Lenis runs on GSAP's ticker and feeds ScrollTrigger, so the scroll position, the pinned
     hero and every scrubbed tween are updated in the same frame (one animation loop instead of two), and
     ScrollTrigger updates once per frame (see below).
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

  /* ScrollTrigger is updated once per frame, by whichever side moved the page:
     - Lenis (wheel, trackpad, in-page links: isScrolling 'smooth'): right after Lenis sets the position on GSAP's
       ticker, so pinned and scrubbed parts move in the same frame as the page. The browser's scroll event for that
       position arrives at the start of the next frame and would only repeat the update, so while Lenis drives the
       scroll it is stopped at the window (capture) before it reaches ScrollTrigger. Nothing else on the site listens
       for scroll events (main.js uses IntersectionObservers), and Lenis itself ignores them while it is smoothing.
     - the browser (touch, scrollbar, keys: 'native'): ScrollTrigger's own scroll listener; Lenis's scroll event
       is not passed on, so it doesn't run twice. (Lenis's last glide frame reports isScrolling false; it is passed on.) */
  var tick = null, onScroll = null, swallow = null;
  if (onTicker) {
    gsap.registerPlugin(ST);
    onScroll = function () { if (lenis.isScrolling !== 'native') ST.update(); };
    lenis.on('scroll', onScroll);
    swallow = function (e) { if (e.target === doc && lenis.isScrolling === 'smooth') e.stopImmediatePropagation(); };
    win.addEventListener('scroll', swallow, { capture: true, passive: true });
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
    if (tick) { gsap.ticker.remove(tick); lenis.off('scroll', onScroll); win.removeEventListener('scroll', swallow, { capture: true }); }
    lenis.destroy();
    win.__lenis = null;
  };
})();
