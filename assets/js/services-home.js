/* jibinjohnson.in — home Services (#services): the tabbed services panel. No library.
   - ARIA tabs (automatic activation): click a tab, or Left/Right/Home/End while a tab has focus (roving tabindex).
     All five panels are in the HTML; inactive ones carry [hidden].
   - A tab change shows its panel (title and features fade up, CSS .play), cross-fades the photo (.on), updates the
     "01 / 05" label and points "Find out more" at the service's page.
   - The sliding indicator (.tb-ind) is moved and resized to the active pill (re-measured when the tabs resize).
   - The pills stay on one row; where they don't fit, the row scrolls sideways and fades (.fade-l / .fade-r) on the
     side with more pills (IntersectionObserver on the end pills, no scroll listener).
   - Autoplay: the next tab every 6s, timed by the progress bar's CSS animation (animationend = next tab), so pausing
     it (.paused: hover or focus inside, tab hidden, section off screen) also freezes the bar. Stops for good on the
     first click or key press on a tab; never under reduced motion.
   - Deep links: /#services-seo (any panel id) opens that tab and scrolls to the section.
   - Entrance: .is-in on the section the first time it comes into view (CSS does the rest). */
(function () {
  'use strict';
  var doc = document, win = window;
  var sec = doc.getElementById('services');
  var list = sec && sec.querySelector('.tb-tabs');
  if (!list) return;

  var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute('aria-controls')); });
  var imgs = [].slice.call(sec.querySelectorAll('.tb-img'));
  var ind = list.querySelector('.tb-ind'), prog = list.querySelector('.tb-prog');
  var tag = sec.querySelector('.tb-tag b');
  var more = sec.querySelector('.tb-more'), moreName = sec.querySelector('.tb-more-name');
  var body = sec.querySelector('.tb-body');
  var reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n = tabs.length, cur = 0;
  var pad = function (i) { return (i < 10 ? '0' : '') + i; };

  /* ---------- indicator ---------- */
  function place() {
    var t = tabs[cur];
    ind.style.width = t.offsetWidth + 'px';
    ind.style.height = t.offsetHeight + 'px';
    ind.style.transform = 'translate(' + t.offsetLeft + 'px,' + t.offsetTop + 'px)';
  }
  /* keep the active pill in view inside the scrolling row (phones) without scrolling the page */
  function reveal() {
    if (list.scrollWidth <= list.clientWidth) return;
    var t = tabs[cur];
    list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- select a tab ---------- */
  function select(i, focus) {
    i = ((i % n) + n) % n;
    if (i !== cur) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (imgs[k]) { imgs[k].classList.toggle('on', on); imgs[k].setAttribute('aria-hidden', on ? 'false' : 'true'); }
      });
      var p = panels[i];
      p.classList.remove('play');
      void p.offsetWidth;            /* restart the fade-up */
      p.classList.add('play');
      if (tag) tag.textContent = pad(i + 1);
      if (more) more.href = tabs[i].getAttribute('data-href');
      if (moreName) moreName.textContent = p.querySelector('h3').textContent;
      cur = i;
      place();
      reveal();
      restartBar();
    }
    if (focus) tabs[i].focus();
  }

  /* ---------- autoplay ---------- */
  var auto = !reduce, hold = { hover: false, focus: false, hidden: doc.hidden, away: true };
  function sync() {
    var paused = false;
    for (var k in hold) if (hold[k]) paused = true;
    sec.classList.toggle('paused', paused);
  }
  function restartBar() {
    if (!auto) return;
    prog.style.animation = 'none';
    void prog.offsetWidth;
    prog.style.animation = '';
  }
  function stop() { auto = false; sec.classList.remove('auto', 'paused'); }
  if (auto) {
    sec.classList.add('auto');
    prog.addEventListener('animationend', function () { if (auto) select(cur + 1); });
    /* pause while the pointer or focus is on the tabs or the panel */
    var over = 0, inside = function (el) { return !!el && (body.contains(el) || list.contains(el)); };
    [body, list].forEach(function (el) {
      el.addEventListener('mouseenter', function () { over++; hold.hover = true; sync(); });
      el.addEventListener('mouseleave', function () { over = Math.max(0, over - 1); hold.hover = over > 0; sync(); });
      el.addEventListener('focusin', function () { hold.focus = true; sync(); });
      el.addEventListener('focusout', function (e) { if (!inside(e.relatedTarget)) { hold.focus = false; sync(); } });
    });
    doc.addEventListener('visibilitychange', function () { hold.hidden = doc.hidden; sync(); });
    sync();
  }

  /* ---------- user input ---------- */
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { stop(); select(i); });
  });
  list.addEventListener('keydown', function (e) {
    var to = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    stop();
    select(to, true);
  });

  /* ---------- deep links: /#services-seo ---------- */
  function fromHash(scroll) {
    var id = decodeURIComponent(win.location.hash.slice(1));
    var k = panels.findIndex(function (p) { return p && p.id === id; });
    if (k < 0) return;
    stop();
    select(k);
    if (scroll) {
      if (win.__lenis) win.__lenis.scrollTo(sec, { immediate: reduce });
      else sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  win.addEventListener('hashchange', function () { fromHash(true); });
  if (win.location.hash) {
    fromHash(false);
    /* scroll once the page (and the hero pin) has its final layout */
    if (doc.readyState === 'complete') fromHash(true);
    else win.addEventListener('load', function () { fromHash(true); });
  }

  /* ---------- observers: entrance, autoplay on screen ---------- */
  if ('IntersectionObserver' in win) {
    new IntersectionObserver(function (en, io) {
      if (en[0].isIntersecting) { sec.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.15 }).observe(sec);
    new IntersectionObserver(function (en) {
      hold.away = !en[0].isIntersecting; sync();
    }).observe(body);
  } else {
    sec.classList.add('is-in'); hold.away = false; sync();
  }

  /* ---------- start ---------- */
  place();
  if ('ResizeObserver' in win) new ResizeObserver(place).observe(list);
  /* edge fades when the pill row scrolls (it never wraps): fade the side whose end pill is not fully in view */
  if ('IntersectionObserver' in win) {
    var edges = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        list.classList.toggle(e.target === tabs[0] ? 'fade-l' : 'fade-r', e.intersectionRatio < 0.98);
      });
    }, { root: list, threshold: [0.98] });
    edges.observe(tabs[0]); edges.observe(tabs[n - 1]);
  }
  requestAnimationFrame(function () { list.classList.add('ready'); });
})();
