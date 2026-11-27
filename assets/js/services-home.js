/* Home Services (#services, .sx): five full-bleed photo cards. GSAP + ScrollTrigger (smooth.js runs Lenis on GSAP's
   ticker and feeds ScrollTrigger, so this follows the Lenis scroll).
   - Entrance (ScrollTrigger.batch, per row): when a row of cards reaches 85% of the screen, its cards rise, fade in
     and open from the bottom (clip-path), left to right 80ms apart; then each card's title, description and
     "Explore" fade in turn.
   - Scrolling back up past a row's start plays its cards backwards; scrolling down again replays them.
   Hover effects are CSS only (the photo and title transforms are never tweened here, so their CSS transitions
   don't fight GSAP). Without GSAP or under reduced motion nothing runs and the cards are visible.
   No scroll listener, no pin. */
(function () {
  var s = document.querySelector('.sx');
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!s || !gsap || !ST || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ST);
  var grid = s.querySelector('.sx-grid');
  var cards = gsap.utils.toArray('.sx-card', grid);
  if (!grid || !cards.length) return;

  /* one paused timeline per card; ScrollTrigger.batch groups the cards that enter together (a row) and staggers them */
  var tls = cards.map(function (c) {
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .from(c, { autoAlpha: 0, y: 48, clipPath: 'inset(10% 0% 0% 0%)', duration: 1 }, 0)
      .from(c.querySelector('.sx-body'), { y: 24, duration: 0.8 }, 0.25)
      .from(c.querySelectorAll('.sx-title, .sx-desc, .sx-go'), { autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 0.25);
  });
  var waits = [];
  function tl(c) { return tls[cards.indexOf(c)]; }
  ST.batch(cards, {
    start: 'top 85%',
    onEnter: function (b) {
      b.forEach(function (c, i) {
        var k = cards.indexOf(c);
        if (waits[k]) waits[k].kill();
        waits[k] = gsap.delayedCall(i * 0.08, function () { tl(c).play(); });
      });
    },
    onLeaveBack: function (b) {
      b.forEach(function (c) {
        var k = cards.indexOf(c);
        if (waits[k]) waits[k].kill();
        tl(c).reverse();
      });
    }
  });
})();
