/* The house's film (src/pages/house/index.astro; site/docs/redesign-plan.md, sections 11 and 11.10):
   the scroll is the film's clock. A tall track scrolls while the stage stays pinned over the 3D
   (stage.js), the study built in three dimensions (study.js). Wherever the reader stops, the frame is
   whole; nothing moves the film on its own.
   00, the title page, is the manuscript on its writing slope: the camera looks squarely at it, close,
   the room in shade and the lamp's pool round the page; the page's words are its markup, laid on the 3D
   page in perspective (sharp, clickable). The loader is that page as a sheet of paper on the veil: when
   the house is ready the camera stands where the page fills the sheet exactly, the veil clears, and the
   camera draws back to the title (so the sheet becomes the manuscript). On scroll the camera pulls out
   and wide (the study revealed as the morning comes up in the window), then moves in to the display,
   whose editor holds the contents, the menu.
   A frame is drawn only when something changes; at rest the kept frame is shown again with the dust and
   the steam drawn over it (stage.js). The machine is measured while the loader shows, and the tier is
   lowered if moving frames come too slowly.
   Review switches: ?static skips the loader; ?tier=high|mid|low fixes the tier. Test hook:
   window.mewritHouse. */
import * as THREE from 'three';
import { clamp, REDUCE, STATIC } from '../shared.js';
import { splitLines } from '../lamp/text.js';
import { createStage, TIER_ORDER } from './stage.js';
import { buildStudy, STUDY } from './study.js';
import { createLogoPlayer } from '../logo-player.js';

const sec = document.getElementById('hs');
if (sec) start();

function start() {
  const root = document.documentElement;
  const track = sec.querySelector('.hs-track'), stage = sec.querySelector('.hs-stage'), canvas = sec.querySelector('.hs-canvas');
  const page = sec.querySelector('.hs-page'), veil = sec.querySelector('.hs-veil');
  const capEls = [...sec.querySelectorAll('.hs-cap')], heads = capEls.map(c => c.querySelector('.hs-hl'));
  const list = [...sec.querySelectorAll('.hs-list a')], lhRun = sec.querySelector('.lh-run');
  const ed = sec.querySelector('.lp-ed'), docs = ed ? [...ed.querySelectorAll('[data-doc]')] : [];
  const motion = REDUCE ? 0 : 1;
  const big = !matchMedia('(pointer: coarse)').matches && Math.max(innerWidth, screen.width) >= 900;
  const askTier = new URLSearchParams(location.search).get('tier');
  const ease = t => t * t * (3 - 2 * t), mix = (a, b, k) => a + (b - a) * k;
  const easeSine = t => .5 - .5 * Math.cos(Math.PI * clamp(t));
  const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const sstep = (a, b, x) => ease(clamp((x - a) / (b - a)));
  const R2D = 180 / Math.PI;

  // ---------- the chapters built so far ----------
  // view: where the camera rests; via: a view the way passes through (split: the share of the way to
  // it); hour: the light at rest; spot: the lamp's pool round the page; doc: the editor's document.
  // Each chapter's scroll (screens, from the page): the move that brings the camera to it, then a short
  // dwell where it holds still; A is the move's share
  const scroll = JSON.parse(sec.dataset.scroll || '[[0,.08],[1.6,.35]]');
  const CH = [
    { id: 'title-page', view: 'page', hour: 'early', spot: 1, doc: 'draft' },
    { id: 'contents', view: 'display', via: 'wide', split: .46, hour: 'morning', spot: 0, doc: 'contents', menu: true },
  ].map((c, i) => { const [move, dwell] = scroll[i] || [1, .3]; return { ...c, span: move + dwell, A: move / (move + dwell), cap: capEls.find(el => el.dataset.ch === c.id) || null }; });
  const S = CH.length;

  // ---------- the views ----------
  // The room's views look level (the picture shifted by the lens, so verticals stay upright) and are
  // framed for the window they are seen in: their highest things just below the letterhead, their foot
  // just above the chapter's words, the things that must show across them inside; the lens widens only
  // as far as that needs. The title page's view looks squarely down at the page.
  let W = 0, H = 0, aspect = 1.6, capTops = [], edCompact = false;
  const SCR = STUDY.SCREEN, SCR_TOP = SCR[0][1] + .13, SCR_FOOT = SCR[2][1] - .13;
  // the editor's own size: 1000 px wide, in the glass's proportions
  const ED_W = 1000, ED_H = ED_W * (SCR[0][1] - SCR[2][1]) / (SCR[1][0] - SCR[0][0]);
  const VIEWS = {
    wide: { p: [6.5, 10.4, 19.5], fov: 40, gap: 0, cap: .985, top: [[6.5, SCR_TOP, -5.3], [12.9, STUDY.WIN.y1 + .35, -7], [-1.05, 5.95, -6.9]], foot: [6.5, 0, STUDY.DESK.z0], safe: [[-4.2, 4, -7], [16.4, 4, -7]] },
    // (the contents' words are on the screen: the whole display shows, down to its stand's foot)
    // (the eye a little high, so the slope before the display stays below the frame, never cut by it)
    display: { p: [6.5, 8.6, 6.0], fov: 40, gap: .04, top: [[6.5, SCR_TOP, -5.3]], foot: [6.5, 0, STUDY.CUP[2] + 1.05], safe: [[2.9, 4, -5.3], [10.1, 4, -5.3], [STUDY.CUP[0] + 1.1, 1, STUDY.CUP[2]]] },
  };
  const headRow = () => (76 + 18) / Math.max(1, H);   // the letterhead's foot, and a little air
  function compose(v, capTop) {
    const [cx, cy, cz] = v.p, tn = q => (cy - q[1]) / (cz - q[2]);
    const topRow = headRow(), footRow = capTop - v.gap, tTop = Math.min(...v.top.map(tn)), tFoot = tn(v.foot);
    let T = Math.tan(v.fov * Math.PI / 360);
    T = Math.max(T, .5 * (tFoot - tTop) / Math.max(.2, footRow - topRow));
    for (const q of v.safe) T = Math.max(T, Math.abs(q[0] - cx) / (cz - q[2]) / aspect * 1.04);
    T = Math.min(T, Math.tan(35 * Math.PI / 180));
    return { p: v.p, yaw: 0, pitch: 0, fov: 2 * Math.atan(T) * R2D, sx: 0, sy: .5 + tFoot / (2 * T) - footRow };
  }
  // squarely at the page: its height a share of the frame (fill), its centre on a row of the frame
  let pc = null, pn = null, pSize = [2.1, 2.97];
  function pagePose(fill, row) {
    const T = Math.tan(20 * Math.PI / 180);
    let D = pSize[1] / (2 * T * fill);
    D = Math.max(D, pSize[0] / (2 * T * aspect * .86));   // (on a narrow window the page's width decides)
    return { p: [pc.x + pn.x * D, pc.y + pn.y * D, pc.z + pn.z * D], yaw: 0, pitch: -Math.asin(pn.y) * R2D, fov: 40, sx: 0, sy: .5 - row };
  }
  function views() {
    const hr = headRow();
    return {
      // (the page a little above the middle below the letterhead, so the scroll cue has the foot)
      page: pagePose(.7 * (1 - hr), hr + (1 - hr) * .47),
      wide: compose(VIEWS.wide, VIEWS.wide.cap),
      display: compose(VIEWS.display, capTops[1] || .8),
    };
  }
  // the sheet the page is shown as while loading: the same squared view, the page filling the sheet
  function sheetPose() {
    const s = stage.getBoundingClientRect(), r = page.getBoundingClientRect();
    return pagePose(r.height / Math.max(1, H), (r.top - s.top + r.height / 2) / Math.max(1, H));
  }
  // the screen card shown while loading the contents: level with the display's glass, at the distance
  // where the glass fills the card exactly, the lens shifted so it sits where the card is
  function screenPose() {
    const s = stage.getBoundingClientRect(), r = ed.getBoundingClientRect(), T = Math.tan(20 * Math.PI / 180);
    const gw = SCR[1][0] - SCR[0][0], gx = (SCR[0][0] + SCR[1][0]) / 2, gy = (SCR[0][1] + SCR[2][1]) / 2;
    const D = gw * Math.max(1, H) / (2 * T * Math.max(1, r.width));
    return { p: [gx, gy, SCR[0][2] + D], yaw: 0, pitch: 0, fov: 40, sx: (r.left - s.left + r.width / 2) / Math.max(1, W) - .5, sy: .5 - (r.top - s.top + r.height / 2) / Math.max(1, H) };
  }
  const lerpPose = (a, b, k) => ({ p: a.p.map((v, j) => mix(v, b.p[j], k)), yaw: mix(a.yaw, b.yaw, k), pitch: mix(a.pitch, b.pitch, k), fov: mix(a.fov, b.fov, k), sx: mix(a.sx, b.sx, k), sy: mix(a.sy, b.sy, k) });
  const poseKey = c => `${c.p[0].toFixed(4)},${c.p[1].toFixed(4)},${c.p[2].toFixed(4)},${c.yaw.toFixed(3)},${c.pitch.toFixed(3)},${c.fov.toFixed(3)},${c.sx.toFixed(4)},${c.sy.toFixed(4)}`;

  // ---------- the scroll: chapter i runs from P = i to i + 1, over its span of screens: its move (the
  // first A of it), then its dwell ----------
  const starts = [];
  CH.reduce((a, c, i) => { starts[i] = a; return a + c.span; }, 0);
  const total = CH.reduce((a, c) => a + c.span, 0);
  const span = () => { const r = track.getBoundingClientRect(); return [r, r.height - stage.offsetHeight]; };
  const PofX = x => { let i = 0; while (i < S - 1 && x >= starts[i + 1]) i++; return i + clamp((x - starts[i]) / CH[i].span); };
  const XofP = P => { const i = Math.min(S - 1, Math.max(0, Math.floor(P))); return starts[i] + (P - i) * CH[i].span; };
  const targetP = () => { const [r, len] = span(); return len <= 0 ? 0 : PofX(clamp(-r.top / len) * total); };
  const scrollFor = P => { const [r, len] = span(); return scrollY + r.top + len * XofP(P) / total; };
  // a chapter's resting place: just into its dwell (a stray touch does not move the camera, and
  // scrolling back moves it again almost at once)
  const restP = i => i === 0 ? 0 : i + CH[i].A + (1 - CH[i].A) * .12;
  const at = P => {
    const i = Math.min(S - 1, Math.max(0, Math.floor(P))), u = Math.min(1, P - i), a = CH[i].A;
    return i > 0 && u < a ? { i, phase: 0, m: u / a } : { i, phase: 2, m: 0 };
  };
  // whose words show: the arriving chapter's once the camera is nearly there
  const capOf = st => st.phase !== 0 ? st.i : st.m < .06 ? st.i - 1 : st.m < .8 ? -1 : st.i;

  // ---------- where the reader comes back to ----------
  // A refresh returns to the chapter the reader was at (the place is kept for half an hour in this
  // tab), a link to a chapter (#contents) opens on it: the page's first script chose the chapter before
  // the first paint (hs-from-N) and shows that chapter's object as the loader; the film starts there.
  // Each chapter's loader is its own: the title page's sheet becomes the manuscript; the display's
  // screen becomes the display
  const KEY = 'mewrit-house-place';
  const fromI = STATIC ? 0 : Math.min(S - 1, +(([...root.classList].map(c => /^hs-from-(\d+)$/.exec(c)).find(Boolean) || [0, 0])[1]));
  const startP = fromI > 0 ? restP(fromI) : 0;
  const restoring = fromI > 0;
  addEventListener('pagehide', () => { try { sessionStorage.setItem(KEY, JSON.stringify({ P: introDone ? Pr : startP, t: Date.now() })); } catch (e) { /* storage off */ } });

  // going to a chapter: a glide of the scroll (asked for by a link; never on its own), unhurried, so the
  // camera's way reads as a walk: about four seconds from the title page to the display, eased at both
  // ends, moving from the moment of the click
  let glide = null;
  const glideTo = P => {
    // first, past any stretch where the camera would only stand still (the rest before the next move):
    // a jump there shows nothing, and the glide then moves the camera from its first moment
    const here = at(Math.min(targetP(), S - 1e-6));
    if (here.phase === 2 && P > here.i + 1) { window.scrollTo({ top: Math.round(scrollFor(here.i + 1)), behavior: 'instant' }); Pr = here.i + 1; }
    const to = Math.round(scrollFor(P)), from = scrollY, far = Math.abs(to - from) / Math.max(1, H);
    if (Math.abs(to - from) < 2) return;
    if (!motion) { window.scrollTo({ top: to, behavior: 'instant' }); return; }
    glide = { from, to, t0: performance.now(), dur: Math.min(5600, Math.max(1600, 1200 + far * 1500)) };
    wake();
  };
  const stopGlide = () => { glide = null; };
  addEventListener('wheel', stopGlide, { passive: true });
  addEventListener('touchstart', stopGlide, { passive: true });
  addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) stopGlide(); });
  sec.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (introDone) glideTo(restP(+a.dataset.go)); }));
  // the contents on the display: a practice not yet built stays where it is (the look test)
  if (ed) ed.querySelectorAll('.ed-toc a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); }));

  // ---------- the words ----------
  let active = -2;
  function activate(c) {
    if (c === active) return;
    active = c;
    const cap = c >= 0 ? CH[c].cap : null;
    stage.dataset.cap = cap ? 'on' : 'off';
    CH.forEach((ch, j) => { if (ch.cap) ch.cap.classList.toggle('on', j === c); });
    if (c >= 0) {
      stage.dataset.ch = CH[c].id;
      // the address names the chapter (shared, it opens there); the title page keeps the plain address
      try { history.replaceState(null, '', c > 0 ? `#${CH[c].id}` : location.pathname + location.search); } catch (e) { /* sandboxed */ }
      if (lhRun) lhRun.textContent = (CH[c].cap && CH[c].cap.dataset.name) || '';
      list.forEach(a => { if (a.getAttribute('href') === `#${CH[c].id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
  }

  // ---------- the 3D ----------
  let world = null, study = null, ready = false, benchMs = 0;
  const logo = new Image();
  logo.src = sec.dataset.logo;
  // (how far the loading has got, for whichever loader shows: set on the page's root, inherited)
  const setP = v => root.style.setProperty('--hs-p', String(Math.max(+(root.style.getPropertyValue('--hs-p') || 0), v)));
  function sizeUp() {
    W = stage.clientWidth; H = stage.clientHeight; aspect = W / Math.max(1, H);
    heads.forEach(h => h && splitLines(h));
    // where each chapter's words begin, as a share of the stage's height (the views sit just above)
    const s = stage.getBoundingClientRect();
    capTops = CH.map(c => c.cap ? (c.cap.getBoundingClientRect().top - s.top) / Math.max(1, H) : 1);
    // the editor's setting for this window: the glass's width on the screen at the display's resting view
    const rest = compose(VIEWS.display, capTops[1] || 1), D = VIEWS.display.p[2] - SCR[0][2];
    edCompact = (SCR[1][0] - SCR[0][0]) * H / (2 * D * Math.tan(rest.fov * Math.PI / 360)) / ED_W < .55;
    if (world) { world.resize(canvas.clientWidth || W, canvas.clientHeight || H); lastKey = ''; wake(); }
  }
  new ResizeObserver(sizeUp).observe(stage);
  sizeUp();
  if (document.fonts) document.fonts.ready.then(sizeUp);

  const fonts = document.fonts ? Promise.race([Promise.all([document.fonts.load('600 22px Caveat'), document.fonts.load('600 20px "Fraunces Variable"'), document.fonts.load('italic 400 20px "Fraunces Variable"')]), new Promise(r => setTimeout(r, 2500))]).catch(() => null) : Promise.resolve();
  const logoIn = new Promise(r => { if (logo.complete) r(); else { logo.onload = r; logo.onerror = r; } });
  const t0 = performance.now();
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
  // the title page's words, for the 3D page's own drawing
  const pageWords = () => ({
    title: page ? [...page.querySelectorAll('.pg-title span')].map(s => s.textContent) : [],
    sub: page ? (page.querySelector('.pg-sub') || {}).textContent || '' : '',
    begin: page && page.querySelector('.pg-begin') ? page.querySelector('.pg-begin').firstChild.textContent : '',
    doc: page && page.querySelector('.pg-doc') ? page.querySelector('.pg-doc').innerHTML.split(/<br\s*\/?>/i).map(s => s.replace(/<[^>]+>/g, '').trim()) : [],
    foot: page && page.querySelector('.pg-foot') ? page.querySelector('.pg-foot').textContent : '',
    lines: JSON.parse(sec.dataset.lines || '[]'),
  });
  setP(.1);
  // how long each part of the loading took (ms from the film's start; window.mewritHouse.marks)
  const marks = { start: Math.round(t0) };   // (start: the film's start, ms from the page's navigation)
  const mark = n => { marks[n] = Math.round(performance.now() - t0); };
  (async () => {
    await Promise.all([fonts, logoIn]);
    mark('fonts');
    setP(.3);
    world = createStage(canvas, { tier: TIER_ORDER.includes(askTier) ? askTier : big ? 'high' : 'mid' });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); console.warn('[house] the 3D context was lost'); });
    world.resize(canvas.clientWidth || W, canvas.clientHeight || H);
    mark('stage');
    study = buildStudy({ logo, quality: big ? 'high' : 'low', page: pageWords() });
    mark('study');
    pc = study.pageCentre; pn = study.pageNormal; pSize = study.pageSize;
    world.scene.add(study.group);
    world.addLamp({ at: study.lamp.at, aim: study.lamp.aim, power: 46, angle: .58 });
    world.addGlow(study.lamp.bulb, { size: 1.5, k: .85 });
    world.centre.set(6, 0, -3);
    world.setHour('early');
    addLife();
    setP(.5);
    await nextFrame();
    await world.compile();
    mark('compile');
    setP(.7);
    await nextFrame();
    world.aim(views().page);
    // the machine's measure: a full frame at this tier; too slow, and the tier steps down (unless asked for)
    benchMs = world.bench(4);
    mark('bench');
    if (!TIER_ORDER.includes(askTier)) {
      while (world.tier !== 'low' && benchMs > (world.tier === 'high' ? 11 : 15)) {
        world.setTier(TIER_ORDER[TIER_ORDER.indexOf(world.tier) + 1]);
        benchMs = world.bench(3);
      }
    }
    setP(.9);
    // back to the reader's place, under the veil, before anything is shown
    if (restoring) { window.scrollTo({ top: Math.round(scrollFor(startP)), behavior: 'instant' }); Pr = startP; }
    await nextFrame();
    ready = true; setP(1);
    mark('ready');
    lastKey = '';
    beginIntro();
  })().catch(err => { console.warn('[house] no 3D:', err); sec.classList.add('hs-nogl'); finishIntro(); });

  // ---------- the intro: the sheet becomes the manuscript ----------
  let intro = STATIC ? 1 : 0, introStart = 0, introFrom = null, introDone = !!STATIC;
  const INTRO_MS = REDUCE ? 1 : 1900;
  function beginIntro() {
    const wait = Math.max(0, (REDUCE ? 200 : 2400) - (performance.now() - t0));
    // (and not before the loader's logo has been written: the camera draws back from a finished page)
    Promise.all([new Promise(r => setTimeout(r, wait)), loaderDrawn]).then(() => {
      if (STATIC) { finishIntro(); return; }
      mark('intro');
      if (fromI === 1) {
        // the contents: the camera stands where the 3D screen fills the card, the editor is laid on the
        // screen where the card already is (no jump), the paper clears, and the camera draws back
        introFrom = screenPose();
        introStart = performance.now();
        world.aim(introFrom);
        placeEditor();
        page.classList.add('quad');   // (the title page, on the manuscript below the frame)
        root.classList.add('hs-in'); root.classList.remove('hs-loading', 'hs-lock');
        if (veil) veil.classList.add('off');
        wake();
        return;
      }
      introFrom = sheetPose();
      introStart = performance.now();
      // the page laid on the manuscript where the sheet already is (no jump), before it turns clear
      world.aim(introFrom);
      const q = project4(study.manuscript());
      if (q) page.style.transform = quad(page.offsetWidth, page.offsetHeight, q);
      page.classList.add('quad');
      root.classList.add('hs-in'); root.classList.remove('hs-loading', 'hs-lock');
      if (veil) veil.classList.add('off');
      wake();
    });
  }
  function finishIntro() {
    const first = !introDone;
    intro = 1; introDone = true;
    if (page) page.classList.add('quad');
    if (veil) veil.classList.add('off');
    root.classList.add('hs-in', 'hs-done'); root.classList.remove('hs-loading', 'hs-lock');
    wake();
    if (first) headerDrawing();
  }

  // ---------- the logo writing itself (version B's pen: src/scripts/logo-player.js) ----------
  // In the loader, the logo the reader first sees (the title page's letterhead; the display's boot
  // screen, after which it docks as the document's letterhead) is written by the pen while the house
  // loads; the letterhead at the top writes itself once the film is in, and again every HEAD_EVERY
  // (the drawing plays 1.8 times version B's pace here: about two and a half seconds, so the loader is
  // not held for it)
  const HEAD_EVERY = 20000, LOGO_SPEED = 1.8;
  const sheetLogo = page && page.querySelector('.pg-logo.ld'), bootLogo = ed && ed.querySelector('.ed-logo.ld'), headLogo = sec.querySelector('.lp-lh-logo .ld');
  const players = new Map();
  const playerOf = el => { if (!el) return null; if (!players.has(el)) players.set(el, createLogoPlayer(el, { speed: LOGO_SPEED })); return players.get(el); };
  let loaderDrawn = Promise.resolve();
  if (!STATIC && !REDUCE) {
    if (fromI === 0 && sheetLogo) loaderDrawn = playerOf(sheetLogo).play();
    else if (fromI === 1 && bootLogo) loaderDrawn = playerOf(bootLogo).play().then(() => { ed.classList.add('docked'); return new Promise(r => setTimeout(r, 750)); });
  }
  let headTimer = 0;
  function headerDrawing() {
    if (STATIC || REDUCE || !headLogo) return;
    clearTimeout(headTimer);
    const go = () => {
      // not while the tab is hidden or the letterhead is gone (the night chapters hide the logo)
      if (document.hidden || getComputedStyle(headLogo.parentElement).opacity === '0') { headTimer = setTimeout(go, HEAD_EVERY); return; }
      playerOf(headLogo).play({ replay: true }).then(() => { headTimer = setTimeout(go, HEAD_EVERY); });
    };
    headTimer = setTimeout(go, 700);   // (once the letterhead has faded in)
  }

  // ---------- life at rest, drawn over the kept frame: dust in the window's light, the coffee's steam ----------
  let dust = null, steam = [];
  // a test against the kept frame's depth, so a living thing hides behind what stands before it
  const behind = /* glsl */`uniform sampler2D tSceneDepth; uniform vec2 uScreen; bool hidden_() { return gl_FragCoord.z > texture2D(tSceneDepth, gl_FragCoord.xy / uScreen).x + 1e-6; }`;
  function addLife() {
    const fxU = world.fxU;
    // dust: specks drifting in the first stretch of the beam of sun from the window, near the glass,
    // where the light is strongest and they read as dust in it, not as marks on the wall
    const N = big ? 150 : 70, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    const L = new THREE.Vector3(-.55, -.42, .72).normalize(), WIN = STUDY.WIN;
    for (let i = 0; i < N; i++) {
      const wx = WIN.x0 + Math.random() * (WIN.x1 - WIN.x0), wy = WIN.y0 + Math.random() * (WIN.y1 - WIN.y0), tMax = Math.min(6.5, wy / -L.y), t = .5 + Math.random() * Math.max(0, tMax - .5);
      pos[i * 3] = wx + L.x * t; pos[i * 3 + 1] = wy + L.y * t; pos[i * 3 + 2] = STUDY.WALL + L.z * t; seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    dust = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uK: { value: 1 }, tSceneDepth: fxU.tSceneDepth, uScreen: fxU.uScreen },
      vertexShader: /* glsl */`
uniform float uTime, uPx, uK;
attribute float aSeed;
varying float vA;
void main() {
  vec3 p = position;
  float t = uTime * (.05 + aSeed * .05) + aSeed * 40.;
  p += vec3(sin(t) * .3, sin(t * .7 + 1.) * .25, cos(t * .8) * .25);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1. + aSeed * 1.8) * uPx * (16. / -mv.z);
  vA = uK * (.1 + .22 * fract(aSeed * 7.3)) * (.55 + .45 * sin(uTime * (.4 + aSeed) + aSeed * 20.));
}`,
      fragmentShader: /* glsl */`${behind}
varying float vA;
void main() { if (hidden_()) discard; vec2 c = gl_PointCoord - .5; float d = dot(c, c); if (d > .25) discard; gl_FragColor = vec4(1., .95, .82, vA * (1. - d * 4.)); }`,
    }));
    dust.frustumCulled = false;
    world.fx.add(dust);
    // steam: three wisps over the cup, each a soft line that waves and breaks as it rises
    const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, .5, 0);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uPhase: { value: i * 2.1 }, uK: { value: motion }, tSceneDepth: fxU.tSceneDepth, uScreen: fxU.uScreen },
        vertexShader: /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 c = modelViewMatrix * vec4(0., 0., 0., 1.);
  c.xy += position.xy * vec2(.9, 2.4);
  gl_Position = projectionMatrix * c;
}`,
        fragmentShader: /* glsl */`${behind}
uniform float uTime, uPhase, uK;
varying vec2 vUv;
void main() {
  if (hidden_()) discard;
  float y = vUv.y;
  float wob = sin(y * 6.5 - uTime * 1.1 + uPhase) * .13 * y + sin(y * 12. - uTime * 1.9 + uPhase * 1.7) * .035 * y;
  float x = abs(vUv.x - .5 - wob), w = .035 + .03 * y;
  float line = smoothstep(w, w * .25, x);
  float wisps = smoothstep(.25, .75, sin(y * 7. - uTime * 1.6 + uPhase * 2.3) * .5 + .5);
  float a = line * wisps * smoothstep(0., .14, y) * (1. - smoothstep(.45, 1., y)) * uK;
  vec3 col = mix(vec3(.62, .66, .76), vec3(1.), smoothstep(w * .7, 0., x));
  gl_FragColor = vec4(col, a * .55);
}`,
      }));
      m.position.set(STUDY.CUP[0] + (i - 1) * .16, .95, STUDY.CUP[2] + (i - 1) * .1);
      m.frustumCulled = false;
      world.fx.add(m); steam.push(m);
    }
  }
  function life(time, sunK) {
    if (dust) { dust.material.uniforms.uTime.value = time; dust.material.uniforms.uPx.value = world.ratio; dust.material.uniforms.uK.value = sunK; }
    steam.forEach(s => { s.material.uniforms.uTime.value = time; });
  }

  // ---------- the surfaces with markup laid on them: the display's editor, the title page ----------
  // A rectangle of markup (w by h px, its origin top left) put on four points of the screen by a
  // projective transform, so it lies in the plane of the surface, in perspective
  function quad(w, h, q) {
    const [x0, y0] = q[0], [x1, y1] = q[1], [x2, y2] = q[2], [x3, y3] = q[3];
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    let g = 0, k = 0;
    if (Math.abs(sx) > 1e-7 || Math.abs(sy) > 1e-7) { const den = dx1 * dy2 - dx2 * dy1; g = (sx * dy2 - dx2 * sy) / den; k = (dx1 * sy - sx * dy1) / den; }
    const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
    const f6 = v => +v.toFixed(7);
    return `matrix3d(${f6(a / w)},${f6(d / w)},0,${f6(g / w)},${f6(b / h)},${f6(e / h)},0,${f6(k / h)},0,0,1,0,${f6(x0)},${f6(y0)},0,1)`;
  }
  if (ed) { ed.style.width = `${ED_W}px`; ed.style.height = `${ED_H.toFixed(2)}px`; }
  const pq = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], edState = {}, pgState = {};
  function project4(pts) { let ok = true; pts.forEach((p, i) => { world.project(p, pq[i]); if (pq[i][2] > 1 || pq[i][2] < -1) ok = false; }); return ok ? pq.map(q => [q[0], q[1]]) : null; }
  function placeEditor() {
    if (!ed || !world) return;
    if (fromI === 1 && !introStart && !introDone) return;   // (the editor is the loader's card until its intro begins)
    const q = project4(SCR);
    const tf = q ? quad(ED_W, ED_H, q) : 'scale(0)';
    if (edState.tf !== tf) { edState.tf = tf; ed.style.transform = tf; }
    // small on the screen (a phone), the documents take their larger setting: chosen by the display's
    // size at its resting view for this window, so it never changes while the camera moves
    if (edState.compact !== edCompact) { edState.compact = edCompact; ed.classList.toggle('compact', edCompact); }
    if (!edState.shown) { edState.shown = true; ed.style.visibility = 'visible'; ed.style.opacity = '1'; }
  }
  // the title page: its words are always the markup, laid exactly on the 3D page at every size (the 3D
  // page draws only its rule, lines and marks), so the words never change or shift as the camera moves;
  // hidden only if the page is behind the camera
  function placePage() {
    if (!page || !page.classList.contains('quad')) return;
    const q = project4(study.manuscript());
    if (q) { const tf = quad(page.offsetWidth, page.offsetHeight, q); if (pgState.tf !== tf) { pgState.tf = tf; page.style.transform = tf; } }
    if (pgState.gone !== !q) { pgState.gone = !q; page.classList.toggle('far', !q); }
  }
  function editorDocs(docMix, live) {
    if (!ed) return;
    docs.forEach(el => { const v = (docMix[el.dataset.doc] || 0).toFixed(3); if (el.dataset.op !== v) { el.dataset.op = v; el.style.opacity = v; el.style.visibility = +v > 0 ? 'inherit' : 'hidden'; } });
    if (edState.live !== live) { edState.live = live; ed.classList.toggle('live', live); ed.setAttribute('aria-hidden', live ? 'false' : 'true'); }
  }
  // the lamp's pool round the page, on the screen
  const sq = [0, 0, 0];
  function spotOn(k) {
    const u = world.passes.final.uniforms;
    if (k <= 0) { u.uSpotK.value = 0; return; }
    world.project([pc.x, pc.y, pc.z], sq);
    const q = project4(study.manuscript());
    const tall = q ? Math.hypot((q[3][0] + q[2][0] - q[0][0] - q[1][0]) / 2, (q[3][1] + q[2][1] - q[0][1] - q[1][1]) / 2) : H * .5;
    u.uSpot.value.set(sq[0] / Math.max(1, W), 1 - sq[1] / Math.max(1, H), Math.max(.15, tall / Math.max(1, H) * .78));
    u.uSpotK.value = k;
  }

  // ---------- the tier, watched while the camera moves: too slow for long, and it steps down ----------
  const moving = [];
  function watch(dtMs, moved) {
    if (!moved || TIER_ORDER.includes(askTier)) { moving.length = 0; return; }
    moving.push(dtMs);
    if (moving.length < 50) return;
    const sorted = [...moving].sort((a, b) => a - b), med = sorted[sorted.length >> 1];
    moving.length = 0;
    if (med > 26 && world.tier !== 'low') { world.setTier(TIER_ORDER[TIER_ORDER.indexOf(world.tier) + 1]); lastKey = ''; console.info('[house] tier lowered to', world.tier, `(${med.toFixed(1)} ms frames)`); }
  }

  // ---------- every frame ----------
  let Pr = startP, time = 0, last = 0, raf = 0, lastKey = '', lastShow = 0, probe = null;
  function frame(dt, now) {
    if (glide) {
      const t = clamp((now - glide.t0) / glide.dur);
      window.scrollTo({ top: glide.from + (glide.to - glide.from) * easeSine(t), behavior: 'instant' });
      if (t >= 1) glide = null;
    }
    // (before the house is ready the film holds still; returning to a place, it follows the scroll from
    // the start; otherwise the title page holds until its intro is done)
    // (the page can be scrolled from the moment the camera starts drawing back; the film holds its
    // place until the intro is done, then follows the scroll smoothly)
    const Pt = !ready || !introDone ? (restoring ? startP : 0) : targetP();
    Pr = motion ? Pr + (Pt - Pr) * (1 - Math.exp(-dt * 7)) : Pt;   // a light smoothing that never overshoots
    if (Math.abs(Pt - Pr) < 1e-4) Pr = Pt;
    time += dt;
    const st = at(Math.min(Pr, S - 1e-6));
    if (introDone) activate(capOf(st));
    // the scroll cue: at the title page only, until the reader scrolls
    const cue = introDone && Pt < .02 && !glide ? 'on' : 'off';
    if (stage.dataset.cue !== cue) stage.dataset.cue = cue;
    if (!world || !ready) return true;
    // the intro: from the sheet back to the title page
    if (!introDone && introStart) {
      intro = clamp((now - introStart) / INTRO_MS);
      if (intro >= 1) finishIntro();
    }
    const V = views();
    let cam, hA, hB = null, hK = 0, spot = 0;
    const docMix = {};
    if (!introDone) {
      // the intro: from the loader's card (the sheet, the screen) back to the chapter the reader comes to
      const c = CH[fromI];
      cam = introStart ? lerpPose(introFrom, V[c.view], easeIO(intro)) : V[c.view];
      hA = c.hour; spot = c.spot || 0; docMix[c.doc] = 1;
    } else if (st.phase === 0) {
      const a = CH[st.i - 1], b = CH[st.i];
      if (b.via) {
        if (st.m < b.split) { const k = easeSine(st.m / b.split); cam = lerpPose(V[a.view], V[b.via], k); hA = a.hour; hB = b.hour; hK = k; spot = a.spot * (1 - k); }
        else { const k = easeSine((st.m - b.split) / (1 - b.split)); cam = lerpPose(V[b.via], V[b.view], k); hA = b.hour; spot = 0; }
      } else { const k = easeSine(st.m); cam = lerpPose(V[a.view], V[b.view], k); hA = a.hour; hB = b.hour; hK = k; spot = mix(a.spot, b.spot, k); }
      const d = sstep(.55, .85, st.m); docMix[a.doc] = 1 - d; docMix[b.doc] = d;
    } else { const c = CH[st.i]; cam = V[c.view]; hA = c.hour; spot = c.spot; docMix[c.doc] = 1; }
    if (probe) cam = { yaw: 0, pitch: 0, sx: 0, sy: .5, fov: 40, ...probe };
    world.setHour(hA, hB || hA, hK);
    editorDocs(docMix, introDone && st.phase === 2 && !!CH[st.i].menu);
    const key = `${poseKey(cam)}|${spot.toFixed(4)}`, moved = key !== lastKey;
    watch(dt * 1000, moved);   // (before drawing: a change of tier is drawn in this same frame)
    let show = false;
    if (moved || world.dirty) {
      world.aim(cam);
      placePage();
      spotOn(spot);
      world.draw(); lastKey = key;
      placeEditor();
      show = true;
    }
    life(time, 1 - spot * .8);
    if (show || (motion && now - lastShow >= 33)) { world.present(); lastShow = now; }
    // keep running while anything is on its way (the scroll's smoothing, a glide, the intro); at rest
    // the loop runs only for the living things (and not at all with reduced motion)
    return glide || Pt !== Pr || moved || !introDone || motion;
  }
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    let more = true;
    try { more = frame(dt, now); } catch (err) { console.warn('[house]', err); }
    if (more) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } }
  document.addEventListener('visibilitychange', wake);
  addEventListener('scroll', wake, { passive: true });
  if (STATIC) finishIntro();
  wake();

  window.mewritHouse = {
    get ready() { return ready && introDone; }, get P() { return Pr; }, settle() { Pr = targetP(); lastKey = ''; wake(); }, get stage() { return world; },
    restP, scrollFor, chapters: CH.map(c => c.id), A: CH[S - 1].A, get bench() { return benchMs; }, marks,
    // review: hold the camera at a pose ({ p, yaw, pitch, fov, sx, sy }), or null to give it back
    probe(p) { probe = p; lastKey = ''; wake(); },
    views, VIEWS,
    // a point of the house on the screen
    project(p) { const q = [0, 0, 0]; world.project(p, q); return q; },
    // the manuscript's top sheet on the screen, [left, top, right, bottom] in px
    manuscriptRect() { if (!world || !study) return null; const q = [0, 0, 0], r = [1e9, 1e9, -1e9, -1e9]; study.manuscript().forEach(p => { world.project(p, q); r[0] = Math.min(r[0], q[0]); r[1] = Math.min(r[1], q[1]); r[2] = Math.max(r[2], q[0]); r[3] = Math.max(r[3], q[1]); }); return r; },
    get baked() { return study && study.baked; },
  };
}
