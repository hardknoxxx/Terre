/* The woven dome lamps of the façade, in 3D. They hang over the first screen, sway, follow the
   pointer a little and light up with the real hour in Puerto Iguazú (or the hour chosen below). */
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.querySelector('[data-lamps]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function weaveTextures() {
  const S = 256;
  const make = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  // alpha: two crossing sets of strands leave diamond holes, like the hand-woven shades
  const a = make(); const ax = a.getContext('2d');
  ax.fillStyle = '#000'; ax.fillRect(0, 0, S, S);
  ax.strokeStyle = '#fff'; ax.lineWidth = 22; ax.lineCap = 'butt';
  for (let k = -S; k <= S * 2; k += 64) {
    ax.beginPath(); ax.moveTo(k, 0); ax.lineTo(k + S, S); ax.stroke();
    ax.beginPath(); ax.moveTo(k, S); ax.lineTo(k + S, 0); ax.stroke();
  }
  // colour: rattan strands, each crossing a little lighter where it passes over
  const m = make(); const mx = m.getContext('2d');
  mx.fillStyle = '#cdb48c'; mx.fillRect(0, 0, S, S);
  mx.lineWidth = 22;
  for (let k = -S; k <= S * 2; k += 64) {
    mx.strokeStyle = '#e6d6b8'; mx.beginPath(); mx.moveTo(k, 0); mx.lineTo(k + S, S); mx.stroke();
    mx.strokeStyle = '#d9c4a0'; mx.beginPath(); mx.moveTo(k, S); mx.lineTo(k + S, 0); mx.stroke();
  }
  const alpha = new THREE.CanvasTexture(a);
  const map = new THREE.CanvasTexture(m);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [alpha, map]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 2); t.anisotropy = 4; }
  return { alpha, map };
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,150,0.9)'); g.addColorStop(0.35, 'rgba(242,180,90,0.35)'); g.addColorStop(1, 'rgba(242,180,90,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function domeGeometry(r, h, inset = 0) {
  // a half-ellipse profile with a slightly flared rim
  const pts = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.sin(t) * (r - inset) + 0.0001, Math.cos(t) * (h - inset)));
  }
  pts.push(new THREE.Vector2(r * 1.04 - inset, -0.04));
  return new THREE.LatheGeometry(pts, 48);
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.documentElement.classList.add('has-webgl');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 10);

  scene.add(new THREE.HemisphereLight(0xf3eadb, 0x16191c, 0.55));
  const key = new THREE.DirectionalLight(0xfff1dc, 0.9);
  key.position.set(-3, 4, 6);
  scene.add(key);

  const { alpha, map } = weaveTextures();
  const shadeMat = new THREE.MeshStandardMaterial({ map, alphaMap: alpha, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, roughness: 0.85, metalness: 0, emissive: new THREE.Color(0xf2b45a), emissiveIntensity: 0 });
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xf2b45a, side: THREE.BackSide, transparent: true, opacity: 0.5 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 });
  const cordMat = new THREE.MeshStandardMaterial({ color: 0x3a4045, roughness: 0.8 });

  const lamps = [];
  const group = new THREE.Group();
  scene.add(group);

  let viewH = 1, viewW = 1;
  const build = () => {
    lamps.splice(0).forEach((l) => group.remove(l.pivot));
    const wide = viewW / viewH > 3.2;
    const layout = wide
      ? [[-0.36, 0.36, 1.0], [-0.17, 0.56, 0.82], [0.02, 0.3, 1.1], [0.2, 0.5, 0.9], [0.38, 0.4, 0.78]]
      : [[-0.3, 0.5, 0.9], [0.02, 0.32, 1.05], [0.32, 0.6, 0.8]];
    layout.forEach(([fx, drop, size], i) => {
      const pivot = new THREE.Group();
      pivot.position.set(fx * viewW, viewH / 2 + 0.2, 0);
      const r = (wide ? 0.95 : 0.72) * size * (viewH / 5.36);
      const h = r * 0.82;
      const cordLen = drop * viewH + 0.2;
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cordLen, 6), cordMat);
      cord.position.y = -cordLen / 2;
      const lamp = new THREE.Group();
      lamp.position.y = -cordLen - h;
      const shade = new THREE.Mesh(domeGeometry(r, h), shadeMat);
      const inner = new THREE.Mesh(domeGeometry(r, h, r * 0.06), innerMat);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 16, 12), bulbMat);
      bulb.position.y = h * 0.15;
      const light = new THREE.PointLight(0xf2b45a, 0, r * 6, 1.6);
      light.position.y = h * 0.1;
      const glow = new THREE.Sprite(glowMat);
      glow.scale.setScalar(r * 4.2);
      glow.position.y = -h * 0.1;
      lamp.add(glow, shade, inner, bulb, light);
      // seen from the sidewalk: tipped towards the viewer so the lit inside shows
      lamp.rotation.x = 0.42;
      pivot.add(cord, lamp);
      group.add(pivot);
      lamps.push({ pivot, lamp, light, shade, inner, phase: i * 1.7, amp: 0.035 + (i % 3) * 0.012, spin: (i % 2 ? 1 : -1) * (0.06 + i * 0.01) });
    });
  };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;
    build();
    setNight(night);
    render(performance.now());
  };

  let night = 0;
  const setNight = (v) => {
    night = v;
    const glow = 0.35 + 0.65 * v; // the lamps are on whenever the corner is open; at night they are the light of the street
    shadeMat.emissiveIntensity = 0.06 + 0.32 * v;
    innerMat.opacity = 0.25 + 0.6 * glow;
    glowMat.opacity = 0.15 + 0.75 * glow;
    bulbMat.color.setHSL(0.11, 1, 0.55 + 0.25 * glow);
    lamps.forEach((l) => (l.light.intensity = 2 + 10 * glow));
  };

  const pointer = { x: 0, tx: 0 };
  addEventListener('pointermove', (e) => { pointer.tx = (e.clientX / innerWidth - 0.5) * 2; }, { passive: true });

  const render = (t) => {
    const s = t / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    const lift = Math.min(scrollY, innerHeight) / innerHeight;
    lamps.forEach((l) => {
      const sway = reduce ? 0 : Math.sin(s * 0.7 + l.phase) * l.amp;
      l.pivot.rotation.z = sway - pointer.x * 0.05;
      l.pivot.rotation.x = reduce ? 0 : Math.cos(s * 0.5 + l.phase) * l.amp * 0.6;
      l.shade.rotation.y = l.inner.rotation.y = reduce ? l.phase : s * l.spin + l.phase;
    });
    group.position.y = lift * viewH * 0.35;
    group.rotation.y = pointer.x * 0.12;
    renderer.render(scene, camera);
  };

  let running = false, raf = 0;
  const loop = (t) => { render(t); raf = requestAnimationFrame(loop); };
  const start = () => { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const hero = document.querySelector('.hero');
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen && !document.hidden ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden || !onScreen ? stop() : start()));
  addEventListener('resize', resize, { passive: true });
  if (reduce) addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });

  const hourNight = (h) => (h < 6 ? 1 : h < 18 ? 0 : h < 20 ? (h - 18) / 2 : 1);
  setNight(hourNight(window.TR_HOUR ?? 12));
  addEventListener('tr:hour', (e) => { setNight(e.detail.night); if (!running) render(performance.now()); });

  resize();
  start();
}

if (canvas) {
  try { init(); } catch (err) { console.warn('3D lamps unavailable, showing the drawn ones instead.', err); }
}
