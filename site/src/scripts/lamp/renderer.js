/* The lamplight renderer, drawn with three.js (MIT licence). Each frame draws what the film asks for
   (draw(F)): up to two rooms (the engraved worlds), each seen through its own camera, so a move from
   one room to the next is a real move of the camera in each; and the study, the drawn morning room,
   laid out in depth (its layers from study.js projected back onto their places from the eye that drew
   them), so the camera can move through it and out of its window.
   By night the rooms are light: behind them a background (the grade's gradient and a soft glow),
   after them bloom (tinted by the light) and a finish (a touch of lens fringing, a vignette, grain).
   By day the same rooms are ink on paper: their strokes alone, their light turned into navy ink
   where it stands above its surroundings (glows, shafts and dust left out), over the paper or the
   study. Night and day are mixed by a front that sweeps across the frame (dawn) or, in the study, by
   the room itself: where the study is open (its window, once its sky has gone) the night beyond shows.
   Over either, last, the page: drawn as on the design board (sheets.js), a plane in its room, seen
   through that room's camera; its ink loosens like ink in water and settles. The record's star is
   added as light. film.js and inner.js decide everything that changes; this only draws it. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { WORLDS } from './worlds/index.js';   // the engraved worlds (the stand-in, for a build without them: './worlds-stub.js')

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

const FINISH = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAberr: { value: .01 }, uVignette: { value: .5 }, uGrain: { value: .03 }, uRes: { value: new THREE.Vector2(1, 1) } },
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

// ---------- the day ----------
const FS_VS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
// a softened copy of the strokes' light, drawn at a quarter size
const BLUR_FS = /* glsl */`
uniform sampler2D tSrc;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec3 c = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) c += texture2D(tSrc, vUv + vec2(float(x), float(y)) * uTexel).rgb;
  gl_FragColor = vec4(c / 9., 1.);
}`;
// the day's picture: the paper, the study over it (drawn premultiplied, its share uStudyK), then the
// strokes' light turned to ink where it stands above its softened surroundings
const INK_FS = /* glsl */`
uniform sampler2D tInk, tBlur, tStudy;
uniform float uInk, uStudyK;
uniform vec3 uPaper, uInkCol;
varying vec2 vUv;
void main() {
  float L = dot(texture2D(tInk, vUv).rgb, vec3(.2126, .7152, .0722)), B = dot(texture2D(tBlur, vUv).rgb, vec3(.2126, .7152, .0722));
  float l = 1. - exp(-L * 1.7), b = 1. - exp(-B * 1.7);
  float ink = clamp((l - b) * 4.6 + max(0., l - .42) * .45, 0., 1.) * uInk;
  vec4 st = texture2D(tStudy, vUv) * uStudyK;
  vec3 back = uPaper * (1. - st.a) + st.rgb;
  gl_FragColor = vec4(mix(back, uInkCol, ink), 1.);
}`;
// night and day mixed: by the study (uMask: the day where the study stands, the night where it is
// open), or by a front with a slightly ragged edge sweeping across the frame along uDir, the new light
// spreading from where the front starts (at dusk the night's, at dawn the day's)
const MIX_FS = /* glsl */`
uniform sampler2D tNight, tDay, tStudy;
uniform float uDay, uAspect, uDusk, uMask, uStudyK;
uniform vec2 uDir;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
void main() {
  float k;
  if (uMask > .5) k = texture2D(tStudy, vUv).a * uStudyK;
  else {
    vec2 q = vUv * vec2(uAspect, 1.), n = normalize(uDir), p = vUv - .5; p.x *= uAspect;
    float x = dot(p, n) / (abs(n.x) * uAspect + abs(n.y)) + .5;
    x += (noise(q * 5.) - .5) * .035 + (noise(q * 19.) - .5) * .01;
    float e = .03, prog = uDusk > .5 ? 1. - uDay : uDay, f = mix(-e, 1. + e, prog), nk = 1. - smoothstep(f - e, f + e, x);
    k = uDusk > .5 ? 1. - nk : nk;
  }
  gl_FragColor = vec4(mix(texture2D(tNight, vUv).rgb, texture2D(tDay, vUv).rgb, k), 1.);
}`;
const COPY_FS = /* glsl */`uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tSrc, vUv).rgb, 1.); }`;
const SUBS_HIDDEN_BY_DAY = [.2, .5, .6];   // the worlds' glows, shafts and dust (their place in a world's draw order)

// ---------- the study in depth ----------
// each layer's drawing is laid back onto its place by projecting from the eye that drew it (uCam: F,
// eye x, y, z; uC: the drawing's centre of projection; uRect: the layer's part of the drawing, y down),
// so from that eye the room is exactly the drawing. The view out is two drawings (the morning, and the
// town alone at dusk or sunset), mixed by uMix. In the evening the room goes blue-grey and dim except
// where the lamp's light falls; uInside fades the room once the camera has gone out through its window.
// Premultiplied, so the study's picture carries how much of the frame it covers
const STUDY_VS = /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const STUDY_FS = /* glsl */`
uniform sampler2D tMap, tMap2;
uniform vec4 uRect, uCam;
uniform vec2 uC;
uniform float uMix, uDusk, uLamp, uWarm, uInside, uK, uFar;
varying vec3 vW;
void main() {
  float d = uCam.w - vW.z;
  if (d < .01) discard;
  vec2 P = vec2(uC.x + uCam.x * (vW.x - uCam.y) / d, uC.y - uCam.x * (vW.y - uCam.z) / d);
  vec2 uv = (P - uRect.xy) / uRect.zw;
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) discard;
  uv.y = 1. - uv.y;
  vec4 c = mix(texture2D(tMap, uv), texture2D(tMap2, uv), uMix);
  if (c.a < .003) discard;
  vec3 col = c.rgb * mix(vec3(1.), vec3(1., .955, .88), uWarm);
  float pool = exp(-pow((vW.x - 10.6) / 3.4, 2.) - pow((vW.z + 2.7) / 1.7, 2.)) * step(abs(vW.y), .7);
  float shade = exp(-pow((vW.x - 12.5) / .9, 2.) - pow((vW.y - 3.75) / .8, 2.));
  vec3 eve = col * vec3(.62, .62, .74) + vec3(.008, .012, .024) * c.a;
  eve = mix(eve, col * vec3(1.02, .9, .72), clamp(pool * .9 + shade * .8, 0., 1.) * uLamp);
  col = mix(col, eve, uDusk * (1. - uFar));
  float k = uK * mix(uInside, 1., uFar);
  gl_FragColor = vec4(col, c.a) * k;
}`;

// the view out of the study's window: a backdrop well behind the wall, in three drawings (the morning;
// dusk's or a sunset's sky over the town; the town alone, its sky open for the night beyond): uMix
// goes from the first to the second, uOut from the second to the third; uK fades it all (premultiplied)
const OUT_VS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const OUT_FS = /* glsl */`
uniform sampler2D tA, tB, tC;
uniform float uMix, uOut, uK;
varying vec2 vUv;
void main() {
  vec4 c = mix(mix(texture2D(tA, vUv), texture2D(tB, vUv), uMix), texture2D(tC, vUv), uOut) * uK;
  if (c.a < .003) discard;
  gl_FragColor = c;
}`;

// ---------- the page ----------
const PAGE_VS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// the page's ink in water: as uLoose rises the ink is carried along a slow curling flow and thins in
// uneven patches, the paper with it; uLoose 0 is the page as drawn. Where the study stands in front
// (uMask), the page is behind it
const PAGE_FS = /* glsl */`
uniform sampler2D tPage, tStudy;
uniform float uLoose, uTime, uSeed, uAlpha, uMask;
uniform vec2 uRes;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
vec2 curl(vec2 p) { float e = .05; return vec2(noise(p + vec2(0., e)) - noise(p - vec2(0., e)), noise(p - vec2(e, 0.)) - noise(p + vec2(e, 0.))) / (2. * e); }
void main() {
  float L = clamp(uLoose, 0., 1.);
  vec2 uv = vUv + (curl(vUv * 3.2 + uTime * .04) * .018 + curl(vUv * 9. - uTime * .03) * .006) * L * L * 5.;
  vec4 c = texture2D(tPage, uv);
  float n = noise(vUv * 6. + uSeed) * .65 + noise(vUv * 19. - uSeed) * .35;
  float keep = 1. - smoothstep(n - .12, n + .12, L * 1.24 - .12);
  float behind = uMask > .5 ? texture2D(tStudy, gl_FragCoord.xy / uRes).a : 0.;
  gl_FragColor = vec4(c.rgb, c.a * keep * uAlpha * (1. - behind));
}`;
// the star, added as light; it swells a little as it opens
const STAR_FS = /* glsl */`
uniform sampler2D tPage, tStudy;
uniform float uAlpha, uMask;
uniform vec2 uRes;
varying vec2 vUv;
void main() {
  float behind = uMask > .5 ? texture2D(tStudy, gl_FragCoord.xy / uRes).a : 0.;
  gl_FragColor = vec4(texture2D(tPage, (vUv - .5) / mix(.6, 1., uAlpha) + .5).rgb * uAlpha * (1. - behind), 1.);
}`;

export const WORLD_IDS = Object.keys(WORLDS);
const RAD = Math.PI / 180;

export function createRenderer(canvas, { dpr, bloomScale = 1, quality = 'high' }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // the rooms (one scene; one room shown at a time, each with its own camera), the background, the
  // study, the page
  const scene = new THREE.Scene(), bgScene = new THREE.Scene(), studyScene = new THREE.Scene(), pageScene = new THREE.Scene();
  const cams = [new THREE.PerspectiveCamera(40, 1, .1, 600), new THREE.PerspectiveCamera(40, 1, .1, 600)], camS = new THREE.PerspectiveCamera(40, 1, .05, 400);

  // the background: the grade's gradient and a glow behind the page
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: BG_VS, fragmentShader: BG_FS, depthTest: false, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uGlowAt: { value: new THREE.Vector2(.65, .5) }, uGlowR: { value: .5 }, uRes: { value: new THREE.Vector2(1, 1) } },
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false; bgScene.add(bg);

  // the worlds: created when asked for (the film asks for one a frame while it loads), hidden at weight 0
  const worlds = {}, weights = {};
  const addWorld = id => {
    if (worlds[id] || !WORLDS[id]) return worlds[id] || null;
    const w = WORLDS[id](THREE, { quality });
    w.group.renderOrder = 0;
    scene.add(w.group);
    w.setWeight(0); weights[id] = 0;
    worlds[id] = w;
    return w;
  };
  // one room at a time, for drawing it through its own camera; then all as their weights say
  const only = id => { for (const k in worlds) worlds[k].group.visible = k === id && weights[k] > 0; };
  const restore = () => { for (const k in worlds) worlds[k].group.visible = weights[k] > 0; };
  // the first time a world is drawn its buffers go up to the GPU, which costs a frame: warmWorld()
  // does it ahead of time, drawing once into a tiny target nobody sees
  const warmTarget = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });

  // this frame's rooms: [{ id, w }], each drawn with cams[i]
  let views = [];
  const drawRooms = r => {
    views.forEach((v, i) => { if (!(v.w > 0) || !worlds[v.id]) return; only(v.id); r.render(scene, cams[i]); });
    restore();
  };
  class RoomsPass extends Pass {
    constructor() { super(); this.needsSwap = false; }
    render(r, writeBuffer, readBuffer) {
      r.setRenderTarget(this.renderToScreen ? null : readBuffer);
      r.setClearColor(0x000000, 1); r.clear();
      const ac = r.autoClear; r.autoClear = false;
      r.render(bgScene, cams[0]);
      drawRooms(r);
      r.autoClear = ac;
    }
  }

  // after the rooms: bloom (tinted by the world's light), then colour (tone mapping, sRGB), then the finish
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.addPass(new RoomsPass());
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .6, .5, .16);
  const bloomSize = bloom.setSize.bind(bloom);
  bloom.setSize = (w, h) => bloomSize(Math.max(1, Math.round(w * bloomScale)), Math.max(1, Math.round(h * bloomScale)));
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH);
  composer.addPass(finish);

  // the day: the strokes' light, its softened copy, the study, the day's picture; and the passes
  const rtOpts = { type: THREE.HalfFloatType, depthBuffer: false };
  const inkRT = new THREE.WebGLRenderTarget(1, 1, rtOpts), blurRT = new THREE.WebGLRenderTarget(1, 1, rtOpts), dayRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const studyRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
  const blurQ = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FS_VS, fragmentShader: BLUR_FS, uniforms: { tSrc: { value: inkRT.texture }, uTexel: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false }));
  const inkU = { tInk: { value: inkRT.texture }, tBlur: { value: blurRT.texture }, tStudy: { value: studyRT.texture }, uInk: { value: 1 }, uStudyK: { value: 0 }, uPaper: { value: new THREE.Vector3(243 / 255, 238 / 255, 227 / 255) }, uInkCol: { value: new THREE.Vector3(19 / 255, 36 / 255, 79 / 255) } };
  const inkQ = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FS_VS, fragmentShader: INK_FS, uniforms: inkU, depthTest: false, depthWrite: false }));
  const mixU = { tNight: { value: null }, tDay: { value: dayRT.texture }, tStudy: { value: studyRT.texture }, uDay: { value: 0 }, uAspect: { value: 1 }, uDusk: { value: 0 }, uMask: { value: 0 }, uStudyK: { value: 0 }, uDir: { value: new THREE.Vector2(.3, 1) } };
  const mixQ = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FS_VS, fragmentShader: MIX_FS, uniforms: mixU, depthTest: false, depthWrite: false }));
  const copyQ = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FS_VS, fragmentShader: COPY_FS, uniforms: { tSrc: { value: dayRT.texture } }, depthTest: false, depthWrite: false }));
  const black = new THREE.Color(0, 0, 0), keepClear = new THREE.Color();
  // the world's glows, shafts and dust step out of the day's strokes (and back in after)
  const hiddenByDay = [];
  const hideSubs = id => worlds[id].group.traverse(o => {
    if (o === worlds[id].group || !o.visible) return;
    const sub = Math.round((((o.renderOrder + 9.5) % 1.8) + 1.8) % 1.8 * 10) / 10;
    if (SUBS_HIDDEN_BY_DAY.includes(sub)) { o.visible = false; hiddenByDay.push(o); }
  });
  let studyK = 0;
  function drawDay() {
    renderer.getClearColor(keepClear); const alpha = renderer.getClearAlpha(), ac = renderer.autoClear;
    renderer.setClearColor(black, 1);
    renderer.setRenderTarget(inkRT); renderer.clear();
    renderer.autoClear = false;
    views.forEach((v, i) => {
      if (!(v.w > 0) || !worlds[v.id] || v.ink === false) return;   // (a room seen only as night, through the study, is not inked)
      only(v.id); hiddenByDay.length = 0; hideSubs(v.id);
      renderer.render(scene, cams[i]);
      hiddenByDay.forEach(o => { o.visible = true; });
    });
    restore();
    renderer.autoClear = ac;
    renderer.setRenderTarget(blurRT); blurQ.render(renderer);
    drawStudy();
    renderer.setRenderTarget(dayRT); inkQ.render(renderer);
    renderer.setClearColor(keepClear, alpha);
    renderer.setRenderTarget(null);
  }
  function drawStudy() {
    renderer.setRenderTarget(studyRT); renderer.setClearColor(black, 0); renderer.clear();
    if (studyK > 0 && studyMeshes.length) renderer.render(studyScene, camS);
  }

  // ---------- the study in depth: a plane for each layer (study.js), set up once its drawings exist ----------
  const studyU = { uCam: { value: new THREE.Vector4() }, uC: { value: new THREE.Vector2() }, uDusk: { value: 0 }, uLamp: { value: 1 }, uWarm: { value: 0 }, uInside: { value: 1 }, uK: { value: 1 } };
  const studyMeshes = [], outsides = {};
  let outsideMat = null;
  const studyTex = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.premultiplyAlpha = true; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t; };
  const PREMUL = { transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
  // setStudy({ eye: { F, ex, ey, ez, cx, cy }, layers: [{ name, z | desk, rect, canvas }], desk: { x0, x1, z0, z1, front },
  // outside: { plane: { z, x0, x1, y0, y1 }, day, dusk, duskTown, sunset, sunsetTown: canvases } })
  function setStudy({ eye, layers, desk, outside }) {
    studyMeshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); studyScene.remove(m); }); studyMeshes.length = 0;
    studyU.uCam.value.set(eye.F, eye.ex, eye.ey, eye.ez); studyU.uC.value.set(eye.cx, eye.cy);
    const unproject = (u, v, z) => { const d = eye.ez - z; return [eye.ex + (u - eye.cx) * d / eye.F, eye.ey - (v - eye.cy) * d / eye.F, z]; };
    const quad = pts => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    for (const k in outsides) outsides[k].dispose();
    // the view out, first (furthest)
    if (outside) {
      for (const k in outside) if (k !== 'plane') outsides[k] = studyTex(outside[k]);
      const O = outside.plane, g = new THREE.PlaneGeometry(O.x1 - O.x0, O.y1 - O.y0);
      g.translate((O.x0 + O.x1) / 2, (O.y0 + O.y1) / 2, O.z);
      outsideMat = new THREE.ShaderMaterial({ vertexShader: OUT_VS, fragmentShader: OUT_FS, side: THREE.DoubleSide, depthTest: true, depthWrite: true, ...PREMUL,
        uniforms: { tA: { value: outsides.day }, tB: { value: outsides.dusk }, tC: { value: outsides.duskTown }, uMix: { value: 0 }, uOut: { value: 0 }, uK: { value: 1 } } });
      const m = new THREE.Mesh(g, outsideMat); m.renderOrder = -1; m.frustumCulled = false; studyScene.add(m); studyMeshes.push(m);
    }
    layers.forEach((L, i) => {
      const [x, y, w, h] = L.rect, tex = studyTex(L.canvas);
      const mat = new THREE.ShaderMaterial({
        vertexShader: STUDY_VS, fragmentShader: STUDY_FS, side: THREE.DoubleSide, depthTest: true, depthWrite: true, ...PREMUL,
        uniforms: { ...studyU, tMap: { value: tex }, tMap2: { value: tex }, uRect: { value: new THREE.Vector4(x, y, w, h) }, uMix: { value: 0 }, uFar: { value: 0 } },
      });
      const add = g => { const m = new THREE.Mesh(g, mat); m.renderOrder = i; m.frustumCulled = false; studyScene.add(m); studyMeshes.push(m); };
      if (L.desk) {
        add(quad([[desk.x0, 0, desk.z0], [desk.x1, 0, desk.z0], [desk.x1, 0, desk.z1], [desk.x0, 0, desk.z1]]));
        add(quad([[desk.x0, desk.front, desk.z0], [desk.x1, desk.front, desk.z0], [desk.x1, 0, desk.z0], [desk.x0, 0, desk.z0]]));
      } else add(quad([unproject(x, y + h, L.z), unproject(x + w, y + h, L.z), unproject(x + w, y, L.z), unproject(x, y, L.z)]));
    });
  }

  // ---------- the page: two planes (the form leaving, the form arriving) and the star ----------
  const plane = new THREE.PlaneGeometry(1, 1), forms = {};
  const maskU = { tStudy: { value: studyRT.texture }, uMask: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } };
  const pageMat = seed => new THREE.ShaderMaterial({ vertexShader: PAGE_VS, fragmentShader: PAGE_FS, uniforms: { ...maskU, tPage: { value: null }, uLoose: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed }, uAlpha: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false });
  const pageMeshes = [new THREE.Mesh(plane, pageMat(3.1)), new THREE.Mesh(plane, pageMat(7.7))];
  const star = new THREE.Mesh(plane, new THREE.ShaderMaterial({ vertexShader: PAGE_VS, fragmentShader: STAR_FS, uniforms: { ...maskU, tPage: { value: null }, uAlpha: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  [...pageMeshes, star].forEach((m, i) => { m.matrixAutoUpdate = false; m.frustumCulled = false; m.renderOrder = i; m.visible = false; pageScene.add(m); });
  const mS = new THREE.Matrix4(), tmpM = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sv = new THREE.Vector3();
  // a form of the page as a texture, with its plane's size and where the page's centre sits on it
  function addForm(kind, drawn) {
    if (forms[kind]) forms[kind].tex.dispose();
    const tex = new THREE.CanvasTexture(drawn.canvas);
    tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
    forms[kind] = { tex, size: drawn.size, offset: drawn.offset || [0, 0], page: drawn.page || drawn.size };
  }
  // the pages of this frame: [{ kind, m, loose, alpha, view }], and the star { k, at, view }
  let pages = [], starOf = null;
  function drawPages() {
    const ac = renderer.autoClear; renderer.autoClear = false;
    pages.forEach((p, i) => {
      const mesh = pageMeshes[i], f = p && forms[p.kind];
      if (!f || !p.m || !(p.alpha > .002) || p.loose >= .999) return;
      const u = mesh.material.uniforms;
      u.tPage.value = f.tex; u.uLoose.value = p.loose || 0; u.uAlpha.value = p.alpha ?? 1; u.uTime.value = time;
      mesh.matrix.fromArray(p.m).multiply(tmpM.makeTranslation(-f.offset[0], -f.offset[1], 0)).multiply(mS.makeScale(f.size[0], f.size[1], 1));
      mesh.matrixWorldNeedsUpdate = true;
      pageMeshes.forEach(m => { m.visible = m === mesh; }); star.visible = false;
      renderer.render(pageScene, cams[p.view || 0]);
    });
    if (starOf && starOf.k > .002 && forms.star && starOf.at) {
      const cam = cams[starOf.view || 0];
      cam.getWorldQuaternion(q);   // the star faces the eye
      star.material.uniforms.tPage.value = forms.star.tex; star.material.uniforms.uAlpha.value = starOf.k;
      star.matrix.compose(v3.set(starOf.at[0], starOf.at[1], starOf.at[2]), q, sv.set(forms.star.size[0], forms.star.size[1], 1));
      star.matrixWorldNeedsUpdate = true;
      pageMeshes.forEach(m => { m.visible = false; }); star.visible = true;
      renderer.render(pageScene, cam);
    }
    pageMeshes.forEach(m => { m.visible = false; }); star.visible = false;
    renderer.autoClear = ac;
  }

  // ---------- the cameras ----------
  let W = 1, H = 1, px = dpr, time = 0;
  const look = new THREE.Vector3(), tmp = new THREE.Vector3();
  // a pose: the eye p, where it faces (yaw from -z toward +x, pitch up, degrees), the field of view, and
  // the picture's shift (sx right, sy up, as fractions of a frame fh tall at the top of the canvas)
  function aim(cam, pose, fh) {
    const y = (pose.yaw || 0) * RAD, pt = (pose.pitch || 0) * RAD, cp = Math.cos(pt);
    cam.position.set(pose.p[0], pose.p[1], pose.p[2]);
    cam.up.set(0, 1, 0);
    look.set(pose.p[0] + Math.sin(y) * cp, pose.p[1] + Math.sin(pt), pose.p[2] - Math.cos(y) * cp);
    cam.lookAt(look);
    cam.fov = pose.fov; cam.aspect = W / fh;
    cam.setViewOffset(W, fh, -(pose.sx || 0) * W, (pose.sy || 0) * fh, W, H);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }

  // colours parsed once and kept (the grade blends them every frame)
  const parsed = new Map(), colour = h => parsed.get(h) || (parsed.set(h, new THREE.Color(h)), parsed.get(h));
  const mixC = (out, a, b, k) => out.copy(colour(a)).lerp(colour(b), k);
  const white = new THREE.Color(1, 1, 1), tint = new THREE.Color();

  return {
    renderer, worlds, weights, ids: WORLD_IDS,
    addWorld,
    // a world's programs and buffers, ready before it is first seen
    warmWorld(id) {
      const w = worlds[id]; if (!w) return;
      const st = w.stage, d = st.dir, l = Math.hypot(d[0], d[1], d[2]) || 1;
      aim(cams[0], { p: [st.anchor[0] + d[0] / l * 30, st.anchor[1] + d[1] / l * 30, st.anchor[2] + d[2] / l * 30], yaw: Math.atan2(-d[0], d[2]) / RAD, pitch: -Math.asin(d[1] / l) / RAD, fov: st.fov }, H);
      w.setWeight(1); weights[id] = 1; only(id);
      renderer.compile(scene, cams[0]); renderer.setRenderTarget(warmTarget); renderer.render(scene, cams[0]); renderer.setRenderTarget(null);
      w.setWeight(0); weights[id] = 0; restore();
    },
    // the stand-in worlds are empty groups: say so, so the review can tell
    get stub() { const ws = Object.values(worlds); return !ws.length || ws.every(w => !w.group.children.length); },
    // the page's forms (sheets.js), each drawn once: addForm(kind, { canvas, size, offset, page })
    addForm, hasForm: kind => !!forms[kind], formOf: kind => forms[kind] || null,
    setStudy,
    resize(w, h, ratio = px) {
      W = Math.max(1, w); H = Math.max(1, h); px = ratio;
      renderer.setPixelRatio(px); composer.setPixelRatio(px);
      renderer.setSize(W, H, false); composer.setSize(W, H);
      bgMat.uniforms.uRes.value.set(W, H);
      finish.uniforms.uRes.value.set(W * px, H * px);
      const dw = Math.round(W * px), dh = Math.round(H * px);
      inkRT.setSize(dw, dh); dayRT.setSize(dw, dh); studyRT.setSize(dw, dh); blurRT.setSize(Math.max(1, dw >> 2), Math.max(1, dh >> 2));
      blurQ.material.uniforms.uTexel.value.set(1 / Math.max(1, dw >> 2), 1 / Math.max(1, dh >> 2));
      maskU.uRes.value.set(dw, dh);
      mixU.uAspect.value = W / H;
    },
    // a point to the stage, in CSS pixels, through a room's camera (0, 1) or the study's ('s'); z > 1
    // means behind the camera
    project(p, out, view = 0) {
      tmp.set(p[0], p[1], p[2]).project(view === 's' ? camS : cams[view]);
      out[0] = (tmp.x * .5 + .5) * W; out[1] = (-tmp.y * .5 + .5) * H; out[2] = tmp.z;
      return out;
    },
    /* One frame. F = {
         time, dt, fh: the frame height the shifts are given in,
         views: [{ id, w, cam: pose }] (up to two rooms, each through its own camera),
         study: null or { k, cam: pose, dusk, lamp, warm, inside, out: 0 (the morning) to 1 (the town at
           dusk or sunset), sky: 'dusk' | 'sunset' },
         mask: the night shows where the study is open; else day (0 night, 1 day), dusk (the night is the
           new light), dayDir (the way the front sweeps),
         pages: [{ kind, m (by columns), loose, alpha, view }], star: null or { k, at, view },
         gA, gB, k (the grades and their blend), glow, glowAt, bloom, aberr } */
    draw(F) {
      time = F.time;
      views = F.views || [];
      // the rooms: how present, each through its camera (its fog starts at the page's distance from it)
      const W8 = {};
      views.forEach(v => { if (worlds[v.id]) W8[v.id] = (W8[v.id] || 0) + v.w; });
      for (const id in worlds) { const w2 = Math.min(1, W8[id] || 0); if (Math.abs(w2 - weights[id]) > 1e-4 || (w2 === 0) !== (weights[id] === 0)) { worlds[id].setWeight(w2); weights[id] = w2; } }
      views.forEach((v, i) => { aim(cams[i], v.cam, F.fh); if (worlds[v.id] && v.w > 0) worlds[v.id].update(F.time, F.dt, cams[i]); });
      if (!views.length) aim(cams[0], F.study ? F.study.cam : { p: [0, 0, 30], fov: 40 }, F.fh);
      // the study
      const S = F.study;
      studyK = S ? S.k : 0;
      if (S) {
        aim(camS, S.cam, F.fh);
        studyU.uDusk.value = S.dusk || 0; studyU.uLamp.value = S.lamp ?? 1; studyU.uWarm.value = S.warm || 0; studyU.uInside.value = S.inside ?? 1; studyU.uK.value = 1;
        if (outsideMat) {
          const u = outsideMat.uniforms, sky = S.sky || 'dusk';
          u.uMix.value = S.evening || 0; u.uOut.value = S.open || 0; u.uK.value = S.outK ?? 1;
          if (outsides[sky]) u.tB.value = outsides[sky];
          if (outsides[sky + 'Town']) u.tC.value = outsides[sky + 'Town'];
        }
      }
      inkU.uStudyK.value = studyK; mixU.uStudyK.value = studyK;
      // the grade
      const { gA, gB, k } = F;
      mixC(bgMat.uniforms.uTop.value, gA.top, gB.top, k);
      mixC(bgMat.uniforms.uBottom.value, gA.bottom, gB.bottom, k);
      mixC(bgMat.uniforms.uGlow.value, gA.glow[0], gB.glow[0], k).multiplyScalar((gA.glow[1] + (gB.glow[1] - gA.glow[1]) * k) * F.glow);
      bgMat.uniforms.uGlowAt.value.set(F.glowAt[0], F.glowAt[1]);
      bloom.strength = F.bloom;
      mixC(tint, gA.light, gB.light, k);
      bloom.bloomTintColors.forEach((c, j) => { const f = .12 + .1 * j; c.set(white.r + (tint.r - white.r) * f, white.g + (tint.g - white.g) * f, white.b + (tint.b - white.b) * f); });
      finish.uniforms.uAberr.value = F.aberr; finish.uniforms.uTime.value = F.time;
      // the light: the study's mask, or the front
      const mask = !!F.mask, day = mask ? 1 : (F.day || 0);
      mixU.uMask.value = mask ? 1 : 0; maskU.uMask.value = mask ? 1 : 0;
      mixU.uDay.value = day; mixU.uDusk.value = F.dusk ? 1 : 0;
      if (F.dayDir) mixU.uDir.value.set(F.dayDir[0], F.dayDir[1]);
      pages = F.pages || []; starOf = F.star || null;
      // the pictures: the night's, the day's, or both mixed
      const needDay = mask || day > .001, needNight = mask || day < .999;
      if (!needDay) { composer.renderToScreen = true; composer.render(); }
      else {
        drawDay();
        if (!needNight) { renderer.setRenderTarget(null); copyQ.render(renderer); }
        else {
          composer.renderToScreen = false; composer.render();
          mixU.tNight.value = composer.readBuffer.texture;
          renderer.setRenderTarget(null); mixQ.render(renderer);
        }
      }
      if (!needDay) { renderer.setRenderTarget(studyRT); renderer.setClearColor(black, 0); renderer.clear(); renderer.setRenderTarget(null); }
      // the page, last, over whichever picture
      drawPages();
    },
    compile() { renderer.compile(scene, cams[0]); renderer.compile(pageScene, cams[0]); if (studyMeshes.length) renderer.compile(studyScene, camS); },
    dispose() {
      Object.values(worlds).forEach(w => w.dispose()); composer.dispose(); warmTarget.dispose();
      [inkRT, blurRT, dayRT, studyRT].forEach(t => t.dispose()); [blurQ, inkQ, mixQ, copyQ].forEach(qd => { qd.material.dispose(); qd.dispose(); });
      Object.values(forms).forEach(f => f.tex.dispose()); [...pageMeshes, star].forEach(m => m.material.dispose()); plane.dispose();
      studyMeshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); for (const k in outsides) outsides[k].dispose();
      renderer.dispose();
    },
  };
}
