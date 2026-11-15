/* jibinjohnson.in — home "What I do" (#services, [data-sx]): one service per screen while the section is pinned,
   with a depth transition: the current panel flies toward the camera and out of view, and only then the next one
   grows from small into place. Fully scrubbed, so it reverses on the way up.
   Home page only. Uses the page's GSAP + ScrollTrigger when present (scrub: true, so it moves only while the page
   scrolls); without them the same frames are drawn straight from the scroll position. Styles: home-services.css.

   Model: s is a continuous step, 0 = intro … N−1 = last service. In each transition from step k to k+1:
     0    – 60%   the current panel flies at the camera, 1× → 3–6× (by screen width), accelerating
     0    – 48%   it is alone and solid; nothing else is visible
     48%  – 60%   (80% of its zoom, the heading already far past the edges) it fades out while still growing, and
                  the next panel starts behind it from 0.4× and opacity 0
     48%  – 100%  the next panel eases into place at 1×
   No blur anywhere.
   Between transitions (HOLD) the panel in place is alone, still and sharp. Scrolling up runs it backwards.
   Scales are reached through real depth: translateZ(z) under the pin's perspective, z = P(1 − 1/scale).
   The scroll through the track maps to s with a short hold on each step (HOLD) so every panel can be read at rest.
   The pin is CSS position: sticky (100svh) inside the tall track; ScrollTrigger only scrubs.
   Inactive panels stay in the page (opacity 0, pointer-events none) for search and screen readers; focus landing
   in one jumps the page to its step. Off under prefers-reduced-motion (and without JS): a plain stacked list. */
(function () {
  'use strict';
  var sec = document.querySelector('[data-sx]');
  if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var win = window, doc = document;
  var pin = sec.querySelector('.sx-pin');
  var panels = Array.prototype.slice.call(sec.querySelectorAll('.sx-panel'));
  var dots = Array.prototype.slice.call(sec.querySelectorAll('.sx-dots button'));
  var cur = sec.querySelector('.sx-cur');
  var N = panels.length;

  var HOLD = 0.35;               /* rest on each step, in units of one transition */
  var T = N * HOLD + (N - 1);    /* timeline length: N holds + N−1 transitions */
  var PERSP = 1000;              /* must match the CSS perspective on .sx-pin */
  var BACK = 0.4;                /* scale the incoming panel starts from */
  var OUT = 0.6;                 /* share of each transition the outgoing zoom takes (it is gone after it) */
  var IN_AT = 0.8;               /* the incoming panel starts at 80% of the outgoing zoom (≈ 2–4× by then) */

  var easeInOut = function (x) { return -(Math.cos(Math.PI * x) - 1) / 2; };
  /* progress 0…1 through the track → continuous step s */
  var stepAt = function (p) {
    var t = Math.max(0, Math.min(1, p)) * T, k = Math.floor(t / (HOLD + 1));
    if (k >= N - 1) return N - 1;
    var r = t - k * (HOLD + 1);
    return r < HOLD ? k : k + easeInOut(r - HOLD);
  };
  /* progress at the middle of step i's hold */
  var progressFor = function (i) { return (i * (HOLD + 1) + HOLD / 2) / T; };

  var active = -1;
  var setActive = function (i) {
    if (i === active) return;
    active = i;
    for (var k = 0; k < N; k++) panels[k].classList.toggle('is-active', k === i);
    pin.setAttribute('data-step', i);
    pin.classList.toggle('on', i > 0);
    if (cur && i > 0) cur.textContent = (i < 10 ? '0' : '') + i;
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k + 1 === i); });
  };

  /* visual scale k ↔ depth: under a perspective P a layer at translateZ(z) shows at P / (P − z),
     so z = P(1 − 1/k). The panels move in real depth; the numbers below are the scales they reach. */
  var zFor = function (k) { return PERSP * (1 - 1 / k); };
  var last = [];
  var render = function (p) {
    var s = stepAt(p);
    /* outgoing peak scale: 3 on phones … 6 on wide screens, so the heading always ends far past the edges */
    var big = Math.max(3, Math.min(6, win.innerWidth / 300));
    for (var i = 0; i < N; i++) {
      var d = s - i, k = 1, o = 0;
      if (d >= 0 && d < OUT) {
        /* outgoing: accelerates at the camera (1 → big) the whole time; solid until IN_AT of its zoom (the
           heading already far past the edges), then it fades out while it keeps growing */
        var u = d / OUT;
        k = 1 + (big - 1) * u * u;
        o = u < IN_AT ? 1 : 1 - (u - IN_AT) / (1 - IN_AT);
      } else if (d < 0 && 1 + d > IN_AT * OUT) {
        /* incoming: begins at IN_AT of the outgoing zoom, behind it (lower z-index), from 0.4× and opacity 0,
           and eases into place by the end of the transition */
        var v = (1 + d - IN_AT * OUT) / (1 - IN_AT * OUT);   /* 0 → 1 */
        var e = 1 - (1 - v) * (1 - v);
        k = BACK + (1 - BACK) * e;
        o = Math.min(1, e / 0.6);
      } else if (d === 0) {
        o = 1;                                /* at rest */
      }
      /* everything else stays at opacity 0 (never visibility: hidden, so links can still take focus and screen
         readers still read every panel) */
      var key = o < 0.005 ? 'off' : k.toFixed(3) + '|' + o.toFixed(3);
      if (last[i] === key) continue;
      last[i] = key;
      var st = panels[i].style;
      st.opacity = o < 0.005 ? '0' : o.toFixed(3);
      if (key === 'off') continue;
      st.transform = 'translate3d(0,0,' + zFor(k).toFixed(1) + 'px)';
      st.zIndex = d > 0 ? 40 : 30;            /* the outgoing panel stays in front of the incoming one */
    }
    setActive(Math.max(0, Math.min(N - 1, Math.round(s))));
  };

  /* scroll position of step i, and a way to get there */
  var trigger = null;
  var rawProgress = function () {
    return -sec.getBoundingClientRect().top / Math.max(1, sec.offsetHeight - pin.offsetHeight);
  };
  var yFor = function (i) {
    if (trigger) return trigger.start + progressFor(i) * (trigger.end - trigger.start);
    var top = sec.getBoundingClientRect().top + win.scrollY;
    return top + progressFor(i) * (sec.offsetHeight - pin.offsetHeight);
  };
  var scrollTo = function (y, instant) {
    var lenis = win.__lenis;
    if (lenis) lenis.scrollTo(y, instant ? { immediate: true, force: true } : { force: true });
    else win.scrollTo({ top: y, behavior: instant ? 'instant' : 'smooth' });
  };

  dots.forEach(function (d) {
    d.addEventListener('click', function () { scrollTo(yFor(+d.getAttribute('data-go'))); });
  });

  /* keyboard: focus in a panel that isn't showing → move the page to its step at once (after the browser's own
     scroll-into-view) and draw that step at once */
  panels.forEach(function (p, i) {
    p.addEventListener('focusin', function () {
      if (i === active) return;
      requestAnimationFrame(function () {
        scrollTo(yFor(i), true);
        render(progressFor(i));
      });
    });
  });

  var gsap = win.gsap, ST = win.ScrollTrigger;
  if (gsap && ST) {
    gsap.registerPlugin(ST);
    var proxy = { p: 0 };
    /* created after hero.js has run (deferred scripts finish before DOMContentLoaded), so the hero's pin and the
       section's arrival margin are measured first */
    doc.addEventListener('DOMContentLoaded', function () {
      var tw = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: function () { render(proxy.p); },
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true }
      });
      trigger = tw.scrollTrigger;
      render(proxy.p);
    });
  } else {
    var ticking = false;
    var update = function () { ticking = false; render(rawProgress()); };
    win.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    win.addEventListener('resize', update, { passive: true });
    update();
  }
})();
