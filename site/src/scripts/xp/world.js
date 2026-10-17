/* The experience's 3D world, drawn with three.js (MIT licence). One cloud of particles moves between
   the formations (formations.js): the shader flies each particle from its place in one formation to
   its place in the next, through a flow field, each leaving at its own moment, and lights the shape as
   the reveal passes. Behind it a background with a soft glow, a floor grid and the globe's orbits;
   after it, bloom and a finishing pass (a touch of lens fringing, a vignette, film grain).
   Night and day are one world: `day` (0 to 1, from experience.js) moves the sky from the scene's
   night through a pastel dawn (lavender above, peach at the horizon) to cream, and the particles from
   light (added to the sky) to navy ink (laid over it), with the night's bloom, fringing and vignette
   fading out. The night keeps its look without tone mapping on the frame: the background shader
   tone-maps the night's sky itself (ACES, as the whole frame used to be), so the cream is never
   greyed. The canvas is the page's backdrop, so it can be taller than the stage the shots are framed
   for (camera() takes the stage's height). experience.js decides everything that changes; this only
   draws it. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildFormations, random } from './formations.js';

const PARTICLE_VS = /* glsl */`
uniform float uTime, uMorph, uRevealFrom, uRevealTo, uSpinFrom, uSpinTo, uStreamFrom, uStreamTo, uGhostFrom, uGhostTo;
uniform float uScale, uSize, uMouse, uMotion, uFlow, uGain, uPick, uPickOn, uDust;
uniform vec3 uMouseO, uMouseD;
uniform vec4 uHalo;   // the shape on screen: its centre and a radius just outside it (for the motes circling it)
uniform float uDay;
attribute vec3 aFrom, aTo, aColFrom, aColTo;
attribute float aKeyFrom, aKeyTo, aPick;
attribute vec4 aRand, aStream;
varying vec3 vColor;
varying float vAlpha;

// the rivers' course (keep in step with streamAt in formations.js)
vec3 streamAt(float u, float side, float ang, float rad) {
  float z = 6. - 42. * u;
  float x = side * (.25 + 6.2 * u * u) + sin(u * 7. + side) * .8 * u;
  float y = -.8 + sin(u * 4. + side * 1.3) * 1.1 * u + u * 2.4;
  float r = rad * (.45 + 1.25 * u);
  return vec3(x + cos(ang) * r, y + sin(ang) * r * .55, z);
}
vec3 spinY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 flow(vec3 p, float t) {
  return vec3(sin(p.y * .55 + t) + sin(p.z * .8 - t * .7),
              sin(p.z * .45 + t * .8) + sin(p.x * .65 + t * .3),
              sin(p.x * .4 - t * .6) + sin(p.y * .75 + t * .9)) * .5;
}
// a particle's place in one formation: dust drifts, the rivers flow, the rest turn with their shape
vec3 placeOf(vec3 p, float key, float spin, float stream, out float fade) {
  float f = 1.;
  vec3 o = spinY(p, spin);
  if (key < -.5 && aRand.w > 3.7) {
    // one mote in ten circles the shape on screen (uHalo), just outside it: slowly, always the same
    // way, the nearer ones a little quicker, rising gently through a band of the shape's height and
    // fading out and in where the band ends
    float r = uHalo.w * (1. + aRand.y * .45), h = uHalo.w * 1.1;
    float a = aRand.z * 6.2832 + uTime * uMotion * .6 / max(r, 3.);
    float yy = mod(aRand.y * h + uTime * .1 * uMotion, h) - h * .5;
    f = smoothstep(-h * .5, -h * .3, yy) * (1. - smoothstep(h * .3, h * .5, yy));
    o = uHalo.xyz + vec3(cos(a) * r, yy, sin(a) * r * .7);
  } else if (key < -.5) {
    // the dust: round the shape and up through the scene, slowly and always the same way (motes in a
    // beam of light), whether or not the reader scrolls; a mote that leaves at the top comes back at
    // the bottom, faded out and in at the ends of its run so it never pops (the field spans y -10.9 to
    // 15.1, formations.js makeDust)
    vec3 q = spinY(p, uTime * .012 * uMotion);
    float y = mod(q.y + 10.9 + uTime * (.12 + aRand.x * .1) * uMotion, 26.) - 10.9;
    f = smoothstep(-10.9, -8.4, y) * (1. - smoothstep(12.6, 15.1, y));
    o = vec3(q.x, y, q.z) + flow(q * .12 + aRand.y * 2., uTime * .05) * .6 * uMotion;
  } else if (stream > .5 && aStream.y != 0.) {
    float u = fract(aStream.x + uTime * .018 * uMotion);
    f = smoothstep(0., .05, u) * (1. - smoothstep(.85, 1., u));
    o = streamAt(u, aStream.y, aStream.z + uTime * .6 * uMotion, aStream.w);
  }
  fade = f;
  return o;
}
// before the reveal reaches it, a particle waits as a faint blueprint (or dark, in a formation whose
// ghost is 0); it flares as it lights. Where it stays dark until written, the flare only trails the
// reveal, like fresh ink behind a pen
vec3 shade(vec3 c, float key, float reveal, float ghostK) {
  if (key <= 0.) return c;
  float lit = smoothstep(key - .02, key + .01, reveal);
  float front = exp(-pow((reveal - key) * 26., 2.)) * step(.002, reveal) * mix(step(key - .004, reveal), 1., step(.5, ghostK));
  vec3 ghost = vec3(dot(c, vec3(.3, .59, .11))) * vec3(.42, .52, .9) * .55 * ghostK;
  return mix(ghost, c, lit) + c * front * 1.8;
}
void main() {
  float fa, fb;
  vec3 a = placeOf(aFrom, aKeyFrom, uSpinFrom, uStreamFrom, fa);
  vec3 b = placeOf(aTo, aKeyTo, uSpinTo, uStreamTo, fb);
  // each particle leaves at its own moment, so shapes dissolve and reform rather than slide
  float d = aRand.z * .45;
  float m = clamp((uMorph - d) / .55, 0., 1.);
  float e = m * m * (3. - 2. * m);
  vec3 p = mix(a, b, e);
  p += flow(p * .2 + aRand.y * 4., uTime * .5 + aRand.y * 6.) * sin(3.14159 * m) * uFlow * uMotion;
  if (uMotion < .5) { e = step(.5, m); p = mix(a, b, e); }   // reduced motion: each particle swaps place, no flight
  vec3 col = mix(shade(aColFrom, aKeyFrom, uRevealFrom, uGhostFrom), shade(aColTo, aKeyTo, uRevealTo, uGhostTo), e);
  // the dust's own brightness (1 in the scenes, where it stays faint behind the shapes; up in the
  // tail, where it is all there is), on particles as they become dust
  if (aKeyTo < -.5) col *= mix(1., uDust, aKeyFrom < -.5 ? 1. : e);
  // the motes circling the shape: a light of their own (mostly ice, a few warm), not the dust's dimness
  bool mote = aKeyTo < -.5 && aRand.w > 3.7;
  // (by day finer and fainter, so on the paper they read as motion, not as specks of dirt)
  if (mote) col = mix(col, mix(vec3(.75, .82, 1.), vec3(1., .62, .32), step(.78, aRand.z)) * (.55 + aRand.y * .5) * mix(1., .45, uDay), aKeyFrom < -.5 ? 1. : e);
  // the practices' shapes: the one picked brightens, the others dim (aPick: its shape, -1 for the rest)
  if (uPickOn > .5 && uPick > -.5 && aPick > -.5) col *= abs(aPick - uPick) < .5 ? 1.55 : .55;
  // the pointer parts the particles and warms them
  vec3 w = p - uMouseO;
  vec3 off = w - uMouseD * dot(w, uMouseD);
  float dist = length(off);
  float push = uMouse * (1. - smoothstep(0., 1.6, dist)) * uMotion;
  p += off / max(dist, 1e-3) * push * .9;
  col *= 1. + push * 1.4;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  float depth = max(-mv.z, .01);
  float tw = 1. + .18 * sin(uTime * aRand.w + aRand.y * 6.283) * uMotion;
  float px = uSize * aRand.x * tw * uScale / depth * (mote ? mix(1.5, .9, uDay) : 1.);
  gl_PointSize = clamp(px, 1.5, 80.);
  gl_Position = projectionMatrix * mv;
  vColor = col * uGain;
  vAlpha = mix(fa, fb, e) * clamp(px / 1.5, .15, 1.) * smoothstep(.5, 2.5, depth) * (1. - smoothstep(45., 70., depth));
}`;

// at night a soft round of light, added to the sky; by day a crisp dot of ink laid over the paper: navy,
// or the logo's orange where the light was warm, the denser the brighter the light was. The colour is
// premultiplied and the alpha is the ink's share, so one blend (one, one minus alpha) adds at night
// (alpha 0) and lays over by day
const PARTICLE_FS = /* glsl */`
uniform float uDay;
uniform vec3 uInkC;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - .5;
  float r2 = dot(c, c) * 4.;
  if (r2 > 1.) discard;
  float warm = clamp((vColor.r - vColor.b) * 2.5, 0., 1.);
  vec3 ink = mix(uInkC, vec3(.72, .33, .04), warm);
  float lum = clamp(dot(vColor, vec3(.3, .59, .11)), 0., 1.4);
  float aNight = (exp(-r2 * 16.) + exp(-r2 * 4.) * .2) * (1. - r2) * vAlpha;
  float aDay = min(1., (1. - smoothstep(.5, 1., r2)) * vAlpha * (.2 + lum * .85));
  float a = mix(aNight, aDay, uDay);
  gl_FragColor = vec4(mix(vColor, ink, uDay) * a, a * uDay);
}`;

const BG_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, .999, 1.); }`;
// the sky: the night's (its two colours, the glow behind the shape, the faint grid), tone-mapped here
// with ACES (three.js's own fit, MIT), mixed toward the day's side (dawn, then cream: uDayTop and
// uDayBottom, set by world.set) by uDayMix; a scene may give its night sky as it is to show (uRaw)
const BG_FS = /* glsl */`
uniform vec3 uTop, uBottom, uGlow, uDayTop, uDayBottom;
uniform vec2 uGlowAt, uRes;
uniform float uGlowR, uGrid, uPx, uDayMix, uRaw;
varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + .0245786) - .000090537; vec3 b = v * (.983729 * v + .4329510) + .238081; return a / b; }
vec3 aces(vec3 c) {
  const mat3 IN = mat3(vec3(.59719, .07600, .02840), vec3(.35458, .90834, .13383), vec3(.04823, .01566, .83777));
  const mat3 OUT = mat3(vec3(1.60475, -.10208, -.00327), vec3(-.53108, 1.10813, -.07276), vec3(-.07367, -.00605, 1.07602));
  return clamp(OUT * RRTAndODTFit(IN * (c / .6)), 0., 1.);
}
void main() {
  float y = smoothstep(0., 1., vUv.y);
  vec3 c = mix(uBottom, uTop, y);
  vec2 d = (vUv - uGlowAt) * vec2(uRes.x / uRes.y, 1.);
  c += uGlow * exp(-dot(d, d) / (uGlowR * uGlowR));
  float s = 56. * uPx;
  vec2 g = (.5 - abs(fract(gl_FragCoord.xy / s) - .5)) * s;
  c += vec3(.010, .018, .042) * (1. - smoothstep(0., uPx, min(g.x, g.y))) * uGrid;
  gl_FragColor = vec4(mix(mix(aces(c), c, uRaw), mix(uDayBottom, uDayTop, y), uDayMix), 1.);
}`;

const LINE_VS = /* glsl */`
attribute float aDist;
uniform vec3 uCam;
uniform float uNear, uFar;
varying float vFade, vDist;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.);
  vFade = 1. - smoothstep(uNear, uFar, distance(wp.xyz, uCam));
  vDist = aDist;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
// light added at night, navy laid over by day (premultiplied, as the particles)
const LINE_FS = /* glsl */`
uniform vec3 uColor, uColorDay;
uniform float uOpacity, uDash, uDashOffset, uDay;
varying float vFade, vDist;
void main() {
  if (uDash > 0. && fract((vDist + uDashOffset) / uDash) > .55) discard;
  float a = uOpacity * vFade;
  gl_FragColor = vec4(mix(uColor, uColorDay, uDay) * a, a * uDay);
}`;

const FINISH = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAberr: { value: .012 }, uVignette: { value: .55 }, uGrain: { value: .035 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: /* glsl */`
uniform sampler2D tDiffuse;
uniform float uTime, uAberr, uVignette, uGrain;
uniform vec2 uRes;
varying vec2 vUv;
void main() {
  vec2 c = vUv - .5;
  float r2 = dot(c, c);
  vec2 o = c * r2 * uAberr;
  vec3 col = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
  col *= 1. - uVignette * smoothstep(.12, .7, r2 * 1.7);
  float n = fract(sin(dot(vUv * uRes + fract(uTime * 7.31) * 113.1, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - .5) * uGrain;
  gl_FragColor = vec4(col, 1.);
}`,
};

// lines with a running length (for dashes): pairs of points
function lineGeometry(segs) {
  const pos = [], dist = [];
  segs.forEach(([a, b, d0 = 0]) => { pos.push(...a, ...b); dist.push(d0, d0 + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  return g;
}
// a circle in the xy plane, as segments
const circle = (r, n = 192, y = null) => Array.from({ length: n }, (_, i) => {
  const t0 = i / n * Math.PI * 2, t1 = (i + 1) / n * Math.PI * 2;
  return y === null ? [[Math.cos(t0) * r, Math.sin(t0) * r, 0], [Math.cos(t1) * r, Math.sin(t1) * r, 0], t0 * r] : [[Math.cos(t0) * r, y, Math.sin(t0) * r], [Math.cos(t1) * r, y, Math.sin(t1) * r], t0 * r];
});

// the day's sky, top and bottom, at points of the light (d): a twilight deep enough that the night's
// light still shows on it (indigo above, dusky rose at the horizon), a pastel dawn (lavender, peach),
// paler, then cream (look.paper may replace the cream). Colours made in OKLCH from the logo's navy and
// orange hues (2026-10-13). Below d .5 the sky moves from the night to the twilight (uDayMix)
const DAWN = [[.5, '#3D4177', '#B37078'], [.68, '#9D97CA', '#F8C4A8'], [.84, '#E7E1F6', '#FAE3D1']];
// premultiplied blending: added where alpha is 0 (the night), laid over where it is 1 (the day)
const PREMULT = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };

// day: when set (the review switches ?day and ?ink), the whole film by day; look (review switches):
// paper [top, bottom] for the cream, inkColor, toneMapping for the frame (none by default)
export function createWorld(canvas, { N, dpr, bloomScale = 1, trails: withTrails = false, compact = false, day: allDay = false, look: pal = {} }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(dpr);
  const TM = { aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping, agx: THREE.AgXToneMapping };
  renderer.toneMapping = TM[pal.toneMapping] ?? THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .1, 220);
  const uDay = { value: allDay ? 1 : 0 };   // shared by every material that changes with the light
  const lineMat = (color, extra = {}) => new THREE.ShaderMaterial({
    vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false, depthTest: false, ...PREMULT,
    uniforms: { uColor: { value: new THREE.Color(color) }, uColorDay: { value: new THREE.Color(pal.inkColor || '#1C3472') }, uDay, uOpacity: { value: 0 }, uDash: { value: 0 }, uDashOffset: { value: 0 }, uCam: { value: camera.position }, uNear: { value: 8 }, uFar: { value: 44 }, ...extra },
  });

  // the background
  const paper = [new THREE.Color((pal.paper || [])[0] || '#FCF6EE'), new THREE.Color((pal.paper || [])[1] || '#F6EDE2')];
  const dawn = [...DAWN.map(([at, t, b]) => [at, new THREE.Color(t), new THREE.Color(b)]), [1, paper[0], paper[1]]];
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: BG_VS, fragmentShader: BG_FS, depthTest: false, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uGlowAt: { value: new THREE.Vector2(.6, .5) }, uGlowR: { value: .55 }, uGrid: { value: 0 }, uPx: { value: dpr }, uRes: { value: new THREE.Vector2(1, 1) },
      uDayTop: { value: new THREE.Color() }, uDayBottom: { value: new THREE.Color() }, uDayMix: { value: 0 }, uRaw: { value: 0 } },
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

  // the floor grid
  const fsegs = [];
  for (let z = 8; z >= -52; z -= 1.1) fsegs.push([[-34, 0, z], [34, 0, z]]);
  for (let x = -34; x <= 34; x += 1.24) fsegs.push([[x, 0, 8], [x, 0, -52]]);
  const floor = new THREE.LineSegments(lineGeometry(fsegs), lineMat('#5B7BD8'));
  floor.frustumCulled = false; floor.renderOrder = -5; scene.add(floor);

  // around the globe: a tilted orbit and the equator, dashed
  const orbit = new THREE.Group();
  const o1 = new THREE.LineSegments(lineGeometry(circle(6.4, 256, 0)), lineMat('#8FA8E8', { uNear: { value: 30 }, uFar: { value: 60 } }));
  const o2 = new THREE.LineSegments(lineGeometry(circle(5.1, 256, 0)), lineMat('#E07A1F', { uNear: { value: 30 }, uFar: { value: 60 }, uColorDay: { value: new THREE.Color('#B4621A') } }));
  o1.rotation.z = .38; o1.rotation.x = .2;
  orbit.add(o1, o2); orbit.children.forEach(c => { c.frustumCulled = false; c.renderOrder = -4; }); scene.add(orbit);

  // the particles: every formation's places, colours and keys as attributes, two of them bound at a
  // time; and, for every particle, which of the practices' shapes it belongs to (aPick)
  const { list, stream, pick } = buildFormations(N, undefined, { compact });
  const attrs = list.map(fm => ({ pos: new THREE.BufferAttribute(fm.pos, 3), col: new THREE.BufferAttribute(fm.col, 3), key: new THREE.BufferAttribute(fm.key, 1) }));
  const R = random(77), rnd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const big = R() < .05;
    rnd[i * 4] = big ? 1.6 + R() * 1 : .5 + R() * .8; rnd[i * 4 + 1] = R(); rnd[i * 4 + 2] = R(); rnd[i * 4 + 3] = 1 + R() * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', attrs[0].pos);   // three.js counts the points from this one
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
  geo.setAttribute('aStream', new THREE.BufferAttribute(stream, 4));
  geo.setAttribute('aPick', new THREE.BufferAttribute(pick, 1));
  const U = {
    uTime: { value: 0 }, uMorph: { value: 0 }, uRevealFrom: { value: 1 }, uRevealTo: { value: 0 }, uSpinFrom: { value: 0 }, uSpinTo: { value: 0 },
    uStreamFrom: { value: 0 }, uStreamTo: { value: 0 }, uGhostFrom: { value: 1 }, uGhostTo: { value: 1 }, uScale: { value: 1 }, uSize: { value: .06 }, uMouse: { value: 0 }, uMotion: { value: 1 }, uFlow: { value: 1.6 }, uGain: { value: 1 },
    uPick: { value: -1 }, uPickOn: { value: 0 }, uDust: { value: 1 }, uMouseO: { value: new THREE.Vector3() }, uMouseD: { value: new THREE.Vector3(0, 0, -1) },
    uDay, uInkC: { value: new THREE.Color(pal.inkColor || '#1C3472') }, uHalo: { value: new THREE.Vector4(0, 0, 0, 6) },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: PARTICLE_VS, fragmentShader: PARTICLE_FS, uniforms: U, transparent: true, depthWrite: false, depthTest: false, ...PREMULT });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; scene.add(points);
  let pair = [-1, -1], streamOf = -1;
  function setPair(a, b, streamForm) {
    if (a !== pair[0]) { geo.setAttribute('aFrom', attrs[a].pos); geo.setAttribute('aColFrom', attrs[a].col); geo.setAttribute('aKeyFrom', attrs[a].key); }
    if (b !== pair[1]) { geo.setAttribute('aTo', attrs[b].pos); geo.setAttribute('aColTo', attrs[b].col); geo.setAttribute('aKeyTo', attrs[b].key); }
    pair = [a, b]; streamOf = streamForm;
    U.uStreamFrom.value = a === streamForm ? 1 : 0; U.uStreamTo.value = b === streamForm ? 1 : 0;
    U.uGhostFrom.value = list[a].ghost ?? 1; U.uGhostTo.value = list[b].ghost ?? 1;
  }
  setPair(0, 0, -1);
  // the first time a formation is bound its buffers go up to the GPU, which costs a frame: warm()
  // does it ahead of time, binding one and drawing once into a tiny target nobody sees
  const warmTarget = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });

  // after the scene: bloom, then colour (sRGB), then the finish
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  // light trails while a shape changes: each frame keeps a fading copy of the last (off at rest)
  const trails = withTrails ? new AfterimagePass(0) : null;
  if (trails) composer.addPass(trails);
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .7, .5, .16);
  const bloomSize = bloom.setSize.bind(bloom);
  bloom.setSize = (w, h) => bloomSize(Math.max(1, Math.round(w * bloomScale)), Math.max(1, Math.round(h * bloomScale)));
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH);
  composer.addPass(finish);

  let W = 1, H = 1, px = dpr;
  const look = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const cA = new THREE.Color(), cB = new THREE.Color();
  const mixColor = (out, a, b, k) => out.copy(cA.set(a)).lerp(cB.set(b), k);
  // the day's side of the sky at d: the twilight up to .5, then along the stops to cream
  const daySide = (top, bottom, d) => {
    let i = 0;
    while (i < dawn.length - 2 && d > dawn[i + 1][0]) i++;
    const [a0, t0, b0] = dawn[i], [a1, t1, b1] = dawn[i + 1], f = Math.min(1, Math.max(0, (d - a0) / (a1 - a0)));
    top.copy(t0).lerp(t1, f); bottom.copy(b0).lerp(b1, f);
  };

  return {
    N, renderer, anchors: i => list[i].anchors, box: i => list[i].box,
    setPair,
    warm(i) {
      const [a, b] = pair, s = streamOf;
      setPair(i, i, -1);
      renderer.setRenderTarget(warmTarget); renderer.render(scene, camera); renderer.setRenderTarget(null);
      setPair(a, b, s);
    },
    resize(w, h, ratio = px) {
      W = Math.max(1, w); H = Math.max(1, h); px = ratio;
      renderer.setPixelRatio(px); composer.setPixelRatio(px);
      renderer.setSize(W, H, false); composer.setSize(W, H);
      bgMat.uniforms.uRes.value.set(W, H); bgMat.uniforms.uPx.value = px;
      finish.uniforms.uRes.value.set(W * px, H * px);
    },
    // the camera: position, the point it looks at, field of view, and the picture's shift, in a frame
    // fh tall at the top of the canvas (the stage the shots are framed for; the canvas may run on below it)
    camera(pos, target, fov, sx, sy, fh = H) {
      camera.position.set(pos[0], pos[1], pos[2]);
      camera.fov = fov; camera.aspect = W / fh;
      look.set(target[0], target[1], target[2]); camera.lookAt(look);
      camera.setViewOffset(W, fh, -sx * W, sy * fh, W, H);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      U.uScale.value = fh * px / (2 * Math.tan(fov * Math.PI / 360));
    },
    // everything else that changes from frame to frame; s.day is the light (0 night, 1 day)
    set(s) {
      const d = allDay ? 1 : Math.min(1, Math.max(0, s.day || 0)), n = 1 - d;
      uDay.value = d;
      U.uTime.value = s.time; U.uMorph.value = s.morph; U.uRevealFrom.value = s.revealFrom; U.uRevealTo.value = s.revealTo;
      U.uSpinFrom.value = s.spinFrom; U.uSpinTo.value = s.spinTo; U.uMotion.value = s.motion; U.uFlow.value = s.flow;
      U.uSize.value = s.size; U.uGain.value = s.gain; U.uPick.value = s.pick; U.uPickOn.value = s.pickOn;
      if (s.halo) U.uHalo.value.set(s.halo[0], s.halo[1], s.halo[2], s.halo[3]);
      // the dust brighter at night, so its drift round the shape shows; on paper a light speckle only
      // (bright dust would read as dirt there)
      U.uDust.value = s.dust * 1.8 * n + Math.min(s.dust, 1.4) * d;
      mixColor(bgMat.uniforms.uTop.value, s.bgA[0], s.bgB[0], s.k);
      mixColor(bgMat.uniforms.uBottom.value, s.bgA[1], s.bgB[1], s.k);
      mixColor(bgMat.uniforms.uGlow.value, s.glowA[0], s.glowB[0], s.k).multiplyScalar(s.glow);
      bgMat.uniforms.uGlowAt.value.set(s.glowAt[0], s.glowAt[1]); bgMat.uniforms.uGrid.value = s.grid;
      daySide(bgMat.uniforms.uDayTop.value, bgMat.uniforms.uDayBottom.value, d);
      bgMat.uniforms.uDayMix.value = Math.min(1, d * 2);
      bgMat.uniforms.uRaw.value = s.raw || 0;   // a sky given as it is to show (the services' dusk indigo), not tone-mapped
      floor.position.y = s.floorY; floor.material.uniforms.uOpacity.value = s.floor * .16 * (n + d * .6);
      orbit.rotation.y = s.time * .04;
      o1.material.uniforms.uOpacity.value = s.orbit * .3; o1.material.uniforms.uDash.value = .5; o1.material.uniforms.uDashOffset.value = -s.time * .4;
      o2.material.uniforms.uOpacity.value = s.orbit * .22; o2.material.uniforms.uDash.value = .28;
      // the night's lens: bloom, fringing, vignette and a heavier grain, gone by day
      bloom.strength = s.bloom * n; finish.uniforms.uAberr.value = s.aberr * n;
      finish.uniforms.uVignette.value = .55 * n; finish.uniforms.uGrain.value = .035 * n + .012 * d;
      if (trails) trails.damp = s.trails * n;
      finish.uniforms.uTime.value = s.time;
    },
    pointer(ndcX, ndcY, strength) {
      tmp.set(ndcX, ndcY, .5).unproject(camera);
      U.uMouseO.value.copy(camera.position);
      U.uMouseD.value.copy(tmp).sub(camera.position).normalize();
      U.uMouse.value = strength;
    },
    // a point in the world to the stage, in CSS pixels; z > 1 means behind the camera
    project(p, out) {
      tmp.set(p[0], p[1], p[2]).project(camera);
      out[0] = (tmp.x * .5 + .5) * W; out[1] = (-tmp.y * .5 + .5) * H; out[2] = tmp.z;
      return out;
    },
    // whether a point on a sphere around the origin faces the camera
    facing(p) { tmp.set(p[0], p[1], p[2]); tmp2.copy(camera.position).sub(tmp); return tmp.dot(tmp2) > 0; },
    render() { composer.render(); },
    compile() { renderer.compile(scene, camera); },
    dispose() { composer.dispose(); warmTarget.dispose(); renderer.dispose(); geo.dispose(); mat.dispose(); },
  };
}
