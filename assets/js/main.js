/* jibinjohnson.in — interactions: mobile menu, header border, section reveals,
   floating WhatsApp button, contact form. No libraries; everything works without it. */
(function () {
  'use strict';
  var doc = document, body = doc.body, win = window;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- mobile menu ---------- */
  var burger = $('.burger');
  if (burger) {
    var setMenu = function (open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
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

  /* ---------- each section's content fades up once as it enters the viewport (not the hero) ---------- */
  if (!reduce && 'IntersectionObserver' in win) {
    var blocks = $$('section:not(.hero) > .wrap');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(function (b) { b.classList.add('rv'); io.observe(b); });
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
