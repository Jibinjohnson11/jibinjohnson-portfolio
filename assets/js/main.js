/* jibinjohnson.in — interactions: mobile menu, glass header, home hero load-in and pointer parallax,
   heading and section reveals, tool chips and their tooltips, project filters, floating WhatsApp button, contact form.
   No libraries; everything works without it. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body, win = window;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- mobile menu ---------- */
  var burger = $('.burger');
  if (burger) {
    var setMenu = function (open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      /* smooth scrolling (smooth.js) pauses under the open menu, like the page's own overflow */
      if (win.__lenis) { if (open) win.__lenis.stop(); else win.__lenis.start(); }
    };
    burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    $$('.sheet a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- on scroll: header border, floating WhatsApp button after the first screen ---------- */
  var head = $('.head'), wa = $('.wa'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = win.scrollY;
    if (head) head.classList.toggle('scrolled', y > 8);
    if (wa) wa.classList.toggle('show', y > win.innerHeight);
  }
  win.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (!reduce && 'IntersectionObserver' in win) {
    /* on the home page the section after the hero ([data-arrive], Services) is revealed by the hero push (hero.js),
       so it is left out here */
    var pushed = function (el) { return !!$('.hero[data-push]') && !!el.closest('[data-arrive]'); };
    /* ---------- each section's content fades up once as it enters the viewport (not the hero) ---------- */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('section:not(.hero) > .wrap').forEach(function (b) { if (!pushed(b)) { b.classList.add('rv'); io.observe(b); } });

    /* ---------- H2s and the statement line slide up once, line by line ----------
       The heading keeps its own line breaks: its rendered lines are measured, each line is wrapped
       and slid up, then the original markup is restored (also on resize). */
    var pending = [];
    var restore = function (h) {
      if (h._html == null) return;
      h.innerHTML = h._html; h._html = null;
      h.classList.remove('rise-in');
    };
    var rise = function (h) {
      h.classList.remove('rise-wait');
      var words = [], tw = doc.createTreeWalker(h, NodeFilter.SHOW_TEXT), n, m, re;
      while ((n = tw.nextNode())) {
        re = /[^ \t\n\r]+/g;
        while ((m = re.exec(n.data))) {
          var r = doc.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          var rects = r.getClientRects();
          if (rects.length !== 1) return;          /* a word broken across lines: leave the heading as it is */
          words.push({ n: n, s: m.index, e: m.index + m[0].length, top: rects[0].top });
        }
      }
      if (!words.length) return;
      var lines = [[words[0]]];
      for (var i = 1; i < words.length; i++) {
        var cur = lines[lines.length - 1];
        if (Math.abs(words[i].top - cur[0].top) < 4) cur.push(words[i]); else lines.push([words[i]]);
      }
      var frag = doc.createDocumentFragment();
      lines.forEach(function (ln, k) {
        var r = doc.createRange();
        r.setStart(ln[0].n, ln[0].s); r.setEnd(ln[ln.length - 1].n, ln[ln.length - 1].e);
        var outer = doc.createElement('span'), inner = doc.createElement('span');
        outer.className = 'rl'; inner.style.setProperty('--d', (k * 0.09) + 's');
        inner.appendChild(r.cloneContents()); outer.appendChild(inner); frag.appendChild(outer);
      });
      h._html = h.innerHTML;
      h.innerHTML = ''; h.appendChild(frag);
      pending.push(h);
      requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('rise-in'); }); });
      setTimeout(function () { restore(h); }, 700 + lines.length * 90);
    };
    var hio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { hio.unobserve(e.target); rise(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    $$('h2:not(.sr), .shout').forEach(function (h) { if (!pushed(h)) { h.classList.add('rise-wait'); hio.observe(h); } });
    win.addEventListener('resize', function () { pending.forEach(restore); pending = []; }, { passive: true });
  }

  /* ---------- counters (home About): count up once from 0 on entering the viewport; static under reduced motion ---------- */
  var nums = $$('[data-count]');
  if (nums.length && !reduce && 'IntersectionObserver' in win) {
    var count = function (el) {
      var to = +el.getAttribute('data-count'), t0 = null, dur = 1400;
      var step = function (now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cio.unobserve(e.target); count(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    nums.forEach(function (el) { el.textContent = '0'; });
    /* hero.js (runs after this file) sets __aboutPushed when it reveals the [data-arrive] section itself: counters in it
       then start on its 'about:counters' event, as they fade in; otherwise (and everywhere else) when they enter the viewport */
    doc.addEventListener('DOMContentLoaded', function () {
      var held = win.__aboutPushed ? nums.filter(function (el) { return !!el.closest('[data-arrive]'); }) : [];
      nums.forEach(function (el) { if (held.indexOf(el) < 0) cio.observe(el); });
      if (held.length) doc.addEventListener('about:counters', function () { held.forEach(count); }, { once: true });
    });
  }

  /* ---------- project filters: the home grid; on the Projects page the grid and the write-ups (.filter-scope) ---------- */
  var tabs = $$('.filters button'), grid = $('.filter-scope') || $('.pgrid'), cards = grid ? $$('[data-type]', grid) : [];
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var f = tab.getAttribute('data-filter');
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t === tab ? 'true' : 'false'); });
      var apply = function () {
        cards.forEach(function (c) { c.hidden = f !== 'all' && c.getAttribute('data-type') !== f; });
        grid.classList.remove('fading');
      };
      if (reduce) apply(); else { grid.classList.add('fading'); setTimeout(apply, 170); }
    });
  });

  /* ---------- home hero: glass layers follow the pointer by their data-depth (desktop, fine pointer only) ---------- */
  var layers = $$('.scene .layer[data-depth]');
  if (layers.length && fine && !reduce) {
    var mx = 0, my = 0, queued = false;
    var move = function () {
      queued = false;
      layers.forEach(function (l) {
        var d = +l.getAttribute('data-depth');
        l.style.transform = 'translate3d(' + (mx * d).toFixed(1) + 'px,' + (my * d).toFixed(1) + 'px,0)';
      });
    };
    win.addEventListener('pointermove', function (e) {
      mx = e.clientX / win.innerWidth - 0.5; my = e.clientY / win.innerHeight - 0.5;
      if (!queued) { queued = true; requestAnimationFrame(move); }
    }, { passive: true });
  }

  /* ---------- contact form (Netlify Forms) ---------- */
  var form = $('form[data-netlify]');
  if (form) {
    var status = $('.form-status', form), send = $('button[type=submit]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = 'Sending your message…';
      send.disabled = true;
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        status.className = 'form-status ok';
        status.textContent = 'Message sent. I reply within one working day.';
      }).catch(function () {
        status.textContent = 'Message not sent. Email jibinjohnsoninfo@gmail.com or use WhatsApp on +91 77362 08172.';
      }).then(function () { send.disabled = false; });
    });
  }

  /* ---------- tool chips (home Stack, About toolkit): each group's chips fade up in turn as the group comes into view ---------- */
  if (!reduce && 'IntersectionObserver' in win) {
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('st-in'); tio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('.stk-card, .ab-group').forEach(function (g) {
      g.classList.add('st');
      $$('.tk, .chip', g).forEach(function (c, i) { c.style.setProperty('--i', Math.min(i, 12)); });
      tio.observe(g);
    });
  }

  /* ---------- AEO / GEO tooltips: shown on hover, keyboard focus and tap (CSS + .open); Escape hides them.
     The text is always in the HTML and linked with aria-describedby. Kept inside the viewport on narrow screens. ---------- */
  var tips = $$('.tip-wrap');
  if (tips.length) {
    /* measured and shifted in the same task it opens, so it never paints in the wrong place */
    var place = function (w) {
      var box = $('.tip-box', w);
      box.style.setProperty('--dx', '0px');
      var r = box.getBoundingClientRect(), vw = root.clientWidth, dx = 0;
      if (!r.width) return;
      if (r.left < 12) dx = 12 - r.left; else if (r.right > vw - 12) dx = vw - 12 - r.right;
      box.style.setProperty('--dx', dx + 'px');
    };
    tips.forEach(function (w) {
      var b = $('.tip', w);
      var on = function () { w.classList.remove('off'); place(w); };
      w.addEventListener('mouseenter', on);
      b.addEventListener('focus', on);
      b.addEventListener('blur', function () { w.classList.remove('open', 'off'); });
      w.addEventListener('mouseleave', function () { w.classList.remove('off'); });
      b.addEventListener('click', function () {
        /* a tap toggles the tip */
        w.classList.toggle('open');
        on();
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tips.forEach(function (w) { w.classList.remove('open'); w.classList.add('off'); });
    });
    doc.addEventListener('click', function (e) {
      tips.forEach(function (w) { if (!w.contains(e.target)) w.classList.remove('open'); });
    });
  }

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
