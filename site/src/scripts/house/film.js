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
   02, on the record (section 11.12): the camera walks from the display through the doorway into the
   library hall (hall.js; one continuous way, route.js) as the day goes to evening and the hall's lamps
   come on, and stops square before the record; there it holds still while the record performs (the
   volumes set on the shelves bay by bay, each figure counting up on its board, the record's light
   coming up), its words HTML laid on the record's band. A return to 02 loads on a card of that band.
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
import { buildHall, HALL, RECORD_TOP } from './hall.js';
import { buildArchive, ARCHIVE } from './archive.js';
import { FACE, BAND, CARD, LAYOUT, PX as REC_PX } from './record-layout.js';
import { route } from './route.js';
import { bake } from './kit.js';
import { createLogoPlayer, warmLogoInk } from '../logo-player.js';
import { yearsIn, inWords, capital } from '../../data/years';

const sec = document.getElementById('hs');
if (sec) start();

function start() {
  const root = document.documentElement;
  const track = sec.querySelector('.hs-track'), stage = sec.querySelector('.hs-stage'), canvas = sec.querySelector('.hs-canvas');
  const page = sec.querySelector('.hs-page'), veil = sec.querySelector('.hs-veil');
  // 02's words: on the record's band (the cartouche, the frieze, the four boards), and its source below
  // (the years on the record go up each new year: the page was built with its own year's count; the
  // reader's year decides, so the frieze turns over on the first of January without a rebuild; and the
  // colophon's year)
  sec.querySelectorAll('[data-years]').forEach(el => { el.textContent = capital(inWords(yearsIn(new Date().getFullYear()))); });
  sec.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  const rec = sec.querySelector('.hs-rec');
  const recParts = rec ? { crest: rec.querySelector('.rec-crest'), frieze: rec.querySelector('.rec-frieze'), boards: [...rec.querySelectorAll('.rec-board')], note: rec.querySelector('.rec-note') } : null;
  // the frieze's headline is typed when the reader arrives: letter by letter while it types (each letter
  // its own span), then whole again (the font's own spacing between the letters)
  const recHl = recParts && recParts.frieze ? recParts.frieze.querySelector('.rec-hl') : null, recHlHTML = recHl ? recHl.innerHTML : '';
  let typeT = 0;
  function typeHeadline(on) {
    if (!recHl) return;
    clearTimeout(typeT);
    recHl.classList.remove('typing'); recHl.innerHTML = recHlHTML;
    if (!on || REDUCE) return;
    const text = recHl.textContent;
    recHl.textContent = '';
    [...text].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = c; recHl.appendChild(s); });
    recHl.classList.add('typing');
    typeT = setTimeout(() => { recHl.classList.remove('typing'); recHl.innerHTML = recHlHTML; }, 80 + text.length * 16 + 200);
  }
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
  // it); walk: a route through fixed points instead (route.js); hour: the light at rest; spot: the
  // lamp's pool round the page; doc: the editor's document; record: the chapter where the record fills.
  // Each chapter's scroll (screens, from the page): the move that brings the camera to it, then a short
  // dwell where it holds still, and (02) between the two the time its object performs while the camera
  // holds still; A is the move's share, B where the performance ends
  const scroll = JSON.parse(sec.dataset.scroll || '[[0,.08],[1.6,.35]]');
  const CH = [
    { id: 'title-page', view: 'page', hour: 'early', spot: 1, doc: 'draft' },
    { id: 'contents', view: 'display', via: 'wide', split: .46, hour: 'morning', spot: 0, doc: 'contents', menu: true },
    { id: 'on-the-record', view: 'record', walk: 'door', hour: 'evening', spot: 0, doc: 'contents', record: true },
    { id: 'regulatory-writing', view: 'archive', walk: 'archive', hour: 'night', spot: 0, doc: 'contents', dossier: true, pair: 'hallArchive' },
  ].slice(0, scroll.length).map((c, i) => {
    const [move, dwell, perform = 0] = scroll[i] || [1, .3], span = move + perform + dwell;
    // (02's words are on the record itself; its caption is the source line beneath)
    return { ...c, span, A: move / span, B: (move + perform) / span, cap: capEls.find(el => el.dataset.ch === c.id) || (c.record && recParts ? recParts.note : null) };
  });
  const S = CH.length, RI = CH.findIndex(c => c.record), AI = CH.findIndex(c => c.dossier);
  // the walks: from the display, left to the doorway, through it, and on and left into the hall, to the
  // record (the eyes between the two views'). From the record, turning left (east) toward the door in
  // the hall's east wall, through it into the archive, to stand looking down the archive's table (each
  // point's fourth number: the way the camera faces there; every walk round the house turns left once)
  const WALKS = {
    door: route([[-7.55, 8.8, 3.4], [-7.55, 9, -7.25], [-13.8, 9.1, -16.5]]),
    archive: route([[-41, 9.05, -38.5, -22], [-55, 8.7, -48.5, -62], [-64.3, 8.1, -52, -84]]),
  };
  // where the sun's shadows are drawn (stage.setShadowBox: a centre, half the width across the light,
  // the reach above and below): each room's own box at rest, so its shadows are as fine as the map
  // allows; on a walk from one room to the next the box grows to hold both and then closes on the
  // second (the shadows are drawn again every frame of a walk anyway: the sun moves)
  const BOXES = {
    study: { c: [6, 0, -3], hw: 30, top: 24, bottom: -18 },
    both: { c: [-15, 10, -32], hw: 84, top: 70, bottom: -70 },
    hall: { c: [-32.5, 8, -51], hw: 58, top: 42, bottom: -42 },
    hallArchive: { c: [-58, 6, -52], hw: 70, top: 56, bottom: -56 },
    archive: { c: [-85, 4, -48], hw: 34, top: 28, bottom: -28 },
  };
  const boxMix = (a, b, k) => ({ c: a.c.map((v, j) => mix(v, b.c[j], k)), hw: mix(a.hw, b.hw, k), top: mix(a.top, b.top, k), bottom: mix(a.bottom, b.bottom, k) });
  const setBox = B => world.setShadowBox(B.c, B.hw, B.top, B.bottom);
  // the box for where the film is: a chapter's room, or on the walk to it
  const ROOM = { 'title-page': 'study', contents: 'study', 'on-the-record': 'hall', 'regulatory-writing': 'archive' };
  function boxFor(st) {
    if (st.phase !== 0 || !CH[st.i].walk) return BOXES[ROOM[CH[st.i].id] || 'study'];
    const a = BOXES[ROOM[CH[st.i - 1].id] || 'study'], b = BOXES[ROOM[CH[st.i].id] || 'study'], both = BOXES[CH[st.i].pair || 'both'];
    return st.m < .5 ? boxMix(a, both, sstep(0, .3, st.m)) : boxMix(both, b, sstep(.7, 1, st.m));
  }

  // ---------- the views ----------
  // The room's views look level (the picture shifted by the lens, so verticals stay upright) and are
  // framed for the window they are seen in: their highest things just below the letterhead, their foot
  // just above the chapter's words, the things that must show across them inside; the lens widens only
  // as far as that needs. The title page's view looks squarely down at the page.
  let W = 0, H = 0, aspect = 1.6, capTops = [], edCompact = false, listRight = 0, footTop = 1;
  const SCR = STUDY.SCREEN, SCR_TOP = SCR[0][1] + .13, SCR_FOOT = SCR[2][1] - .13;
  // the editor's own size: 1000 px wide, in the glass's proportions
  const ED_W = 1000, ED_H = ED_W * (SCR[0][1] - SCR[2][1]) / (SCR[1][0] - SCR[0][0]);
  const VIEWS = {
    wide: { p: [6.5, 10.4, 19.5], fov: 40, gap: 0, cap: .985, top: [[6.5, SCR_TOP, -5.3], [12.9, STUDY.WIN.y1 + .35, -7], [-1.05, 5.95, -6.9]], foot: [6.5, 0, STUDY.DESK.z0], safe: [[-4.2, 4, -7], [16.4, 4, -7]] },
    // (the contents' words are on the screen: the whole display shows, down to its stand's foot)
    // (the eye a little high, so the slope before the display stays below the frame, never cut by it)
    display: { p: [6.5, 8.6, 6.0], fov: 40, gap: .04, top: [[6.5, SCR_TOP, -5.3]], foot: [6.5, 0, STUDY.CUP[2] + 1.05], safe: [[2.9, 4, -5.3], [10.1, 4, -5.3], [STUDY.CUP[0] + 1.1, 1, STUDY.CUP[2]]] },
    // 02: level with the record and facing it down the hall, the whole of it from its cartouche to its
    // plinth, its ends inside the frame
    // (its lettering kept clear of the chapter list down the left, where the list shows: clearList)
    record: { p: [-32.5, 9.2, -32], fov: 40, gap: .035, top: [[-32.5, RECORD_TOP + .5, FACE]], foot: [-32.5, HALL.FLOOR, FACE + .6], safe: [[BAND.x0 - 1.4, 4, FACE], [BAND.x1 + 1.4, 4, FACE]], clearList: true },
    // 03: in the archive, facing east down its table, the dossier before the camera: from its cover
    // standing up as it closes to its near edge, the binder open across its width
    archive: { p: [-66.6, 8.6, ARCHIVE.DOSSIER.z], yaw: -90, fov: 52, gap: .03, top: [[ARCHIVE.DOSSIER.x, 4.4, ARCHIVE.DOSSIER.z]], foot: [ARCHIVE.DOSSIER.x + 2.1, ARCHIVE.TABLE.top, ARCHIVE.DOSSIER.z], safe: [[ARCHIVE.DOSSIER.x, 0, ARCHIVE.DOSSIER.z + 6], [ARCHIVE.DOSSIER.x, 0, ARCHIVE.DOSSIER.z - 3.4]], clearList: true },
  };
  const headRow = () => (76 + 18) / Math.max(1, H);   // the letterhead's foot, and a little air
  function compose(v, capTop) {
    // (a view faces south unless it says otherwise: yaw, degrees from -z toward +x; its points are
    // measured along the way it faces (depth) and across it)
    const [cx, cy, cz] = v.p, yw = (v.yaw || 0) * Math.PI / 180, fx = Math.sin(yw), fz = -Math.cos(yw);
    const depth = q => (q[0] - cx) * fx + (q[2] - cz) * fz, across = q => (q[0] - cx) * -fz + (q[2] - cz) * fx;
    const tn = q => (cy - q[1]) / depth(q);
    // (the view's foot stays above the chapter's words and above the stationery's foot line)
    const topRow = headRow(), footRow = Math.min(capTop, footTop) - v.gap, tTop = Math.min(...v.top.map(tn)), tFoot = tn(v.foot);
    let T = Math.tan(v.fov * Math.PI / 360);
    T = Math.max(T, .5 * (tFoot - tTop) / Math.max(.2, footRow - topRow));
    // (the share of the frame's width the view may use either side of its middle: all of it, or what
    // the chapter list leaves)
    const room = v.clearList && listRight > 0 ? Math.max(.4, 1 - 2 * (listRight + 18) / Math.max(1, W)) : 1;
    for (const q of v.safe) T = Math.max(T, Math.abs(across(q)) / depth(q) / aspect * 1.04 / room);
    T = Math.min(T, Math.tan(35 * Math.PI / 180));
    return { p: v.p, yaw: v.yaw || 0, pitch: 0, fov: 2 * Math.atan(T) * R2D, sx: 0, sy: .5 + tFoot / (2 * T) - footRow };
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
      record: compose(VIEWS.record, capTops[2] || .94),
      archive: compose(VIEWS.archive, capTops[3] || .8),
    };
  }
  // the sheet the page is shown as while loading: the same squared view, the page filling the sheet
  function sheetPose() {
    const s = stage.getBoundingClientRect(), r = page.getBoundingClientRect();
    return pagePose(r.height / Math.max(1, H), (r.top - s.top + r.height / 2) / Math.max(1, H));
  }
  // the record's card shown while loading 02: straight before the record's band, at the distance where
  // a unit of it is the card's unit on the screen, the lens shifted so the band sits where the card is
  // (the page's first script set the card: --rc-u, --rc-x, --rc-y)
  function recordCardPose() {
    const s = stage.getBoundingClientRect(), cs = getComputedStyle(root), num = n => parseFloat(cs.getPropertyValue(n)) || 0;
    const u = num('--rc-u') || 20, T = Math.tan(20 * Math.PI / 180), D = Math.max(1, H) / (2 * T * u);
    const cx = num('--rc-x') - s.left + LAYOUT.w * u / 2, cy = num('--rc-y') - s.top + LAYOUT.h * u / 2;
    return { p: [(CARD.x0 + CARD.x1) / 2, (CARD.top + CARD.bottom) / 2, FACE + D], yaw: 0, pitch: 0, fov: 40, sx: cx / Math.max(1, W) - .5, sy: .5 - cy / Math.max(1, H) };
  }
  // the label card shown while loading 03: straight above the dossier's label (looking down, its head
  // away), at the distance where the label's width is the card's, the lens shifted to where the card is
  function labelCardPose() {
    const s = stage.getBoundingClientRect(), r = dosLabel.getBoundingClientRect(), L = archive.dossier.label, T = Math.tan(20 * Math.PI / 180);
    const c = [0, 1, 2].map(j => L.reduce((a, q) => a + q[j], 0) / 4), across = Math.abs(L[0][2] - L[1][2]);
    const D = across * Math.max(1, H) / (2 * T * Math.max(1, r.width));
    return { p: [c[0], c[1] + D, c[2]], yaw: -90, pitch: -89.5, fov: 40, sx: (r.left - s.left + r.width / 2) / Math.max(1, W) - .5, sy: .5 - (r.top - s.top + r.height / 2) / Math.max(1, H) };
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
  // a chapter's resting place: just into its dwell, after any performance (a stray touch does not move
  // the camera, and scrolling back moves it again almost at once)
  const restP = i => i === 0 ? 0 : i + CH[i].B + (1 - CH[i].B) * .12;
  // where the scroll is: moving to chapter i (phase 0, m of the way), its object performing (phase 1, k
  // of it), or at rest (phase 2)
  const at = P => {
    const i = Math.min(S - 1, Math.max(0, Math.floor(P))), u = Math.min(1, P - i), c = CH[i];
    if (i > 0 && u < c.A) return { i, phase: 0, m: u / c.A, k: 0 };
    if (u < c.B) return { i, phase: 1, m: 0, k: (u - c.A) / (c.B - c.A) };
    return { i, phase: 2, m: 0, k: 1 };
  };
  // whose words show: the arriving chapter's once the camera is nearly there
  const capOf = st => st.phase !== 0 ? st.i : st.m < .06 ? st.i - 1 : st.m < (CH[st.i].record ? .45 : .8) ? -1 : st.i;
  // how full the record is: empty until the camera has arrived before it, full once it has performed
  const fillOf = st => RI < 0 ? 0 : st.i > RI ? 1 : st.i < RI ? 0 : st.phase === 0 ? 0 : st.k;

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
  // the contents on the display: a practice not yet built stays where it is (the look test), and the
  // screen's foot says so for a moment
  if (ed) {
    const hint = ed.querySelector('.ed-hint');
    let hintT = 0;
    ed.querySelectorAll('.ed-toc a').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      if (!hint) return;
      hint.classList.add('soon'); clearTimeout(hintT); hintT = setTimeout(() => hint.classList.remove('soon'), 2400);
    }));
  }

  // ---------- the words ----------
  let active = -2;
  function activate(c) {
    if (c === active) return;
    active = c;
    const cap = c >= 0 ? CH[c].cap : null;
    // (the paper glow is for a caption's headline; 02's words are on the record, its line needs none)
    stage.dataset.cap = cap && !CH[c].record ? 'on' : 'off';
    CH.forEach((ch, j) => { if (ch.cap) ch.cap.classList.toggle('on', j === c); });
    if (c >= 0) {
      stage.dataset.ch = CH[c].id;
      // (a chapter at night sets its words in light ink over the dark room; the letterhead stays paper)
      stage.dataset.dark = CH[c].hour === 'night' ? 'on' : 'off';
      // the address names the chapter (shared, it opens there); the title page keeps the plain address
      try { history.replaceState(null, '', c > 0 ? `#${CH[c].id}` : location.pathname + location.search); } catch (e) { /* sandboxed */ }
      if (lhRun) lhRun.textContent = (CH[c].cap && CH[c].cap.dataset.name) || '';
      list.forEach(a => { if (a.getAttribute('href') === `#${CH[c].id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
  }

  // ---------- the 3D ----------
  let world = null, study = null, hall = null, archive = null, ready = false, benchMs = 0;
  const logo = new Image();
  logo.src = sec.dataset.logo;
  // (how far the loading has got, for whichever loader shows: set on the page's root, inherited)
  let loadP = 0, loaderK = 0;
  const setP = v => { loadP = Math.max(loadP, v); root.style.setProperty('--hs-p', String(Math.max(+(root.style.getPropertyValue('--hs-p') || 0), v))); };
  function sizeUp() {
    W = stage.clientWidth; H = stage.clientHeight; aspect = W / Math.max(1, H);
    heads.forEach(h => h && splitLines(h));
    // where each chapter's words begin, as a share of the stage's height (the views sit just above)
    const s = stage.getBoundingClientRect();
    capTops = CH.map(c => c.cap ? (c.cap.getBoundingClientRect().top - s.top) / Math.max(1, H) : 1);
    // where the chapter list ends on the left (0 when it is not shown), where the foot line begins
    const listEl = sec.querySelector('.hs-list'), lr = listEl && listEl.offsetParent ? listEl.getBoundingClientRect() : null;
    listRight = lr && lr.width > 0 ? lr.right - s.left : 0;
    const fb = sec.querySelector('.hf-bar');
    footTop = fb ? Math.min(1, (fb.getBoundingClientRect().top - s.top) / Math.max(1, H)) : 1;
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
    // (the pen's ink for every logo on the page, worked out once, now, while the loader shows)
    const inked = warmLogoInk().catch(() => null);
    await Promise.all([fonts, logoIn, inked]);
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
    // the library hall, through the doorway (section 11.12), merged as the study is
    hall = buildHall({ hi: big });
    bake(hall.group);
    world.scene.add(hall.group);
    addHallLights();
    mark('hall');
    // the archive, through the hall's east door (03)
    archive = buildArchive({ hi: big });
    bake(archive.group);
    world.scene.add(archive.group);
    addArchiveLights();
    mark('archive');
    world.addLamp({ at: study.lamp.at, aim: study.lamp.aim, power: 46, angle: .58 });
    world.addGlow(study.lamp.bulb, { size: 1.5, k: .85 });
    // the sun's shadows: drawn over the room the camera is in (BOXES), widened on the way between two
    setBox(BOXES.study);
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
    const wait = Math.max(0, (REDUCE ? 200 : 2000) - (performance.now() - t0));
    // (and not before the loader's logo has been written: the camera draws back from a finished page)
    Promise.all([new Promise(r => setTimeout(r, wait)), loaderDrawn]).then(() => {
      if (STATIC) { finishIntro(); return; }
      mark('intro');
      if (fromI === AI && AI >= 0) {
        // the archive: the camera stands over the dossier, square above its label, where the 3D label
        // fills the card (the label is laid on it where the card already is), the paper clears, and the
        // camera draws back and up to the archive's view
        introFrom = labelCardPose();
        introStart = performance.now();
        world.aim(introFrom);
        placeLabel();
        page.classList.add('quad');
        root.classList.add('hs-in'); root.classList.remove('hs-loading', 'hs-lock');
        if (veil) veil.classList.add('off');
        wake();
        return;
      }
      if (fromI === RI) {
        // the record: the camera stands where the 3D band fills the card, its words are laid on the band
        // where the card already is (no jump), the paper and the card clear, and the camera draws back
        introFrom = recordCardPose();
        introStart = performance.now();
        world.aim(introFrom);
        placeRecord(1);
        page.classList.add('quad');
        root.classList.add('hs-in'); root.classList.remove('hs-loading', 'hs-lock');
        if (veil) veil.classList.add('off');
        wake();
        return;
      }
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
  // (the drawing plays at twice version B's pace here: about two and a quarter seconds, so the loader is
  // not held for it)
  const HEAD_EVERY = 20000, LOGO_SPEED = 2;
  const sheetLogo = page && page.querySelector('.pg-logo.ld'), bootLogo = ed && ed.querySelector('.ed-logo.ld'), headLogo = sec.querySelector('.lp-lh-logo .ld');
  const crestLogo = recParts && recParts.crest ? recParts.crest.querySelector('.ld') : null;
  // 03's label (laid on the dossier's cover; on 03's loader, the card)
  const dos = sec.querySelector('.hs-dos'), dosLabel = dos && dos.querySelector('.dos-label'), dosLogo = dosLabel && dosLabel.querySelector('.ld');
  const players = new Map();
  const playerOf = el => { if (!el) return null; if (!players.has(el)) players.set(el, createLogoPlayer(el, { speed: LOGO_SPEED })); return players.get(el); };
  let loaderDrawn = Promise.resolve();
  if (!STATIC && !REDUCE) {
    if (fromI === 0 && sheetLogo) loaderDrawn = playerOf(sheetLogo).play();
    else if (fromI === 1 && bootLogo) loaderDrawn = playerOf(bootLogo).play().then(() => { ed.classList.add('docked'); return new Promise(r => setTimeout(r, 750)); });
    else if (fromI === RI && crestLogo) loaderDrawn = playerOf(crestLogo).play();
    else if (fromI === AI && AI >= 0 && dosLogo) loaderDrawn = playerOf(dosLogo).play().then(() => { dos.classList.add('stamped'); return new Promise(r => setTimeout(r, 650)); });
  }
  // (03's label waits with its logo not yet written, unless its own loader is writing it now; there the
  // stamp is pressed once the logo is written: house.css)
  if (dosLogo && !(fromI === AI && !STATIC)) dosLogo.classList.add('ld-first');
  if (dos && fromI === AI && AI >= 0 && !STATIC) dos.classList.add('on');
  // (02's cartouche waits with its logo not yet written, unless its own loader is writing it now; on the
  // loader's card the headline is typed and the boards follow at once)
  if (crestLogo && !(fromI === RI && !STATIC)) crestLogo.classList.add('ld-first');
  // (on 02's own loader the words are still: the headline whole, the figures at their full counts; only
  // the logo is drawn)
  if (fromI === RI && !STATIC && rec) setTimeout(() => { recArrived = crestArrived = true; rec.classList.add('typed'); }, 0);

  // ---------- the stationery's foot: its button opens and closes it; at the film's end it opens by itself
  // (and closes again when the reader scrolls back, unless the reader opened it) ----------
  const foot = sec.querySelector('.hs-foot'), footBtn = foot && foot.querySelector('.hf-toggle'), footPanel = foot && foot.querySelector('.hf-panel');
  let footBy = '';
  function setFoot(open, by = '') {
    if (!foot) return;
    foot.dataset.open = open ? 'true' : 'false';
    footBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) footPanel.removeAttribute('inert'); else footPanel.setAttribute('inert', '');
    footBy = open ? by : '';
  }
  if (footBtn) footBtn.addEventListener('click', () => setFoot(foot.dataset.open !== 'true', 'reader'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && foot && foot.dataset.open === 'true') { setFoot(false); footBtn.focus(); } });
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

  // ---------- the hall's lamps: they come on as the light goes and the reader walks in ----------
  // The record's light (a wide spot from the ceiling, coming up as the record fills), a warm light from
  // the pendants for the room, and the glows: the pendants', the reading lamps' (with their pools on the
  // tables) and each bay's picture light (lit as its bay fills)
  let recLight = null, roomLight = null;
  const hallGlows = [], bayGlows = [], pools = [];
  let poolTex = null;
  function addHallLights() {
    recLight = world.addLamp({ at: [-32.5, 33, -50], aim: [-32.5, 7, FACE], power: 80, angle: .64, penumbra: .8, shadow: false, decay: 1, color: '#FFDDB2' });
    world.setLampK(recLight, 0);
    roomLight = new THREE.PointLight('#FFD3A0', 0, 120, 1);
    roomLight.position.set(-32.5, 24, -44);
    world.scene.add(roomLight);
    hall.pendants.forEach(p => hallGlows.push({ s: world.addGlow(p, { size: 7, k: 0, color: '#FFE0B0' }), k: .8 }));
    hall.lamps.forEach(p => hallGlows.push({ s: world.addGlow(p, { size: 3.2, k: 0, color: '#FFE6B8' }), k: .9 }));
    hall.bayLamps.forEach(p => bayGlows.push(world.addGlow(p, { size: 4.5, k: 0, color: '#FFE2B4' })));
    // the reading lamps' pools of light on the tables (drawn over the wood, left out of the normals)
    poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    hall.lamps.forEach(([x, y, z]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), new THREE.MeshBasicMaterial({ map: poolTex, color: '#FFB86A', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, y - 1.43, z); m.userData.noG = true; m.renderOrder = 2;
      world.scene.add(m); pools.push(m);
    });
  }
  // how far the hall's lamps are on (0 to 1), how full the record is: set each frame
  const hallState = { on: -1, fill: -1 };
  function hallLamps(on, fill, shares) {
    if (!hall || (Math.abs(on - hallState.on) < 1e-4 && Math.abs(fill - hallState.fill) < 1e-4)) return;
    hallState.on = on; hallState.fill = fill;
    world.setLampK(recLight, on * (.25 + .75 * fill));
    roomLight.intensity = 32 * on;
    hallGlows.forEach(g => { g.s.material.opacity = g.k * on; });
    pools.forEach(p => { p.material.opacity = .42 * on; });
    bayGlows.forEach((s, b) => { s.material.opacity = .85 * on * Math.min(1, (shares ? shares[b] : fill) * 3); });
    world.dirty = true;
  }

  // ---------- the archive's lamps: the two pendants over its table (the first lights the dossier, with its
  // shadows), their glows, a warm light for the room; on as the reader walks in ----------
  let arcLights = [], arcRoom = null;
  const arcGlows = [];
  function addArchiveLights() {
    arcLights = archive.lamps.map(([x, y, z], i) => world.addLamp({ at: [x, y - .2, z], aim: [i === 0 ? ARCHIVE.DOSSIER.x : x, ARCHIVE.TABLE.top, z], power: i === 0 ? 46 : 34, angle: 1.0, penumbra: .75, decay: 1.25, shadow: i === 0, color: '#FFD6A0' }));
    arcLights.forEach(l => world.setLampK(l, 0));
    arcRoom = new THREE.PointLight('#FFCF98', 0, 90, 1);
    arcRoom.position.set(-84, 15, -46);
    world.scene.add(arcRoom);
    archive.pendants.forEach(p => arcGlows.push(world.addGlow(p, { size: 4.2, k: 0, color: '#FFE0B0' })));
  }
  const arcState = { on: -1 };
  function archiveLamps(on) {
    if (!archive || Math.abs(on - arcState.on) < 1e-4) return;
    arcState.on = on;
    arcLights.forEach(l => world.setLampK(l, on));
    arcRoom.intensity = 40 * on;
    arcGlows.forEach(s => { s.material.opacity = .85 * on; });
    world.dirty = true;
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
  // (laid-on words are drawn over the 3D, never behind its walls: each room's words show only while the
  // camera is in that room; the study's end at its back wall)
  const inStudy = () => world.camera.position.z > STUDY.WALL - .55;
  function placeEditor() {
    if (!ed || !world) return;
    if (fromI === 1 && !introStart && !introDone) return;   // (the editor is the loader's card until its intro begins)
    const q = inStudy() ? project4(SCR) : null;
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
    const q = inStudy() ? project4(study.manuscript()) : null;
    if (q) { const tf = quad(page.offsetWidth, page.offsetHeight, q); if (pgState.tf !== tf) { pgState.tf = tf; page.style.transform = tf; } }
    if (pgState.gone !== !q) { pgState.gone = !q; page.classList.toggle('far', !q); }
  }
  function editorDocs(docMix, live) {
    if (!ed) return;
    docs.forEach(el => { const v = (docMix[el.dataset.doc] || 0).toFixed(3); if (el.dataset.op !== v) { el.dataset.op = v; el.style.opacity = v; el.style.visibility = +v > 0 ? 'inherit' : 'hidden'; } });
    if (edState.live !== live) { edState.live = live; ed.classList.toggle('live', live); ed.setAttribute('aria-hidden', live ? 'false' : 'true'); }
  }
  // 02: the record's words, laid on its band in perspective (each part at its own size: record-layout.js,
  // set out at REC_PX to a unit); shown once the camera is through the doorway, so they are never drawn
  // over the study's wall
  if (recParts) [recParts.crest, recParts.frieze, ...recParts.boards].forEach((el, j) => { const r = j === 0 ? LAYOUT.crest : j === 1 ? LAYOUT.frieze : LAYOUT.boards[j - 2]; if (el) { el.style.width = `${r.w * REC_PX}px`; el.style.height = `${r.h * REC_PX}px`; } });
  // (seen from the study the record shows through the doorway: its words are laid on it from then on,
  // cut to the doorway's opening, so they are never drawn over the study's wall; recSeen: whether the
  // frieze is in the frame and in sight, for its words' arrival)
  const recState = { tf: [], vis: '', clip: '' };
  let recSeen = false, crestSeen = false;
  const D0 = STUDY.DOOR, DZ = STUDY.WALL - .25, doorPts = [[D0.x0, D0.top, DZ], [D0.x1, D0.top, DZ], [D0.x1, STUDY.FLOOR, DZ], [D0.x0, STUDY.FLOOR, DZ]];
  const inside = (pt, poly) => { let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], c = (b[0] - a[0]) * (pt[1] - a[1]) - (b[1] - a[1]) * (pt[0] - a[0]); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };
  function placeRecord(vis) {
    if (!recParts || !hall) return;
    if (fromI === RI && !introStart && !introDone) return;   // (the words are the loader's card until its intro begins)
    let clip = 'none', d = null;
    if (vis > 0 && inStudy()) {
      d = project4(doorPts);
      if (d) clip = `polygon(${d.map(p => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',')})`; else vis = 0;
    }
    // (in sight: its middle inside the frame below the letterhead and above the foot line, and through
    // the doorway when the camera is in the study)
    const top = headRow() * H, foot = footTop * H;
    const sighted = qs => { if (vis <= 0) return false; const q = project4(qs); if (!q) return false; const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]; return c[0] > 0 && c[0] < W && c[1] > top && c[1] < foot && (!d || inside(c, d)); };
    recSeen = sighted(hall.frieze); crestSeen = sighted(hall.crest);
    if (recState.clip !== clip) { recState.clip = clip; rec.style.clipPath = clip; }
    const els = [recParts.crest, recParts.frieze, ...recParts.boards], quads = [hall.crest, hall.frieze, ...hall.boards];
    if (vis > 0) els.forEach((el, j) => { if (!el) return; const q = project4(quads[j]); const tf = q ? quad(el.offsetWidth, el.offsetHeight, q) : 'scale(0)'; if (recState.tf[j] !== tf) { recState.tf[j] = tf; el.style.transform = tf; } });
    const v = vis.toFixed(3);
    if (recState.vis !== v) { recState.vis = v; rec.style.opacity = v; rec.style.visibility = vis > 0 ? 'visible' : 'hidden'; }
  }
  // 02's words arrive each on its own, as it comes into sight: the headline is typed when the frieze
  // does, the pen writes the cartouche's logo when the cartouche does (the boards need neither: their
  // figures count as their bays fill); when the reader leaves, each is made ready to arrive again
  let recArrived = false, crestArrived = false;
  function recArrive(on) {
    if (!rec || on === recArrived) return;
    recArrived = on;
    rec.classList.toggle('typed', on);
    typeHeadline(on);
  }
  function crestArrive(on) {
    if (!rec || on === crestArrived) return;
    crestArrived = on;
    const p = crestLogo ? playerOf(crestLogo) : null;
    if (!p) return;
    if (on) { if (REDUCE) p.settle(); else p.play(); } else p.reset();
  }

  // 03: the dossier's label, laid on its closed cover once the cover has closed (the pen writes the logo,
  // the stamp is pressed: house.css); shown only while the camera is in the archive
  // (on 03's own loader the label is already on, its logo written: the intro does not write it again)
  const dosState = { tf: '', on: fromI === AI && !STATIC, vis: '' };
  function placeLabel() {
    if (!dos || !archive) return;
    if (fromI === AI && !introStart && !introDone) return;   // (the label is the loader's card until its intro begins)
    const here = world.camera.position.x < ARCHIVE.X1 - .5, closed = dosK >= archive.dossier.closeAt - .005;
    const q = here && closed ? project4(archive.dossier.label) : null;
    if (q) { const tf = quad(dosLabel.offsetWidth, dosLabel.offsetHeight, q); if (dosState.tf !== tf) { dosState.tf = tf; dosLabel.style.transform = tf; } }
    const vis = q ? 'visible' : 'hidden';
    if (dosState.vis !== vis) { dosState.vis = vis; dosLabel.style.visibility = vis; }
    const on = !!q;
    if (on !== dosState.on) {
      dosState.on = on;
      dos.classList.toggle('on', on);
      const p = dosLogo ? playerOf(dosLogo) : null;
      // (the stamp is pressed once the logo is written)
      if (!on) { dos.classList.remove('stamped'); if (p) p.reset(); }
      else if (!p || REDUCE) { if (p) p.settle(); dos.classList.add('stamped'); }
      else p.play().then(() => { if (dosState.on) dos.classList.add('stamped'); });
    }
  }

  // the figures count up as their bays fill (a bay not begun shows its words only)
  const counts = recParts ? recParts.boards.map(el => ({ n: el.querySelector('.rec-n'), to: +el.dataset.to || 0, plus: el.dataset.plus || '', shown: null })) : [];
  const fmt = v => v.toLocaleString('en-GB');
  function countUp(shares) {
    counts.forEach((c, b) => {
      const s = shares ? shares[b] : 0, v = Math.round(c.to * s), t = s >= 1 ? fmt(c.to) + c.plus : v < 1 ? '' : fmt(v);
      if (c.shown !== t) { c.shown = t; if (c.n) c.n.textContent = t; }
    });
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
  let Pr = startP, time = 0, last = 0, raf = 0, lastKey = '', lastShow = 0, probe = null, recShares = null, dosK = 0;
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
    // (while a chapter's loader plays and the camera draws back, the list already names that chapter)
    if (introDone) activate(capOf(st)); else if (introStart) activate(fromI);
    // the scroll cue: at the title page only, until the reader scrolls
    const cue = introDone && Pt < .02 && !glide ? 'on' : 'off';
    if (stage.dataset.cue !== cue) stage.dataset.cue = cue;
    // and at the record, while it fills (from the moment the camera settles before it)
    const stP = at(Math.min(Pr, S - 1e-6));
    // (and at the archive while the dossier is made: each chapter that performs says so in its own words)
    const performing = introDone && !glide && (stP.i === RI || stP.i === AI) && ((stP.phase === 0 && stP.m > .94) || (stP.phase === 1 && stP.k < .985));
    const fillCue = !performing ? 'off' : stP.i === RI ? 'on' : 'dos';
    if (stage.dataset.fill !== fillCue) stage.dataset.fill = fillCue;
    // 02's words: they arrive with the reader (once the camera is nearly before the record) and are made
    // ready to arrive again when the reader walks away
    // (they arrive as soon as they come into the frame, the camera through the doorway: the headline is
    // typed and the logo written while the camera is still on its way; the shelves fill only once it has
    // stopped before them)
    if (rec && RI >= 0) {
      // (walking on from the record, its words stay on it while it is in view: neither here nor away)
      const leaving = stP.i === RI + 1 && stP.phase === 0;
      const here = !introDone ? fromI === RI : (stP.i === RI && (stP.phase > 0 || recSeen)) || leaving;
      const away = !introDone ? fromI !== RI : !leaving && (stP.i !== RI || (stP.phase === 0 && !recSeen && stP.m < .3));
      if (here) recArrive(true); else if (away) recArrive(false);
      const crestHere = !introDone ? fromI === RI : (stP.i === RI && (stP.phase > 0 || crestSeen)) || leaving;
      if (crestHere) crestArrive(true); else if (away) crestArrive(false);
    }
    // the foot opens by itself at the film's end
    if (foot) {
      const atEnd = introDone && Pt > S - .02;
      if (atEnd && !footBy) setFoot(true, 'end'); else if (!atEnd && footBy === 'end') setFoot(false);
    }
    // coming back to 02: on the loader's card the figures count, bay by bay, as the house loads
    if (!introStart && !introDone && RI >= 0 && fromI === RI) countUp(counts.map(() => 1));
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
      if (b.walk) {
        // a walk: one continuous way through its points (route.js), the day going as it goes
        cam = WALKS[b.walk].pose(V[a.view], V[b.view], st.m); hA = a.hour; hB = b.hour; hK = easeSine(st.m); spot = 0;
      } else if (b.via) {
        if (st.m < b.split) { const k = easeSine(st.m / b.split); cam = lerpPose(V[a.view], V[b.via], k); hA = a.hour; hB = b.hour; hK = k; spot = a.spot * (1 - k); }
        else { const k = easeSine((st.m - b.split) / (1 - b.split)); cam = lerpPose(V[b.via], V[b.view], k); hA = b.hour; spot = 0; }
      } else { const k = easeSine(st.m); cam = lerpPose(V[a.view], V[b.view], k); hA = a.hour; hB = b.hour; hK = k; spot = mix(a.spot, b.spot, k); }
      // (the display's document changes on the way, unless both chapters keep the same one)
      const d = sstep(.55, .85, st.m); docMix[a.doc] = 1 - d; docMix[b.doc] = (docMix[b.doc] || 0) + d;
    } else { const c = CH[st.i]; cam = V[c.view]; hA = c.hour; spot = c.spot; docMix[c.doc] = 1; }
    // (a held pose for review: in its own hour if it names one, without the title page's pool)
    if (probe) { cam = { yaw: 0, pitch: 0, sx: 0, sy: 0, fov: 40, ...probe }; spot = probe.spot || 0; if (probe.hour) { hA = probe.hour; hB = probe.hourB || null; hK = probe.hourK || 0; } }
    // the sun's shadows over the room the camera is in (or both, on the way)
    setBox(probe && probe.box ? BOXES[probe.box] : !introDone ? BOXES[ROOM[CH[fromI].id] || 'study'] : boxFor(st));
    world.setHour(hA, hB || hA, hK);
    // (the contents on the display can be used whenever they are what it shows, wherever the camera is,
    // as long as the display is in view)
    editorDocs(docMix, introDone && (docMix.contents || 0) > .5 && inStudy());
    // the hall: its lamps come on as the reader walks in; the record fills as it performs
    if (hall) {
      const ci = introDone ? st.i : fromI;
      const on = probe && probe.lamps !== undefined ? probe.lamps : RI < 0 ? 0 : ci > RI ? 1 : ci < RI ? 0 : !introDone || st.phase > 0 ? 1 : sstep(.38, .82, st.m);
      const fill = probe && probe.fill !== undefined ? probe.fill : !introDone ? (fromI >= RI ? 1 : 0) : fillOf(st);
      const sh = hall.record.setFill(fill);
      if (sh) { recShares = sh; world.dirty = true; }
      hallLamps(on, fill, recShares);
      countUp(recShares);
    }
    // the archive: its lamps come on as the reader walks in; the dossier is made as 03 performs
    if (archive && AI >= 0) {
      const ci = introDone ? st.i : fromI;
      const on = probe && probe.lamps !== undefined ? probe.lamps : ci > AI ? 1 : ci < AI ? 0 : !introDone || st.phase > 0 ? 1 : sstep(.4, .85, st.m);
      archiveLamps(on);
      const dk = probe && probe.dossier !== undefined ? probe.dossier : !introDone ? (fromI >= AI ? 1 : 0) : ci > AI ? 1 : ci < AI || st.phase === 0 ? 0 : st.k;
      // (its pieces cast the lamp's shadows: drawn again as they move)
      if (archive.dossier.set(dk)) world.shadowsDirty();
      dosK = dk;
    }
    const key = `${poseKey(cam)}|${spot.toFixed(4)}`, moved = key !== lastKey;
    watch(dt * 1000, moved);   // (before drawing: a change of tier is drawn in this same frame)
    let show = false;
    if (moved || world.dirty) {
      world.aim(cam);
      placePage();
      spotOn(spot);
      world.draw(); lastKey = key;
      placeEditor();
      // (the record's words as a chapter's words come: once the camera is nearly there, and only ever
      // with it through the doorway)
      // (on the walk they show as the record comes into the frame, the camera through the doorway)
      // (and walking on to the archive they stay on the record until the camera is through the door)
      const recVis = probe ? 1 : !introDone ? (fromI === RI ? 1 : 0) : st.i === RI || (st.i === RI + 1 && st.phase === 0) ? 1 : 0;
      placeRecord(recVis * sstep(ARCHIVE.X1 + .2, ARCHIVE.X1 + 2.5, cam.p[0]));
      placeLabel();
      show = true;
    }
    life(time, 1 - spot * .8);
    if (show || (motion && now - lastShow >= 33)) { world.present(); lastShow = now; }
    // keep running while anything is on its way (the scroll's smoothing, a glide, the intro); at rest
    // the loop runs only for the living things (and not at all with reduced motion)
    return glide || Pt !== Pr || moved || !introDone || motion;
  }
  // (at most about sixty frames a second: on a faster screen, 120 Hz and up, a refresh is let go when
  // drawing on it would come sooner than a sixtieth of a second after the last frame. The film moves as
  // smoothly; the GPU does half the work, so a laptop runs cooler and quieter)
  const FRAME_MS = 1000 / 60;
  let refreshMs = FRAME_MS, lastTick = 0;
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    if (lastTick) refreshMs = refreshMs * .9 + Math.min(50, now - lastTick) * .1;
    lastTick = now;
    if (last && now - last + refreshMs * .5 < FRAME_MS) { raf = requestAnimationFrame(loop); return; }
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
    restP, scrollFor, chapters: CH.map(c => c.id), A: CH[S - 1].A, As: CH.map(c => c.A), Bs: CH.map(c => c.B), get bench() { return benchMs; }, marks,
    get state() { const st = at(Math.min(Pr, S - 1e-6)); return { P: +Pr.toFixed(4), i: st.i, phase: st.phase, m: +st.m.toFixed(3), k: +st.k.toFixed(3), fill: +fillOf(st).toFixed(3), cam: world ? world.camera.position.toArray().map(v => +v.toFixed(2)) : null }; },
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
