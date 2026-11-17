/* jibinjohnson.in — home Services: scroll-driven card rotation (GSAP + ScrollTrigger, loaded before this file).
   Three places: a smaller card top right (next), the main card in the centre (current), a smaller card bottom left
   (previous). On each step of scroll a new card fades in from the right at the top, the top-right card moves to the
   centre and grows, the centre card shrinks into the bottom left, and the bottom-left card fades out below.
   The section pins while every card takes the centre once (one step per card after the first); the order loops, so the
   last card's "next" is the first and its "previous" the one before it.
   Each card's place is one continuous number d (0 centre, 1 top right, -1 bottom left, ±2 off stage), so every
   property is interpolated from the same value and the motion reverses exactly. Cards rest in place at either end of
   each step (HOLD), so a step reads as one deliberate move.
   Back cards show only their image and title: each card's height runs between its own measured "compact" height (to
   the foot of the H3) and its full height (fits its content). Leaving the centre, the description, chips and footer
   fade out first (--t) and only then does the card shrink; arriving, it grows first and the text fades in after, so
   no text is ever cut at a card edge. The text stays in the HTML (opacity only).
   The panel left of the cards (counter, one-liner, description, checklist; six panes in the HTML) follows the same
   position: at the midpoint of a step, where the incoming card passes in front, the script moves .is-on to the new
   pane and updates the counter; CSS cross-fades them (300ms, 8px rise; instant under reduced motion).
   Without JS or GSAP, under reduced motion or on very short screens the grid stays (gsap.matchMedia reverts it). */
(function () {
  'use strict';
  var win = window, gsap = win.gsap, ST = win.ScrollTrigger;
  var sec = document.getElementById('services');
  if (!gsap || !ST || !gsap.matchMedia || !sec) return;
  var list = sec.querySelector('.bento');
  var items = list ? Array.prototype.slice.call(list.children) : [];
  var n = items.length;
  if (n < 4) return;
  gsap.registerPlugin(ST);

  var cards = items.map(function (li) { return li.querySelector('.svc-card'); });
  var heads = cards.map(function (c) { return c.querySelector('h3'); });
  var panes = Array.prototype.slice.call(sec.querySelectorAll('.svc-pane'));
  var count = sec.querySelector('.svc-count');
  var pad = function (v) { return (v < 10 ? '0' : '') + v; };
  var active = 0;
  function setActive(c) {
    if (c === active || !panes[c]) return;
    if (panes[active]) panes[active].classList.remove('is-on');
    panes[c].classList.add('is-on');
    active = c;
    if (count) {
      count.textContent = pad(c + 1) + ' / ' + pad(n);
      count.classList.remove('is-new');
      void count.offsetWidth;   /* restart the fade */
      count.classList.add('is-new');
    }
  }

  var STEP = 0.75;   /* viewport heights of scroll per step */
  var HOLD = 0.16;   /* part of each step, at either end, where the cards rest */
  var TEXT = 0.6;    /* closeness to the centre (f) from which the back-card text fades in; below it the card resizes */
  var ease = gsap.parseEase('power3.inOut');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  var stage = sec.querySelector('.svc-stage') || sec;

  /* 900px and up the whole section pins (panel and buttons left, cards right); below, the label and H2 scroll past
     and only the stage (panel above the cards) pins, so the panel never squeezes the cards */
  gsap.matchMedia().add({
    wide: '(min-width: 900px)',
    on: '(prefers-reduced-motion: no-preference) and (min-height: 520px)'
  }, function (ctx) {
    if (!ctx.conditions.on) return;
    var pinEl = ctx.conditions.wide ? sec : stage;
    sec.classList.add('svc-rot');

    var state = { raw: 0 };
    var slots = null, full = [], compact = [];

    /* sizes and the five places, from the stage (the list) */
    function layout() {
      var sw = list.clientWidth, sh = list.clientHeight;
      if (!sw || !sh) return;
      var phone = sw < 480;
      /* below 768px the side cards tuck behind the main card (see below), so the main card can take the stage width */
      var tuck = win.innerWidth < 768;
      /* cards are laid out at one width (400px; on phones 86% of the stage, at most 360px; tucked, the stage width, at
         most 360px) and scaled down to the stage if needed, never up */
      var cw = tuck ? Math.round(Math.min(360, sw)) : phone ? Math.round(Math.min(360, sw * 0.86)) : 400;
      list.style.setProperty('--cw', cw + 'px');
      var HF = 0, HC = 0;
      cards.forEach(function (card, i) {
        card.style.height = '';
        full[i] = card.offsetHeight;
        compact[i] = Math.min(full[i], Math.ceil(heads[i].offsetTop + heads[i].offsetHeight + 18));
        HF = Math.max(HF, full[i]); HC = Math.max(HC, compact[i]);
      });
      if (tuck) {
        /* phones: a tucked stack. Every card takes the tallest card's height (no resizing; back-card text still fades
           by --t); the side cards are 0.85x, sit behind the main card and peek out PEEK px above (next, nudged right)
           and below (previous, nudged left), so the stack still reads as three cards. Same order, timing, easing. */
        var PEEK = 24, TS = 0.85;
        for (var q = 0; q < n; q++) { full[q] = compact[q] = HF; }
        var TG = Math.min(1, (sh * 0.98 - 2 * PEEK) / HF, sw / cw);
        var tvw = cw * TG, thf = HF * TG, ths = thf * TS, ttx = tvw * 0.05;
        var tyT = -thf / 2 - PEEK + ths / 2, tyB = thf / 2 + PEEK - ths / 2;
        slots = {
          '-2': { x: -ttx * 1.6, y: tyB, s: TG * TS * 0.94, o: 0 },
          '-1': { x: -ttx, y: tyB, s: TG * TS, o: 0.92 },
          '0': { x: 0, y: 0, s: TG, o: 1 },
          '1': { x: ttx, y: tyT, s: TG * TS, o: 0.92 },
          '2': { x: ttx * 1.6, y: tyT, s: TG * TS * 0.94, o: 0 }
        };
        return;
      }
      /* S: side cards relative to the centre card. OVX: how far they tuck behind it sideways. OVB: how much of the
         bottom-left card's image slides under the centre card's foot. The top-right card sits wholly above the centre
         card's top edge, so its title is never covered, and can tuck in sideways as far as half its width. */
      var S = phone ? 0.44 : 0.56, OVX = 0.5, OVB = 0.25;
      var G = Math.min(1,
        sh * 0.96 / (HF + HC * S * (2 - OVB)),
        phone ? sw * 0.9 / cw : sw / (cw * (1 + 2 * S * (1 - OVX))));
      var vw = cw * G, hf = HF * G, w = vw * S, hc = HC * G * S;
      var tx = phone ? sw / 2 - w / 2 : vw / 2 + w / 2 - w * OVX;
      var yo = hc * OVB / 2;                       /* centres the group vertically */
      var yT = -hf / 2 - hc / 2 + yo, yB = hf / 2 + hc / 2 - hc * OVB + yo;
      slots = {
        '-2': { x: -tx, y: yB + hc * 0.35, s: G * S * 0.94, o: 0 },
        '-1': { x: -tx, y: yB, s: G * S, o: 0.92 },
        '0': { x: 0, y: yo, s: G, o: 1 },
        '1': { x: tx, y: yT, s: G * S, o: 0.92 },
        /* the new card starts a little right of the top-right place, inside the stage (never past the screen edge) */
        '2': { x: Math.max(tx, Math.min(tx + w * 0.5, sw / 2 - w * 0.47)), y: yT, s: G * S * 0.94, o: 0 }
      };
    }

    function render() {
      if (!slots) return;
      var raw = state.raw, k = Math.floor(raw), fr = raw - k;
      var p = k + ease(clamp((fr - HOLD) / (1 - 2 * HOLD)));
      items.forEach(function (li, i) {
        var d = i - p;
        d = ((d + n / 2) % n + n) % n - n / 2;   /* the shortest way round: -n/2 … n/2 */
        var st = li.style;
        var f = clamp(1 - Math.abs(d));
        cards[i].style.height = (compact[i] + (full[i] - compact[i]) * clamp(f / TEXT)).toFixed(1) + 'px';
        st.setProperty('--f', f.toFixed(3));
        st.setProperty('--t', clamp((f - TEXT) / (1 - TEXT)).toFixed(3));
        if (d <= -2 || d >= 2) { st.visibility = 'hidden'; st.opacity = 0; return; }
        var j = Math.min(1, Math.floor(d)), u = d - j;
        /* the entering card waits until the one before it has left the top-right place; the leaving card goes
           early, before the next one reaches the bottom left, so no title is crossed by a passing card */
        if (j === 1) u = clamp(u * 2);          /* enters over the second half of the step */
        else if (j === -2) u = clamp(u * 2 - 1); /* leaves over the first half */
        var a = slots[j], b = slots[j + 1];
        var x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u;
        var s = a.s + (b.s - a.s) * u, o = a.o + (b.o - a.o) * u;
        st.visibility = o < 0.01 ? 'hidden' : 'visible';
        st.opacity = o;
        /* nearer the centre is higher; at a tie the incoming card (d > 0) passes in front */
        st.zIndex = Math.round(50 - Math.abs(d) * 10) + (d > 0 ? 1 : 0);
        st.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
      });
      /* the panel follows the card in (or nearest) the centre */
      setActive(Math.round(p) % n);
    }

    var tween = gsap.to(state, {
      raw: n - 1,
      ease: 'none',
      onUpdate: render,
      scrollTrigger: {
        trigger: pinEl,
        start: 'top top',
        end: function () { return '+=' + Math.round(win.innerHeight * STEP * (n - 1)); },
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });
    var trig = tween.scrollTrigger;

    var onRefresh = function () { layout(); render(); };
    ST.addEventListener('refresh', onRefresh);
    layout(); render();

    /* keyboard: tabbing to a card's arrow scrolls to the step where that card is in the centre */
    var onFocus = function (e) {
      var li = e.target.closest && e.target.closest('.bento > li');
      if (!li) return;
      try { if (!e.target.matches(':focus-visible')) return; } catch (err) { /* old browsers: always follow focus */ }
      var y = trig.start + (trig.end - trig.start) * (items.indexOf(li) / (n - 1));
      if (win.__lenis) win.__lenis.scrollTo(y, { duration: 0.8 }); else win.scrollTo(0, y);
    };
    list.addEventListener('focusin', onFocus);

    return function () {
      ST.removeEventListener('refresh', onRefresh);
      list.removeEventListener('focusin', onFocus);
      sec.classList.remove('svc-rot');
      list.style.removeProperty('--cw');
      items.forEach(function (li, i) {
        ['visibility', 'opacity', 'z-index', 'transform', '--f', '--t'].forEach(function (pr) { li.style.removeProperty(pr); });
        cards[i].style.removeProperty('height');
      });
      setActive(0);
      if (count) count.classList.remove('is-new');
    };
  });
})();
