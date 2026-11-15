/* jibinjohnson.in — Services page only: the sticky service screen, the process line, focus for the service chips.
   No libraries. Without it every service block shows its own illustration and the process line is full. */
(function () {
  'use strict';
  var doc = document, win = window;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = 'IntersectionObserver' in win;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- sticky screen (1024px+): a copy of each block's illustration; the block crossing the middle of the
     viewport picks the scene. CSS hides the screen below 1024px, where each block shows its own. ---------- */
  var screen = doc.querySelector('.ss-screen'), blocks = $$('.ss-block');
  if (screen && blocks.length && io) {
    var frame = screen.querySelector('.ss-frame');
    var num = doc.querySelector('.ss-n'), bars = $$('.ss-bars i');
    var scenes = blocks.map(function (b) {
      var s = b.querySelector('.scene').cloneNode(true);
      $$('.as', s).forEach(function (el, i) { el.style.setProperty('--d', (0.12 + i * 0.08) + 's'); });
      frame.appendChild(s);
      return s;
    });
    if (!reduce) screen.classList.add('motion');
    var cur = -1;
    var show = function (i) {
      if (i === cur || i < 0) return;
      cur = i;
      scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      bars.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      if (num) num.textContent = (i < 9 ? '0' : '') + (i + 1);
    };
    show(0);
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) show(blocks.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -49% 0px' });
    blocks.forEach(function (b) { sio.observe(b); });
  }

  /* ---------- hero chips: after the jump, keyboard focus moves into the chosen service ---------- */
  $$('.sv-jump a').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = doc.getElementById(a.getAttribute('href').slice(1));
      if (t) t.focus({ preventScroll: true });
    });
  });

  /* ---------- process: the line and the circles fill once as the steps come into view (not under reduced motion) ---------- */
  var steps = doc.querySelector('.sv-steps');
  if (steps && !reduce && io) {
    steps.classList.add('track');
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { steps.classList.add('lit'); pio.disconnect(); }
      });
    }, { rootMargin: '0px 0px -30% 0px' });
    pio.observe(steps);
  }
})();
