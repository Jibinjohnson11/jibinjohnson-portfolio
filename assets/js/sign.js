/* jibinjohnson.in — signature preloader (home page only). Needs GSAP (loaded before this file).
   - index.html adds .is-signing to <html> before the first paint (with JS, not under reduced motion), so the white
     cover shows from the first frame, and starts a 6s fallback (window.__signT) that lifts the cover by itself if this
     file or GSAP never arrives. Once per page load; nothing is stored.
   - The signature is the traced original (one filled path, its exact shape) revealed through a mask of pen strokes
     that follow its centre line in writing order: the J and the joined "ibin" (one stroke, the J first), the two
     i-dots, then the underline. Each mask path carries data-t: the drawn fraction of its length at 40 equal steps in
     time, precomputed with the two-thirds power law of handwriting (the pen slows in tight curves, speeds up on
     long sweeps).
   - Draw ~1.9s → hold 0.3s → fade 0.45s. Scrolling is locked (CSS overflow + Lenis stopped) until the fade starts;
     then the hero intro plays. When the cover is gone the element and the timeline are removed and 'sign:done' is
     sent (hero.js builds its card ring then, so that work never costs the signature frames). */
(function () {
  'use strict';
  var win = window, doc = document, root = doc.documentElement;
  var el = doc.querySelector('.sign');
  clearTimeout(win.__signT);
  if (!el) return;

  var tl = null;
  var lenis = win.__lenis;
  var block = function (e) { e.preventDefault(); };

  var unlock = function () {
    root.classList.remove('is-signing');
    el.removeEventListener('wheel', block);
    el.removeEventListener('touchmove', block);
    if (lenis) lenis.start();
  };
  var finish = function () {
    if (tl) { tl.kill(); tl = null; }
    unlock();
    el.remove();
    doc.dispatchEvent(new Event('sign:done'));
  };

  /* the fallback already lifted the cover, or no GSAP: end now */
  if (!root.classList.contains('is-signing') || !win.gsap) { finish(); return; }

  try {
    var gsap = win.gsap;
    if (lenis) lenis.stop();
    el.addEventListener('wheel', block, { passive: false });
    el.addEventListener('touchmove', block, { passive: false });

    var svg = el.querySelector('svg');
    var masked = el.querySelector('[mask]');
    var strokes = [].map.call(el.querySelectorAll('mask path'), function (p) {
      var L = p.getTotalLength();
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = L;
      p.style.visibility = 'hidden'; /* no round-cap dot before the pen touches down */
      return { p: p, L: L, t: p.getAttribute('data-t').split(',').map(Number) };
    });

    /* u: time fraction 0–1 → drawn length, through the stroke's speed table */
    var draw = function (s, u) {
      var n = s.t.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x));
      var f = s.t[i] + (s.t[i + 1] - s.t[i]) * (x - i);
      s.p.style.strokeDashoffset = (s.L * (1 - f)).toFixed(2);
    };
    var pen = function (s, duration, ease, at) {
      var o = { u: 0 };
      tl.to(o, {
        u: 1, duration: duration, ease: ease,
        onStart: function () { s.p.style.visibility = 'visible'; },
        onUpdate: function () { draw(s, o.u); }
      }, at);
    };

    tl = gsap.timeline({ delay: 0.1, onComplete: finish });
    pen(strokes[0], 1.2, 'sine.inOut');           /* J, then "ibin" and its tail */
    pen(strokes[1], 0.1, 'power1.out', '+=0.07'); /* i-dot */
    pen(strokes[2], 0.1, 'power1.out', '+=0.05'); /* i-dot */
    pen(strokes[3], 0.34, 'power2.inOut', '+=0.08'); /* underline */
    /* fully drawn: show the path unmasked so no sub-pixel edge of the mask can ever clip it */
    tl.call(function () { masked.removeAttribute('mask'); });
    tl.call(function () { el.classList.add('out'); unlock(); }, null, '+=0.3'); /* hold, then reveal */
    tl.to(el, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' });
    tl.to(svg, { y: -12, duration: 0.45, ease: 'power2.out' }, '<');
  } catch (err) {
    finish();
  }
})();
