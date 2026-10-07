/* Hero panel, "From molecule to manuscript": a technical drawing of the work behind a medicine, in
   seven stages that hand over to one another. Drug development (a molecule), clinical trials (a
   cohort randomised into two arms), medical research (a systematic review), data and statistics (a
   scatter and its fit), analysis (Kaplan-Meier curves), reporting (a clinical study report) and the
   manuscript, accepted for publication. Twenty-four dots carry through every stage: atoms become
   participants, then studies, data points, events on the curves, and finally the seal on the paper.
   Lines draw themselves, labels decode into place, and each stage hands its dots to the next.
   A pure function of time, so it can be paused, sought and shown as a still. */
import { $, clamp, easeOut, easeInOutCubic, easeInOutSine, REDUCE, STATIC, INTRO } from './shared.js';

const svg = $('heroSvg');
if (svg && document.documentElement.dataset.hero !== 'ribbons') {
  const NS = 'http://www.w3.org/2000/svg';
  const MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
  const C = { ink: '#13244F', navy: '#1C3472', navy2: '#2B4A92', muted: '#5E6884', light: '#C9D3E6', faint: '#DCE2EE', orange: '#E07A1F', orangeInk: '#A34D09' };
  const RGB = { navy: [28, 52, 114], orange: [224, 122, 31] };
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const IN = 1000, HOLD = 1900, OUT = 900, STAGE = IN + HOLD + OUT, COUNT = 7, LOOP = STAGE * COUNT, N = 24;
  const root = $('pipeStages');

  /* ---- drawing helpers: lines that draw themselves, labels that decode */
  const stages = [];
  function stage(title, note) { const g = mk('g', { visibility: 'hidden' }, root); const s = { g, title, note, lines: [], labels: [] }; stages.push(s); return s; }
  function line(s, d, o = {}) {
    const el = mk('path', { d, fill: 'none', stroke: o.stroke || C.navy, 'stroke-width': o.w || 1.3, 'stroke-linecap': o.cap || 'round', 'stroke-linejoin': 'round',
      pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, opacity: o.op ?? 1 }, o.parent || s.g);
    s.lines.push({ el, at: o.at ?? s.lines.length * 70 });
    return el;
  }
  function label(s, x, y, text, o = {}) {
    const el = mk('text', { x, y, 'font-family': MONO, 'font-size': o.size || 8.6, 'font-weight': o.weight || 500, 'letter-spacing': o.ls ?? .5,
      fill: o.fill || C.muted, 'text-anchor': o.anchor || 'start', opacity: 0 }, o.parent || s.g);
    if (o.rotate) el.setAttribute('transform', `rotate(${o.rotate} ${x} ${y})`);
    el.textContent = text;
    s.labels.push({ el, text, at: o.at ?? 380 + s.labels.length * 90, decode: !!o.decode });
    return el;
  }
  // a label decodes into place: each character cycles through look-alikes, settling left to right
  const GLYPHS = '0123456789ABCDEFHKLMNPRSTUXZ#%+';
  const scramble = (text, e) => {
    const n = text.length, done = clamp(e / 520) * n;
    let out = '';
    for (let i = 0; i < n; i++) {
      const ch = text[i];
      if (i < done || ch === ' ' || ch === '.' || ch === '·' || ch === ',') { out += ch; continue; }
      out += GLYPHS[(i * 7 + Math.floor(e / 45) * 13) % GLYPHS.length];
    }
    return out;
  };

  /* ---- the plot area shared by the statistics and the analysis */
  const PX0 = 70, PX1 = 350, PY0 = 74, PY1 = 262;

  /* 01 drug development: a molecule, two fused rings with a side chain */
  const s0 = stage('Drug development', 'Lead candidate · preclinical package');
  const RS = 30, H3 = Math.sqrt(3), DY = 16;
  const ring = (cx, cy) => [-90, -30, 30, 90, 150, 210].map(a => [cx + RS * Math.cos(a * Math.PI / 180), cy + RS * Math.sin(a * Math.PI / 180) + DY]);
  const A = ring(150, 152), B = ring(150 + RS * H3, 152);
  const add = (p, dx, dy) => [p[0] + dx, p[1] + dy];
  const C1 = add(B[1], RS * H3 / 2, -RS / 2), O1 = add(C1, 0, -RS), N1 = add(C1, RS * H3 / 2, RS / 2), C2 = add(N1, RS * H3 / 2, -RS / 2), O2 = add(A[4], -RS * H3 / 2, RS / 2);
  const ATOMS = [A[0], A[1], A[2], A[3], A[4], A[5], B[0], B[1], B[2], B[3], C1, O1, N1, C2, O2];
  const P = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const poly = pts => 'M' + pts.map(P).join('L') + 'Z';
  line(s0, poly(A), { w: 1.4 });
  line(s0, poly(B), { w: 1.4 });
  // the alternating inner bonds of the aromatic rings
  const inner = (ringPts, k, c) => { const p = ringPts[k], q = ringPts[(k + 1) % 6]; const f = (u, v) => [u[0] + (v[0] - u[0]) * .2, u[1] + (v[1] - u[1]) * .2]; return `M${P(f(p, c))}L${P(f(q, c))}`; };
  const cA = [150, 152 + DY], cB = [150 + RS * H3, 152 + DY];
  [0, 2, 4].forEach(k => line(s0, inner(A, k, cA), { w: 1.1, op: .7 }));
  [1, 3].forEach(k => line(s0, inner(B, k, cB), { w: 1.1, op: .7 }));
  line(s0, `M${P(B[1])}L${P(C1)}`);
  line(s0, `M${P(add(C1, -2.4, 0))}L${P(add(O1, -2.4, 0))}M${P(add(C1, 2.4, 0))}L${P(add(O1, 2.4, 0))}`);
  line(s0, `M${P(C1)}L${P(N1)}L${P(C2)}`);
  line(s0, `M${P(A[4])}L${P(O2)}`);
  // a bond length, dimensioned like an engineering drawing
  const d0 = add(B[2], 11, 7), d1 = add(B[3], 11, 7);
  line(s0, `M${P(d0)}L${P(d1)}M${P(add(d0, -3, -5))}L${P(add(d0, 3, 5))}M${P(add(d1, -3, -5))}L${P(add(d1, 3, 5))}`, { w: .9, stroke: C.muted, op: .8 });
  label(s0, O1[0] + 9, O1[1] + 3, 'O', { fill: C.ink, size: 9.4 });
  label(s0, N1[0] - 4, N1[1] + 16, 'NH', { fill: C.orangeInk, size: 9.4 });
  label(s0, C2[0] + 8, C2[1] + 3, 'CH₃', { fill: C.ink, size: 9.4 });
  label(s0, O2[0] - 23, O2[1] + 3, 'OH', { fill: C.ink, size: 9.4 });
  label(s0, d1[0] + 10, d1[1] + 12, '1.39 Å', { decode: true });
  label(s0, 40, 266, 'CANDIDATE MW-104', { decode: true, fill: C.navy });

  /* 02 clinical trials: an enrolled cohort, randomised 1:1 into two arms, followed over visits */
  const s1 = stage('Clinical trials', 'Phase III · randomised 1:1 · double-blind');
  const GRID = Array.from({ length: N }, (_, i) => [52 + (i % 4) * 13, 116 + Math.floor(i / 4) * 13]);
  const R = [138, 148], ARM = [112, 184];
  const ARMPOS = Array.from({ length: N }, (_, i) => [190 + (i % 12) * 13.5, ARM[i < 12 ? 0 : 1]]);
  line(s1, 'M98,148L127,148');
  mk('circle', { cx: R[0], cy: R[1], r: 11, fill: '#fff', stroke: C.navy, 'stroke-width': 1.3, class: 'pipe-fade' }, s1.g);
  line(s1, `M149,148L178,${ARM[0]}L352,${ARM[0]}`, { stroke: C.orange, w: 1.5 });
  line(s1, `M149,148L178,${ARM[1]}L352,${ARM[1]}`, { w: 1.5 });
  line(s1, 'M190,236L350,236', { stroke: C.muted, w: 1 });
  [190, 243.3, 296.7, 350].forEach(x => line(s1, `M${x},232L${x},240`, { stroke: C.muted, w: 1 }));
  label(s1, R[0], R[1] + 3.4, 'R', { anchor: 'middle', fill: C.navy, size: 9.4, ls: 0 });
  label(s1, 52, 104, 'ENROLLED');
  label(s1, 52, 200, 'N = 480', { decode: true, fill: C.navy });
  label(s1, 184, ARM[0] - 12, 'TREATMENT', { fill: C.orangeInk });
  label(s1, 184, ARM[1] + 20, 'CONTROL', { fill: C.navy });
  ['W0', 'W12', 'W24', 'W52'].forEach((t, i) => label(s1, 190 + i * 53.3, 254, t, { anchor: 'middle', size: 7.8 }));
  label(s1, 52, 240, 'VISITS');

  /* 03 medical research: a systematic review narrows the evidence */
  const s2 = stage('Medical research', 'Systematic literature review · PRISMA');
  const BOX = [[70, 66, 260, '1,240', 'RECORDS IDENTIFIED'], [95, 118, 210, '312', 'SCREENED'], [120, 170, 160, '64', 'FULL TEXTS'], [145, 222, 110, '28', 'INCLUDED']];
  const KEEP = [24, 14, 9, 6];
  BOX.forEach(([x, y, w, n, t], l) => {
    line(s2, `M${x + 6},${y}H${x + w - 6}Q${x + w},${y} ${x + w},${y + 6}V${y + 22}Q${x + w},${y + 28} ${x + w - 6},${y + 28}H${x + 6}Q${x},${y + 28} ${x},${y + 22}V${y + 6}Q${x},${y} ${x + 6},${y}Z`,
      { stroke: l === 3 ? C.orange : C.navy, w: 1.2, at: l * 160 });
    label(s2, x + 9, y + 12, t, { size: 7.4, fill: l === 3 ? C.orangeInk : C.muted, at: 300 + l * 160 });
    label(s2, x + w - 9, y + 12, n, { size: 7.8, anchor: 'end', decode: true, fill: l === 3 ? C.orangeInk : C.navy, at: 360 + l * 160 });
    if (l < 3) line(s2, `M200,${y + 30}V${y + 50}M196,${y + 45}L200,${y + 50}L204,${y + 45}`, { stroke: C.muted, w: 1, at: 120 + l * 160 });
  });
  // which level each dot reaches (the first six are the included studies)
  const LEVEL = Array.from({ length: N }, (_, i) => i < 6 ? 3 : i < 9 ? 2 : i < 14 ? 1 : 0);
  const rank = (i, l) => { let r = 0; for (let j = 0; j < i; j++) if (LEVEL[j] >= l) r++; return r; };
  const FUN = (i, l) => { const [x, y, w] = BOX[l], n = KEEP[l], sp = Math.min(13.5, (w - 30) / (n - 1)); return [200 - (n - 1) * sp / 2 + rank(i, l) * sp, y + 21]; };

  /* 04 data and statistics: a scatter, its fitted line and confidence band */
  const s3 = stage('Data & statistics', 'Descriptive statistics · regression');
  const NOISE = [.3, -.8, .5, -.2, .9, -.6, .1, .7, -.9, .4, -.3, .8, -.5, .2, .6, -.7, 0, -.4, .9, -.1, .5, -.8, .3, -.2];
  const fit = x => 246 - (x - PX0) * .52;
  const SCAT = Array.from({ length: N }, (_, i) => { const x = 86 + i * 11; return [x, fit(x) + NOISE[i] * 16]; });
  line(s3, `M76,${fit(76).toFixed(1)}L344,${fit(344).toFixed(1)}`, { stroke: C.orange, w: 1.6, at: 450 });
  const band = sgn => { let d = ''; for (let x = 76; x <= 344; x += 12) { const y = fit(x) + sgn * (9 + ((x - 210) / 134) ** 2 * 11); d += (d ? 'L' : 'M') + x + ',' + y.toFixed(1); } return d; };
  line(s3, band(-1), { stroke: C.orange, w: 1, op: .45, at: 600 });
  line(s3, band(1), { stroke: C.orange, w: 1, op: .45, at: 640 });
  label(s3, 86, 98, 'R = 0.64', { decode: true, fill: C.navy });
  label(s3, 86, 112, 'N = 480', { decode: true });
  label(s3, 300, fit(300) - 26, '95% CI', { fill: C.orangeInk, anchor: 'middle' });
  label(s3, PX1, PY1 + 16, 'EXPOSURE', { anchor: 'end', size: 7.8 });
  label(s3, PX0, PY0 - 8, 'RESPONSE', { size: 7.8 });

  /* 05 analysis: Kaplan-Meier curves, treatment against control */
  const s4 = stage('Analysis', 'Time to event · Kaplan-Meier · hazard ratio');
  const TRT = [[100, 94], [132, 104], [166, 114], [205, 124], [246, 134], [290, 142], [332, 148]];
  const CTL = [[92, 100], [116, 118], [144, 136], [176, 154], [212, 170], [252, 186], [296, 198], [338, 206]];
  const stepPath = drops => { let d = `M${PX0},84`; drops.forEach(([x, y]) => { d += `H${x}V${y}`; }); return d + `H${PX1}`; };
  const stepAt = (drops, x) => { let y = 84; drops.forEach(([dx, dy]) => { if (x >= dx) y = dy; }); return y; };
  const KM = Array.from({ length: N }, (_, i) => { const t = i < 12, k = i % 12, x = (t ? 80 : 91) + k * 22; return [x, stepAt(t ? TRT : CTL, x)]; });
  const kmG = mk('g', {}, s4.g);
  line(s4, stepPath(TRT), { stroke: C.orange, w: 1.7, parent: kmG, at: 300 });
  line(s4, stepPath(CTL), { w: 1.7, parent: kmG, at: 360 });
  [70, 140, 210, 280, 350].forEach((x, i) => label(s4, x, PY1 + 14, String(i * 6), { anchor: 'middle', size: 7.4 }));
  line(s4, 'M250,92L262,92', { stroke: C.orange, w: 1.7, at: 500 });
  line(s4, 'M250,106L262,106', { w: 1.7, at: 540 });
  label(s4, 268, 95, 'TREATMENT', { fill: C.orangeInk, size: 7.6 });
  label(s4, 268, 109, 'CONTROL', { fill: C.navy, size: 7.6 });
  label(s4, 84, 236, 'HR 0.72 · 95% CI 0.58 TO 0.89', { decode: true, fill: C.navy, size: 8.2 });
  label(s4, 84, 250, 'P < 0.001', { decode: true, size: 8.2 });
  label(s4, PX1, PY1 - 6, 'MONTHS', { anchor: 'end', size: 7.4 });
  label(s4, PX0, PY0 - 8, 'SURVIVAL', { size: 7.8 });

  // the axes stay through statistics and analysis
  const axes = { g: mk('g', { visibility: 'hidden' }, root), lines: [], labels: [], from: 3, to: 4 };
  line(axes, `M${PX0},${PY1}H${PX1}M${PX0},${PY1}V${PY0}`, { w: 1.2, at: 0 });
  line(axes, [70, 140, 210, 280, 350].map(x => `M${x},${PY1}V${PY1 + 4}`).join('') + [262, 215, 168, 121, 74].map(y => `M${PX0},${y}H${PX0 - 4}`).join(''), { w: 1, stroke: C.muted, at: 150 });

  /* 06 reporting: the analysis becomes a figure in a clinical study report */
  const s5 = stage('Reporting', 'Clinical study report · ICH E3');
  const map = (box, x, y) => [box[0] + (x - PX0) * box[2], box[1] + (y - PY0) * box[3]];
  const FIG5 = [132, 130, 136 / 280, 60 / 188], FIG6 = [210, 172, 62 / 280, 30 / 188];
  const stepIn = (drops, box) => {
    const m = (x, y) => map(box, x, y), f = v => v.toFixed(1);
    let d = `M${f(m(PX0, 84)[0])},${f(m(PX0, 84)[1])}`;
    drops.forEach(([x, y]) => { const [a, b] = m(x, y); d += `H${f(a)}V${f(b)}`; });
    return d + `H${f(m(PX1, 0)[0])}`;
  };
  label(s5, 124, 74, 'CLINICAL STUDY REPORT', { size: 7.2, fill: C.ink, at: 200 });
  line(s5, 'M124,80H276', { w: 1, at: 150 });
  label(s5, 124, 94, '14.2  EFFICACY RESULTS', { size: 7.2, fill: C.navy, at: 280 });
  [[103, 148], [110, 132], [117, 112]].forEach(([y, w], i) => line(s5, `M124,${y}H${124 + w}`, { stroke: C.light, w: 3, cap: 'butt', at: 320 + i * 60 }));
  line(s5, 'M124,124H276V196H124Z', { stroke: C.faint, w: 1, at: 380 });
  line(s5, stepIn(TRT, FIG5), { stroke: C.orange, w: 1.2, at: 0 });
  line(s5, stepIn(CTL, FIG5), { w: 1.2, at: 0 });
  label(s5, 124, 205, 'FIGURE 14.2.1', { size: 6.4, at: 520 });
  line(s5, 'M124,214H276M124,226H276M124,238H276M124,250H276M172,214V250M224,214V250', { stroke: C.light, w: 1, at: 560 });
  label(s5, 128, 222.5, 'ENDPOINT', { size: 6.2, at: 640 });
  label(s5, 176, 222.5, 'HR', { size: 6.2, at: 660 });
  label(s5, 228, 222.5, '95% CI', { size: 6.2, at: 680 });
  label(s5, 124, 280, 'PAGE 87 OF 412', { size: 6.2, decode: true, at: 720 });

  /* 07 manuscript and publication: an IMRaD paper, accepted */
  const s6 = stage('Manuscript & publication', 'IMRaD manuscript · peer review · accepted');
  label(s6, 124, 74, 'JOURNAL ARTICLE', { size: 7.2, fill: C.ink, at: 200 });
  line(s6, 'M124,80H276M124,83H276', { w: .9, at: 150 });
  line(s6, 'M124,96H262', { stroke: C.ink, w: 5.5, cap: 'butt', at: 260 });
  line(s6, 'M124,106H220', { stroke: C.ink, w: 5.5, cap: 'butt', at: 300 });
  line(s6, 'M124,117H218', { stroke: C.muted, w: 2.4, cap: 'butt', at: 340 });
  line(s6, 'M124,124H276V150H124Z', { stroke: C.faint, w: 1, at: 380 });
  [[132, 140], [138, 132], [144, 110]].forEach(([y, w], i) => line(s6, `M130,${y}H${130 + w}`, { stroke: C.light, w: 2, cap: 'butt', at: 420 + i * 40 }));
  label(s6, 124, 164, 'INTRODUCTION', { size: 6.2, fill: C.navy, at: 480 });
  [[170, 70], [176, 66], [182, 70], [188, 52]].forEach(([y, w], i) => line(s6, `M124,${y}H${124 + w}`, { stroke: C.light, w: 2, cap: 'butt', at: 520 + i * 30 }));
  label(s6, 124, 202, 'METHODS', { size: 6.2, fill: C.navy, at: 560 });
  [[208, 70], [214, 62], [220, 70], [226, 66], [232, 48]].forEach(([y, w], i) => line(s6, `M124,${y}H${124 + w}`, { stroke: C.light, w: 2, cap: 'butt', at: 600 + i * 30 }));
  label(s6, 206, 164, 'RESULTS', { size: 6.2, fill: C.navy, at: 520 });
  line(s6, 'M206,168H276V206H206Z', { stroke: C.faint, w: 1, at: 540 });
  line(s6, stepIn(TRT, FIG6), { stroke: C.orange, w: 1.1, at: 560 });
  line(s6, stepIn(CTL, FIG6), { w: 1.1, at: 560 });
  label(s6, 206, 220, 'DISCUSSION', { size: 6.2, fill: C.navy, at: 600 });
  [[226, 70], [232, 58]].forEach(([y, w], i) => line(s6, `M206,${y}H${206 + w}`, { stroke: C.light, w: 2, cap: 'butt', at: 640 + i * 30 }));
  // the seal: the dots close into a ring around it
  const SEAL = [244, 262], seal = mk('g', { transform: `rotate(-14 ${SEAL[0]} ${SEAL[1]})` }, s6.g);
  line(s6, `M${SEAL[0] + 22},${SEAL[1]}A22 22 0 1 1 ${SEAL[0] - 22},${SEAL[1]}A22 22 0 1 1 ${SEAL[0] + 22},${SEAL[1]}`, { stroke: C.orange, w: 1.2, parent: seal, at: 1500 });
  label(s6, SEAL[0], SEAL[1] + 2.6, 'ACCEPTED', { anchor: 'middle', size: 7.2, weight: 600, ls: 1, fill: C.orangeInk, parent: seal, at: 1700, decode: true });
  const RING = Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2 - Math.PI / 2; return [SEAL[0] + 29 * Math.cos(a), SEAL[1] + 29 * Math.sin(a)]; });

  // the page stays through reporting and the manuscript
  const page = { g: mk('g', { visibility: 'hidden' }, root), lines: [], labels: [], from: 5, to: 6 };
  mk('rect', { x: 112, y: 56, width: 176, height: 236, rx: 6, fill: '#fff', class: 'pipe-page' }, page.g);
  line(page, 'M118,56H282Q288,56 288,62V286Q288,292 282,292H118Q112,292 112,286V62Q112,56 118,56Z', { w: 1.2, at: 0 });
  root.insertBefore(page.g, root.firstChild);   // the paper sits under the stages' drawing

  /* ---- the dots: where each one is in every stage, at stage time u */
  const NAVY = 0, ORANGE = 1;
  function dot(s, i, u) {   // -> [x, y, r, opacity, colour 0..1]
    switch (s) {
      case 0: return i < ATOMS.length ? [...ATOMS[i], 3.4, 1, i === 12 ? ORANGE : NAVY] : [cA[0] + 26, cA[1], 1, 0, NAVY];
      case 1: {   // gather in the cohort, then pass through the randomisation to the arms
        const p = easeInOutCubic(clamp((u - 900 - i * 34) / 900)), arm = i < 12 ? 0 : 1, g = GRID[i], f = ARMPOS[i], a = [178, ARM[arm]];
        const at = p < .45 ? lerp2(g, R, p / .45) : p < .6 ? lerp2(R, a, (p - .45) / .15) : lerp2(a, f, (p - .6) / .4);
        return [...at, p < .45 ? 3 : 2.8, 1, arm === 0 ? clamp((p - .45) / .2) : NAVY];
      }
      case 2: {   // through the review, level by level; those not taken further step aside
        const step = l => 250 + l * 520;
        let l = 0;
        while (l < 3 && l < LEVEL[i] && u >= step(l + 1)) l++;
        let pos = FUN(i, l), op = 1;
        if (l < LEVEL[i]) { const k = easeInOutSine(clamp((u - step(l + 1) + 420) / 420)); pos = lerp2(pos, FUN(i, l + 1), k); }
        else if (l < 3) {   // left behind at this level: slides aside and fades
          const k = easeInOutSine(clamp((u - step(l + 1)) / 420)); pos = [pos[0] + (pos[0] < 200 ? -1 : 1) * 30 * k, pos[1]]; op = 1 - k;
        }
        return [...pos, 2.6, op, LEVEL[i] === 3 ? clamp((u - step(3)) / 300) : NAVY];
      }
      case 3: return [...SCAT[i], 2.9, 1, NAVY];
      case 4: return [...KM[i], 2.5, 1, i < 12 ? ORANGE : NAVY];
      case 5: return [...map(FIG5, ...KM[i]), 1.5, 1, i < 12 ? ORANGE : NAVY];
      default: {   // into the paper's figure, then out to close the seal
        const p = easeInOutCubic(clamp((u - 900 - i * 22) / 800));
        return [...lerp2(map(FIG6, ...KM[i]), RING[i], p), 1.3 + .9 * p, 1, i < 12 ? ORANGE : p];
      }
    }
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const dots = Array.from({ length: N }, () => mk('circle', { r: 3, cx: 200, cy: 170, fill: C.navy }, $('pipeDots')));

  /* ---- header and footer */
  const title = $('pipeTitle'), note = $('pipeNote'), count = $('pipeCount');
  const segs = Array.from({ length: COUNT }, (_, k) => {
    const x = 24 + k * (352 + 6) / COUNT, w = (352 + 6) / COUNT - 6;
    mk('rect', { x, y: 354, width: w, height: 3, rx: 1.5, fill: C.faint }, $('pipeProgress'));
    return { fill: mk('rect', { x, y: 354, width: 0, height: 3, rx: 1.5, fill: C.orange }, $('pipeProgress')), w };
  });

  /* ---- one frame */
  function drawGroup(s, local, fade) {   // local: time since the group appeared
    s.g.setAttribute('visibility', 'visible');
    s.g.setAttribute('opacity', fade.toFixed(3));
    s.lines.forEach(l => l.el.setAttribute('stroke-dashoffset', (1 - easeInOutSine(clamp((local - l.at) / 560))).toFixed(4)));
    s.labels.forEach(l => {
      const e = local - l.at;
      l.el.setAttribute('opacity', clamp(e / 260).toFixed(3));
      if (l.decode) l.el.textContent = e > 0 && e < 520 ? scramble(l.text, e) : l.text;
    });
    s.g.querySelectorAll('.pipe-fade').forEach(el => el.setAttribute('opacity', clamp((local - 120) / 300).toFixed(3)));
  }
  const fadeOut = u => 1 - easeInOutSine(clamp((u - IN - HOLD) / (OUT * .75)));
  let lastStage = -1;
  function renderAt(t) {
    const T = ((t % LOOP) + LOOP) % LOOP, s = Math.floor(T / STAGE), u = T - s * STAGE;
    stages.forEach((st, k) => { if (k === s) drawGroup(st, u, fadeOut(u)); else st.g.setAttribute('visibility', 'hidden'); });
    [axes, page].forEach(sh => {
      if (s >= sh.from && s <= sh.to) drawGroup(sh, (s - sh.from) * STAGE + u, s === sh.to ? fadeOut(u) : 1);
      else sh.g.setAttribute('visibility', 'hidden');
    });
    // the dots: in this stage's formation, then handed to the next stage's during the hand-over
    const next = (s + 1) % COUNT;
    dots.forEach((el, i) => {
      let d = dot(s, i, u);
      const k = easeInOutCubic(clamp((u - IN - HOLD - i * 12) / (OUT - 12 * (N - 1))));
      if (k > 0) { const e = dot(next, i, 0); d = [lerp(d[0], e[0], k), lerp(d[1], e[1], k), lerp(d[2], e[2], k), lerp(d[3], e[3], k), lerp(d[4], e[4], k)]; }
      const c = RGB.navy.map((v, j) => Math.round(lerp(v, RGB.orange[j], d[4])));
      el.setAttribute('cx', d[0].toFixed(2)); el.setAttribute('cy', d[1].toFixed(2)); el.setAttribute('r', d[2].toFixed(2));
      el.setAttribute('opacity', d[3].toFixed(3)); el.setAttribute('fill', `rgb(${c})`);
    });
    // the stage's name decodes as it changes; the bar fills through the stage
    const e = u;
    const name = stages[s].title.toUpperCase();
    title.textContent = e < 520 ? scramble(name, e) : name;
    note.textContent = stages[s].note;
    note.setAttribute('opacity', (clamp((e - 300) / 400) * fadeOut(u)).toFixed(3));
    count.textContent = `${String(s + 1).padStart(2, '0')} / ${String(COUNT).padStart(2, '0')}`;
    segs.forEach((sg, k) => {
      sg.fill.setAttribute('width', (k < s ? sg.w : k === s ? sg.w * clamp(u / STAGE) : 0).toFixed(2));
      sg.fill.setAttribute('fill', k < s ? C.navy : C.orange);
    });
    if (s !== lastStage) { lastStage = s; svg.setAttribute('data-stage', String(s)); }
  }

  /* ---- playback: runs only on screen and after the intro; a pause button; a still with reduced motion */
  let clock = 0, last = null, raf = 0, onScreen = true, userPaused = false, allowed = false;
  const STILL = 6 * STAGE + IN + HOLD - 200;   // the paper, accepted
  function frame(now) { raf = requestAnimationFrame(frame); if (last !== null) clock += Math.min(now - last, 100); last = now; renderAt(clock); }
  function update() {
    const run = allowed && onScreen && !userPaused && !document.hidden;
    if (run && !raf) { last = null; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  const btn = $('heroPause');
  function setPaused(p) { userPaused = p; btn.setAttribute('aria-pressed', String(p)); btn.setAttribute('aria-label', p ? 'Play animation' : 'Pause animation'); update(); }
  btn.addEventListener('click', () => setPaused(!userPaused));
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; update(); }).observe($('heroVisual'));
  document.addEventListener('visibilitychange', update);
  renderAt(0);
  // with an intro, the drawing starts once the logo has landed (a panel that animates while it is
  // first revealed made the glide stall, measured); until then it shows its first frame
  const startWhenSettled = fn => {
    if (!INTRO || document.documentElement.classList.contains('logo-landed')) fn();
    else document.addEventListener('mewrit:introdone', fn, { once: true });
  };
  if (REDUCE || STATIC) { clock = STILL; renderAt(STILL); setPaused(true); } else startWhenSettled(() => { allowed = true; update(); });
  // review and test hook
  window.mewritHero = { seek(t) { clock = t; renderAt(t); }, pause() { setPaused(true); }, play() { setPaused(false); }, isRunning: () => !!raf, loopMs: LOOP, still: STILL, stageMs: STAGE };
}
