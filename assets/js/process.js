/* jibinjohnson.in — home Process: the wave timeline reveals itself once as it enters view (GSAP + ScrollTrigger,
   loaded before this file). Desktop: the wave is uncovered left to right (--draw on .pt-wave); as it reaches each
   column centre that step's dot pops in, its big number fades in and its heading and description fade up 14px.
   Below 1024px the vertical line grows segment by segment (--s on each li) with the same sequence.
   Plays once; without JS or GSAP, or under reduced motion, everything is simply visible. */
(function () {
  'use strict';
  var win = window, gsap = win.gsap, ST = win.ScrollTrigger;
  var sec = document.getElementById('process');
  var list = sec && sec.querySelector('.pt-steps');
  var wave = sec && sec.querySelector('.pt-wave');
  if (!gsap || !ST || !list) return;
  if (win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ST);

  var items = Array.prototype.slice.call(list.children);
  var q = function (li, sel) { return li.querySelector(sel); };
  var words = function (li) { return li.querySelectorAll('.pt-txt > h3, .pt-txt > p'); };
  var wide = function () { return win.matchMedia('(min-width:1024px)').matches; };

  if (wave) gsap.set(wave, { '--draw': 0 });
  items.forEach(function (li) {
    gsap.set(li, { '--s': 0 });
    gsap.set(q(li, '.pt-dot'), { scale: 0, opacity: 0 });
    gsap.set(q(li, '.pt-n'), { opacity: 0, y: 20 });
    gsap.set(words(li), { opacity: 0, y: 14 });
  });

  function play() {
    var tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    var h = wide(), D = 1.9, n = items.length;
    if (h && wave) tl.to(wave, { '--draw': 1, duration: D, ease: 'sine.inOut' }, 0);
    items.forEach(function (li, i) {
      var t;
      if (h) {
        /* the column centre is at (2i+1)/(2n) of the width: the time the sine.inOut reveal reaches it */
        var f = (2 * i + 1) / (2 * n);
        t = D * Math.acos(1 - 2 * f) / Math.PI;
      } else {
        t = i * 0.35;
        if (i < n - 1) tl.to(li, { '--s': 1, duration: 0.45, ease: 'power1.inOut' }, t + 0.2);
      }
      tl.to(q(li, '.pt-dot'), { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2.2)' }, t)
        .to(q(li, '.pt-n'), { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, t + 0.15)
        .to(words(li), { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, t + 0.2);
    });
    tl.eventCallback('onComplete', function () {
      /* leave no inline styles behind, so the CSS (hover, breakpoints) is in charge again */
      if (wave) gsap.set(wave, { clearProps: '--draw' });
      items.forEach(function (li) {
        gsap.set(li, { clearProps: '--s' });
        gsap.set([q(li, '.pt-dot'), q(li, '.pt-n')].concat(Array.prototype.slice.call(words(li))), { clearProps: 'all' });
      });
    });
  }

  ST.create({ trigger: list, start: 'top 80%', once: true, onEnter: play });
})();
