/* jibinjohnson.in — home Services (what I do + my toolkit).
   1. The services carousel (.sx): a tab widget. Clicking a thumbnail tab (or Enter/Space on it) makes it featured;
      arrow keys, Home and End move focus between the tabs (manual activation). On desktop the tabs rotate through the
      slots of the composition (data-slot: 0 featured, 1-4 the row, 5 left of the featured image; CSS moves them by
      transform); a tab that would cross the composition fades in at its new slot instead (.sx-jump). In the swipe row
      (phones) the chosen tab is scrolled into view (the row only, never the page).
      Slideshow: every 5s, paused on hover (mouse), while focus is in the section, while the carousel is off screen or
      the browser tab is hidden; the play/pause button shows the progress. It stops for good once a service is chosen.
      None under reduced motion (the button stays hidden).
   2. The reveal (GSAP, loaded before this file): the header's label and right column fade up, then the carousel; lower
      down the toolkit label, its chips (in quick succession) and the link. The H2 is screen-reader only. Two
      IntersectionObservers start it (nothing scroll-linked, so nothing to sync with Lenis). Without JS or GSAP, or
      under reduced motion, main.js's section fade applies instead (or everything is simply visible). */
(function () {
  'use strict';
  var doc = document, win = window, gsap = win.gsap;
  var sec = doc.getElementById('services'), wrap = sec && sec.querySelector('.wrap');
  if (!sec) return;
  var RM = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in win;

  /* ---------- 1. carousel ---------- */
  var sx = sec.querySelector('.sx');
  if (sx) (function () {
    var tabs = Array.prototype.slice.call(sx.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute('aria-controls')); });
    var list = sx.querySelector('[role="tablist"]'), play = sx.querySelector('.sx-play');
    var n = tabs.length, sel = 0;
    tabs.forEach(function (t, i) { if (t.getAttribute('aria-selected') === 'true') sel = i; });
    var slot = function (i) { return (i - sel + n) % n; };      /* 0 featured, 1-4 row, 5 left */
    var vis = function (o) { return (o + 1) % n; };             /* left-to-right order of the slots */

    function select(i, byUser) {
      if (i === sel) return;
      var k = (i - sel + n) % n, back = k === n - 1;            /* the left thumbnail = one step back */
      var before = tabs.map(function (t, j) { return vis(slot(j)); });
      tabs[sel].setAttribute('aria-selected', 'false'); tabs[sel].tabIndex = -1;
      panels[sel].classList.remove('is-on');
      sel = i;
      tabs[sel].setAttribute('aria-selected', 'true'); tabs[sel].tabIndex = 0;
      panels[sel].classList.add('is-on');
      tabs.forEach(function (t, j) {
        var o = slot(j), now = vis(o);
        var jump = back ? now < before[j] : now > before[j];    /* wrapped around: fade in instead of crossing */
        t.classList.remove('sx-jump');
        if (jump) { void t.offsetWidth; t.classList.add('sx-jump'); }
        t.setAttribute('data-slot', o);
      });
      /* swipe row: bring the chosen tab into view (horizontal scroll of the row only) */
      if (list.scrollWidth > list.clientWidth + 1) {
        var t = tabs[sel], x = t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, x), behavior: RM ? 'auto' : 'smooth' });
      }
      if (byUser) stop(); else elapsed = 0;
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, true); });
      t.addEventListener('animationend', function () { t.classList.remove('sx-jump'); });
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(doc.activeElement), to = -1;
      if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + n) % n;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = n - 1;
      if (to < 0) return;
      e.preventDefault();
      tabs[to].focus();
    });

    /* slideshow */
    if (RM || !IO || !play) return;
    var DUR = 5000, elapsed = 0, last = 0, raf = 0;
    var on = true, hover = false, focusIn = false, seen = false;
    var running = function () { return on && !hover && !focusIn && seen && !doc.hidden; };
    function tick(now) {
      raf = 0;
      if (!running()) { last = 0; return; }
      if (last) elapsed += now - last;
      last = now;
      if (elapsed >= DUR) { elapsed = 0; select((sel + 1) % n, false); }
      play.style.setProperty('--p', Math.min(1, elapsed / DUR).toFixed(4));
      raf = win.requestAnimationFrame(tick);
    }
    function sync() { if (running() && !raf) { last = 0; raf = win.requestAnimationFrame(tick); } }
    function stop() {
      if (!play) return;
      on = false; elapsed = 0;
      play.classList.add('is-stopped'); play.setAttribute('aria-label', 'Play the slideshow');
      play.style.setProperty('--p', 0);
    }
    play.hidden = false;
    play.addEventListener('click', function () {
      if (on) { stop(); return; }
      on = true; play.classList.remove('is-stopped'); play.setAttribute('aria-label', 'Pause the slideshow');
      sync();
    });
    sx.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; } });
    sx.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; sync(); } });
    sec.addEventListener('focusin', function () { focusIn = true; });
    sec.addEventListener('focusout', function (e) { if (!sec.contains(e.relatedTarget)) { focusIn = false; sync(); } });
    doc.addEventListener('visibilitychange', sync);
    new IntersectionObserver(function (entries) {
      seen = entries[entries.length - 1].isIntersecting;
      sync();
    }).observe(sx);
  })();

  /* ---------- 2. reveal ---------- */
  if (!wrap || !gsap || !IO || RM) return;
  /* main.js hides each section's .wrap (.rv) until it enters view; this section runs its own reveal instead.
     If the section was already on screen when main.js ran (no .rv), it is left as it is. */
  if (!wrap.classList.contains('rv')) return;
  var all = function (s) { return Array.prototype.slice.call(sec.querySelectorAll(s)); };
  var parts = [
    { box: sec.querySelector('.sv-top'), a: all('.sv-top .eyebrow, .sv-aside > *'), b: all('.sx-label, .sx-panels, .sx-tabs, .sx-play'), sa: 0.08, sb: 0.08 },
    { box: sec.querySelector('.kit-box'), a: all('.kit-label'), b: all('.kit > li, .kit-link'), sa: 0, sb: 0.03 }
  ];
  parts.forEach(function (p) { gsap.set(p.a.concat(p.b), { opacity: 0, y: 18 }); });
  wrap.classList.remove('rv');

  parts.forEach(function (p) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var els = p.a.concat(p.b);
      gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: function () { gsap.set(els, { clearProps: 'opacity,transform' }); } })
        .to(p.a, { opacity: 1, y: 0, duration: 0.8, stagger: p.sa }, 0)
        .to(p.b, { opacity: 1, y: 0, duration: 0.7, stagger: p.sb }, 0.2);
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(p.box);
  });
})();
