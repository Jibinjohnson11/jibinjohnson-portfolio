/* jibinjohnson.in — motion and interaction layer.
   Only dependency: Lenis (smooth scroll), loaded separately; everything works without it. */
(function () {
  'use strict';
  var doc = document, body = doc.body, win = window;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = matchMedia('(min-width: 901px) and (min-height: 640px)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ---------- loader (home, once per visit) ---------- */
  var loader = $('.loader'), seen = false;
  try { seen = sessionStorage.getItem('seen') === '1'; sessionStorage.setItem('seen', '1'); } catch (e) {}
  function ready() { body.classList.add('ready'); }
  if (!loader || reduce || seen) {
    if (loader) loader.remove();
    requestAnimationFrame(ready);
  } else {
    var veil = $('.veil'); if (veil) veil.style.animation = 'none';
    var num = $('span', loader), t0 = performance.now();
    (function tick(now) {
      var p = Math.min((now - t0) / 1100, 1);
      num.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) requestAnimationFrame(tick); else ready();
    })(t0);
  }

  /* ---------- smooth scroll (Lenis, desktop pointers only) ---------- */
  var lenis = null;
  if (win.Lenis && fine && !reduce) {
    try {
      lenis = new win.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
      doc.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        var t = a && a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -88 }); }
      });
    } catch (e) { lenis = null; }
  }

  /* ---------- mobile menu ---------- */
  var burger = $('.burger');
  if (burger) {
    var setMenu = function (open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      if (lenis) lenis[open ? 'stop' : 'start']();
    };
    burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    $$('.sheet a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- reveals: headings word by word, lists in sequence ---------- */
  function words(el, cls) {
    var out = doc.createDocumentFragment(), list = [];
    el.textContent.trim().split(/\s+/).forEach(function (w, i) {
      var s = doc.createElement('span'); s.className = cls;
      if (cls === 'mw') { var inr = doc.createElement('span'); inr.textContent = w; inr.style.setProperty('--n', i); s.appendChild(inr); }
      else s.textContent = w;
      if (i) out.appendChild(doc.createTextNode(' '));
      out.appendChild(s); list.push(s);
    });
    el.textContent = ''; el.appendChild(out);
    return list;
  }
  var masks = $$('.mask');
  var items = $$('.svc li, .incl li, .why li, .price, .ind li, .stack > div, .proof li, .faq details, .proj, .bio > div, .case');
  if (!reduce) {
    masks.forEach(function (m) { words(m, 'mw'); });
    items.forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add('rv'); el.style.setProperty('--d', (i % 6) * 70 + 'ms');
    });
  }
  if ('IntersectionObserver' in win && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    masks.concat(items).forEach(function (m) { io.observe(m); });
  } else masks.concat(items).forEach(function (m) { m.classList.add('in'); });

  var scrubWords = [];
  $$('.scrub').forEach(function (p) { scrubWords = scrubWords.concat(words(p, 'w')); });

  /* ---------- scroll-linked scenes, one pass per frame ---------- */
  var head = $('.head'), hero = $('.hero:not(.sub)'), serp = $('.serp');
  var proc = $('.proc'), steps = $('.steps'), stepItems = steps ? $$('li', steps) : [], bar = $('.proc-bar i');
  var grow = reduce ? [] : $$('.dark:not(.hero):not(.proc-pin)');
  var footWord = $('.foot-word');
  grow.forEach(function (g) { g.classList.add('grow'); });
  var lastY = 0, ticking = false, mx = 0, my = 0, heroLive = true;

  var stick = 0;
  function pinHero() {
    if (!hero || reduce) return;
    var H = hero.offsetHeight, vh = win.innerHeight, gap = parseFloat(getComputedStyle(hero).marginTop) || 0;
    var on = wide.matches && H <= vh * 1.35;
    hero.classList.toggle('pin', on);
    hero.style.top = on ? Math.min(gap, vh - H - gap) + 'px' : '';
    stick = on ? Math.max(0, H + 2 * gap - vh) : 0;
  }
  function frame() {
    ticking = false;
    var y = win.scrollY, vh = win.innerHeight;
    if (head && !body.classList.contains('menu-open')) head.classList.toggle('hide', y > lastY && y > 500);
    lastY = y;

    if (hero) {
      var pinned = hero.classList.contains('pin');
      var hp = pinned ? clamp((y - stick) / (vh * 0.95)) : clamp(y / hero.offsetHeight);
      heroLive = hp < 1;
      if (pinned) {
        hero.style.setProperty('--hp', hp.toFixed(3));
        hero.style.visibility = heroLive ? '' : 'hidden';
      }
      if (serp && !reduce && heroLive) {
        serp.style.setProperty('--ry', (mx * 10 + hp * 26).toFixed(2) + 'deg');
        serp.style.setProperty('--rx', (-my * 8 - hp * 8).toFixed(2) + 'deg');
      }
    }
    if (scrubWords.length) {
      var line = vh * 0.74;
      scrubWords.forEach(function (w) { w.classList.toggle('on', w.getBoundingClientRect().top < line); });
    }
    if (proc && steps) {
      var r = proc.getBoundingClientRect();
      if (wide.matches && !reduce) {
        var p = clamp(-r.top / (r.height - vh));
        var max = steps.scrollWidth - steps.clientWidth;
        steps.style.transform = 'translate3d(' + (-p * max).toFixed(1) + 'px,0,0)';
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      } else {
        steps.style.transform = '';
        var sr = steps.getBoundingClientRect();
        steps.style.setProperty('--p', clamp((vh * 0.6 - sr.top) / sr.height).toFixed(3));
        stepItems.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top < vh * 0.6); });
      }
    }
    grow.forEach(function (g) {
      var t = g.getBoundingClientRect().top;
      if (t < vh * 1.2 && t > -vh) g.style.setProperty('--e', clamp((vh - t) / (vh * 0.55)).toFixed(3));
    });
    if (footWord && !reduce) {
      var ft = footWord.getBoundingClientRect().top;
      if (ft < vh * 1.3) footWord.style.transform = 'translate3d(0,' + (clamp((ft - vh * 0.35) / vh) * 34).toFixed(1) + '%,0)';
    }
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  win.addEventListener('scroll', ask, { passive: true });
  win.addEventListener('resize', function () { pinHero(); ask(); }, { passive: true });
  if (fine && !reduce) {
    win.addEventListener('pointermove', function (e) {
      mx = e.clientX / win.innerWidth - 0.5; my = e.clientY / win.innerHeight - 0.5;
      if (serp && heroLive) ask();
    }, { passive: true });
  }
  pinHero(); frame();

  /* ---------- hero: type a query, watch the green result climb to #1 ---------- */
  var typed = $('[data-type]');
  if (typed && serp && !reduce) {
    var rows = $$('.res', serp), nums = rows.map(function (r) { return $('b', r); });
    var setRank = function (top) {
      serp.style.setProperty('--c', top ? 1 : 0);
      setTimeout(function () {
        nums[0].textContent = top ? '1' : '4';
        for (var i = 1; i < nums.length; i++) nums[i].textContent = top ? i + 1 : i;
      }, 420);
    };
    var measure = function () { serp.style.setProperty('--step', (rows[0].offsetHeight + parseFloat(getComputedStyle(rows[0]).marginBottom)) + 'px'); };
    measure(); win.addEventListener('resize', measure, { passive: true });
    var qs = typed.getAttribute('data-type').split('|'), qi = 0, ci = qs[0].length, del = true;
    setTimeout(function type() {
      var wait = del ? 34 : 68;
      if (heroLive && !doc.hidden) {
        var q = qs[qi];
        if (del) {
          if (ci === q.length) setRank(false);
          ci--;
          if (ci === 0) { del = false; qi = (qi + 1) % qs.length; wait = 380; }
        } else {
          ci++;
          if (ci === qs[qi].length) { del = true; wait = 3600; setRank(true); }
        }
        typed.textContent = (del ? q : qs[qi]).slice(0, ci);
      }
      setTimeout(type, wait);
    }, 3200);
  }

  /* ---------- hero: 3D field of points receding to a horizon ---------- */
  var cv = $('.hero-cv');
  if (cv && !reduce && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(win.devicePixelRatio || 1, 1.5);
    var size = function () { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); win.addEventListener('resize', size, { passive: true });
    var COLS = 64, ROWS = 26, GAP = 54, F = 430;
    (function draw(t) {
      requestAnimationFrame(draw);
      if (!heroLive || doc.hidden) return;
      ctx.clearRect(0, 0, W, H);
      var time = t * 0.00045, hz = H * 0.6, cx = W * 0.5 + mx * -70;
      for (var j = 0; j < ROWS; j++) {
        var z = 30 + j * GAP, sc = F / (F + z);
        for (var i = 0; i < COLS; i++) {
          var x = (i - COLS / 2 + 0.5) * GAP;
          var wave = Math.sin(i * 0.32 + time * 2.1) * 22 + Math.cos(j * 0.42 + time * 1.6) * 22;
          var sx = cx + x * sc, sy = hz + (170 + wave) * sc + my * -18;
          if (sx < -10 || sx > W + 10 || sy > H + 10) continue;
          var a = (1 - j / ROWS) * 0.5 * Math.min(1, (sy - hz) / 60);
          if (a <= 0.01) continue;
          ctx.fillStyle = wave > 24 ? 'rgba(90,158,124,' + (a + 0.25).toFixed(2) + ')' : 'rgba(137,150,142,' + a.toFixed(2) + ')';
          var s = 0.6 + sc * 2.1;
          ctx.fillRect(sx, sy, s, s);
        }
      }
    })(0);
  }

  /* ---------- pointer details: magnetic buttons, cursor companion ---------- */
  if (fine && !reduce) {
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
    var cur = doc.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true'); body.appendChild(cur);
    var cx2 = 0, cy2 = 0, tx = 0, ty = 0, moving = false;
    win.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; cur.classList.add('show');
      var hit = e.target.closest && e.target.closest('[data-cur]');
      cur.classList.toggle('big', !!hit); cur.textContent = hit ? hit.getAttribute('data-cur') : '';
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { cur.classList.remove('show'); });
    var follow = function () {
      cx2 += (tx - cx2) * 0.2; cy2 += (ty - cy2) * 0.2;
      cur.style.transform = 'translate3d(' + cx2.toFixed(1) + 'px,' + cy2.toFixed(1) + 'px,0)';
      if (Math.abs(tx - cx2) + Math.abs(ty - cy2) > 0.3) requestAnimationFrame(follow); else moving = false;
    };
  }

  /* ---------- page-to-page transition ---------- */
  if (!reduce && $('.veil')) {
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(href) || /\.(xml|txt)$/.test(href)) return;
      e.preventDefault();
      body.classList.add('leaving');
      setTimeout(function () { win.location.href = a.href; }, 430);
    });
    win.addEventListener('pageshow', function (e) { if (e.persisted) body.classList.remove('leaving'); });
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

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
