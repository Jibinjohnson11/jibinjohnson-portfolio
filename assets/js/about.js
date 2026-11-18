/* jibinjohnson.in — About page only: section index, local time, principles accordion, toolkit links, journey line.
   No libraries. Without it the page reads in full: the time shows "IST", every principle is open, the timeline is filled. */
(function () {
  'use strict';
  var doc = document, win = window;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- sticky section index: mark the section crossing the middle of the screen ---------- */
  var links = $$('.ab-index a');
  if (links.length && 'IntersectionObserver' in win) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var setActive = function (id) {
      links.forEach(function (a) {
        if (a === byId[id]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = doc.getElementById(id); if (s) sio.observe(s); });
    setActive('intro');
  }

  /* ---------- local time in IST, updated on the minute ---------- */
  var clock = doc.querySelector('[data-ist]');
  if (clock && win.Intl) {
    var fmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    var tick = function () {
      clock.textContent = fmt.format(new Date()).toLowerCase() + ' IST';
      setTimeout(tick, 60000 - Date.now() % 60000 + 50);
    };
    tick();
  }

  /* ---------- principles: one button per item toggles its panel ---------- */
  $$('.ab-acc button').forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });

  /* ---------- toolkit: a tool chip highlights the tools it works with (hover, focus or tap); the others fade back ---------- */
  var box = doc.querySelector('.ab-tools');
  if (box) {
    /* tools only (skills are plain text); keys are each chip's data-t */
    var pairs = {
      html: ['css', 'js', 'bootstrap'], css: ['bootstrap'], js: ['bootstrap', 'mongo'],
      python: ['django', 'postgres'], django: ['postgres', 'mysql', 'docker'],
      postgres: ['sql', 'docker'], mysql: ['sql'], sql: ['excel', 'tableau', 'powerbi'],
      shopify: ['liquid', 'razorpay'], liquid: ['html', 'css', 'js'], razorpay: ['django', 'js'],
      ga: ['excel'], tableau: ['powerbi', 'excel'], powerbi: ['excel'],
      chatgpt: ['claude'], claude: ['python'],
      pandas: ['numpy', 'python', 'sql', 'excel'], numpy: ['python'], sklearn: ['pandas', 'numpy'],
      tensorflow: ['keras', 'numpy', 'python'], keras: ['python'], opencv: ['numpy', 'python'],
      git: ['github', 'vscode'], github: ['vscode'], docker: ['aws'], aws: ['django']
    };
    var map = {};
    Object.keys(pairs).forEach(function (a) {
      pairs[a].forEach(function (b) {
        (map[a] = map[a] || []).push(b);
        (map[b] = map[b] || []).push(a);
      });
    });
    var chips = $$('.chip', box), pinned = null;
    var show = function (chip) {
      box.classList.toggle('linking', !!chip);
      var t = chip && chip.getAttribute('data-t'), rel = (t && map[t]) || [];
      chips.forEach(function (c) {
        var ct = c.getAttribute('data-t');
        c.classList.toggle('on', c === chip);
        c.classList.toggle('rel', rel.indexOf(ct) > -1);
      });
    };
    chips.forEach(function (c) {
      c.addEventListener('mouseenter', function () { show(c); });
      c.addEventListener('mouseleave', function () { show(pinned); });
      c.addEventListener('focus', function () { show(c); });
      c.addEventListener('blur', function () { show(pinned); });
      c.addEventListener('click', function () {
        pinned = pinned === c ? null : c;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === pinned ? 'true' : 'false'); });
        show(pinned);
      });
    });
  }

  /* ---------- journey: dots light up and the line fills down to the last one reached (not under reduced motion) ---------- */
  var line = doc.querySelector('.ab-line');
  if (line && !reduce && 'IntersectionObserver' in win) {
    var items = $$('.ab-line > li');
    var fill = function () {
      var last = -1;
      items.forEach(function (li, i) { if (li.classList.contains('lit')) last = i; });
      items.slice(0, last + 1).forEach(function (li) { li.classList.add('lit'); });   /* after a jump, light the ones passed */
      line.style.setProperty('--fill', (last > -1 ? items[last].offsetTop : 0) + 'px');
    };
    line.classList.add('track');
    fill();
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('lit'); lio.unobserve(e.target); }
      });
      fill();
    }, { rootMargin: '0px 0px -35% 0px' });
    items.forEach(function (li) { lio.observe(li); });
    win.addEventListener('resize', fill, { passive: true });
  }
})();
