/* jibinjohnson.in — home hero: glass cards orbiting the portrait, and the scroll push from the hero into About.
   Home page only. The orbit needs no library. The push needs GSAP + ScrollTrigger (assets/js/vendor/gsap,
   loaded before this file); without them, without JS or under reduced motion the page simply scrolls and
   everything is visible. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* touch devices (phones, tablets): the light orbit and no exit blur (layoutFor), and the About content is held fixed
     while it arrives, so it moves in the same frame as the flying card (see the arrival below) */
  var TOUCH = matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* =====================================================================================
     1. Orbit: the portrait and the cards share one preserve-3d scene
       - the portrait is a plane at z = 0, so it hides cards that pass behind the head
       - cards sit on a cylinder ring (rotateY(slot) translateZ(R)), tangent to it like a carousel:
         face-on at the front, edge-on at the sides, backs showing behind
       - the whole ring spins about its axis, tipped towards the camera and slightly rolled
     Direction (front moves right → left): back → right → front → left → back.
     ===================================================================================== */
  var box = document.querySelector('[data-orbit]');
  var ring = document.querySelector('[data-orbit-ring]');

  var svg = function (paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  };
  var ICONS = {
    code: svg('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>'),
    trend: svg('<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
    spark: svg('<path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z"/>'),
    brain: svg('<path d="M9 4a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 10a3 3 0 0 0 1.2 2.4A3 3 0 0 0 6 17a3 3 0 0 0 3 3V4z"/><path d="M15 4a3 3 0 0 1 3 3v.2a3 3 0 0 1 2 2.8 3 3 0 0 1-1.2 2.4A3 3 0 0 1 18 17a3 3 0 0 1-3 3V4z"/><path d="M9 9h1.5M13.5 9H15M9 15h1.5M13.5 15H15"/>'),
    python: svg('<path d="M12 3c-4 0-4 1.6-4 3v2h4.5M8 8H5.5C4 8 3 9.4 3 12s1 4 2.5 4H8"/><path d="M12 21c4 0 4-1.6 4-3v-2h-4.5M16 16h2.5c1.5 0 2.5-1.4 2.5-4s-1-4-2.5-4H16v3.5c0 1-.8 1.5-1.5 1.5h-5c-.8 0-1.5.6-1.5 1.5V16"/><circle cx="10.5" cy="5.5" r=".6" fill="currentColor"/><circle cx="13.5" cy="18.5" r=".6" fill="currentColor"/>'),
    penTool: svg('<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>')
  };

  /* kind: "card" = icon + title, "img" = picture panel. Every panel shares one size, radius and border.
     Pictures are real screenshots of client projects only (name = the project), WebP at 320 and 480px wide
     (panels are 150px wide on phones, at most 232px elsewhere: 2x), cropped to the panel by object-fit: cover;
     src is the path without the -<width>.webp suffix; w/h are the 480px file's intrinsic size. */
  var PANELS = [
    { kind: 'card', title: 'Web Development', caption: 'Fast, modern sites', icon: 'code' },
    { kind: 'img', name: 'Blackbox Learning', src: 'assets/img/shot-blackbox-learning', w: 480, h: 300 },
    { kind: 'card', title: 'Full Stack Development', caption: 'End-to-end apps', icon: 'layers' },
    { kind: 'card', title: 'Python Development', caption: 'Django · pandas', icon: 'python' },
    { kind: 'card', title: 'Artificial Intelligence', caption: 'Models that learn', icon: 'brain' },
    { kind: 'img', name: 'AQ Air', src: 'assets/img/work-airaq', w: 480, h: 269 },
    { kind: 'card', title: 'Generative AI', caption: 'RAG chatbots', icon: 'spark' },
    { kind: 'card', title: 'UI/UX Design', caption: 'Clean interfaces', icon: 'penTool' },
    { kind: 'img', name: 'Serene Derma', src: 'assets/img/shot-serene-derma', w: 480, h: 300 },
    { kind: 'card', title: 'Search Engine Optimization (SEO)', caption: 'Rank higher', icon: 'trend' }
  ];
  /* 10 panels on tablet/desktop, 6 on phones: few enough that each slot leaves room for a readable card */
  var WIDE_SET = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  var MOBILE_SET = [0, 1, 2, 4, 6, 8];

  /* Per breakpoint (px unless noted): r ring radius as a share of viewport width (capped at rMax),
     cardW max panel width, cardH panel height, gap guaranteed edge-to-edge gap between neighbours,
     tilt ring tipped towards the camera (deg), roll ring roll (deg), cam perspective, period seconds per lap,
     cx ring centre as a share of the stage width (the head) */
  var layoutFor = function (w) {
    /* phones: no share of the width; the radius is fitted to the screen (fitRadius), leaving `edge` px each side.
       Card size, radius cap and camera grow with the screen from 430px (k = 1) so a large phone or small tablet in
       portrait (the portrait is 80vw there) reaches the tablet sizes at 767px instead of keeping phone-sized cards */
    var k = Math.min(1.5, Math.max(1, w / 430));
    /* the head's centre in the image: the same --head-x that main.css uses to put it on the page centre line */
    var cx = parseFloat(getComputedStyle(box.parentNode).getPropertyValue('--head-x')) || 0.53;
    /* light orbit on touch devices and below 1024px: 3 strips per card and no exit blur (desktop: 8 strips, coarse blur) */
    var lite = TOUCH || w < 1024, fx = { flex: lite ? FLEX_LITE : FLEX_FULL, blur: !lite };
    return Object.assign(fx, w < 768
      ? { set: MOBILE_SET, fit: true, edge: 14, rMax: 230 * k, cardW: 150 * k, cardH: Math.round(48 * k), gap: 8, tilt: 14, roll: 7, cam: 1100 * k, period: 16, cx: cx }
      : w < 1024
        ? { set: WIDE_SET, r: 0.45, rMax: 355, cardW: 224, cardH: 70, gap: 26, tilt: 13, roll: 7, cam: 1600, period: 18, cx: cx }
        : { set: WIDE_SET, r: 0.27, rMax: 450, cardW: 232, cardH: 78, gap: 28, tilt: 12, roll: 7, cam: 2000, period: 20, cx: cx });
  };

  /* Widest flat panel that still leaves `gap` between neighbours on a ring of radius R with n slots.
     Panels are tangent to the ring, so adjacent near edges are 2R·sin(θ/2) − w·cos(θ/2) apart (θ = 2π/n). */
  var panelWidth = function (R, n, gap, max) {
    var half = Math.PI / n;
    return Math.max(0, Math.min(max, (2 * R * Math.sin(half) - gap) / Math.cos(half)));
  };

  /* Phones: the largest ring radius whose cards stay inside `half` px either side of the ring centre at every
     point of the spin. Each card corner goes through the same transforms as the scene (rotateY to its place on
     the ring, the tilt, the roll) and the perspective, whose origin sits on the ring centre. The curl only pulls
     the edges inward, so the flat card is the widest case. */
  var reach = function (R, n, L) {
    var w = panelWidth(R, n, L.gap, L.cardW), h = L.cardH, tx = (-L.tilt * Math.PI) / 180, rz = (L.roll * Math.PI) / 180;
    var max = 0;
    for (var s = 0; s < 72; s++) {
      var a = (s / 72) * 2 * Math.PI, sa = Math.sin(a), ca = Math.cos(a);
      for (var c = 0; c < 4; c++) {
        var u = c & 1 ? w / 2 : -w / 2, v = c & 2 ? h / 2 : -h / 2;
        var x = u * ca + R * sa, z = -u * sa + R * ca;
        var y1 = v * Math.cos(tx) - z * Math.sin(tx), z1 = v * Math.sin(tx) + z * Math.cos(tx);
        var x2 = x * Math.cos(rz) - y1 * Math.sin(rz);
        max = Math.max(max, Math.abs((x2 * L.cam) / (L.cam - z1)));
      }
    }
    return max;
  };
  var fitRadius = function (half, n, L) {
    var lo = 40, hi = L.rMax;
    if (reach(hi, n, L) <= half) return hi;
    for (var i = 0; i < 20; i++) {
      var mid = (lo + hi) / 2;
      if (reach(mid, n, L) <= half) lo = mid; else hi = mid;
    }
    return lo;
  };

  /* Flexible cards: each panel is cut into `slices` vertical strips joined by hinges, chained outward from the
     card's centre line (an odd count has a flat centre strip). Each strip shows its own slice of the same panel, so
     content stays continuous; strips are rigid, so bending never stretches the card, it only curls in depth. Opacity
     is set on the strips, never on a wrapper: opacity on a preserve-3d parent flattens it.
     Every strip is two composited 3D layers (face and back), so the count is what the GPU pays for: desktop keeps 8
     strips and the full 36° curl; touch devices and screens below 1024px use 3 (a gentle 20° curl, 6 layers a card). */
  var FLEX_FULL = { slices: 8, bend: 36 };   /* bend: max curl (deg) at the far edge, reached at the sides */
  var FLEX_LITE = { slices: 3, bend: 20 };

  /* Seamless joins: neighbouring strips overlap by SEAM px and cross-fade through a mask whose curve m(t)
     makes two layers of glass with alpha a composite back to exactly one: a·m(t) + a·m(1−t) − a²·m(t)·m(1−t) = a */
  var SEAM = 12;
  var SEAM_ALPHA = { glass: 0.6, opaque: 1 };
  var PAD_TOP = 8, PAD_BOTTOM = 18, PAD_SIDE = 14; /* room around each strip for the panel's short drop shadow */

  var makeRamp = function (a) {
    var mid = (1 - Math.sqrt(1 - a)) / a; /* m(½), from 2x − a·x² = 1 */
    var f = function (t) { return 2 * mid * t; };
    var m = function (t) { return t <= 0.5 ? f(t) : (1 - f(1 - t)) / (1 - a * f(1 - t)); };
    var out = [];
    for (var i = 0; i <= 8; i++) out.push([i / 8, m(i / 8)]);
    return out;
  };
  /* ramps cached per 5% step of the strip's drawn alpha; a mask is rewritten only when its step changes */
  var rampCache = {};
  var rampFor = function (alpha) {
    var key = Math.max(1, Math.min(20, Math.round(alpha * 20)));
    if (!rampCache[key]) rampCache[key] = makeRamp(key / 20);
    return [key, rampCache[key]];
  };
  var seamMask = function (width, fadeLeft, fadeRight, ramp) {
    var stops = [], i;
    if (fadeLeft) for (i = 0; i < ramp.length; i++) stops.push('rgba(0,0,0,' + ramp[i][1].toFixed(3) + ') ' + (ramp[i][0] * SEAM).toFixed(2) + 'px');
    else stops.push('#000 0px');
    if (fadeRight) for (i = ramp.length - 1; i >= 0; i--) stops.push('rgba(0,0,0,' + ramp[i][1].toFixed(3) + ') ' + (width - ramp[i][0] * SEAM).toFixed(2) + 'px');
    else stops.push('#000 ' + width + 'px');
    return 'linear-gradient(to right, ' + stops.join(', ') + ')';
  };
  var fitSeams = function (face, opacity) {
    var seam = face._seam, r = rampFor(seam.alpha * opacity);
    if (face._rampKey === r[0]) return;
    face._rampKey = r[0];
    var mask = seamMask(seam.width, seam.fadeL, seam.fadeR, r[1]);
    face.style.webkitMaskImage = mask;
    face.style.maskImage = mask;
  };

  var imgsLive = false; /* set by showRing(): rebuilds after that (resize) use src directly */
  var panelHTML = function (p, compact, w) {
    /* decorative: the ring is aria-hidden and each card is drawn once per strip. Picture sources go in data-src /
       data-srcset: showRing() sets them once the portrait (the LCP image) has loaded, at low priority */
    if (p.kind === 'img') return '<div class="op op-img"><img ' + (imgsLive ? '' : 'data-') + 'src="' + p.src + '-480.webp" ' + (imgsLive ? '' : 'data-') + 'srcset="' + p.src + '-320.webp 320w, ' + p.src + '-480.webp 480w" sizes="' + Math.round(w) + 'px" width="' + p.w + '" height="' + p.h + '" alt="" draggable="false" fetchpriority="low"><span class="op-gloss"></span></div>';
    return '<div class="op op-card' + (compact ? ' op-compact' : '') + '">' +
      '<span class="op-sheen"></span>' +
      '<span class="op-ic">' + (ICONS[p.icon] || '') + '</span>' +
      '<span class="op-txt"><span class="op-t">' + p.title + '</span><span class="op-c">' + p.caption + '</span></span>' +
    '</div>';
  };
  var el = function (cls, style) {
    var d = document.createElement('div');
    d.className = cls;
    for (var k in style) d.style[k] = style[k];
    return d;
  };

  /* builds one curling card; returns its faces (strips), backs and hinges for the frame loop.
     Each strip has two sides, both backface-visibility: hidden: the face (the panel's content) and a plain back
     (rotateY(180deg), the blank panel, no text or picture), so a card on the far side of the ring shows its blank
     back instead of a mirrored front. The back shows the mirrored slice of the blank panel, so its rounded corners
     stay on the card's outer edges. */
  function buildCard(w, h, html, opaque, flex) {
    var alpha = opaque ? SEAM_ALPHA.opaque : SEAM_ALPHA.glass;
    var slices = flex.slices, half = Math.floor(slices / 2), odd = slices % 2;
    var sw = w / slices, mid = odd ? sw / 2 : 0; /* mid: half the flat centre strip (odd counts) */
    var faces = [], backs = [], hinges = { r: [], l: [] };
    var backHTML = '<div class="op op-back' + (opaque ? ' op-back-img' : '') + '"></div>';
    var root = el('orbit-curve', { left: w / 2 + 'px' });
    /* one strip (face + plain back) into `box`, showing the panel from x = `from`; each face reaches SEAM/2 past every
       join (fadeL/fadeR) and further past an outer edge for the shadow */
    var strip = function (box, from, fadeL, fadeR) {
      var extL = fadeL ? SEAM / 2 : PAD_SIDE, extR = fadeR ? SEAM / 2 : PAD_SIDE;
      var faceW = sw + extL + extR;
      var face = el('orbit-face', { left: -extL + 'px', top: -PAD_TOP + 'px', width: faceW + 'px', height: h + PAD_TOP + PAD_BOTTOM + 'px' });
      face._seam = { width: faceW, fadeL: fadeL, fadeR: fadeR, alpha: alpha };
      face._rampKey = null;
      var clip = el('orbit-clip', { left: extL - from + 'px', top: PAD_TOP + 'px', width: w + 'px', height: h + 'px' });
      clip.innerHTML = html;
      face.appendChild(clip);
      var back = el('orbit-back', { width: sw + 'px', height: h + 'px' });
      var bclip = el('orbit-clip', { left: from + sw - w + 'px', top: 0, width: w + 'px', height: h + 'px' });
      bclip.innerHTML = backHTML;
      back.appendChild(bclip);
      box.appendChild(face);
      box.appendChild(back);
      backs.push(back);
      return face;
    };
    if (odd) {
      var centre = el('orbit-hinge', { left: -mid + 'px', width: sw + 'px', height: h + 'px' });
      faces[half] = strip(centre, w / 2 - mid, slices > 1, slices > 1);
      root.appendChild(centre);
    }
    [1, -1].forEach(function (side) {
      var right = side > 0, node = null;
      for (var k = half - 1; k >= 0; k--) {
        var outer = k === half - 1;
        var from = right ? w / 2 + mid + k * sw : w / 2 - mid - (k + 1) * sw; /* slice's left edge within the panel */
        var hinge = el('orbit-hinge', {
          left: (right ? (k === 0 ? mid : sw) : (k === 0 ? -mid - sw : -sw)) + 'px',
          width: sw + 'px', height: h + 'px',
          transformOrigin: right ? '0 50%' : '100% 50%'
        });
        var face = strip(hinge, from, right || !outer, !right || !outer);
        if (node) hinge.appendChild(node);
        node = hinge;
        faces[right ? half + odd + k : half - 1 - k] = face;
        (right ? hinges.r : hinges.l)[k] = hinge;
      }
      if (node) root.appendChild(node);
    });
    /* hinge k turns wts[k] of the curl, so the far edge reaches flex.bend: 0, 1, 2, 3 sixths with 8 strips (the
       first hinge sits on the centre line); with a flat centre strip the first hinge already turns */
    var wts = [], sum = 0, k2;
    for (k2 = 0; k2 < half; k2++) sum += k2 + odd;
    for (k2 = 0; k2 < half; k2++) wts.push(sum ? (k2 + odd) / sum : 0);
    return { root: root, faces: faces, backs: backs, hinges: hinges, half: half, wts: wts, bend: flex.bend };
  }

  if (box && ring) {
    var layout, cards = [], n = 0, size = { w: 0, h: 0 }, builtFor = -1;
    var start = null, shown = null, lastBlur = '', ringGone = false, visible = true, running = false;
    var lastPersp = '', lastOrigin = '';

    var build = function () {
      var vw = window.innerWidth;
      if (vw === builtFor) return;
      builtFor = vw;
      layout = layoutFor(vw);
      var panels = layout.set.map(function (i) { return PANELS[i]; });
      n = panels.length;
      var R;
      if (layout.fit) {
        /* phones: the ring is as wide as the screen allows around its centre (the head), so the cards circle the
           head instead of sitting inside its outline, and none crosses the screen edge. Positions come from
           offsetLeft (layout, untouched by the scroll zoom's transform). */
        var left = 0;
        for (var e = box; e; e = e.offsetParent) left += e.offsetLeft;
        var centre = left + box.clientWidth * layout.cx;
        var room = Math.min(centre, document.documentElement.clientWidth - centre) - layout.edge;
        R = fitRadius(Math.max(60, room), n, layout);
      } else {
        R = Math.min(vw * layout.r, layout.rMax);
      }
      var cardW = panelWidth(R, n, layout.gap, layout.cardW), cardH = layout.cardH;
      /* the full card (36px icon, 14.5px title) needs a 64px+ tall panel; shorter ones (phones) use the compact style */
      var compact = cardW < 170 || cardH < 64;
      ring.textContent = '';
      lastBlur = null; /* new strips: re-apply any exit blur on the next frame */
      cards = panels.map(function (p, i) {
        var slot = el('orbit-slot', {
          width: cardW + 'px', height: cardH + 'px', left: -cardW / 2 + 'px', top: -cardH / 2 + 'px',
          transform: 'rotateY(' + (i * 360) / n + 'deg) translateZ(' + R.toFixed(1) + 'px)'
        });
        var card = buildCard(cardW, cardH, panelHTML(p, compact, cardW), p.kind === 'img', layout.flex);
        slot.appendChild(card.root);
        ring.appendChild(slot);
        return card;
      });
    };

    /* Per frame only values that changed are written (strings compared first), at steps too small to see:
       opacity 0.01, hinge angles 0.1deg. A style write that changes nothing still costs a style recalc of every
       strip, so skipping them keeps the frame cheap while the page scrolls.
       Exit blur (desktop only): three coarse steps while the push runs, so the strips are re-rasterised three times
       on the way out instead of at every 0.5px; touch devices and screens below 1024px fade without blur. */
    var BLUR_AT = [0.2, 0.5, 0.8], BLUR_PX = [3, 5.5, 8];
    var exitBlur = function (exit) {
      for (var i = BLUR_AT.length - 1; i >= 0; i--) if (exit >= BLUR_AT[i]) return 'blur(' + BLUR_PX[i] + 'px)';
      return '';
    };
    var frame = function (now) {
      if (!visible && !reduce) { running = false; return; } /* off screen: stop; the observer restarts it */
      if (start === null) start = now;
      var t = now - start, W = size.w, H = size.h;
      /* full exit (set by the push below): hide the ring outright; visibility doesn't flatten 3D */
      var exit = box._exit || 0, gone = exit >= 0.999;
      if (gone !== ringGone) { ringGone = gone; ring.style.visibility = gone ? 'hidden' : ''; }
      /* gone: stop drawing; the push wakes the loop (box._wake) as soon as the ring comes back */
      if (gone && W && !reduce) { running = false; return; }
      if (W && !gone) {
        var L = layout;
        var cx = W * L.cx, cy = H * 0.31; /* ring centre ≈ eye level of the head in the portrait */
        var persp = L.cam + 'px', origin = cx.toFixed(1) + 'px ' + (cy - H * 0.06).toFixed(1) + 'px';
        if (persp !== lastPersp) { lastPersp = persp; box.style.perspective = persp; }
        if (origin !== lastOrigin) { lastOrigin = origin; box.style.perspectiveOrigin = origin; }
        /* spin decreases, so the front of the ring travels right → left */
        var spin = reduce ? -20 : -((t / 1000) / L.period) * 360;
        var sc = (1 + 1.6 * exit).toFixed(3);
        ring.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) rotateZ(' + L.roll + 'deg) rotateX(' + -L.tilt + 'deg) rotateY(' + spin.toFixed(3) + 'deg)' +
          (exit > 0.001 ? ' scale3d(' + sc + ',' + sc + ',' + sc + ')' : '');
        /* exit: the ring keeps spinning but grows on top of the stage zoom, so the cards come at the camera faster
           than the portrait; they blur and fade. The blur goes on the strips only (a filter on a 3D wrapper flattens it). */
        var blur = L.blur ? exitBlur(exit) : '';
        var blurChanged = blur !== lastBlur;
        lastBlur = blur;
        /* the ring stays invisible (faces start at opacity 0 in CSS) until its pictures are decoded (showRing), then
           fades in over FADE ms; the spin runs from the first frame either way */
        var intro = (shown === null ? 0 : reduce ? 1 : Math.min(1, Math.max(0, (now - shown) / FADE))) * (1 - exit);
        for (var i = 0; i < n; i++) {
          var c = cards[i], a = ((spin + (i * 360) / n) * Math.PI) / 180;
          var near = (Math.cos(a) + 1) / 2; /* 0 = back of the ring, 1 = front */
          var op = (0.55 + 0.45 * near) * intro, opStr = op.toFixed(2);
          var opChanged = opStr !== c._op;
          c._op = opStr;
          if (opChanged || blurChanged) {
            for (var f = 0; f < c.faces.length; f++) {
              var face = c.faces[f];
              if (opChanged) { face.style.opacity = opStr; fitSeams(face, op); }
              if (blurChanged) face.style.filter = blur;
            }
            for (var b = 0; b < c.backs.length; b++) {
              if (opChanged) c.backs[b].style.opacity = opStr;
              if (blurChanged) c.backs[b].style.filter = blur;
            }
          }
          /* the half of the card nearer the back of the ring curls inward, mirrored between the sides */
          var s = Math.sin(a), amt = c.bend * Math.abs(s);
          for (var k = 0; k < c.half; k++) {
            var step = amt * c.wts[k];
            var tr = 'rotateY(' + (s > 0 ? step : 0).toFixed(1) + 'deg)', tlft = 'rotateY(' + (s < 0 ? -step : 0).toFixed(1) + 'deg)';
            var hr = c.hinges.r[k], hl = c.hinges.l[k];
            if (hr._t !== tr) { hr._t = tr; hr.style.transform = tr; }
            if (hl._t !== tlft) { hl._t = tlft; hl.style.transform = tlft; }
          }
        }
      }
      /* under reduced motion the ring is drawn once per change and then left still */
      if (!reduce || !W) requestAnimationFrame(frame); else running = false;
    };
    var kick = function () { if (!running) { running = true; requestAnimationFrame(frame); } };

    /* The ring is built as soon as this script runs (deferred: right after the HTML is parsed), not after the load
       event, the signature intro or an idle callback, and it spins from its first frame. It stays invisible until
       its pictures are ready: their downloads start only once the portrait (the LCP image, preloaded with
       fetchpriority high) has loaded, at fetchpriority low, and every copy is decoded before the ring fades in
       (FADE), so no card shows blank and fills in later. SHOW_CAP: on a stalled network the ring shows anyway. */
    var FADE = 400, SHOW_CAP = 5000;
    var showRing = function () {
      var done = false;
      var reveal = function () { if (done) return; done = true; shown = performance.now(); kick(); };
      setTimeout(reveal, SHOW_CAP);
      var load = function () {
        imgsLive = true;
        var imgs = [].slice.call(ring.querySelectorAll('img[data-src]')); /* queried now: a resize may have rebuilt the ring */
        Promise.all(imgs.map(function (im) {
          im.srcset = im.getAttribute('data-srcset');
          im.src = im.getAttribute('data-src');
          im.removeAttribute('data-srcset');
          im.removeAttribute('data-src');
          return im.decode ? im.decode().catch(function () {}) : null;
        })).then(reveal);
      };
      var lcp = document.querySelector('.hero-img');
      if (!lcp || lcp.complete) load();
      else { lcp.addEventListener('load', load, { once: true }); lcp.addEventListener('error', load, { once: true }); }
    };
    var startOrbit = function () {
      box._wake = kick; /* the push (below) restarts the loop when the ring returns from a full exit */
      new ResizeObserver(function (entries) {
        var r = entries[0].contentRect;
        size = { w: r.width, h: r.height };
        if (reduce) kick();
      }).observe(box);
      /* stop drawing while the hero is off screen; restart when it comes back (a hidden tab gets no frames at all) */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) kick(); }).observe(box);
      }
      var queued = false;
      window.addEventListener('resize', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; build(); if (reduce) kick(); });
      }, { passive: true });
      build();
      kick();
    };
    startOrbit();
    showRing();
  }

  /* =====================================================================================
     2. Push from the hero into About (GSAP + ScrollTrigger)
     The hero pins and the camera moves forward into the scene, toward eye level: the stage (portrait + cards)
     scales 1 → 2.5 around the face. Timeline 0 → 1 over 100% of the viewport height:
       0   – 0.3   headline, intro, buttons and stats drift up and fade out
       0   – 0.6   cards fly ahead of the portrait (parallax), blur to 8px and fade (orbit frame loop above)
       0.55 →      the portrait is handed to one fixed layer (.travel) that carries it into the About frame (see the end)
     Then the section after the hero ([data-arrive], About) arrives: from 90% of the zoom its content is drawn over the whitened hero and revealed
     in sequence while it rises, at half the scroll speed, into place under the header, TAIL screens after the zoom.
     The section is pulled up over the hero's (by then empty, white) last screen so no dead scroll is left between
     the zoom and About. From the top of the page to About in place: 1.35 screens (it was ~2.4).
     Scrolling is smoothed by Lenis (smooth.js), which runs on GSAP's ticker and updates ScrollTrigger.
     ===================================================================================== */
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  var hero = document.querySelector('.hero[data-push]');
  var about = document.querySelector('[data-arrive]'); /* the section the hero hands over to (About) */
  if (!gsap || !ScrollTrigger || !hero || !about || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  var stage = hero.querySelector('.hero-stage');
  var copy = hero.querySelector('.hero-copy');
  var portrait = hero.querySelector('.hero-img');
  var header = document.querySelector('.head');

  /* phones: the address bar showing/hiding changes only the height; don't re-measure (and jump) for that */
  ScrollTrigger.config({ ignoreMobileResize: true });
  /* re-measure every trigger once images and fonts have loaded */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

  var ZOOM = 2.5;
  var UNIT = 1; /* viewport heights of scroll per timeline unit (the zoom) */
  var orbitExit = { v: 0 };
  /* the orbit reads the live tweened value every frame (an onUpdate copy goes stale after a refresh) */
  if (box) Object.defineProperty(box, '_exit', { get: function () { return orbitExit.v; }, configurable: true });
  gsap.set(stage, { transformOrigin: '50% 45%' }); /* the face area of the composition */

  var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    .fromTo(stage, { scale: 1 }, { scale: ZOOM, duration: 1 }, 0)
    .to(copy, { yPercent: -20, autoAlpha: 0, duration: 0.3 }, 0)
    .to(orbitExit, { v: 1, duration: 0.6, onUpdate: function () { if (orbitExit.v < 0.999 && box && box._wake) box._wake(); } }, 0);

  /* On short screens (phones) the hero is taller than the viewport: it pins once its foot reaches the bottom.
     scrub: true ties the zoom to the scroll position directly. The scroll itself is already smoothed (Lenis on
     wheel/trackpad, the browser's own momentum on touch); a scrub lag on top of that made the zoom trail the page.
     No anticipatePin: it nudges the pin early, which shows as a jump when the scroll is smoothed.
     Pinning moves the hero into a .pin-spacer, and moving an element restarts its CSS animations: the load-in of
     the intro, buttons and portrait (main.css) would play a second time. Their progress is saved first and put
     back after the move (finished ones are finished again). */
  var loadIn = [].map.call(hero.querySelectorAll('.lede,.cta-row,.hero-portrait'), function (el) {
    var a = el.getAnimations ? el.getAnimations()[0] : null;
    return { el: el, t: a ? a.currentTime : 'done' };
  });
  var heroTrigger = ScrollTrigger.create({
    animation: tl,
    trigger: hero,
    start: function () { return hero.offsetHeight > window.innerHeight + 1 ? 'bottom bottom' : 'top top'; },
    end: function () { return '+=' + Math.round(window.innerHeight * UNIT * tl.duration()); },
    pin: true,
    pinSpacing: true,
    scrub: true,
    invalidateOnRefresh: true,
    onToggle: function (self) { stage.style.willChange = self.isActive ? 'transform' : ''; }
  });
  loadIn.forEach(function (k) {
    var a = k.el.getAnimations ? k.el.getAnimations()[0] : null;
    if (!a) return;
    if (k.t === 'done') a.finish(); else if (k.t != null) a.currentTime = k.t;
  });

  /* ---------- arrival of the next section ([data-arrive]: About) ----------
     Before: About followed the whole pinned hero, so after the zoom a full (white, empty) screen of hero scrolled
     away while the About content was held frozen on screen: ~1 screen of scroll where nothing moved.
     Now #about gets a negative top margin so it reaches its place under the header TAIL screens after the zoom
     ends. The overlap is invisible: the About section has no background, so the pinned hero paints over its box,
     and its content (a transformed .wrap, painted above the hero) stays hidden until the reveal.
     From DARK_AT of the zoom to arrival the content is revealed in sequence and rises into place at HOLD of its
     natural speed, so it keeps moving with the scroll instead of standing still.
     Positions are read from the About section itself, which is never transformed. */
  var inner = about.querySelector('.wrap');
  var DARK_AT = 0.9;
  var TAIL = 0.35; /* screens of scroll after the zoom until About is in place: the reveal runs over 0.1 + 0.35 screens */
  var HOLD = 0.5;  /* the content moves at half speed during the reveal (1 = frozen, as before; 0 = plain scroll) */
  var headH = function () { return header ? header.offsetHeight : 0; };
  /* the part of the hero that is on screen when the pin starts: all of it, or one screen on phones (taller hero) */
  var overlap = function () {
    var vh = window.innerHeight, h = hero.offsetHeight;
    return Math.max(0, Math.round((h > vh + 1 ? vh : h) - headH() - TAIL * vh));
  };
  var setOverlap = function () { about.style.marginTop = -overlap() + 'px'; };
  setOverlap();
  ScrollTrigger.addEventListener('refreshInit', setOverlap); /* before every re-measure (resize, load, fonts) */

  var revealStart = function () { return heroTrigger.start + DARK_AT * (heroTrigger.end - heroTrigger.start); };
  var aboutTop = function () { return about.getBoundingClientRect().top + window.scrollY; };
  var holdEnd = function () { return aboutTop() - headH(); };

  /* desktop: the half-speed arrival is a scrubbed tween on the content. Touch devices: the same positions, applied by
     holdAt() below, with the content held fixed while it arrives */
  if (!TOUCH) gsap.fromTo(inner, { y: function () { return (revealStart() - holdEnd()) * HOLD; } }, {
    y: 0,
    ease: 'none',
    scrollTrigger: { trigger: about, start: revealStart, end: holdEnd, scrub: true, invalidateOnRefresh: true }
  });

  /* ---------- touch devices: About is held fixed while it arrives ----------
     A touch scroll moves the page on the browser's own thread; anything moved from JavaScript follows a frame later.
     So natively, the half-speed content (scroll + its transform) and the flying card (fixed, moved from JavaScript)
     drift apart every frame and shake. Here, from the reveal to the landing, the content is taken out of the flow
     (position: fixed, the section keeps its height so nothing below moves) and placed from JavaScript at exactly the
     position it has on desktop at that scroll: its top in the page − scroll + the half-speed offset. The card, the
     pinned hero and the content then move in the same frame; nothing visible scrolls natively under the card (the
     hero behind it is plain white by then). It goes back into the flow, at the same place, when the card lands.
     Same positions, timing and stacking as desktop: the fixed content paints above the pinned hero (later in the page)
     and below the card (z-index 30), as the transformed content does. */
  var held = null;   /* measured with the content in the flow: reveal and landing scroll, page top, left, width, section height */
  var holdMode = -1; /* 0 in the flow before the reveal, 1 held, 2 in the flow after the landing */
  var setFlow = function (fixed) {
    inner.style.position = fixed ? 'fixed' : '';
    inner.style.top = fixed ? '0px' : '';
    inner.style.left = fixed ? held.left + 'px' : '';
    inner.style.width = fixed ? held.width + 'px' : '';
    about.style.height = fixed ? held.h + 'px' : '';
  };
  var releaseHold = function () {
    if (!TOUCH) return;
    inner.style.position = inner.style.top = inner.style.left = inner.style.width = inner.style.transform = about.style.height = '';
    holdMode = -1;
  };
  var holdAt = function (s) {
    if (!held) return;
    var mode = s < held.rs ? 0 : s < held.he ? 1 : 2;
    if (mode !== holdMode) { holdMode = mode; setFlow(mode === 1); }
    if (mode === 1) {
      var y = held.y0 * (1 - (s - held.rs) / (held.he - held.rs));
      inner.style.transform = 'translate3d(0px, ' + (held.top - s + y).toFixed(4) + 'px, 0px)';
    } else {
      inner.style.transform = 'translate(0px, ' + (mode === 0 ? +held.y0.toFixed(4) : 0) + 'px)';
    }
  };
  /* every re-measure (resize, load, fonts) starts from the content in the flow */
  ScrollTrigger.addEventListener('refreshInit', releaseHold);

  /* reveal in order, scrubbed exactly: label, heading, intro, description and link (the portrait arrives with the journey below); all in by 70% of the arrival */
  var seq = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: about, start: revealStart, end: holdEnd, scrub: true, invalidateOnRefresh: true }
  });
  var items = Array.prototype.slice.call(about.querySelectorAll('.ed-head > *, .ed-intro, .ed-side > *'));
  var step = items.length > 1 ? 0.24 / (items.length - 1) : 0;
  items.forEach(function (item, i) {
    seq.fromTo(item, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.34 }, 0.12 + i * step);
    /* the counters (main.js) count up as they fade in here, not when they first enter the viewport hidden */
    if (item.querySelector('[data-count]')) {
      var fired = false;
      seq.call(function () {
        if (fired) return;
        fired = true;
        document.dispatchEvent(new CustomEvent('about:counters'));
      }, null, 0.12 + i * step + 0.05);
    }
  });
  seq.to({}, { duration: Math.max(0, 1 - seq.duration()) }); /* spans exactly 0 → 1 */
  window.__aboutPushed = true; /* main.js: the About counters wait for the event above */

  /* ---------- image flip: the hero portrait turns over like a card and becomes the About portrait ----------
     One rotation about the vertical axis (rotateY 0 → 180°, with perspective) runs over the whole move, from the
     first scroll out of the hero (heroTrigger.start) to About in place (holdEnd), and completes on landing.
       - Until HANDOFF of the zoom the cards are still orbiting, so the portrait stays in the 3D scene (it hides the
         cards behind the head): the hero image itself starts to turn (its own perspective). The stage still zooms
         2.5× for the cards' push, but the portrait is counter-scaled about the same point, so it grows only to
         1 + ZMAX of its size (eased in and out) and stays anchored on the face.
       - At HANDOFF (the cards have flown out) one fixed two-sided card (.travel) takes over at the portrait's exact
         zoomed box, angle and perspective. Front: the hero cut-out; back: the About photo in the frame's wash,
         border, radius and shadow. Both faces hide their backs, so the image changes exactly at edge-on (90°),
         which always falls inside the card's flight (EDGE). The card moves and resizes to
         the About frame (.ed-frame), landing on its exact box at 180°, where the frame's own photo takes over.
     Only one image is on screen at a time: the hero portrait, then the card, then the frame.
     Everything is a pure function of the scroll position, so it reverses exactly. */
  var edFrame = about.querySelector('.ed-frame'); /* not `frame`: that name is the orbit's draw loop above */
  var photo = about.querySelector('.ed-photo');
  var frameImg = edFrame && edFrame.querySelector('img');
  if (!edFrame || !photo || !frameImg || !portrait) return;
  frameImg.loading = 'eager'; /* decoded before the card lands on it */

  var HANDOFF = 0.6;  /* share of the zoom at which the card takes over (the orbit has gone: orbitExit = 1) */
  var EDGE = 0.3;     /* edge-on (90°) at this share of the card's flight */
  var CAMERA = 3;     /* perspective distance in widths of the image (the same in the scene and on the card) */
  var ZMAX = 0.1;     /* the portrait's whole zoom: 1 → 1.1 by the handoff (the card then resizes to the frame) */

  var travel = document.createElement('div');
  travel.className = 'travel';
  travel.setAttribute('aria-hidden', 'true');
  var front = document.createElement('div'); front.className = 't-face t-front';
  var back = document.createElement('div'); back.className = 't-face t-back';
  var tHero = portrait.cloneNode(false);
  tHero.removeAttribute('class'); tHero.removeAttribute('fetchpriority'); tHero.alt = '';
  var tAbout = frameImg.cloneNode(false);
  tAbout.loading = 'eager'; tAbout.alt = '';
  front.appendChild(tHero); back.appendChild(tAbout);
  travel.appendChild(front); travel.appendChild(back);
  document.body.appendChild(travel);

  var from = null, to = null; /* viewport boxes at the handoff and at the landing */
  var w0 = 0, h0 = 0, ox = 0, oy = 0; /* unzoomed portrait size; the stage's zoom origin in the portrait's own box */
  portrait.style.transformOrigin = '0 0';
  /* the portrait's transform: undo the stage zoom s down to T about the stage's zoom origin, then turn it about its
     own centre line with perspective (in its own units, so CAMERA × its width on screen at any zoom) */
  var portraitTransform = function (T, s, angle) {
    var c = T / s, hx = w0 / 2, hy = h0 / 2;
    return 'translate(' + ox.toFixed(2) + 'px,' + oy.toFixed(2) + 'px) scale(' + c.toFixed(5) + ') translate(' + (-ox).toFixed(2) + 'px,' + (-oy).toFixed(2) + 'px)' +
      (angle ? ' translate(' + hx.toFixed(2) + 'px,' + hy.toFixed(2) + 'px) perspective(' + (CAMERA * w0).toFixed(1) + 'px) rotateY(' + angle.toFixed(2) + 'deg) translate(' + (-hx).toFixed(2) + 'px,' + (-hy).toFixed(2) + 'px)' : '');
  };
  var measure = function () {
    releaseHold(); /* touch: measure with the About content in the flow, untransformed */
    var prev = tl.progress(), turn = portrait.style.transform;
    portrait.style.transform = '';
    w0 = portrait.offsetWidth; h0 = portrait.offsetHeight;
    /* the stage zooms about 50% 45% of its box (gsap.set above): that point in the portrait's own box, unzoomed */
    tl.progress(0);
    var sr = stage.getBoundingClientRect(), pr = portrait.getBoundingClientRect();
    ox = sr.left + 0.5 * sr.width - pr.left; oy = sr.top + 0.45 * sr.height - pr.top;
    /* handoff: the portrait as the zoom leaves it at HANDOFF (at 1 + ZMAX, unturned), placed as while the hero is pinned */
    tl.progress(HANDOFF);
    portrait.style.transform = portraitTransform(1 + ZMAX, 1 + (ZOOM - 1) * HANDOFF, 0);
    var r = portrait.getBoundingClientRect(), h = hero.getBoundingClientRect();
    tl.progress(prev);
    portrait.style.transform = turn;
    var pinTop = hero.offsetHeight > window.innerHeight + 1 ? window.innerHeight - hero.offsetHeight : 0;
    from = { x: r.left, y: r.top - h.top + pinTop, w: r.width, h: r.height };
    /* landing: the frame once About is in place (its top under the header, its content not shifted) */
    var f = edFrame.getBoundingClientRect(), a = about.getBoundingClientRect();
    to = { x: f.left, y: f.top - a.top - (TOUCH ? 0 : gsap.getProperty(inner, 'y') || 0) + headH(), w: edFrame.offsetWidth, h: edFrame.offsetHeight };
    if (TOUCH) {
      /* the same numbers as the desktop tween: its start offset from the exact positions, its progress between
         ScrollTrigger's start and end (which ScrollTrigger rounds to whole pixels) */
      var ir = inner.getBoundingClientRect(), rsx = revealStart(), hex = holdEnd();
      held = { rs: Math.round(rsx), he: Math.round(hex), top: ir.top + window.scrollY, left: ir.left, width: ir.width, h: about.getBoundingClientRect().height, y0: (rsx - hex) * HOLD };
    }
  };

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = gsap.parseEase('sine.inOut');
  /* the turn: speeds up from the first scroll to edge-on at gE, then slows into the landing (0 → 0.5 → 1) */
  var turnAt = function (g, gE) {
    return g < gE ? 0.5 * (1 - Math.cos((Math.PI / 2) * (g / gE))) : 0.5 + 0.5 * Math.sin((Math.PI / 2) * ((g - gE) / (1 - gE)));
  };
  var state = -1; /* 0 hero portrait, 1 card, 2 About frame: visibility is switched only when this changes */
  var spin; /* the ScrollTrigger below */
  var handoffAt = function () { return heroTrigger.start + HANDOFF * (heroTrigger.end - heroTrigger.start); };

  var render = function (g) {
    if (!from || !spin) return;
    var span = spin.end - spin.start;
    if (TOUCH) holdAt(spin.start + Math.min(1, Math.max(0, g)) * span);
    var gH = span > 0 ? Math.min(0.9, Math.max(0, (handoffAt() - spin.start) / span)) : 0;
    var gE = gH + EDGE * (1 - gH);
    g = Math.min(1, Math.max(0, g));
    var next = g <= gH ? 0 : g >= 1 ? 2 : 1;
    if (next !== state) {
      state = next;
      portrait.style.visibility = next === 0 ? '' : 'hidden';
      travel.style.visibility = next === 1 ? 'visible' : '';
      photo.style.visibility = next === 2 ? '' : 'hidden';
      portrait.style.willChange = next === 0 && g > 0 ? 'transform' : '';
    }
    var angle = 180 * turnAt(g, gE);
    if (next === 0) {
      if (g <= 0) { portrait.style.transform = ''; return; }
      /* the stage's zoom at this scroll position, read from the scroll itself (not from tl, which may update after) */
      var hs = heroTrigger.end - heroTrigger.start;
      var hp = hs > 0 ? Math.min(1, Math.max(0, (spin.start + g * span - heroTrigger.start) / hs)) : 0;
      portrait.style.transform = portraitTransform(1 + ZMAX * ease(g / gH), 1 + (ZOOM - 1) * hp, angle);
      return;
    }
    if (next === 2) return;
    var p = (g - gH) / (1 - gH), e = ease(p);
    var w = lerp(from.w, to.w, e), ht = lerp(from.h, to.h, e);
    var cx = lerp(from.x + from.w / 2, to.x + to.w / 2, e), cy = lerp(from.y + from.h / 2, to.y + to.h / 2, e);
    travel.style.width = w + 'px';
    travel.style.height = ht + 'px';
    travel.style.transform = 'translate3d(' + (cx - w / 2).toFixed(2) + 'px,' + (cy - ht / 2).toFixed(2) + 'px,0) perspective(' + (CAMERA * w).toFixed(1) + 'px) rotateY(' + angle.toFixed(2) + 'deg)';
  };

  spin = ScrollTrigger.create({
    start: function () { return heroTrigger.start; },
    end: holdEnd,
    invalidateOnRefresh: true,
    onUpdate: function (self) { render(self.progress); },
    onRefresh: function (self) { measure(); state = -1; render(self.progress); }
  });
  var remeasure = function () { measure(); state = -1; render(spin.progress); };
  remeasure();
  /* the portrait's load-in (main.css portrait-in) moves it: measure again once it has settled */
  var hp = hero.querySelector('.hero-portrait');
  if (hp) hp.addEventListener('animationend', remeasure);
})();
