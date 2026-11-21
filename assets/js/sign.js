/* jibinjohnson.in — signature intro (home page only). No library: its own requestAnimationFrame timeline, loaded
   async right after the .sign element, so it never waits for GSAP or the other deferred files.
   - The inline head script in index.html decides whether it plays at all: not under reduced motion, not with
     Save-Data, and once per browser session (sessionStorage 'signed', set when it decides to play). It then adds
     .is-signing to <html> before the first paint, records the start (window.__signT0) and sets a 1.4s fallback
     (window.__signT) that removes the overlay and sends 'sign:done' if this file never runs.
   - The overlay is a light veil over the hero, which renders and animates underneath from the first paint (the
     hero copy is the LCP element and is never hidden). It never takes pointer events and never locks scrolling.
   - The signature is the traced original (one filled path) revealed through a mask of pen strokes along its centre
     line in writing order: J + "ibin" (one stroke), the two i-dots, the underline. Each mask path's data-t is the
     drawn fraction at 40 equal time steps (two-thirds power law of handwriting).
   - About 1s in all: draw 0.66s → hold 0.08s → fade 0.25s. If this file runs late (over 0.4s after the start),
     it skips the drawing and just fades the veil. When done the element is removed and 'sign:done' is sent
     (hero.js builds its card ring then). */
(function () {
  'use strict';
  var win = window, doc = document, root = doc.documentElement;
  var el = doc.querySelector('.sign');
  if (!el) return;
  var done = false;
  var finish = function () {
    if (done) return;
    done = true;
    clearTimeout(win.__signT);
    root.classList.remove('is-signing');
    el.remove();
    doc.dispatchEvent(new Event('sign:done'));
  };
  /* the fallback already lifted the veil (it sent sign:done itself) */
  if (!root.classList.contains('is-signing')) { el.remove(); return; }
  clearTimeout(win.__signT);
  win.__signT = setTimeout(finish, 1500); /* new hard cap: a stalled frame loop can never keep the veil up */

  var late = (win.performance ? performance.now() : 0) - (win.__signT0 || 0) > 400;
  var ease = {
    sineInOut: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },
    p1Out: function (t) { return 1 - (1 - t) * (1 - t); },
    p2InOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    p2Out: function (t) { return 1 - Math.pow(1 - t, 3); }
  };

  try {
    var svg = el.querySelector('svg');
    var masked = el.querySelector('[mask]');
    var strokes = late ? [] : [].map.call(el.querySelectorAll('mask path'), function (p) {
      var L = p.getTotalLength();
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = L;
      p.style.visibility = 'hidden'; /* no round-cap dot before the pen touches down */
      return { p: p, L: L, t: p.getAttribute('data-t').split(',').map(Number) };
    });
    /* [stroke, start, duration, easing] in seconds */
    var plan = late ? [] : [
      [0, 0, 0.34, ease.sineInOut],  /* J, then "ibin" and its tail */
      [1, 0.37, 0.05, ease.p1Out],   /* i-dot */
      [2, 0.44, 0.05, ease.p1Out],   /* i-dot */
      [3, 0.52, 0.14, ease.p2InOut]  /* underline */
    ];
    var drawEnd = late ? 0 : 0.66, fadeAt = late ? 0 : 0.74, fadeDur = 0.25;
    var unmasked = false, t0 = null;

    /* u: time fraction 0–1 → drawn length, through the stroke's speed table */
    var draw = function (s, u) {
      var n = s.t.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x));
      var f = s.t[i] + (s.t[i + 1] - s.t[i]) * (x - i);
      s.p.style.strokeDashoffset = (s.L * (1 - f)).toFixed(2);
    };
    var frame = function (now) {
      if (done) return;
      if (t0 === null) t0 = now;
      var t = (now - t0) / 1000;
      for (var k = 0; k < plan.length; k++) {
        var st = plan[k], s = strokes[st[0]];
        if (t < st[1]) continue;
        s.p.style.visibility = 'visible';
        draw(s, st[3](Math.min(1, (t - st[1]) / st[2])));
      }
      /* fully drawn: show the path unmasked so no sub-pixel edge of the mask can ever clip it */
      if (!unmasked && t >= drawEnd) { unmasked = true; if (!late) masked.removeAttribute('mask'); }
      if (t >= fadeAt) {
        var f = ease.p2Out(Math.min(1, (t - fadeAt) / fadeDur));
        el.style.opacity = 1 - f;
        svg.style.transform = 'translateY(' + (-12 * f).toFixed(2) + 'px)';
        if (f >= 1) { finish(); return; }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } catch (err) {
    finish();
  }
})();
