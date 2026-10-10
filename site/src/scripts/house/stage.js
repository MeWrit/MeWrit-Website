/* The house's renderer, drawn with three.js (MIT licence): the film's illustrated 3D look
   (site/docs/redesign-plan.md, section 11). Solid objects lit by the sun through the windows and by
   the lamps, with soft shadows; ambient occlusion where things meet, so everything stands on its
   surface; a fine navy ink line drawn on silhouettes and creases, so the house stays drawn; then a
   paper grade: warm highlights, a faint grain, a soft vignette. The hour of the day is a set of lights
   and a sky (setHour): the film blends between them. The camera is a pose: an eye, where it faces
   (yaw, pitch), a lens (fov) and a lens shift (sx, sy), so a room's verticals stay upright.

   Built to run on ordinary machines (the user's request, 10 October 2026), with savings the eye
   cannot see:
   - a frame is drawn only when something changed (draw); at rest the finished frame is kept and
     shown again with only the small living things drawn over it (present), so a still page costs
     almost nothing;
   - the shadows are drawn once, and again only when the light changes;
   - the occlusion is worked out at half the resolution (it is soft by nature); the ink keeps the full
     resolution;
   - one geometry pass for the normals and depth (shared by the occlusion and the ink), one for the
     colour, then a single pass for occlusion, tone, ink and paper, and SMAA;
   - the number of pixels drawn is capped by a tier (high, mid, low), measured on the machine while the
     loader shows (bench) and lowered if moving frames come too slowly.
   film.js decides everything that changes; this only draws it. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const RAD = Math.PI / 180;

// the tiers: how many pixels a frame may hold, the occlusion's share of the resolution (0: none) and
// its samples, the anti-aliasing, the shadow maps' sizes (0: the lamp casts none)
export const TIERS = {
  high: { budget: 4.2e6, maxRatio: 2, ao: .5, aoSamples: 16, pdSamples: 12, smaa: true, shadow: 2048, lampShadow: 1024 },
  mid: { budget: 2.4e6, maxRatio: 1.5, ao: .5, aoSamples: 10, pdSamples: 8, smaa: true, shadow: 2048, lampShadow: 1024 },
  low: { budget: 1.3e6, maxRatio: 1, ao: 0, aoSamples: 8, pdSamples: 8, smaa: true, shadow: 1024, lampShadow: 0 },
};
export const TIER_ORDER = ['high', 'mid', 'low'];

// the normals and the depth, drawn once a frame for both the occlusion and the ink; what has no
// surface of its own (points, lines, sprites, glass: userData.noG) is left out
class GBufferPass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene; this.camera = camera; this.needsSwap = false;
    this.target = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.UnsignedByteType, depthTexture: new THREE.DepthTexture(4, 4) });
    this.material = new THREE.MeshNormalMaterial();
    this.material.blending = THREE.NoBlending;
    this.clear = new THREE.Color(0x7777ff);
    this.hidden = [];
    this.keep = new THREE.Color();
  }
  setSize(w, h) { this.target.setSize(w, h); }
  render(renderer) {
    const hid = this.hidden;
    this.scene.traverseVisible(o => { if (o.isPoints || o.isLine || o.isSprite || o.userData.noG) hid.push(o); });
    for (const o of hid) o.visible = false;
    renderer.getClearColor(this.keep); const a = renderer.getClearAlpha();
    renderer.setRenderTarget(this.target);
    renderer.setClearColor(this.clear, 1); renderer.clear();
    this.scene.overrideMaterial = this.material;
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;
    renderer.setClearColor(this.keep, a);
    for (const o of hid) o.visible = true;
    hid.length = 0;
  }
  dispose() { this.target.dispose(); this.material.dispose(); }
}

// the occlusion, at a share of the resolution, from the normals and depth above; it draws nothing on
// the picture itself (the final pass applies it)
class SoftAO extends GTAOPass {
  constructor(scene, camera, gbuf) {
    super(scene, camera, 4, 4);
    this.normalRenderTarget.dispose(); this.depthTexture.dispose();
    this.normalRenderTarget = gbuf;
    this.setGBuffer(gbuf.depthTexture, gbuf.texture);
    this.output = GTAOPass.OUTPUT.Off; this.needsSwap = false; this.share = .5;
  }
  setSize(w, h) {
    const sw = Math.max(1, Math.round(w * this.share)), sh = Math.max(1, Math.round(h * this.share));
    this.width = sw; this.height = sh;
    this.gtaoRenderTarget.setSize(sw, sh); this.pdRenderTarget.setSize(sw, sh);
    this.gtaoMaterial.uniforms.resolution.value.set(sw, sh);
    this.pdMaterial.uniforms.resolution.value.set(sw, sh);
  }
}

// the one finishing pass: the occlusion, the tone (three.js's neutral curve and the sRGB transfer,
// as its output pass does), the ink (an edge where the depth breaks, a silhouette, or where the
// surface turns, a crease; in navy, on display values), and the paper (warm highlights, a hint of navy
// in the deepest shade, a soft vignette, a faint fixed grain)
const FINAL = {
  uniforms: {
    tDiffuse: { value: null }, tAO: { value: null }, tNormal: { value: null }, tDepth: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) }, uAOK: { value: .92 }, uExposure: { value: 1 },
    uNear: { value: .05 }, uFar: { value: 400 }, uThick: { value: 1 }, uInkK: { value: .62 }, uInk: { value: new THREE.Vector3(19 / 255, 36 / 255, 79 / 255) },
    uGrain: { value: .026 }, uVignette: { value: .2 },
    uSpot: { value: new THREE.Vector3(.5, .5, .3) }, uSpotK: { value: 0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: /* glsl */`
uniform sampler2D tDiffuse, tAO, tNormal, tDepth;
uniform vec2 uRes;
uniform float uAOK, uExposure, uNear, uFar, uThick, uInkK, uGrain, uVignette, uSpotK;
uniform vec3 uInk, uSpot;
varying vec2 vUv;
vec3 neutral(vec3 color) {
  const float S = .8 - .04, D = .15;
  float x = min(color.r, min(color.g, color.b));
  color -= x < .08 ? x - 6.25 * x * x : .04;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < S) return color;
  float d = 1. - S, np = 1. - d * d / (peak + d - S);
  color *= np / peak;
  return mix(color, vec3(np), 1. - 1. / (D * (peak - np) + 1.));
}
vec3 srgb(vec3 c) { return mix(pow(c, vec3(.41666)) * 1.055 - .055, c * 12.92, vec3(lessThanEqual(c, vec3(.0031308)))); }
float lin(vec2 uv) { float z = texture2D(tDepth, uv).x * 2. - 1.; return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
vec3 nrm(vec2 uv) { return texture2D(tNormal, uv).xyz * 2. - 1.; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb * mix(1., texture2D(tAO, vUv).r, uAOK);
  c = srgb(clamp(neutral(c * uExposure), 0., 1.));
  vec2 px = uThick / uRes;
  float d = lin(vUv), l = lin(vUv - vec2(px.x, 0.)), r = lin(vUv + vec2(px.x, 0.)), u = lin(vUv + vec2(0., px.y)), b = lin(vUv - vec2(0., px.y));
  float lap = (abs(l + r - 2. * d) + abs(u + b - 2. * d)) / max(d, .001);
  vec3 n = nrm(vUv);
  float crease = max(max(1. - dot(n, nrm(vUv - vec2(px.x, 0.))), 1. - dot(n, nrm(vUv + vec2(px.x, 0.)))), max(1. - dot(n, nrm(vUv + vec2(0., px.y))), 1. - dot(n, nrm(vUv - vec2(0., px.y)))));
  float far = smoothstep(60., 140., d);
  float edge = max(smoothstep(.012, .045, lap), smoothstep(.16, .42, crease) * (1. - far)) * (1. - far * .6);
  c = mix(c, uInk, edge * uInkK);
  float L = dot(c, vec3(.2126, .7152, .0722));
  c = mix(c, c * vec3(1.015, 1., .965), smoothstep(.55, 1., L));
  c = mix(vec3(.075, .1, .2), c, .97 + .03 * smoothstep(0., .25, L));
  vec2 q = vUv - .5;
  c *= 1. - uVignette * smoothstep(.2, .85, dot(q, q) * 2.2);
  // the lamp's pool (uSpot: its centre on the screen and its reach, as shares of the height): round it
  // the room falls into shade and the pool itself warms a little; uSpotK how much of it there is
  if (uSpotK > 0.) {
    float r = length((vUv - uSpot.xy) * vec2(uRes.x / uRes.y, 1.)) / uSpot.z, lit = 1. - smoothstep(.55, 1.8, r);
    c *= mix(1., mix(.5, 1.04, lit), uSpotK);
    c = mix(c, c * vec3(1.03, 1., .95), uSpotK * lit * .5);
  }
  c += (hash(floor(vUv * uRes)) - .5) * uGrain;
  gl_FragColor = vec4(c, 1.);
}`,
};

// the hours: the sun (its colour, strength, the way it comes in), the sky's fill, the sky itself
// (zenith, horizon, ground), the lamps, the exposure. Blended by setHour(a, b, k)
export const HOURS = {
  // first light: the room still in shade, the lamp lit (the title page); the sun comes the same way as
  // the morning's, so the shadows need no redrawing as one becomes the other
  early: { sun: '#FFD9B8', sunK: .85, sunDir: [-.55, -.42, .72], fillSky: '#C3CADB', fillGround: '#8A7B6C', fillK: .45, zenith: '#7A8BB2', horizon: '#E8D6C6', ground: '#8C857B', lamp: 1.7, exposure: .97 },
  morning: { sun: '#FFE7C7', sunK: 3.1, sunDir: [-.55, -.42, .72], fillSky: '#EAF0F8', fillGround: '#B8A388', fillK: 1.05, zenith: '#9FB8DA', horizon: '#EEF1F2', ground: '#C9C2B4', lamp: .55, exposure: 1 },
  day: { sun: '#FFF4E2', sunK: 3.4, sunDir: [-.4, -.62, .68], fillSky: '#EEF3F9', fillGround: '#BCA98F', fillK: 1.1, zenith: '#8DAAD6', horizon: '#EDF1F4', ground: '#CBC4B6', lamp: .2, exposure: 1 },
  evening: { sun: '#FFB980', sunK: 2.1, sunDir: [-.75, -.22, .62], fillSky: '#B9B4CF', fillGround: '#8E7766', fillK: .62, zenith: '#3B4A7A', horizon: '#E7A983', ground: '#5E5560', lamp: 1.4, exposure: .96 },
  night: { sun: '#9DB2E6', sunK: .45, sunDir: [-.3, -.75, .6], fillSky: '#40507F', fillGround: '#2A2630', fillK: .3, zenith: '#0A1638', horizon: '#1D2B55', ground: '#0B0F1E', lamp: 2.4, exposure: .92 },
  dawn: { sun: '#FFD3A8', sunK: 1.6, sunDir: [.7, -.18, .68], fillSky: '#C9C8DF', fillGround: '#8E8090', fillK: .7, zenith: '#5D6FA6', horizon: '#F2C4A5', ground: '#6C6470', lamp: .9, exposure: .97 },
  sunset: { sun: '#FF9D66', sunK: 2.4, sunDir: [-.85, -.14, .5], fillSky: '#B79FB8', fillGround: '#7E6158', fillK: .58, zenith: '#2C3768', horizon: '#F0A36F', ground: '#4E4352', lamp: 1.6, exposure: .95 },
};

// a soft round glow (for lamps' bulbs and shades): drawn with the colour, left out of the normals
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.45)'); g.addColorStop(.6, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

export function createStage(canvas, { tier = 'high' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;   // (the final pass tones the picture)
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;   // drawn when the light changes (shadowsDirty)
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#EEF1F2', 110, 430);   // the haze of distance, outside only (the hour sets its colour)
  const fx = new THREE.Scene();   // the small living things, drawn over the finished frame
  const camera = new THREE.PerspectiveCamera(40, 1, .05, 400);
  // (no environment map: its reflections on the few glossy things were barely seen, and making it cost
  // the first visit most of a second and every pixel a little)

  // ---------- the lights ----------
  const sun = new THREE.DirectionalLight('#ffffff', 3);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 24, bottom: -18, near: 1, far: 120 });
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.HemisphereLight('#ffffff', '#888888', 1);
  scene.add(fill);
  // the lamps (the study's desk lamp, and any the house adds): each a spot with a warm glow
  const lamps = [];
  function addLamp({ at, aim, color = '#FFD9A0', power = 40, angle = .62, penumbra = .85, shadow = true, distance = 0 }) {
    const L = new THREE.SpotLight(color, power, distance, angle, penumbra, 1.6);
    L.position.set(...at); L.target.position.set(...aim);
    L.shadow.bias = -.0006; L.shadow.normalBias = .03; L.shadow.radius = 4; L.shadow.camera.near = .2; L.shadow.camera.far = 40;
    scene.add(L, L.target);
    const lamp = { light: L, power, shadow };
    lamps.push(lamp);
    shadowSizes();
    return L;
  }
  function addGlow(at, { color = '#FFE2B0', size = 1.6, k = 1 } = {}) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: k }));
    s.position.set(...at); s.scale.set(size, size, 1);
    scene.add(s);
    return s;
  }

  // ---------- the sky: one dome for the whole house, coloured by the hour ----------
  const skyU = { uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
uniform vec3 uZenith, uHorizon, uGround, uSun, uSunCol;
varying vec3 vDir;
void main() {
  float e = vDir.y;
  vec3 c = e > 0. ? mix(uHorizon, uZenith, pow(smoothstep(0., .62, e), .8)) : mix(uHorizon, uGround, smoothstep(0., .08, -e));
  float s = max(0., dot(normalize(vDir), normalize(-uSun)));
  c += uSunCol * (pow(s, 24.) * .25 + pow(s, 4.) * .06) * step(0., e + .02);
  gl_FragColor = vec4(c, 1.);
}`,
  }));
  sky.frustumCulled = false; sky.renderOrder = -1; sky.userData.noG = true;
  scene.add(sky);

  // ---------- the passes ----------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }));
  composer.renderToScreen = false;   // the finished frame is kept (present shows it)
  const gbuf = new GBufferPass(scene, camera);
  composer.addPass(gbuf);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new SoftAO(scene, camera, gbuf.target);
  gtao.updateGtaoMaterial({ radius: .55, distanceExponent: 1.6, thickness: 1, scale: 1.1, distanceFallOff: 1 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2 });
  composer.addPass(gtao);
  const final = new ShaderPass(FINAL);
  final.uniforms.tNormal.value = gbuf.target.texture;
  final.uniforms.tDepth.value = gbuf.target.depthTexture;
  composer.addPass(final);
  const smaa = new SMAAPass();
  composer.addPass(smaa);
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
  // showing the kept frame, then the living things over it (they test the kept depth themselves)
  const show = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { t: { value: null } }, depthTest: false, depthWrite: false,
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`uniform sampler2D t; varying vec2 vUv; void main() { gl_FragColor = texture2D(t, vUv); }`,
  }));
  const fxU = { tSceneDepth: { value: gbuf.target.depthTexture }, uScreen: { value: new THREE.Vector2(1, 1) } };

  // ---------- the camera ----------
  let W = 1, H = 1, px = 1, tierName = tier;
  const look = new THREE.Vector3(), v3 = new THREE.Vector3();
  // a pose: the eye p, where it faces (yaw from -z toward +x, pitch up, degrees), the field of view,
  // the lens shift (sx right, sy up, as fractions of the frame)
  let lastPose = null;
  function aim(pose) {
    lastPose = pose;
    const y = (pose.yaw || 0) * RAD, pt = (pose.pitch || 0) * RAD, cp = Math.cos(pt);
    camera.position.set(pose.p[0], pose.p[1], pose.p[2]);
    look.set(pose.p[0] + Math.sin(y) * cp, pose.p[1] + Math.sin(pt), pose.p[2] - Math.cos(y) * cp);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.fov = pose.fov; camera.aspect = W / H;
    camera.setViewOffset(W, H, -(pose.sx || 0) * W, (pose.sy || 0) * H, W, H);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  }

  // ---------- the hour ----------
  const ca = new THREE.Color(), cb = new THREE.Color(), va = new THREE.Vector3();
  const blendC = (out, a, b, k) => out.copy(ca.set(a)).lerp(cb.set(b), k);
  const centre = new THREE.Vector3(8, 0, -3);   // where the sun's shadows are drawn about (the film moves it)
  let hourKey = '';
  function setHour(a, b = a, k = 0) {
    const key = `${a}|${b}|${k.toFixed(4)}`;
    if (key === hourKey) return;
    hourKey = key;
    const A = HOURS[a], B = HOURS[b], mix = (x, y) => x + (y - x) * k;
    blendC(sun.color, A.sun, B.sun, k); sun.intensity = mix(A.sunK, B.sunK);
    va.set(mix(A.sunDir[0], B.sunDir[0]), mix(A.sunDir[1], B.sunDir[1]), mix(A.sunDir[2], B.sunDir[2])).normalize();
    sun.position.copy(centre).addScaledVector(va, -60); sun.target.position.copy(centre); sun.target.updateMatrixWorld();
    blendC(fill.color, A.fillSky, B.fillSky, k); blendC(fill.groundColor, A.fillGround, B.fillGround, k); fill.intensity = mix(A.fillK, B.fillK);
    blendC(skyU.uZenith.value, A.zenith, B.zenith, k); blendC(skyU.uHorizon.value, A.horizon, B.horizon, k); blendC(skyU.uGround.value, A.ground, B.ground, k);
    scene.fog.color.copy(skyU.uHorizon.value);
    skyU.uSun.value.copy(va); skyU.uSunCol.value.copy(sun.color);
    const lampK = mix(A.lamp, B.lamp);
    lamps.forEach(l => { l.light.intensity = l.power * lampK; });
    final.uniforms.uExposure.value = mix(A.exposure, B.exposure);
    // (the shadows are drawn again only if the sun has moved; its strength and colour need none)
    if (lastDir.distanceToSquared(va) > 1e-8) { lastDir.copy(va); renderer.shadowMap.needsUpdate = true; }
    stage.dirty = true;
  }
  const lastDir = new THREE.Vector3(9, 9, 9);

  // ---------- the tier ----------
  function shadowSizes() {
    const t = TIERS[tierName];
    const size = (light, s) => { if (light.shadow.mapSize.x !== s) { light.shadow.mapSize.set(s, s); if (light.shadow.map) { light.shadow.map.dispose(); light.shadow.map = null; } } };
    size(sun, t.shadow);
    lamps.forEach(l => { l.light.castShadow = l.shadow && t.lampShadow > 0; if (l.light.castShadow) size(l.light, t.lampShadow); });
    renderer.shadowMap.needsUpdate = true;
  }
  function setTier(name) {
    tierName = name;
    const t = TIERS[name];
    gtao.enabled = t.ao > 0;
    if (t.ao > 0) { gtao.share = t.ao; gtao.updateGtaoMaterial({ samples: t.aoSamples }); gtao.updatePdMaterial({ samples: t.pdSamples }); }
    final.uniforms.tAO.value = t.ao > 0 ? gtao.pdRenderTarget.texture : white;
    smaa.enabled = t.smaa;
    shadowSizes();
    if (W > 1) resize(W, H);
    stage.dirty = true;
  }
  function resize(w, h) {
    W = Math.max(1, w); H = Math.max(1, h);
    const t = TIERS[tierName];
    px = Math.max(.5, Math.min(window.devicePixelRatio || 1, t.maxRatio, Math.sqrt(t.budget / (W * H))));
    renderer.setPixelRatio(px); composer.setPixelRatio(px);
    renderer.setSize(W, H, false); composer.setSize(W, H);
    const dw = Math.round(W * px), dh = Math.round(H * px);
    final.uniforms.uRes.value.set(dw, dh); final.uniforms.uThick.value = Math.max(1, px * .85);
    fxU.uScreen.value.set(dw, dh);
    stage.dirty = true;
    // resizing empties the canvas (and the kept frame): draw again at once, in the same moment, so the
    // empty canvas is never seen (a white flash otherwise)
    if (lastPose) { aim(lastPose); draw(); present(); stage.dirty = true; }
  }

  // ---------- drawing ----------
  function draw() {
    renderer.info.reset();
    final.uniforms.uNear.value = camera.near; final.uniforms.uFar.value = camera.far;
    composer.render();
    stage.dirty = false;
  }
  function present() {
    renderer.setRenderTarget(null);
    show.material.uniforms.t.value = composer.readBuffer.texture;
    show.render(renderer);
    if (fx.children.length) {
      const ac = renderer.autoClear; renderer.autoClear = false;
      renderer.render(fx, camera);
      renderer.autoClear = ac;
    }
  }

  const stage = {
    renderer, scene, fx, fxU, camera, sun, addLamp, addGlow, setHour, aim, centre, composer, passes: { gbuf, gtao, final, smaa },
    dirty: true,
    get tier() { return tierName; }, get ratio() { return px; },
    setTier, resize, draw, present,
    shadowsDirty() { renderer.shadowMap.needsUpdate = true; stage.dirty = true; },
    // a point to the stage, in CSS pixels; z > 1 means behind the camera
    project(p, out) { v3.set(p[0], p[1], p[2]).project(camera); out[0] = (v3.x * .5 + .5) * W; out[1] = (-v3.y * .5 + .5) * H; out[2] = v3.z; return out; },
    // the median time of a full frame on this machine, in ms (after one frame that builds what it needs)
    bench(n = 5) {
      const gl = renderer.getContext(), times = [];
      draw(); present(); gl.finish();
      for (let i = 0; i < n; i++) { const t0 = performance.now(); draw(); present(); gl.finish(); times.push(performance.now() - t0); }
      times.sort((a, b) => a - b);
      return times[n >> 1];
    },
    stats() { const r = renderer.info.render; return { calls: r.calls, triangles: r.triangles, tier: tierName, ratio: +px.toFixed(3), pixels: Math.round(W * H * px * px), geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs ? renderer.info.programs.length : 0 }; },
    // every shader the film will use, compiled in the background while the loader shows (the scene's,
    // the passes', the living things'), so the first frames do not stall on compiling them
    async compile() {
      const g = new THREE.PlaneGeometry(1, 1), flat = new THREE.Scene(), lit = new THREE.Scene(), ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      [gtao.gtaoMaterial, gtao.pdMaterial, final.material, smaa._materialEdges, smaa._materialWeights, smaa._materialBlend, show.material].forEach(m => { if (m) flat.add(new THREE.Mesh(g, m)); });
      lit.add(new THREE.Mesh(g, gbuf.material));
      const c = (s, cam) => renderer.compileAsync ? renderer.compileAsync(s, cam) : Promise.resolve(renderer.compile(s, cam));
      await Promise.all([c(scene, camera), c(lit, camera), c(fx, camera), c(flat, ortho)]);
      g.dispose();
    },
    dispose() { composer.dispose(); gbuf.dispose(); show.dispose(); renderer.dispose(); },
  };
  setTier(tier);
  return stage;
}
