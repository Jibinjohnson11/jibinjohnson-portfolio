/* footer.js — footer (.end), every page. No library.
   1. "Scroll top" button: glides to the top (Lenis when it runs), then focuses the skip link's target.
   2. (link hover underline is CSS only, in main.css)
   3. Entrance: the link groups, the CTA card and the bottom bar fade up 80ms apart.
   4. Giant wordmark: each letter slides in from the left inside its own mask, 0.15s apart, once at 15% in view.
   Nothing is hidden without JS or under reduced motion: the motion classes are only added here. */
(function () {
  var doc = document, win = window;
  var end = doc.querySelector('.end');
  if (!end) return;
  var reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel) { return Array.prototype.slice.call(end.querySelectorAll(sel)); };

  /* ---------- 1. scroll to top ---------- */
  var top = end.querySelector('.to-top');
  if (top) top.addEventListener('click', function () {
    if (win.__lenis && !reduce) win.__lenis.scrollTo(0);
    else win.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var main = doc.getElementById('main');   /* keyboard users continue from the top of the page */
    if (main) { if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
  });

  /* ---------- 4. giant wordmark ----------
     Each letter becomes span.wm__mask (aria-hidden, clips) > span.wm__char (slides). Runs before the reduced-motion
     return so the letters are always split; under reduced motion the CSS shows them in place, with no transition. */
  var wm = end.querySelector('.wm');
  if (wm) {
    var word = wm.textContent.trim();
    wm.textContent = '';
    word.split('').forEach(function (ch, i) {
      var mask = doc.createElement('span'), chr = doc.createElement('span');
      mask.className = 'wm__mask'; mask.setAttribute('aria-hidden', 'true');
      chr.className = 'wm__char'; chr.textContent = ch; chr.style.setProperty('--i', i);
      mask.appendChild(chr); wm.appendChild(mask);
    });

    /* fit to width: the word's ink runs exactly from the left to the right end of the divider line.
       Measured on the masks (never transformed), so the hidden slide-in state doesn't affect it. */
    var masks = wm.children, ctx = doc.createElement('canvas').getContext('2d');
    var oneScreen = win.matchMedia('(min-width: 1024px) and (min-height: 700px)');   /* same query as the CSS */
    var fitWordmark = function () {
      var first = masks[0], last = masks[masks.length - 1];
      if (!first) return;
      first.style.marginLeft = '';
      wm.style.fontSize = '100px';                                   /* test size */
      var natural = last.getBoundingClientRect().right - first.getBoundingClientRect().left;   /* masks + gaps */
      var cs = getComputedStyle(wm);
      var box = wm.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);    /* = the divider's length */
      /* optical edges: the space each glyph carries beside its ink (side bearings), at 100px */
      ctx.font = cs.fontWeight + ' 100px ' + cs.fontFamily; ctx.textAlign = 'left';
      var a = ctx.measureText(first.textContent), z = ctx.measureText(last.textContent);
      var lsb = -a.actualBoundingBoxLeft, rsb = z.width - z.actualBoundingBoxRight;
      var ink = natural - lsb - rsb;
      if (!(ink > 0) || !(box > 0)) { wm.style.fontSize = ''; return; }
      var size = 100 * box / ink;                                    /* a) fits the width */
      if (oneScreen.matches) {
        /* b) fits the height left for the wordmark (the band is one screen tall here). A letter box is .8em of
           line-height plus the masks' padding, so measure that ratio rather than assume .8 */
        var avail = wm.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        var perPx = first.getBoundingClientRect().height / 100;
        if (avail > 0 && perPx > 0) size = Math.min(size, avail / perPx);
      }
      wm.style.fontSize = Math.floor(size * 100) / 100 + 'px';
      first.style.marginLeft = (-lsb / 100) + 'em';                  /* pull the J's ink onto the left edge */
    };
    fitWordmark();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitWordmark);   /* re-measure with the real Switzer */
    var fitT;
    win.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitWordmark, 100); });

    /* scroll-linked slide: the scroll position is the timeline, so scrolling up plays the same path backwards and
       stopping halfway leaves the letters halfway.
       progress 0 = the wordmark's top edge at the bottom of the screen, 1 = the whole wordmark in view.
       No scroll listener (site rule): while the wordmark is near the screen (IntersectionObserver) a rAF loop reads
       its position each frame, which follows Lenis, touch, keys and the scrollbar alike; it eases the rendered
       progress towards that target (lerp .12) and writes the letters only when the value changes. */
    if (!reduce) {
      var chars = wm.querySelectorAll('.wm__char'), N = chars.length;
      var STAGGER = 0.15, SPAN = 1 - STAGGER * (N - 1);                  /* each letter's share of the timeline */
      var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
      var current = -1, drawn = -1, near = false, raf = 0;
      var target = function () {
        var r = wm.getBoundingClientRect();
        return r.height ? clamp01((win.innerHeight - r.top) / r.height) : 1;
      };
      var render = function (p) {
        for (var i = 0; i < N; i++) {
          var local = clamp01((p - i * STAGGER) / SPAN);
          var eased = 1 - Math.pow(1 - local, 4);                      /* ease-out quart, ≈ cubic-bezier(.16,1,.3,1) */
          chars[i].style.transform = 'translate3d(' + (-101 * (1 - eased)).toFixed(3) + '%,0,0)';
        }
      };
      var tick = function () {
        raf = 0;
        var t = target();
        if (current < 0) current = t;                                   /* first frame: show the right state at once */
        else current = Math.abs(t - current) < 0.0005 ? t : current + (t - current) * 0.12;
        if (current !== drawn) { render(current); drawn = current; }
        if (near || current !== t) raf = win.requestAnimationFrame(tick);   /* off screen and settled: stop */
      };
      var start = function () { if (!raf) raf = win.requestAnimationFrame(tick); };
      render(0);                                                        /* hidden until the first measurement */
      if ('IntersectionObserver' in win) {
        new IntersectionObserver(function (entries) {
          near = entries[entries.length - 1].isIntersecting;
          start();
        }, { rootMargin: '25% 0px' }).observe(wm);                     /* wake a little before it reaches the screen */
      } else { near = true; start(); }
      win.addEventListener('resize', start);
      win.addEventListener('load', start);
    }
  }

  if (reduce) return;

  if (!('IntersectionObserver' in win)) return;
  end.classList.add('ft-motion');

  /* ---------- 3. staggered entrance ---------- */
  var items = $$('.foot-nav > div, .foot-cta, .legal');
  items.forEach(function (el, i) { el.classList.add('ft-rv'); el.style.setProperty('--i', i); });
  var io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) { end.classList.add('ft-in'); io.disconnect(); }
  }, { rootMargin: '0px 0px -10% 0px' });
  io.observe(end);

})();
