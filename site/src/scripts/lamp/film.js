/* The lamplight film (src/pages/lamplight/index.astro): a tall track whose stage stays pinned while
   the scroll reads through the chapters (chapters.js) of one document over one day, in one house
   joined by its windows and doors (site/docs/redesign-plan.md, section 10.3). The camera really
   travels, on one smooth path for each move: the study (the drawn room, laid out in depth: study.js)
   is a set it moves through, and each room is joined to the next at an opening (a portal: the next
   room is placed beyond the door or window so the path runs on into it and ends at its rest), so a
   move is one continuous flight, the rooms changing as the camera passes the opening. Through the
   study's window: to the window as the light goes, out through it, and the eyes go up to the stars;
   then down through the archive's roof along the moonbeam; down the aisle and through the far door
   into the reading room; dawn in its windows, next door into the auditorium, across the hall into the
   workshop room; back at the desk, in to the display; out to the desk in the late afternoon; and out
   through the window at sunset toward the horizon. Inside a chapter nothing moves: the camera holds
   still. The scroll is followed on a spring, and a stop part way through a move is finished in the
   direction the reader was going.
   The page is drawn as on the design board (sheets.js): in the study it is the document open on the
   display (an editor laid over the drawing), elsewhere a sheet of paper standing in its room, whose
   ink settles in as the camera arrives; the record's page becomes a star, in the middle of the sky.
   Each chapter's cards (the digital layer) stand beside its page once it has settled. Around it the
   furniture (the letterhead, by day a running head, the folio, a footnote) and one caption a chapter:
   a headline that rises line by line, one line, one action. The 3D (renderer.js) loads on its own, so
   the words never wait for it; without WebGL they still follow the scroll.
   Review switch: ?static skips the loading screen. Test hook: window.mewritLamp. */
import { clamp, REDUCE, STATIC } from '../shared.js';
import { CHAPTERS } from './chapters.js';
import { fitShot, turnDir, placement, apply, norm, sub } from './fit.js';
import { splitLines, typer } from './text.js';
import { osf } from './figures.js';
import { studyLayers, drawStudyLayer, drawOutside, STUDY_X, DESK, SCREEN3, WIN, OUTSIDE } from './study.js';
import { drawPage, drawStar } from './sheets.js';

const sec = document.getElementById('lp');
if (sec) start();

function start() {
  const root = document.documentElement;
  const track = sec.querySelector('.lp-track'), stage = sec.querySelector('.lp-stage'), canvas = sec.querySelector('.lp-canvas');
  const caps = CHAPTERS.map(c => sec.querySelector(`.lp-cap[data-ch="${c.id}"]`));
  const heads = caps.map(el => el && el.querySelector('.lp-hl'));
  const rhBar = sec.querySelector('.lp-rh'), rh = sec.querySelector('.lp-rh .l'), folioEl = sec.querySelector('.lp-folio'), folio = sec.querySelector('.lp-folio b');
  const fn = sec.querySelector('.lp-fn'), colo = sec.querySelector('.lp-colophon');
  const toc = [...sec.querySelectorAll('.lp-toc a')];
  const lhRun = sec.querySelector('.lh-run'), nav = [...sec.querySelectorAll('.lp-lh-nav a')];
  const cardSets = CHAPTERS.map(c => sec.querySelector(`.lp-cards[data-ch="${c.id}"]`));
  const ed = sec.querySelector('.lp-ed'), edDocs = ed ? [...ed.querySelectorAll('[data-doc]')] : [], edToc = ed ? [...ed.querySelectorAll('[data-toc]')] : [];
  const S = CHAPTERS.length;
  const big = !matchMedia('(pointer: coarse)').matches && Math.max(innerWidth, screen.width) >= 900;
  const motion = REDUCE ? 0 : 1;
  const ease = t => t * t * (3 - 2 * t), mix = (a, b, k) => a + (b - a) * k;
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeSine = t => .5 - .5 * Math.cos(Math.PI * clamp(t));
  const sstep = (a, b, x) => ease(clamp((x - a) / (b - a)));
  const type = typer(motion);
  const isStudy = i => CHAPTERS[i].world === 'study';
  const RAD = Math.PI / 180;

  // ---------- poses: an eye, where it faces, its lens ----------
  // p the eye; yaw (from -z toward +x) and pitch (up), degrees; fov; the picture's shift (sx right,
  // sy up, as fractions of the frame: a lens shift, which keeps a room's verticals upright)
  const pose = (p, yaw = 0, pitch = 0, fov = 40, sx = 0, sy = 0) => ({ p, yaw, pitch, fov, sx, sy });
  const fromShot = s => { const f = norm(sub([s[3], s[4], s[5]], [s[0], s[1], s[2]])); return pose([s[0], s[1], s[2]], Math.atan2(f[0], -f[2]) / RAD, Math.asin(f[1]) / RAD, s[6], s[7], s[8]); };
  const fwdOf = P => { const y = P.yaw * RAD, t = P.pitch * RAD; return [Math.sin(y) * Math.cos(t), Math.sin(t), -Math.cos(y) * Math.cos(t)]; };
  const levelOf = P => { const y = P.yaw * RAD; return [Math.sin(y), 0, -Math.cos(y)]; };   // ahead, on the level
  const rightOf = P => { const y = P.yaw * RAD; return [Math.cos(y), 0, Math.sin(y)]; };
  const plus = (p, ...terms) => terms.reduce((a, [v, k]) => [a[0] + v[0] * k, a[1] + v[1] * k, a[2] + v[2] * k], p);
  const UP = [0, 1, 0];
  const with_ = (P, o) => ({ ...P, ...o });

  // ---------- the camera's paths ----------
  // a path through keyed poses, walked by s from 0 to 1: every part of the pose on a smooth curve
  // through the keys (no jolt at a key), the keys spaced by the effort between them (the way travelled,
  // the turn, the change of lens) so the pace is even; the film eases s at the ends
  const PARTS = P => [P.p[0], P.p[1], P.p[2], P.yaw, P.pitch, P.fov, P.sx, P.sy];
  function makePath(keys) {
    const V = keys.map(PARTS), n = V.length, S = [0];
    for (let i = 1; i < n; i++) {
      const a = V[i - 1], b = V[i];
      S.push(S[i - 1] + Math.max(.01, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) + (Math.abs(b[3] - a[3]) + Math.abs(b[4] - a[4])) * .12 + Math.abs(b[5] - a[5]) * .08 + (Math.abs(b[6] - a[6]) + Math.abs(b[7] - a[7])) * 6));
    }
    const L = S[n - 1]; for (let i = 0; i < n; i++) S[i] /= L;
    const Tg = V.map((v, i) => v.map((_, j) => i === 0 ? (V[1][j] - V[0][j]) / (S[1] - S[0]) : i === n - 1 ? (V[n - 1][j] - V[n - 2][j]) / (S[n - 1] - S[n - 2]) : (V[i + 1][j] - V[i - 1][j]) / (S[i + 1] - S[i - 1])));
    const f = s => {
      if (s <= 0) return keys[0];
      if (s >= 1) return keys[n - 1];
      let i = 0; while (i < n - 2 && s > S[i + 1]) i++;
      const h = S[i + 1] - S[i], u = (s - S[i]) / h, u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      const v = V[i].map((a, j) => h00 * a + h10 * h * Tg[i][j] + h01 * V[i + 1][j] + h11 * h * Tg[i + 1][j]);
      return pose([v[0], v[1], v[2]], v[3], v[4], v[5], v[6], v[7]);
    };
    f.S = S;   // where each key falls along the path
    return f;
  }
  // a room placed beyond another's opening: turned about the vertical by psi and moved by t. portal(E, R)
  // places the next room so that the pose E (on the path, in the room being left) is its rest R; across()
  // carries a pose from the room being left into the next room's own frame
  const turnY = (p, psi) => { const c = Math.cos(psi * RAD), s = Math.sin(psi * RAD); return [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c]; };
  const portal = (E, R) => { const psi = R.yaw - E.yaw, q = turnY(E.p, psi); return { psi, t: [R.p[0] - q[0], R.p[1] - q[1], R.p[2] - q[2]] }; };
  const across = (P, T) => { const q = turnY(P.p, T.psi); return pose([q[0] + T.t[0], q[1] + T.t[1], q[2] + T.t[2]], P.yaw + T.psi, P.pitch, P.fov, P.sx, P.sy); };

  // ---------- the study in depth ----------
  const E0 = [STUDY_X.ex, STUDY_X.ey, STUDY_X.ez], CY0 = -36, F0 = STUDY_X.F;   // the drawing's eye, and its centre of projection (y) in the 1280 by 800 view
  const ED_W = 1000, ED_H = ED_W * (SCREEN3[0][1] - SCREEN3[3][1]) / (SCREEN3[1][0] - SCREEN3[0][0]);
  const SC = [(SCREEN3[0][0] + SCREEN3[1][0]) / 2, (SCREEN3[0][1] + SCREEN3[2][1]) / 2, SCREEN3[0][2]], SW = SCREEN3[1][0] - SCREEN3[0][0];
  // the drawing's own view of the room (the part of it in view: centre, zoom), on computers and phones
  const WIDE = { desk: { c: [700, 430], z: 1 }, phone: { c: [860, 420], z: 1 } };
  // where the display stands in the frame in the views in on it (its width, its centre, as fractions)
  const ONDESK = { desk: { display: { w: .42, x: .635, y: .5 }, close: { w: .6, x: .69, y: .5 } }, phone: { display: { w: .9, x: .5, y: .32 }, close: { w: .96, x: .5, y: .3 } } };
  const within = (v, a, b) => Math.min(b, Math.max(a, v));
  function viewRect(v, a) {
    let w = 1280 / v.z, h = 800 / v.z;
    if (a > 1.6) h = w / a; else w = h * a;
    if (w > 1280) { w = 1280; h = w / a; }
    if (h > 800) { h = 800; w = h * a; }
    return [within(v.c[0] - w / 2, 0, 1280 - w), within(v.c[1] - h / 2, 0, 800 - h), w, h];
  }
  // the study's one lens: the drawing's own view (from its eye the frame is exactly the drawing), the
  // same in every view of the room, so moving between them is a move of the camera alone
  function studyLens(aspect) {
    const [vx, vy, vw, vh] = viewRect(WIDE[layout === 'phone' ? 'phone' : 'desk'], aspect);
    return { fov: 2 * Math.atan(vh / 2 / F0) / RAD, sx: (640 - vx) / vw - .5, sy: .5 - (CY0 - vy) / vh, tn: vh / 2 / F0 };
  }
  function studyPose(name, aspect) {
    const L = studyLens(aspect);
    if (!name || name === 'wide') return pose(E0.slice(), 0, 0, L.fov, L.sx, L.sy);
    const T = ONDESK[layout === 'phone' ? 'phone' : 'desk'][name], d = SW / (T.w * 2 * aspect * L.tn);
    return pose([SC[0] - (T.x - .5 - L.sx) * 2 * aspect * L.tn * d, SC[1] + (T.y - .5 + L.sy) * 2 * L.tn * d, SC[2] + d], 0, 0, L.fov, L.sx, L.sy);
  }
  // the window: the left of its two lights, where the camera goes out
  const PANE = [(WIN.x0 + .32 + (WIN.x0 + WIN.x1) / 2) / 2, 6.95];

  // ---------- the scroll: chapter i runs from P = i to i + 1, over its span of screens ----------
  // in a chapter (u from 0 to 1): the arrival up to A (the move from the room before), then up to B[i]
  // the page's change of form where it has one, then the rest
  const A = .58, B = CHAPTERS.map((c, i) => i === 0 ? 0 : c.rest && c.rest !== c.page ? .8 : A);
  const spans = CHAPTERS.map(c => c.span), starts = [];
  spans.reduce((a, s, i) => { starts[i] = a; return a + s; }, 0);
  const total = spans.reduce((a, s) => a + s, 0);
  const span = () => { const r = track.getBoundingClientRect(); return [r, r.height - stage.offsetHeight]; };
  const PofX = x => { let i = 0; while (i < S - 1 && x >= starts[i + 1]) i++; return i + clamp((x - starts[i]) / spans[i]); };
  const XofP = P => { const i = Math.min(S - 1, Math.max(0, Math.floor(P))); return starts[i] + (P - i) * spans[i]; };
  const targetP = () => { const [r, len] = span(); return len <= 0 ? 0 : PofX(clamp(-r.top / len) * total); };
  const scrollFor = P => { const [r, len] = span(); return scrollY + r.top + len * XofP(P) / total; };
  const restP = i => i === 0 ? 0 : i + (B[i] + 1) / 2;
  const at = P => {
    const i = Math.min(S - 1, Math.max(0, Math.floor(P))), u = Math.min(1, P - i);
    if (i > 0 && u < A) return { i, u, phase: 0, m: u / A };
    if (i > 0 && u < B[i]) return { i, u, phase: 1, m: (u - A) / (B[i] - A) };
    return { i, u, phase: 2, m: 0 };
  };
  // the words of an arrival: the old caption goes as the move begins, the new one comes past half way
  const capOf = st => st.phase !== 0 ? st.i : st.m < .08 ? st.i - 1 : st.m < .6 ? -1 : st.i;

  // ---------- smooth scrolling of our own (the settle, the letterhead, the contents) ----------
  let glide = null, lastScrollAt = 0, userAt = 0, touching = false, hold = false, way = 1, lastT = 0;   // hold: the test hook stops the settle
  const glideTo = (P, ms) => {
    const to = Math.round(scrollFor(P)), from = scrollY;
    if (Math.abs(to - from) < 2) return;
    if (!motion) { window.scrollTo({ top: to, behavior: 'instant' }); return; }
    glide = { from, to, t0: performance.now(), dur: ms || Math.min(2000, 700 + Math.abs(to - from) * .3) };
  };
  const goTo = i => glideTo(restP(i));
  const userMoved = () => { userAt = performance.now(); glide = null; };
  addEventListener('wheel', userMoved, { passive: true });
  addEventListener('touchstart', () => { touching = true; userMoved(); }, { passive: true });
  addEventListener('touchend', () => { touching = false; userAt = performance.now(); }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') userMoved(); }, { passive: true });
  addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) userMoved(); });
  // which way the reader is going (a stop part way through a move is finished that way)
  addEventListener('scroll', () => { const t = targetP(); if (Math.abs(t - lastT) > 1e-5) way = t > lastT ? 1 : -1; lastT = t; if (!glide) lastScrollAt = performance.now(); }, { passive: true });
  // where the film can rest: a chapter's rest after its arrival (and its change of form, if it has
  // one), and in a chapter with a change, a short stop between them, the page settled and still
  const ZONES = CHAPTERS.flatMap((c, i) => i === 0 ? [[0, 1]] : B[i] > A ? [[i + A - .03, i + A], [i + B[i], i + 1]] : [[i + A, i + 1]]);
  const resting = P => ZONES.some(([a, b]) => P >= a - 1e-4 && P <= b + 1e-4);
  // the rest to finish a stop at: the next one the way the reader was going (unless the stop is right at
  // the edge of the rest behind)
  function restNear(P) {
    if (resting(P)) return null;
    const before = ZONES.filter(z => z[1] < P).pop(), after = ZONES.find(z => z[0] > P);
    const back = before && before[1] - .008, fwd = after && after[0] + .008;
    if (back === undefined) return fwd ?? null;
    if (fwd === undefined) return back;
    const k = (XofP(P) - XofP(before[1])) / (XofP(after[0]) - XofP(before[1]));
    return way > 0 ? (k < .05 ? back : fwd) : (k > .95 ? fwd : back);
  }
  function settle(now) {
    if (glide) {
      const t = clamp((now - glide.t0) / glide.dur);
      window.scrollTo({ top: glide.from + (glide.to - glide.from) * easeSine(t), behavior: 'instant' });
      if (t >= 1) glide = null;
      return;
    }
    if (hold || !motion || !loaderOut || touching || !lastScrollAt || now - lastScrollAt < 420 || now - userAt < 420) return;
    lastScrollAt = 0;
    const to = restNear(targetP());
    if (to !== null) glideTo(to);
  }

  // ---------- the rooms: each room's stage fitted to its frame, held still ----------
  // The fitted box is the world's stage (its size around its anchor, at least the page with a margin),
  // seen from the stage's direction (turned by the chapter's yaw and pitch); it is fitted into the
  // chapter's TARGET, a rectangle on the stage: right of the caption on computers, above it on phones,
  // clear of the running head and the folio (or the middle of the frame, for the star). One pose a
  // chapter: the camera moves only between them.
  const TARGET = { desk: { x: .45, y: .1, w: .51, h: .8 }, short: { x: .47, y: .12, w: .49, h: .76 }, phone: { x: .05, y: .08, w: .9, h: .5 } };
  const CENTRE = { desk: { x: .3, y: .12, w: .4, h: .6 }, short: { x: .3, y: .12, w: .4, h: .58 }, phone: { x: .1, y: .1, w: .8, h: .44 } };
  const PROVISIONAL = { anchor: [0, 0, 0], dir: [.2, .12, 1], fov: 42, size: [11, 13.4, 6] };
  const GRADE0 = { top: '#0B1A42', bottom: '#030817', fog: '#0A1430', fogDensity: .02, light: '#C9D8FF', glow: ['#1C3472', .5] };
  const PW = 7.6, PH = 10.6;
  let rests = [], moves = [], layout = 'desk', targets = [], headPx = 76, aspect = 1.6;
  const M = CHAPTERS.map(() => placement([0, 0, 0], [0, 0, 1]));
  const worldOf = i => world && world.worlds[CHAPTERS[i].world];
  const stageOf = i => (worldOf(i) && worldOf(i).stage) || PROVISIONAL;
  const gradeOf = i => isStudy(i) ? GRADE0 : (worldOf(i) && worldOf(i).grade) || GRADE0;
  const pxBox = (el, sr) => {
    if (!el || !el.getClientRects().length) return null;
    const q = el.getBoundingClientRect();
    return q.width ? [q.left - sr.left, q.top - sr.top, q.right - sr.left, q.bottom - sr.top] : null;
  };
  function targetOf(w, h, ob, centre) {
    const base = (centre ? CENTRE : TARGET)[layout], fr = q => q && [q[0] / w, q[1] / h, q[2] / w, q[3] / h];
    const cap = fr(ob.cap), top = fr(ob.rh), fo = fr(ob.folio), note = fr(ob.fn), cl = fr(ob.colo);
    let x0 = base.x, y0 = Math.max(base.y, (headPx + 12) / h), x1 = base.x + base.w, y1 = base.y + base.h;
    if (top) y0 = Math.max(y0, top[3] + 18 / h);
    if (layout === 'phone') y1 = Math.min(y0 + base.h, cap ? cap[1] - 24 / h : y1);
    else if (!centre) {
      if (cap) x0 = Math.max(x0, cap[2] + 40 / w);
      if (fo) y1 = Math.min(y1, fo[1] - 18 / h);
      if (cl) y1 = Math.min(y1, cl[1] - 22 / h);
      if (note && note[2] > x0) y1 = Math.min(y1, note[1] - 16 / h);
    }
    return { x: x0, y: y0, w: Math.max(.08, x1 - x0), h: Math.max(.08, y1 - y0) };
  }
  function buildRests(w, h) {
    if (!w || !h) return;
    aspect = w / h;
    layout = w < 760 || aspect < .8 ? 'phone' : aspect < 1.45 ? 'short' : 'desk';
    headPx = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 76;
    const sr = stage.getBoundingClientRect(), rhB = pxBox(rhBar, sr), foB = pxBox(folioEl, sr), fnB = pxBox(fn, sr), clB = pxBox(colo, sr);
    rests = []; targets = [];
    CHAPTERS.forEach((c, i) => {
      if (isStudy(i)) { rests[i] = studyPose(c.view, aspect); targets[i] = null; return; }
      const st = stageOf(i), d = turnDir(st.dir, (c.yaw || 0) * RAD, (c.pitch || 0) * RAD);
      // (a chapter's room: how much more of the room than the page the shot takes in)
      const k = c.room || 1, box = { c: st.anchor, size: [Math.max(st.size[0], PW + 1.6) * k, Math.max(st.size[1], PH + 1.4) * k, Math.max(st.size[2], 2.5)] };
      const t = targetOf(w, h, { cap: pxBox(caps[i], sr), rh: c.light ? rhB : null, folio: foB, fn: c.footnote ? fnB : null, colo: c.colophon ? clB : null }, c.center);
      targets[i] = t;
      M[i] = placement(st.anchor, d, .45);
      rests[i] = fromShot(fitShot(box, d, st.fov, t, aspect));
    });
    moves = CHAPTERS.map((c, i) => i ? planMove(i) : null);
  }
  // where the record's star shines: a little above the page's centre, as on the design board
  const starPoint = i => apply(M[i], [0, 1.2, .3]);
  // the archive's aisle (its own frame, archive.js): across it, up, down it
  const AISLE = 26 * RAD, aisle = (u, v, w) => [u * Math.cos(AISLE) - w * Math.sin(AISLE), v, -u * Math.sin(AISLE) - w * Math.cos(AISLE)];

  // ---------- the moves ----------
  // Each move is planned once (when the frame is sized): its path, in the frame of the room it leaves,
  // and the portal that places the next room beyond the opening, so the path ends at that room's rest
  function planMove(i) {
    const c = CHAPTERS[i], X = rests[i - 1], Y = rests[i], mv = { kind: c.move };
    const lensOf = P => ({ fov: P.fov, sx: P.sx, sy: P.sy });
    switch (c.move) {
      case 'view': mv.path = makePath([X, Y]); break;
      case 'dusk': case 'sunset': {
        const L = studyLens(aspect);
        const E = c.move === 'dusk'
          ? pose([PANE[0] + .2, PANE[1] + .8, -15.5], 0, Y.pitch, Y.fov, Y.sx, Y.sy)   // out, and the eyes go up
          : pose([PANE[0] + .6, PANE[1] + 2.4, -40], 0, Y.pitch, Y.fov, Y.sx, Y.sy);  // out, on over the town
        mv.path = makePath([
          X,
          pose([PANE[0] - 1.3, PANE[1] + 1.8, .4], 0, 0, mix(L.fov, 52, .5), 0, L.sy * .5),   // toward the window, the eyes coming up
          pose([PANE[0], PANE[1], -6.25], 0, 0, 52, 0, 0),                                     // at the glass
          pose([PANE[0] + .05, PANE[1] + .1, -11.5], 0, 0, 52, 0, 0),                         // out, the town below
          E,
        ]);
        mv.T = portal(E, Y);
        break;
      }
      case 'down': {
        const ahead = levelOf(X);
        const E = pose(plus(X.p, [UP, -46], [ahead, 12]), X.yaw, Y.pitch, Y.fov, Y.sx, Y.sy);
        mv.path = makePath([X, with_(X, { pitch: -18, sx: 0, sy: 0 }), pose(plus(X.p, [UP, -16], [ahead, 4]), X.yaw, -56, X.fov, 0, 0), E]);
        mv.T = portal(E, Y);
        break;
      }
      case 'through': {
        const E = pose(aisle(0, 3.4, 132), -26, Y.pitch, Y.fov, Y.sx, Y.sy);
        mv.path = makePath([X, pose(aisle(8.5, 1.4, -6), -20, -3, X.fov, 0, 0), pose(aisle(3.5, 2.2, 48), -26, 0, X.fov, 0, 0), pose(aisle(0, 3.2, 104), -26, 1, X.fov, 0, 0), E]);
        mv.T = portal(E, Y);
        break;
      }
      case 'dawn': {
        const E = pose(plus(X.p, [rightOf(X), 11], [levelOf(X), 5], [UP, 3]), X.yaw + 70, Y.pitch, Y.fov, Y.sx, Y.sy);
        mv.path = makePath([X, pose(plus(X.p, [rightOf(X), 4], [levelOf(X), 2]), X.yaw + 36, X.pitch * .5, X.fov, 0, 0), E]);
        mv.T = portal(E, Y);
        break;
      }
      // across the hall: in to the slide on the auditorium's screen, through it as its ink loosens, and
      // into the workshop room beyond it
      case 'across': {
        const ctr = apply(M[i - 1], [0, 0, 0]), f = norm(sub(ctr, X.p)), d = Math.hypot(ctr[0] - X.p[0], ctr[1] - X.p[1], ctr[2] - X.p[2]);
        const yaw = Math.atan2(f[0], -f[2]) / RAD, pitch = Math.asin(f[1]) / RAD;
        const E = pose(plus(ctr, [f, 3]), yaw, Y.pitch, Y.fov, Y.sx, Y.sy);
        mv.path = makePath([X, pose(plus(X.p, [f, d * .55]), yaw, pitch, X.fov, 0, 0), pose(plus(X.p, [f, d * .9]), yaw, pitch, X.fov, 0, 0), E]);
        mv.T = portal(E, Y);
        mv.through = true;
        break;
      }
      case 'back': {
        const K1 = pose(plus(X.p, [levelOf(X), 3], [rightOf(X), 2]), X.yaw + 25, X.pitch * .4, X.fov, 0, 0);
        const E = pose(plus(K1.p, [levelOf(K1), 17]), K1.yaw, Y.pitch, Y.fov, Y.sx, Y.sy);
        mv.path = makePath([X, K1, pose(plus(E.p, [levelOf(E), -11]), E.yaw, 0, Y.fov, Y.sx, Y.sy), E]);
        mv.T = portal(E, Y);
        break;
      }
      default: mv.path = makePath([X, Y]);
    }
    mv.lens = lensOf(Y);
    return mv;
  }

  // ---------- what a moment shows ----------
  // A chapter at rest; or the move into it from the chapter before. The state F (renderer.js, draw)
  // plus the editor on the display: on (how present), docs (each document's share)
  const blank = () => ({
    views: [], study: null, mask: false, day: 1, dusk: false, dayDir: [.3, 1],
    pages: [], star: null, gA: GRADE0, gB: GRADE0, k: 0, ed: 0, docs: {}, light: 1,
  });
  // the study as it stands in a pose
  const studyAt = (cam, o = {}) => ({ k: 1, cam, dusk: 0, lamp: 1, warm: 0, inside: 1, evening: 0, open: 0, outK: 1, sky: 'dusk', ...o });
  function restOf(i, phase, m) {
    const c = CHAPTERS[i], o = blank(), P = rests[i];
    o.light = c.light; o.day = c.light; o.gA = o.gB = gradeOf(i);
    if (isStudy(i)) {
      o.study = studyAt(P, { warm: c.warm || 0 });
      o.ed = 1; o.docs[c.editor] = 1;
      return o;
    }
    o.views = [{ id: c.world, w: c.weight ?? 1, cam: P }];
    const rest = c.rest || c.page;
    if (phase === 1) {
      // the change of form on the spot: the record's ink loosens and gathers into the star; the
      // dossier's (or the seal's) settles over the page, which is the same underneath
      if (rest === 'star') { o.pages = [{ kind: c.page, m: M[i], loose: sstep(0, .62, m), alpha: 1, view: 0 }]; o.star = { k: sstep(.3, 1, m), at: starPoint(i), view: 0 }; }
      else o.pages = [{ kind: c.page, m: M[i], loose: 0, alpha: 1, view: 0 }, { kind: rest, m: M[i], loose: 1 - sstep(0, .92, m), alpha: 1, view: 0 }];
    } else if (rest === 'star') o.star = { k: 1, at: starPoint(i), view: 0 };
    else o.pages = [{ kind: rest, m: M[i], loose: 0, alpha: 1, view: 0 }];
    return o;
  }
  // the page a room keeps as the camera leaves it (it stays where it stands), and the one the camera
  // comes to (its ink settling in from `from` to `to` along the path)
  function left(o, i, w, view) {
    const c = CHAPTERS[i], rest = c.rest || c.page;
    if (rest === 'star') o.star = { k: w, at: starPoint(i), view };
    else o.pages.push({ kind: rest, m: M[i], loose: 0, alpha: w, view });
  }
  const arrived = (o, i, w, view, from, to, s) => o.pages.push({ kind: CHAPTERS[i].page, m: M[i], loose: 1 - sstep(from, to, s), alpha: w, view });

  function arrive(i, m) {
    const c = CHAPTERS[i], p = CHAPTERS[i - 1], o = blank(), mv = moves[i];
    if (!mv) return restOf(i, 2, 0);
    // the move's own time, eased at its ends; with reduced motion, a cut half way
    const cut = s => motion ? s : s < .5 ? 0 : 1;
    o.gA = gradeOf(i - 1); o.gB = gradeOf(i); o.light = c.light; o.day = c.light;
    switch (mv.kind) {
      // in the study, from one view of it to another; the editor's document changes half way
      case 'view': {
        const s = cut(easeSine(m)), d = sstep(.3, .7, s);
        o.study = studyAt(mv.path(s), { warm: mix(p.warm || 0, c.warm || 0, sstep(.15, .9, s)) });
        o.ed = 1; o.docs[p.editor] = 1 - d; o.docs[c.editor] = d;
        return o;
      }
      // to the study's window as the light goes, out through it; the room beyond has been placed past
      // the window, so its camera is the same camera; its sky is seen only once the drawn sky opens
      case 'dusk': case 'sunset': {
        const s = cut(easeSine(m)), K = mv.path.S, cam = mv.path(s), dusk = c.move === 'dusk';
        const glass = K[2] + (K[3] - K[2]) * .14;   // where the camera passes the wall
        o.study = studyAt(cam, {
          warm: p.warm || 0, sky: c.move,
          dusk: (dusk ? .4 : .18) * sstep(0, K[2], s),             // the room dims a little (the lamp's light stays)
          evening: sstep(.05, K[2], s),                             // the window's sky goes to dusk or sunset
          open: dusk ? sstep(K[3], K[3] + (1 - K[3]) * .55, s) : sstep(K[3] - .02, K[3] + .14, s),   // then opens for the room beyond
          outK: dusk ? 1 : 1 - sstep(K[3] + .1, K[3] + .26, s),   // (at sunset the town falls behind)
          inside: 1 - sstep(glass, glass + .04, s),
        });
        o.mask = true;
        // the room beyond is drawn once the camera is at the glass (until then the drawn sky hides it)
        if (s > K[2] - .06) { o.views = [{ id: c.world, w: c.weight ?? 1, cam: across(cam, mv.T), ink: false }]; arrived(o, i, 1, 0, .82, 1, s); }
        o.ed = 1 - sstep(0, .3, s); o.docs[p.editor] = 1;
        o.gA = o.gB; o.light = s > glass ? 0 : 1;
        return o;
      }
      // a move between rooms: one path through the opening, the room behind fading as the camera
      // passes it, the room ahead coming in
      case 'down': case 'through': case 'dawn': case 'across': {
        const dawn = mv.kind === 'dawn', s = cut(easeSine(dawn ? (m - .32) / .68 : m)), cam = mv.path(s);
        // (the next room comes in while there is still something of this one in view: below the sky as
        // the eyes go down, around the turn across the hall)
        const [o0, o1, i0, i1] = { down: [.32, .56, .14, .46], through: [.74, .86, .7, .86], dawn: [.32, .5, .24, .44], across: [.56, .8, .5, .74] }[mv.kind];
        const wOut = 1 - sstep(o0, o1, s), wIn = sstep(i0, i1, s);
        o.views = [{ id: p.world, w: wOut, cam }, { id: c.world, w: wIn, cam: across(cam, mv.T) }];
        o.k = wIn;
        if (mv.kind === 'down' || mv.kind === 'through') o.day = 0;
        if (dawn) { o.day = motion ? sstep(.03, .3, m) : m < .5 ? 0 : 1; o.dayDir = [1, .08]; o.light = o.day > .5 ? 1 : 0; }
        left(o, i - 1, wOut, 0);
        // (going through the page: its ink loosens as the camera comes up to it)
        if (mv.through && o.pages[0]) o.pages[0].loose = sstep(.42, .8, s);
        arrived(o, i, wIn, 1, .8, 1, s);
        return o;
      }
      // back at the desk: the workshop's camera turns toward its door and goes on into the study, placed
      // beyond it, in to the display
      case 'back': {
        const s = cut(easeSine(m)), cam = mv.path(s), wOut = 1 - sstep(.16, .36, s);
        o.views = [{ id: p.world, w: wOut, cam }];
        o.study = studyAt(across(cam, mv.T), { k: sstep(.12, .3, s) });
        o.ed = sstep(.8, 1, s); o.docs[c.editor] = 1;
        left(o, i - 1, wOut, 0);
        o.gB = o.gA;
        return o;
      }
      default: return restOf(i, 2, 0);
    }
  }

  // ---------- the words, the furniture ----------
  const NAMES = caps.map(el => el ? el.dataset.name : ''), NUMS = caps.map(el => el ? el.dataset.num : '');
  // the letterhead's link for each chapter: the practices under Practices, training under the Academy,
  // the record under Publications, the last chapter under Contact
  const NAV_OF = { 'title-page': 'title-page', contents: 'contents', 'on-the-record': 'on-the-record', training: 'training', 'how-we-work': 'title-page', correspondence: 'correspondence' };
  let active = -2, furnished = -1;
  function furnish(c, now) {
    furnished = c;
    stage.dataset.ch = CHAPTERS[c].id;
    type.type(rh, NAMES[c], now);
    if (lhRun) lhRun.textContent = NAMES[c];
    if (folio) folio.innerHTML = osf(NUMS[c]);
    const go = String(CHAPTERS.findIndex(x => x.id === (NAV_OF[CHAPTERS[c].id] || 'contents')));
    nav.forEach(a => { if (a.dataset.go === go) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (fn) fn.classList.toggle('on', !!CHAPTERS[c].footnote);
    if (colo) colo.classList.toggle('on', !!CHAPTERS[c].colophon);
  }
  function activate(c, now) {
    if (c === active) return;
    const prev = active;
    active = c;
    stage.dataset.cap = c >= 0 ? 'on' : 'off';
    caps.forEach((el, j) => { if (!el) return; el.classList.toggle('on', j === c); el.classList.toggle('was', j === prev && j !== c); });
    if (c >= 0 && c !== furnished) furnish(c, now);
  }
  // a link in a caption that is not showing brings its chapter in when it gets the focus
  caps.forEach((el, i) => el && el.addEventListener('focusin', () => { if (i !== active) glideTo(restP(i), 1); }));
  // the letterhead's links and the actions that scroll go to their chapters; the regulatory chapter's
  // action opens its page (a short move in on the page, then the page itself)
  sec.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { if (a.dataset.go === '' || +a.dataset.go < 0) return; e.preventDefault(); goTo(+a.dataset.go); }));
  let leaveAt = 0;
  sec.querySelectorAll('.lp-act[data-kind="open"]').forEach(a => a.addEventListener('click', e => {
    if (!motion || !world || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    leaveAt = performance.now();
    root.classList.add('lp-leaving');
    setTimeout(() => { location.href = a.href; }, 460);
  }));
  addEventListener('pageshow', e => { if (e.persisted) { leaveAt = 0; root.classList.remove('lp-leaving'); } });
  // the contents: pointing at an entry (or focusing it) lights its line in the document on the display
  let hovered = -1;
  toc.forEach((a, j) => {
    a.addEventListener('pointerenter', () => { hovered = j; });
    a.addEventListener('pointerleave', () => { if (hovered === j) hovered = -1; });
    a.addEventListener('focus', () => { hovered = j; });
    a.addEventListener('blur', () => { if (hovered === j) hovered = -1; });
  });

  // ---------- the 3D, loaded on its own ----------
  let world = null, W2 = 0, H2 = 0, CW = 0, CH = 0, lastW = -1;
  const loader = document.getElementById('lpLoader');
  let progress = 6, shown = 0, loaderOut = !loader || STATIC;
  const t0 = performance.now(), MIN = REDUCE ? 600 : 1800;
  const setProgress = v => { progress = Math.max(progress, v); };
  function sizeUp() {
    W2 = stage.clientWidth; H2 = stage.clientHeight; CW = canvas.clientWidth || W2; CH = canvas.clientHeight || H2;
    if (W2 !== lastW) { lastW = W2; heads.forEach(h => h && splitLines(h)); }
    if (colo) stage.style.setProperty('--lp-colo-h', `${Math.ceil(colo.offsetHeight)}px`);
    buildRests(W2, H2);
    if (world) world.resize(CW, CH);
  }
  const ro = new ResizeObserver(() => sizeUp());
  ro.observe(stage); ro.observe(canvas);
  sizeUp();
  if (document.fonts) document.fonts.ready.then(() => { lastW = -1; sizeUp(); });   // the headlines' lines, in their own font

  // while the loading screen is up, one piece of work a frame: the study's layers (after its
  // handwriting's font) and its view out, the rooms (each built and sent to the GPU), the page's forms
  const formScale = big ? (devicePixelRatio >= 1.5 ? 3.1 : 2.4) : 1.6;
  const layerScale = name => big ? (name === 'wall' || name === 'desk' || name === 'beyond' ? 2.4 : 3.2) : (name === 'wall' || name === 'desk' ? 1.2 : 1.6);
  let fontsIn = !document.fonts;
  if (document.fonts) Promise.race([document.fonts.load('600 22px Caveat'), new Promise(r => setTimeout(r, 2500))]).catch(() => null).then(() => { fontsIn = true; });
  const LAYERS = studyLayers(), drawn = {}, outsides = { plane: OUTSIDE };
  const WORK = [
    ...LAYERS.map(L => ['layer', L.name]), ...['day', 'dusk', 'duskTown', 'sunset', 'sunsetTown'].map(v => ['outside', v]), ['study'],
    ...[...new Set(CHAPTERS.filter(c => c.world !== 'study').map(c => c.world))].map(id => ['world', id]),
    ...[...new Set(CHAPTERS.flatMap(c => [c.page, c.rest]).filter(Boolean))].map(f => ['form', f]),
  ];
  const ALL = WORK.length;
  let studyReady = false;
  function workOne() {
    const job = WORK[0];
    if (!job) return;
    if (job[0] === 'layer' && job[1] === 'desk' && !fontsIn) return;   // the tablet's notes are handwritten
    WORK.shift();
    try {
      if (job[0] === 'layer') drawn[job[1]] = drawStudyLayer(job[1], layerScale(job[1]));
      else if (job[0] === 'outside') outsides[job[1]] = drawOutside(job[1], big ? 2048 : 1024, big ? 2048 : 1024);
      else if (job[0] === 'study') {
        world.setStudy({ eye: STUDY_X, desk: DESK, layers: LAYERS.map(L => ({ ...L, canvas: drawn[L.name].canvas })), outside: outsides });
        studyReady = true;
      } else if (job[0] === 'world') { if (world.addWorld(job[1])) { world.warmWorld(job[1]); buildRests(W2, H2); } }
      else if (job[0] === 'form') world.addForm(job[1], job[1] === 'star' ? drawStar() : drawPage(job[1], { scale: formScale }));
    } catch (err) { console.warn('[lamp]', job, err); }
    setProgress(100 - 34 * WORK.length / ALL);
  }
  import('./renderer.js').then(({ createRenderer }) => {
    setProgress(50);
    world = createRenderer(canvas, { dpr: Math.min(devicePixelRatio || 1, big ? 2 : 1.75), bloomScale: big ? 1 : .5, quality: big ? 'high' : 'low' });
    world.resize(CW, CH);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); world = null; sec.classList.add('lp-nogl'); });
    setProgress(62);
    requestAnimationFrame(() => {   // compile the shaders and draw once while the loading screen still covers the page
      try { frame(0, performance.now()); world && world.compile(); } catch (err) { console.warn('[lamp]', err); }
      setProgress(66);
    });
  }).catch(err => { console.warn('[lamp] no 3D:', err); world = null; sec.classList.add('lp-nogl'); setProgress(100); });

  // ---------- the loading screen: the counter as a folio over the paper, a fine rule ----------
  function exitLoader() {
    if (loaderOut) return;
    loaderOut = true;
    loader.classList.add('out');
    root.classList.remove('lp-lock');
    [...document.body.children].forEach(el => {
      if (el.contains(sec) || el.matches('script, dialog, .skip') || !el.animate) return;
      el.animate({ opacity: [0, 1] }, { duration: REDUCE ? 200 : 800, delay: 150, easing: 'ease', fill: 'backwards' });
    });
    setTimeout(() => { loader.hidden = true; }, 1400);
    jumpToHash();
  }
  function jumpToHash() {
    const i = CHAPTERS.findIndex(c => '#' + c.id === location.hash);
    if (i > 0) window.scrollTo({ top: Math.round(scrollFor(restP(i))), behavior: 'instant' });
  }
  if (loader && !STATIC) {
    root.classList.add('lp-lock');
    try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers */ }
    window.scrollTo(0, 0);
    const num = loader.querySelector('.lp-load-folio b'), bar = loader.querySelector('.lp-load-rule i');
    let counted = '', lit = false;
    const tick = now => {
      if (loaderOut) return;
      const due = clamp((now - t0) / MIN) * 100;
      shown = Math.min(progress, due, shown + Math.max(.6, (Math.min(progress, due) - shown) * .12));
      const txt = String(Math.floor(shown));
      if (counted !== txt) { counted = txt; num.innerHTML = osf(txt); }
      bar.style.transform = `scaleX(${(shown / 100).toFixed(3)})`;
      // the study shows through the paper once it is laid out
      if (!lit && studyReady) { lit = true; loader.classList.add('lit'); }
      if (shown >= 100) { setTimeout(exitLoader, REDUCE ? 0 : 500); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(exitLoader, 12000);   // whatever happens, the page never stays covered
  } else {
    if (loader) loader.hidden = true;
    requestAnimationFrame(jumpToHash);
  }

  // ---------- the editor on the display, laid over the study where the camera sees its screen ----------
  let edBox = null, edShown = false;
  const edState = {}, q4 = [[0, 0, 0], [0, 0, 0]];
  if (ed) { ed.style.width = `${ED_W}px`; ed.style.height = `${ED_H.toFixed(2)}px`; }
  function placeEditor(on, docs) {
    if (!ed) return;
    const show = !!world && studyReady && on > .002;
    if (show !== edShown) { edShown = show; ed.style.visibility = show ? 'visible' : 'hidden'; if (!show) { ed.style.opacity = '0'; edState.op = '0'; } }
    if (!show) { edBox = null; return; }
    world.project(SCREEN3[0], q4[0], 's'); world.project(SCREEN3[2], q4[1], 's');
    const left = q4[0][0], top = q4[0][1], sc = (q4[1][0] - q4[0][0]) / ED_W;
    const tf = `translate3d(${left.toFixed(2)}px,${top.toFixed(2)}px,0) scale(${sc.toFixed(5)})`;
    if (edState.tf !== tf) { edState.tf = tf; ed.style.transform = tf; }
    const op = on.toFixed(3);
    if (edState.op !== op) { edState.op = op; ed.style.opacity = op; }
    edDocs.forEach(el => { const v = (docs[el.dataset.doc] || 0).toFixed(3); if (el.dataset.op !== v) { el.dataset.op = v; el.style.opacity = v; el.style.visibility = +v > 0 ? 'inherit' : 'hidden'; } });
    edBox = [left, top, left + ED_W * sc, top + ED_H * sc];
  }

  // ---------- every frame ----------
  // the scroll is followed on a critically damped spring: no jolt when the wheel steps, no overshoot
  let Pr = 0, Pv = 0, time = 0, last = 0, raf = 0, now8 = null;
  const SPRING = 64, DAMP = 2 * Math.sqrt(SPRING);
  const pt = [0, 0, 0], F = { glowAt: [.65, .5] };
  function frame(dt, now) {
    const Pt = targetP();
    if (motion) { Pv += ((Pt - Pr) * SPRING - Pv * DAMP) * dt; Pr += Pv * dt; } else Pr = Pt;
    if (Math.abs(Pt - Pr) < 1e-4 && Math.abs(Pv) < 1e-3) { Pr = Pt; Pv = 0; }
    time += dt;
    const P = clamp(Pr / S) * S, st = at(Math.min(P, S - 1e-6)), c = CHAPTERS[st.i];
    if (loaderOut) activate(capOf(st), now);
    type.tick(now);
    settle(now);

    const o = st.i > 0 && st.phase === 0 ? arrive(st.i, st.m) : restOf(st.i, st.phase, st.m);
    now8 = o;
    const lightNow = o.light > .5 ? 'day' : 'night';
    if (stage.dataset.light !== lightNow) stage.dataset.light = lightNow;
    if (!world || !W2) { placeEditor(0, {}); return; }
    // the study waits for its layers; until they are in, the day is plain paper
    if (o.study && !studyReady) o.study = null;
    // leaving for a page: the camera closes in on it
    if (leaveAt && o.views[0]) { const z = ease(clamp((now - leaveAt) / 440)) * .22, cam = o.views[0].cam; o.views[0].cam = with_(cam, { p: plus(cam.p, [fwdOf(cam), z * 30]) }); }
    // the glow behind the page
    const pg = o.pages[o.pages.length - 1];
    if (pg) world.project(apply(pg.m, [0, 0, 0]), pt, pg.view); else if (o.star) world.project(o.star.at, pt, o.star.view);
    Object.assign(F, {
      time, dt, fh: H2, views: o.views, study: o.study, mask: o.mask, day: o.day, dusk: o.dusk, dayDir: o.dayDir,
      pages: o.pages, star: o.star, gA: o.gA, gB: o.gB, k: o.k, glow: c.glow || 1, bloom: mix(c.bloom || .62, .9, leaveAt ? .5 : 0), aberr: .008,
    });
    F.glowAt[0] = pt[0] / CW; F.glowAt[1] = 1 - pt[1] / CH;
    world.draw(F);
    placeEditor(o.ed, o.docs);
    edToc.forEach((el, j) => { const on = c.pick && j === hovered; if (el.classList.contains('on') !== on) el.classList.toggle('on', on); });
    placeCards(st);
  }

  // ---------- the cards: the active chapter's, beside its page once the page has settled ----------
  // left of the page where there is room and the caption is clear of them, right of it otherwise, and
  // under it when neither side has room
  const settledAt = (st, j) => st.phase === 2 && st.i === j && st.i === active && Math.abs(targetP() - Pr) < .015 && !leaveAt;
  function pageBox(i) {
    if (isStudy(i)) return edBox;
    if (!world) return null;
    const c = CHAPTERS[i], rest = c.rest || c.page;
    if (rest === 'star') { world.project(starPoint(i), pt, 0); return [pt[0] - 70, pt[1] - 70, pt[0] + 70, pt[1] + 70]; }
    const f = world.formOf(rest), pw = f ? f.page[0] : PW, ph = f ? f.page[1] : PH, r = [1e9, 1e9, -1e9, -1e9];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      world.project(apply(M[i], [sx * pw / 2, sy * ph / 2, 0]), pt, 0);
      r[0] = Math.min(r[0], pt[0]); r[1] = Math.min(r[1], pt[1]); r[2] = Math.max(r[2], pt[0]); r[3] = Math.max(r[3], pt[1]);
    });
    return r;
  }
  const overlap = (a, b, mg = 0) => a && b && a[0] < b[2] + mg && a[2] > b[0] - mg && a[1] < b[3] + mg && a[3] > b[1] - mg;
  function placeCards(st) {
    cardSets.forEach((el, j) => {
      if (!el) return;
      const on = settledAt(st, j);
      if (on) {
        const pb = pageBox(j), sr = stage.getBoundingClientRect(), cap = pxBox(caps[j], sr);
        if (pb) {
          const cw = el.offsetWidth, ch = el.offsetHeight, y = Math.max(headPx + 40, pb[1] + (pb[3] - pb[1]) * .12);
          const left = [pb[0] - cw - 22, y], right = [pb[2] + 22, y], under = [Math.max(16, Math.min(W2 - cw - 16, pb[0])), Math.min(H2 - ch - 16, pb[3] + 14)];
          const fits = q => q[0] >= 16 && q[0] + cw <= W2 - 16 && !overlap([q[0], q[1], q[0] + cw, q[1] + ch], cap, 12);
          const [x, yy] = [left, right, under].find(fits) || under;
          const tf = `translate3d(${Math.round(x)}px,${Math.round(yy)}px,0)`;
          if (el.style.transform !== tf) el.style.transform = tf;
        }
      }
      if (el.classList.contains('on') !== on) el.classList.toggle('on', on);
    });
  }

  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    try { frame(dt, now); } catch (err) { console.warn('[lamp]', err); }
    if (world && WORK.length) workOne();
  }
  const wake = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', wake);
  wake();

  // review and test hook
  window.mewritLamp = {
    get P() { return Pr; }, get chapter() { return CHAPTERS[active] ? CHAPTERS[active].id : null; },
    get ready() { return !!world && loaderOut && !WORK.length; },
    get layout() { return layout; }, get targets() { return targets; }, get stub() { return world ? world.stub : null; },
    get weights() { return world ? { ...world.weights } : null; }, get worlds() { return world ? Object.keys(world.worlds) : []; },
    settle() { Pr = targetP(); Pv = 0; }, set hold(v) { hold = !!v; }, get resting() { return resting(targetP()); }, scrollFor, restP, chapters: CHAPTERS.map(c => c.id), A, B,
    go: goTo, rests: () => rests,
    // the active chapter's page as it stands now, [left, top, right, bottom] in px (in the study, the editor)
    pageRect() { return active >= 0 ? pageBox(active) : null; },
    get state() {
      if (!now8) return null;
      const r = v => Math.round(v * 1000) / 1000, cam = P => P && { p: P.p.map(r), yaw: r(P.yaw), pitch: r(P.pitch), fov: r(P.fov) };
      return { day: r(now8.day), light: now8.light, mask: now8.mask, ed: r(now8.ed), views: now8.views.map(v => ({ id: v.id, w: r(v.w), cam: cam(v.cam) })), study: now8.study && { k: r(now8.study.k), dusk: r(now8.study.dusk), evening: r(now8.study.evening), open: r(now8.study.open), inside: r(now8.study.inside), cam: cam(now8.study.cam) }, pages: now8.pages.map(p => ({ kind: p.kind, loose: r(p.loose), alpha: r(p.alpha), view: p.view })), star: now8.star && r(now8.star.k) };
    },
  };
}
