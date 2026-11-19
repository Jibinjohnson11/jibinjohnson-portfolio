/* jibinjohnson.in — home Selected work (#work): while the section crosses the viewport the four tilted project cards drift
   upward at different speeds and turn a few degrees toward straight (GSAP + ScrollTrigger, loaded before this file,
   scrubbed). Only the --dy and --k custom properties on each card's <li> change; they feed the card's transform in
   main.css, so nothing moves in the layout. 640px and up only (phones show an upright swipe row). Off under reduced
   motion and without GSAP: the cards keep their static tilt. */
(function () {
  'use strict';
  var win = window, gsap = win.gsap, ST = win.ScrollTrigger;
  var sec = document.getElementById('work');
  if (!gsap || !ST || !sec || !gsap.matchMedia) return;
  gsap.registerPlugin(ST);

  var cards = Array.prototype.slice.call(sec.querySelectorAll('.wk-c'));
  /* px each card rises over the whole pass, so they move at different speeds; card 2 barely moves (on desktop it covers
     the top of the giant word's j, with only a few px to spare) */
  var travel = [80, 12, 110, 62];

  gsap.matchMedia().add('(min-width:640px) and (prefers-reduced-motion: no-preference)', function () {
    cards.forEach(function (li, i) {
      var t = travel[i % travel.length];
      gsap.fromTo(li, { '--dy': t / 2 + 'px', '--k': 1 }, {
        '--dy': -t / 2 + 'px', '--k': 0.55, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  });
})();
