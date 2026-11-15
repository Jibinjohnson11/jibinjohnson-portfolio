/* jibinjohnson.in — home hero: real-time 3D glass composition (Three.js r170, self-hosted in assets/js/vendor/three/).
   Progressive enhancement over the CSS scene in .scene: it loads only on screens 600px and wider with WebGL, after the
   page has loaded, and fades in over the CSS scene in the same box (no layout shift). If anything fails, the CSS scene stays.
   Three frosted, bevelled glass cards, a thin chrome ring with orange reflections, a dark orb and a reflective pedestal lit
   orange from below, all lit by a studio environment map. Animates only while on screen and the tab is visible;
   one still frame under prefers-reduced-motion. Decorative: the canvas is inside the aria-hidden .scene. */
const box = document.querySelector('.hero.glass .scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (box && matchMedia('(min-width: 600px)').matches && webgl()) {
  const go = () => start().catch(() => { /* keep the CSS scene */ });
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}

async function start() {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('./vendor/three/RoomEnvironment.js');
  const { RoundedBoxGeometry } = await import('./vendor/three/RoundedBoxGeometry.js');
  await document.fonts.load('600 80px "Plus Jakarta Sans"');

  const css = getComputedStyle(document.documentElement);
  const v = (n, d) => css.getPropertyValue(n).trim() || d;
  const ORANGE = v('--ring-2', '#FF6A0F'), GLOW = v('--glow', '#FF7A1A'), CREAM = v('--ring-spark', '#FFF4EC');

  const canvas = document.createElement('canvas');
  canvas.className = 'hero3d';
  canvas.setAttribute('aria-hidden', 'true');
  box.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3(0.35, 0.05, 0);

  // ---------- lights: soft key from the top left, orange from the pedestal and behind the orb
  scene.add(new THREE.HemisphereLight(0xfff4ec, 0x8a6a5a, 0.6));
  const key = new THREE.DirectionalLight(0xfff1e6, 2.2); key.position.set(-5, 6, 7); scene.add(key);
  const under = new THREE.PointLight(GLOW, 60, 7, 2); under.position.set(0.45, -2.15, 0.9); scene.add(under);
  const behind = new THREE.PointLight(ORANGE, 40, 6, 2); behind.position.set(0.7, -0.6, -2.2); scene.add(behind);
  const rim = new THREE.PointLight(0xffd7bc, 18, 9, 2); rim.position.set(3.8, 2.6, 2.5); scene.add(rim);

  const world = new THREE.Group(); scene.add(world);

  // ---------- glass cards: bevelled rounded slabs, smoked frosted glass, with the icon and label on a face plane
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x564d49, metalness: 0.12, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.05,
    transparent: true, opacity: 0.78, envMapIntensity: 1.05, specularIntensity: 1, ior: 1.5
  });
  function face(kind, label, w, h) {
    const W = 1024, H = Math.round(W * h / w), c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), s = W * 0.0066;
    g.save(); g.translate(W / 2, H * 0.4); g.scale(s, s); g.translate(-24, -24);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = kind === 'web' ? 'rgba(255,255,255,.35)' : 'rgba(255,106,15,.9)'; g.shadowBlur = 34;
    if (kind === 'seo') {
      g.fillStyle = ORANGE;
      [[6, 30, 10], [16, 24, 16], [26, 27, 13], [36, 18, 22]].forEach(([x, y, hh]) => { g.beginPath(); g.roundRect(x, y, 7, hh, 1.6); g.fill(); });
      g.strokeStyle = ORANGE; g.lineWidth = 3.6;
      g.beginPath(); g.moveTo(5, 20); g.lineTo(17, 12); g.lineTo(25, 16); g.lineTo(41, 4); g.stroke();
      g.beginPath(); g.moveTo(33, 4); g.lineTo(41, 4); g.lineTo(41, 12); g.stroke();
    } else if (kind === 'dev') {
      g.strokeStyle = ORANGE; g.lineWidth = 4.6;
      g.beginPath(); g.moveTo(16, 13); g.lineTo(5, 24); g.lineTo(16, 35); g.moveTo(32, 13); g.lineTo(43, 24); g.lineTo(32, 35); g.moveTo(28, 8); g.lineTo(20, 40); g.stroke();
    } else {
      g.strokeStyle = CREAM; g.fillStyle = CREAM; g.lineWidth = 2.6;
      g.beginPath(); g.roundRect(6, 9, 36, 30, 4); g.stroke();
      g.beginPath(); g.moveTo(6, 17); g.lineTo(42, 17); g.stroke();
      [11, 15, 19].forEach(x => { g.beginPath(); g.arc(x, 13, 1.3, 0, 6.283); g.fill(); });
      g.strokeRect(12, 23, 10, 10);
      g.beginPath(); g.moveTo(27, 24); g.lineTo(37, 24); g.moveTo(27, 29); g.lineTo(37, 29); g.moveTo(27, 34); g.lineTo(33, 34); g.stroke();
    }
    g.restore();
    g.font = '600 ' + Math.round(W * 0.078) + 'px "Plus Jakarta Sans", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.96)';
    g.shadowColor = 'rgba(40,20,10,.35)'; g.shadowBlur = 10;
    g.fillText(label, W / 2, H * 0.76);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xfff6f0, side: THREE.BackSide, transparent: true, opacity: 0.6, depthWrite: false });
  const cards = [];
  function card(kind, label, w, h, pos, rot, bob) {
    const d = 0.2, m = new THREE.Group();
    const slab = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, 0.3), glass);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.96), new THREE.MeshBasicMaterial({ map: face(kind, label, w, h), transparent: true, toneMapped: false, depthWrite: false }));
    f.position.z = d / 2 + 0.006; slab.renderOrder = 1; f.renderOrder = 2;   // label always drawn on top of its glass
    // bright bevelled rim: a slightly larger back-facing shell shows as a light edge round the glass
    const rim = new THREE.Mesh(new RoundedBoxGeometry(w + 0.06, h + 0.06, d + 0.04, 6, 0.32), rimMat); rim.renderOrder = 0;
    m.add(rim, slab, f); m.position.set(...pos); m.rotation.set(...rot); m.userData = { y: pos[1], bob };
    world.add(m); cards.push(m);
  }
  card('dev', 'Development', 3.25, 2.5, [-1.2, 0.0, 0.85], [0.06, 0.32, -0.1], [1.0, 0]);
  card('seo', 'SEO & Growth', 2.75, 2.1, [1.05, 1.72, -0.7], [0.12, -0.28, 0.13], [0.8, 2.1]);
  card('web', 'Web Design', 2.55, 1.95, [1.8, -0.78, 0.35], [0.05, -0.34, 0.05], [0.9, 4.2]);

  // ---------- orb: dark, glowing orange from below
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.12, 64, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x3a302c, metalness: 0.55, roughness: 0.32, clearcoat: 0.6, envMapIntensity: 0.9 }));
  orb.position.set(0.45, -0.35, -0.95); world.add(orb);

  // ---------- ring: thin chrome torus wrapping round the cards
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.06, 32, 360),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07, envMapIntensity: 1.6 }));
  ring.position.set(0.35, 0.05, 0.05); ring.rotation.set(1.2, 0.18, -0.42); world.add(ring);

  // ---------- pedestal: reflective glass disc with an orange core, glow on the floor and a soft contact shadow
  const ped = new THREE.Group(); ped.position.set(0.45, -2.6, 0.2); world.add(ped);
  ped.add(new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.02, 0.24, 128, 1),
    new THREE.MeshPhysicalMaterial({ color: 0xd9c8be, metalness: 0.2, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.5, envMapIntensity: 1.3 })));
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.02, 96), new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0.55, toneMapped: false }));
  core.position.y = 0.06; ped.add(core);
  function radial(stops) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8),
    new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,122,26,.75)'], [0.45, 'rgba(255,122,26,.18)'], [1, 'rgba(255,122,26,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = -0.14; ped.add(floorGlow);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6),
    new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(60,30,15,.35)'], [1, 'rgba(60,30,15,0)']]), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.13; ped.add(shadow);

  // ---------- sizing: fit the composition in the box
  function size() {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const need = Math.max(6.9, 7.0 / camera.aspect);           // keep about 7 units of width and 6.9 of height in view
    camera.position.set(target.x, target.y + 0.3, need / 2 / Math.tan(THREE.MathUtils.degToRad(15)));
    camera.lookAt(target); camera.updateProjectionMatrix();
  }
  size(); addEventListener('resize', () => { size(); if (!running) renderer.render(scene, camera); }, { passive: true });

  // ---------- motion: gentle bob, slow ring sway, pointer tilt; paused off screen or when the tab is hidden
  let mx = 0, my = 0, tx = 0, ty = 0, onScreen = true, running = false, t0 = performance.now();
  if (fine && !reduce) addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); }, { passive: true });
  function pose(t) {
    cards.forEach(c => { c.position.y = c.userData.y + Math.sin(t * 0.0009 * c.userData.bob[0] + c.userData.bob[1]) * 0.08; });
    ring.rotation.x = 1.2 + Math.sin(t * 0.0004) * 0.04; ring.rotation.z = -0.42 + Math.sin(t * 0.0003) * 0.05;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    world.rotation.y = mx * 0.28; world.rotation.x = my * 0.12;
  }
  function frame(now) {
    if (!running) return;
    pose(now - t0); renderer.render(scene, camera); requestAnimationFrame(frame);
  }
  function sync() {
    const go = onScreen && !document.hidden && !reduce;
    if (go && !running) { running = true; requestAnimationFrame(frame); } else if (!go) running = false;
  }
  pose(0); renderer.render(scene, camera);
  box.classList.add('is-3d');
  if (!reduce) {
    new IntersectionObserver(es => { onScreen = es[0].isIntersecting; sync(); }).observe(box);
    document.addEventListener('visibilitychange', sync);
    sync();
  }
}
