/* jibinjohnson.in — home Process: the alternating timeline draws itself once as it enters view (GSAP + ScrollTrigger,
   loaded before this file). The line grows from its start (--draw on .pt-steps); as it reaches each marker the marker
   appears, its stem grows out of the line (--s), the step's heading and description fade up 14px and its photo (if any) opens with a
   clip-path from the line outwards. The same sequence runs along the vertical line on tablets and phones.
   Plays once; without JS or GSAP, or under reduced motion, everything is simply visible. */
(function () {
  'use strict';
  var win = window, gsap = win.gsap, ST = win.ScrollTrigger;
  var sec = document.getElementById('process');
  var list = sec && sec.querySelector('.pt-steps');
  if (!gsap || !ST || !list) return;
  if (win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ST);

  var items = Array.prototype.slice.call(list.children);
  var part = function (li, sel) { return li.querySelector(sel); };
  /* the heading and description (the stem sits inside .pt-txt too, and is drawn on its own) */
  var words = function (li) { return li.querySelectorAll('.pt-txt > h3, .pt-txt > p'); };
  var horizontal = function () { return win.matchMedia('(min-width:1024px)').matches; };
  /* where a photo opens from: towards the line on desktop (top photos from their foot, bottom photos from their top),
     from the top on the vertical layouts */
  var closed = function (li) {
    return horizontal() && li.classList.contains('down') ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)';
  };

  gsap.set(list, { '--draw': 0 });
  items.forEach(function (li) {
    gsap.set(part(li, '.pt-dot'), { scale: 0, opacity: 0 });
    gsap.set(part(li, '.pt-stem'), { '--s': 0 });
    gsap.set(words(li), { opacity: 0, y: 14 });
    var pic = part(li, '.pt-pic');
    if (pic) { gsap.set(pic, { clipPath: closed(li) }); gsap.set(pic.firstElementChild, { scale: 1.1 }); }
  });

  function play() {
    var D = 1.9, box = list.getBoundingClientRect(), h = horizontal();
    var tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tl.to(list, { '--draw': 1, duration: D, ease: 'sine.inOut' }, 0);
    items.forEach(function (li) {
      var dot = part(li, '.pt-dot'), r = dot.getBoundingClientRect();
      var f = h ? (r.left + r.width / 2 - box.left) / box.width : (r.top + r.height / 2 - box.top) / box.height;
      f = Math.min(Math.max(f, 0), 1);
      /* the time at which the sine.inOut line reaches this marker */
      var t = D * Math.acos(1 - 2 * f) / Math.PI;
      tl.to(dot, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, t)
        .to(part(li, '.pt-stem'), { '--s': 1, duration: 0.5, ease: 'power2.out' }, t + 0.1)
        .to(words(li), { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, t + 0.25);
      var pic = part(li, '.pt-pic');
      if (pic) {
        tl.fromTo(pic, { clipPath: closed(li) }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, t + 0.3)
          .to(pic.firstElementChild, { scale: 1, duration: 1.4, ease: 'power3.out' }, t + 0.3);
      }
    });
    tl.eventCallback('onComplete', function () {
      /* leave no inline transforms behind, so the CSS (hover, breakpoints) is in charge again */
      gsap.set(list, { clearProps: '--draw' });
      items.forEach(function (li) {
        var pic = part(li, '.pt-pic');
        gsap.set([part(li, '.pt-dot'), part(li, '.pt-stem')].concat(Array.prototype.slice.call(words(li))), { clearProps: 'all' });
        if (pic) gsap.set([pic, pic.firstElementChild], { clearProps: 'all' });
      });
    });
  }

  ST.create({ trigger: list, start: 'top 80%', once: true, onEnter: play });
})();
