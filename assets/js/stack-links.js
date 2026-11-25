/* jibinjohnson.in — tool chips that show what they work with (About toolkit; loaded on About only). Hover, focus or tap a
   chip: it fills sage, the tools it works with on this page turn tint, the rest fade back (styles in main.css).
   A tap pins the highlight (aria-pressed); tapping it again clears it. Links to chips the page
   doesn't have are skipped. No libraries; without it the chips are plain buttons. */
(function () {
  'use strict';
  /* keys are each chip's data-t; each link works both ways */
  var pairs = {
    html: ['css', 'js', 'bootstrap'], css: ['bootstrap'], js: ['bootstrap', 'mongo'],
    python: ['django', 'postgres'], django: ['postgres', 'mysql', 'docker'],
    postgres: ['sql', 'docker'], mysql: ['sql'], sql: ['excel', 'tableau', 'powerbi'],
    shopify: ['razorpay'], razorpay: ['django', 'js'],
    kw: ['competitor', 'content', 'onpage'], onpage: ['techseo', 'content'], offpage: ['competitor', 'local'], local: ['kw', 'onpage'],
    aeo: ['geo', 'content'], geo: ['content'], seoreport: ['ga'],
    ga: ['excel'], tableau: ['powerbi', 'excel'], powerbi: ['excel'],
    chatgpt: ['claude'], claude: ['python'],
    deeplearning: ['tensorflow', 'keras'], imageproc: ['opencv', 'deeplearning'], nlp: ['chatgpt', 'claude', 'deeplearning'],
    pandas: ['numpy', 'python', 'sql', 'excel'], numpy: ['python'], sklearn: ['pandas', 'numpy'],
    tensorflow: ['keras', 'numpy', 'python'], keras: ['python'], opencv: ['numpy', 'python'],
    git: ['github', 'vscode'], github: ['vscode'], claudecode: ['vscode', 'github', 'claude'], docker: ['aws'], aws: ['django']
  };

  Array.prototype.slice.call(document.querySelectorAll('.tg-grid')).forEach(function (box) {
    var chips = Array.prototype.slice.call(box.querySelectorAll('button[data-t]'));
    if (!chips.length) return;
    var here = {}, map = {}, pinned = null;
    chips.forEach(function (c) { here[c.getAttribute('data-t')] = true; });
    Object.keys(pairs).forEach(function (a) {
      if (!here[a]) return;
      pairs[a].forEach(function (b) {
        if (!here[b]) return;
        (map[a] = map[a] || []).push(b);
        (map[b] = map[b] || []).push(a);
      });
    });
    var show = function (chip) {
      box.classList.toggle('linking', !!chip);
      var rel = (chip && map[chip.getAttribute('data-t')]) || [];
      chips.forEach(function (c) {
        c.classList.toggle('on', c === chip);
        c.classList.toggle('rel', rel.indexOf(c.getAttribute('data-t')) > -1);
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
  });
})();
