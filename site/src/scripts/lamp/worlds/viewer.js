/* The worlds' test bench (src/pages/lamplight/worlds.astro): one world at a time over its own grade,
   with a placeholder page (an outlined rectangle 7.6 by 10.6 at the anchor) so the composition can
   be judged; bloom and ACES tone mapping as the film has them; the camera fitted from the world's
   stage the way the film's fit-to-frame does it (on computers the page's box fills a target in the
   right part of the screen, on phones one in the upper part).
   Switches: ?w=archive picks a world; ?orbit swings the camera slowly about the anchor; ?xfade=a,b
   cross-fades two worlds over 4 s and back, in a loop; ?q=low builds the phones' worlds; ?clean
   hides the strip; ?msaa smooths the strokes (four samples); ?ink draws the world as the film does
   by day, navy ink on ivory paper (its strokes alone, no bloom, the light mapped to ink).
   Test hook: window.mewritWorlds = { show(id), xfade(a, b, t), weights(map), view(yaw, pitch),
   freeze(time), bench(frames), stats, quality, ink, ready }. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { WORLDS } from './index.js';

const BG_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, .999, 1.); }`;
const BG_FS = /* glsl */`
uniform vec3 uTop, uBottom, uGlow;
uniform vec2 uGlowAt, uRes;
uniform float uGlowR;
varying vec2 vUv;
void main() {
  vec3 c = mix(uBottom, uTop, smoothstep(0., 1., vUv.y));
  vec2 d = (vUv - uGlowAt) * vec2(uRes.x / uRes.y, 1.);
  c += uGlow * exp(-dot(d, d) / (uGlowR * uGlowR));
  gl_FragColor = vec4(c, 1.);
}`;

// ?ink: the day's ink, as the film draws a world by day (the design board's inked(), on the GPU). The
// picture's luminance L (after tone mapping, as shown) against a box blur of it, about
// max(2, round(width / 150)) pixels each way, taken at half size; then
// ink = clamp((L - blur) * 5.5 + max(0, L - .5) * .4, 0, 1), and the paper and the ink mixed by it
const INK_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const INK_BLUR_FS = /* glsl */`
uniform sampler2D tSrc;
uniform vec2 uStep;
uniform float uRad, uLum;   // taps either side; 1 to take the picture's luminance, 0 to read it as given
varying vec2 vUv;
void main() {
  float s = 0.;
  for (int i = -24; i <= 24; i++) {
    if (abs(float(i)) > uRad) continue;
    vec3 c = texture2D(tSrc, vUv + uStep * float(i)).rgb;
    s += uLum > .5 ? dot(c, vec3(.2126, .7152, .0722)) : c.r;
  }
  gl_FragColor = vec4(vec3(s / (2. * uRad + 1.)), 1.);
}`;
const INK_FS = /* glsl */`
uniform sampler2D tDiffuse, tBlur;
varying vec2 vUv;
void main() {
  float L = dot(texture2D(tDiffuse, vUv).rgb, vec3(.2126, .7152, .0722)), B = texture2D(tBlur, vUv).r;
  float k = clamp((L - B) * 5.5 + max(0., L - .5) * .4, 0., 1.);
  gl_FragColor = vec4(mix(vec3(.95294, .93333, .89020), vec3(.07451, .14118, .30980), k), 1.);   // #F3EEE3 to #13244F
}`;
class InkPass extends Pass {
  constructor() {
    super();
    const make = (fs, uniforms) => new THREE.ShaderMaterial({ vertexShader: INK_VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false });
    this.blurH = make(INK_BLUR_FS, { tSrc: { value: null }, uStep: { value: new THREE.Vector2() }, uRad: { value: 1 }, uLum: { value: 1 } });
    this.blurV = make(INK_BLUR_FS, { tSrc: { value: null }, uStep: { value: new THREE.Vector2() }, uRad: { value: 1 }, uLum: { value: 0 } });
    this.inkMat = make(INK_FS, { tDiffuse: { value: null }, tBlur: { value: null } });
    this.half = [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }));
    this.quad = new FullScreenQuad(null);
  }
  // w, h in device pixels; the blur's half-size taps are two pixels apart, the first one a 2 by 2 mean
  setSize(w, h) {
    const hw = Math.max(1, Math.ceil(w / 2)), hh = Math.max(1, Math.ceil(h / 2)), rad = Math.max(1, Math.round(Math.max(2, Math.round(w / 150)) / 2));
    this.half.forEach(t => t.setSize(hw, hh));
    this.blurH.uniforms.uStep.value.set(1 / hw, 0); this.blurV.uniforms.uStep.value.set(0, 1 / hh);
    this.blurH.uniforms.uRad.value = rad; this.blurV.uniforms.uRad.value = rad;
  }
  render(renderer, writeBuffer, readBuffer) {
    const [a, b] = this.half;
    this.blurH.uniforms.tSrc.value = readBuffer.texture;
    this.quad.material = this.blurH; renderer.setRenderTarget(a); this.quad.render(renderer);
    this.blurV.uniforms.tSrc.value = a.texture;
    this.quad.material = this.blurV; renderer.setRenderTarget(b); this.quad.render(renderer);
    this.inkMat.uniforms.tDiffuse.value = readBuffer.texture; this.inkMat.uniforms.tBlur.value = b.texture;
    this.quad.material = this.inkMat; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }
  dispose() { [this.blurH, this.blurV, this.inkMat].forEach(m => m.dispose()); this.half.forEach(t => t.dispose()); this.quad.dispose(); }
}

// where the page's box goes on the screen, in fractions (as the film places it)
const TARGET = { desk: { x: .46, y: .14, w: .5, h: .7 }, short: { x: .46, y: .15, w: .5, h: .64 }, phone: { x: .06, y: .12, w: .88, h: .42 } };
const DMAX = 40;   // the farthest the camera stands from the anchor; beyond it the view widens instead

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const smooth = t => t * t * (3 - 2 * t);

const root = document.getElementById('wl');
if (root) start();

function start() {
  const canvas = root.querySelector('.wl-canvas'), readout = root.querySelector('.wl-readout');
  const buttons = [...root.querySelectorAll('[data-world]')], orbitBtn = root.querySelector('[data-orbit]');
  const qs = new URLSearchParams(location.search);
  if (qs.has('clean')) document.documentElement.classList.add('wl-clean');
  const quality = qs.get('q') === 'low' || qs.get('q') === 'high' ? qs.get('q') : (matchMedia('(pointer: coarse)').matches || innerWidth < 760 ? 'low' : 'high');
  const dpr = Math.min(devicePixelRatio || 1, 2), ink = qs.has('ink');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .1, 240);

  const bgU = { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uGlowAt: { value: new THREE.Vector2(.7, .5) }, uGlowR: { value: .55 }, uRes: { value: new THREE.Vector2(1, 1) } };
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: BG_VS, fragmentShader: BG_FS, depthTest: false, depthWrite: false, uniforms: bgU }));
  bg.frustumCulled = false; bg.renderOrder = -10; bg.visible = !ink; scene.add(bg);

  // the placeholder page: a plain outlined rectangle, upright at the anchor, facing +z
  const pg = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-3.8, -5.3, 0, 3.8, -5.3, 0, 3.8, -5.3, 0, 3.8, 5.3, 0, 3.8, 5.3, 0, -3.8, 5.3, 0, -3.8, 5.3, 0, -3.8, -5.3, 0], 3));
  const page = new THREE.LineSegments(pg, new THREE.LineBasicMaterial({ color: '#F4F1EA', transparent: true, opacity: .85, depthTest: false, depthWrite: false }));
  page.renderOrder = 1; page.frustumCulled = false; scene.add(page);

  const target = qs.has('msaa') ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }) : undefined;
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  if (!ink) composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .6, .5, .16));
  composer.addPass(new OutputPass());
  if (ink) composer.addPass(new InkPass());

  // the worlds, built once
  const ids = Object.keys(WORLDS), worlds = {}, stats = {};
  ids.forEach(id => {
    const w = WORLDS[id](THREE, { quality });
    worlds[id] = w; stats[id] = { ...w.stats };
    scene.add(w.group); w.setWeight(0);
    // by day the strokes are drawn alone: the glows (.2), shafts (.5) and motes (.6) are known by
    // their place in the world's draw order
    if (ink) w.group.traverse(o => {
      if (o === w.group) return;
      const s = Math.round((((o.renderOrder + 9.5) % 1.8) + 1.8) % 1.8 * 10) / 10;
      if (s === .2 || s === .5 || s === .6) o.visible = false;
    });
  });

  // ---------- the camera: the stage's box fitted to the target, as the film does it ----------
  let W = 1, H = 1, layout = 'desk', headPx = 64;
  function fitShot(stage, yaw, pitch) {
    const t = { ...TARGET[layout] };
    t.y = Math.max(t.y, (headPx + 10) / H);
    const aspect = W / H, c = stage.anchor, hs = stage.size.map(v => v / 2);
    let dir = norm(stage.dir);
    // the orbit: turn the direction about the upright, then tip it
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    dir = [dir[0] * cy + dir[2] * sy, dir[1], -dir[0] * sy + dir[2] * cy];
    const el = Math.asin(Math.max(-.95, Math.min(.95, dir[1]))) + pitch, hz = Math.hypot(dir[0], dir[2]) || 1;
    dir = [dir[0] / hz * Math.cos(el), Math.sin(el), dir[2] / hz * Math.cos(el)];
    const Rv = norm(cross([0, 1, 0], dir)), Uv = cross(dir, Rv);
    const corners = Array.from({ length: 8 }, (_, i) => [c[0] + (i & 1 ? hs[0] : -hs[0]), c[1] + (i & 2 ? hs[1] : -hs[1]), c[2] + (i & 4 ? hs[2] : -hs[2])]);
    let tn = Math.tan(stage.fov * Math.PI / 360);
    const rect = d => {
      const p = [c[0] + dir[0] * d, c[1] + dir[1] * d, c[2] + dir[2] * d], r = [1e9, 1e9, -1e9, -1e9];
      corners.forEach(q => {
        const v = sub(q, p), z = Math.max(.3, -dot(v, dir)), x = .5 + dot(v, Rv) / (z * tn * aspect) / 2, y = .5 - dot(v, Uv) / (z * tn) / 2;
        r[0] = Math.min(r[0], x); r[1] = Math.min(r[1], y); r[2] = Math.max(r[2], x); r[3] = Math.max(r[3], y);
      });
      return r;
    };
    let d = Math.max(hs[1] / tn / t.h, Math.max(hs[0], hs[2]) / (tn * aspect) / t.w) * 1.06;
    for (let k = 0; k < 8; k++) {
      const r = rect(d), over = Math.max((r[2] - r[0]) / t.w, (r[3] - r[1]) / t.h);
      if (k >= 3 && over <= 1.005) break;
      d *= over;
      if (d > DMAX) { tn *= d / DMAX; d = DMAX; }
    }
    const r = rect(d);
    return { pos: [c[0] + dir[0] * d, c[1] + dir[1] * d, c[2] + dir[2] * d], at: c, fov: Math.atan(tn) * 360 / Math.PI, sx: t.x + t.w / 2 - (r[0] + r[2]) / 2, sy: (r[1] + r[3]) / 2 - (t.y + t.h / 2), glow: [t.x + t.w / 2, 1 - (t.y + t.h / 2)] };
  }
  const look = new THREE.Vector3();
  function applyShot(a, b, k) {
    const m = (x, y) => x + (y - x) * k;
    camera.position.set(m(a.pos[0], b.pos[0]), m(a.pos[1], b.pos[1]), m(a.pos[2], b.pos[2]));
    look.set(m(a.at[0], b.at[0]), m(a.at[1], b.at[1]), m(a.at[2], b.at[2]));
    camera.fov = m(a.fov, b.fov); camera.aspect = W / H;
    camera.lookAt(look);
    camera.setViewOffset(W, H, -m(a.sx, b.sx) * W, m(a.sy, b.sy) * H, W, H);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    bgU.uGlowAt.value.set(m(a.glow[0], b.glow[0]), m(a.glow[1], b.glow[1]));
  }
  const cA = new THREE.Color(), cB = new THREE.Color();
  function applyGrade(ga, gb, k) {
    bgU.uTop.value.copy(cA.set(ga.top)).lerp(cB.set(gb.top), k);
    bgU.uBottom.value.copy(cA.set(ga.bottom)).lerp(cB.set(gb.bottom), k);
    bgU.uGlow.value.copy(cA.set(ga.glow[0]).multiplyScalar(ga.glow[1])).lerp(cB.set(gb.glow[0]).multiplyScalar(gb.glow[1]), k);
  }

  // ---------- what is shown ----------
  let pair = [qs.get('w') && WORLDS[qs.get('w')] ? qs.get('w') : 'desk', null], mix = 0, orbit = qs.has('orbit'), offset = [0, 0], frozen = null, xloop = null;
  const xf = (qs.get('xfade') || '').split(',');
  if (xf.length === 2 && WORLDS[xf[0]] && WORLDS[xf[1]]) xloop = xf;
  function setWeights(map) { ids.forEach(id => worlds[id].setWeight(map[id] || 0)); }
  function setPair(a, wa, b, wb) { ids.forEach(id => worlds[id].setWeight(id === a ? wa : id === b ? wb : 0)); }
  // the fitted shots, kept while nothing that decides them changes (the orbit refits every frame)
  const shots = {};
  let shotKey = '';
  function shotOf(id, yaw, pitch) {
    if (orbit) return fitShot(worlds[id].stage, yaw, pitch);
    const key = `${W}x${H}:${layout}:${yaw}:${pitch}`;
    if (key !== shotKey) { ids.forEach(i => { shots[i] = null; }); shotKey = key; }
    return shots[id] || (shots[id] = fitShot(worlds[id].stage, yaw, pitch));
  }
  function show(id) { if (!WORLDS[id]) return; xloop = null; pair = [id, null]; mix = 0; mark(); }
  function xfade(a, b, k) { if (!WORLDS[a] || !WORLDS[b]) return; xloop = null; pair = [a, b]; mix = Math.min(1, Math.max(0, k)); mark(); }
  function mark() {
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.world === pair[0] && !pair[1])));
    if (orbitBtn) orbitBtn.setAttribute('aria-pressed', String(orbit));
    const s = stats[pair[0]];
    if (readout) readout.textContent = `${pair[0]}${pair[1] ? ' to ' + pair[1] : ''} · ${quality}${ink ? ' · ink' : ''} · built in ${s.buildMs.toFixed(1)} ms · ${s.lineVerts} line points · ${s.points} points · ${s.calls} draws`;
  }
  buttons.forEach(b => b.addEventListener('click', () => show(b.dataset.world)));
  if (orbitBtn) orbitBtn.addEventListener('click', () => { orbit = !orbit; mark(); });

  function resize() {
    W = Math.max(1, innerWidth); H = Math.max(1, innerHeight);
    layout = W < 760 || W / H < .8 ? 'phone' : W / H < 1.45 ? 'short' : 'desk';
    headPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    renderer.setSize(W, H, false); composer.setSize(W, H);
    bgU.uRes.value.set(W, H);
  }
  addEventListener('resize', resize);
  resize();

  // ---------- the loop ----------
  const clock = { last: performance.now(), t: 0 };
  let manual = null;   // an explicit weights(map) from the test hook
  function frame(now) {
    const dt = Math.min(.1, Math.max(0, (now - clock.last) / 1000)); clock.last = now; clock.t += dt;
    const time = frozen ?? clock.t;
    let a = pair[0], b = pair[1], k = mix;
    if (xloop) { const u = (clock.t % 8) / 4; [a, b] = xloop; k = smooth(u < 1 ? u : 2 - u); }
    const yaw = (orbit ? Math.sin(clock.t * .16) * 14 : 0) * Math.PI / 180 + offset[0], pitch = (orbit ? Math.sin(clock.t * .11) * 4 : 0) * Math.PI / 180 + offset[1];
    const sa = shotOf(a, yaw, pitch), sb = b ? shotOf(b, yaw, pitch) : sa;
    applyShot(sa, sb, b ? k : 0);
    applyGrade(worlds[a].grade, (b ? worlds[b] : worlds[a]).grade, b ? k : 0);
    if (manual) setWeights(manual);
    else setPair(a, b ? 1 - k : 1, b, k);
    ids.forEach(id => worlds[id].update(time, dt, camera));
    composer.render();
  }
  function loop(now) { requestAnimationFrame(loop); frame(now); }
  mark();
  frame(performance.now());
  requestAnimationFrame(loop);

  window.mewritWorlds = {
    ids, stats, quality, ink, ready: true,
    show, xfade,
    weights(map) { manual = map || null; },
    view(yawDeg = 0, pitchDeg = 0) { offset = [yawDeg * Math.PI / 180, pitchDeg * Math.PI / 180]; },
    freeze(t = null) { frozen = t; },
    // the cost of a frame: n frames drawn back to back, the GPU made to finish; ms per frame
    bench(n = 120) {
      const gl = renderer.getContext(), px = new Uint8Array(4), t0 = performance.now();
      for (let i = 0; i < n; i++) frame(t0 + i * 16.7);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return (performance.now() - t0) / n;
    },
    // what each world's update() leaves on the heap over n calls (0 if it allocates nothing; needs
    // Chrome's precise memory info)
    allocTest(n = 20000) {
      const heap = () => (performance.memory ? performance.memory.usedJSHeapSize : NaN);
      // fresh: a new time each call, as a film passes it (the caller boxes each new number it
      // passes; that is the caller's, not the world's); fixed: one time, so only the world's own
      // allocations can show
      const run = (f, fresh) => {
        for (let i = 0; i < 6000; i++) f(fresh ? i * .016 : 1.5, .016, camera);   // warmed, so the engine has optimised it
        const m0 = heap();
        for (let i = 0; i < n; i++) f(fresh ? i * .016 : 1.5, .016, camera);
        return heap() - m0;
      };
      // the loop's own cost, calling a function that does nothing, for comparison
      const out = { control: run((t, dt, c) => c, true) };
      ids.forEach(id => {
        const w = worlds[id];
        w.setWeight(1);
        out[id] = [run(w.update, true), run(w.update, false)];
        w.setWeight(0);
      });
      return out;
    },
    // the same, piece by piece, for the operations update() is made of
    allocParts(n = 20000) {
      const heap = () => performance.memory.usedJSHeapSize;
      const v = new THREE.Vector4(0, 30, 0, 0), c = new THREE.Color('#F2B866'), o = new THREE.Object3D(), e = camera.matrixWorld.elements;
      const tests = {
        vecX: t => { v.x = t; },
        vecSqrt: t => { const dx = e[12] - t, dy = e[13], dz = e[14]; v.y = Math.sqrt(dx * dx + dy * dy + dz * dz); },
        flicker: t => { const f = 1 + .04 * (Math.sin(t * 7.3) * .45 + Math.sin(t * 12.9 + 1.3) * .3); v.w = f; },
        setRGB: t => { const f = 1 + .04 * Math.sin(t * 7.3); c.setRGB(.9 * f, .5 * f, .13 * f); },
        position: t => { o.position.x = Math.sin(t * .012) * 6; },
      };
      const out = {};
      for (const [k, f] of Object.entries(tests)) {
        for (let i = 0; i < 6000; i++) f(1.5 + i * 1e-6);
        const m0 = heap();
        for (let i = 0; i < n; i++) f(1.5);
        out[k] = heap() - m0;
      }
      return out;
    },
    // build a second copy of every world, draw it once, dispose of it: true if each left the scene
    disposeTest() {
      const t = new THREE.WebGLRenderTarget(64, 64), out = {};
      ids.forEach(id => {
        const w = WORLDS[id](THREE, { quality });
        scene.add(w.group); w.setWeight(1); w.update(1, .016, camera);
        renderer.setRenderTarget(t); renderer.render(scene, camera); renderer.setRenderTarget(null);
        w.dispose();
        out[id] = !w.group.parent;
      });
      t.dispose();
      return out;
    },
    // the draw calls one render of the scene makes as it stands (the background and the placeholder
    // page are two of them): for checking that a hidden world costs nothing
    drawn() {
      const t = new THREE.WebGLRenderTarget(64, 64);
      renderer.info.autoReset = false; renderer.info.reset();
      renderer.setRenderTarget(t); renderer.render(scene, camera); renderer.setRenderTarget(null);
      const r = renderer.info.render, out = { calls: r.calls, triangles: r.triangles, points: r.points };
      renderer.info.autoReset = true; t.dispose();
      return out;
    },
  };
}
