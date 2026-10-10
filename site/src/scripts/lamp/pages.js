/* The hero page of the lamplight film (src/pages/lamplight/index.astro) in each of its states, all
   generated here as particles: no models, no images. Every formation is drawn in the page's own
   frame (its centre at the origin, x across, y up, z toward the reader; the page is PW wide by PH
   tall) and the renderer places it in the world on its chapter's anchor. A formation gives every
   particle a place, a colour, a key and a tag:
   - the key orders how the page writes itself: 0 is lit from the start; any other particle stays
     dark until the reveal passes its key, then flares like fresh ink. The outline comes first (keys
     up to OUTLINE, which the loading counter draws on the first page), then one pen writes the
     rest, top to bottom, stroke after stroke;
   - the tag: 0 to 4 are the contents page's five entries (the one pointed at brightens), 10 the
     pages under the hero page (they stay and fade while it turns), 11 a seal (it presses on last),
     -1 everything else;
   - the particles a formation does not use wait dark in a haze around the page, at the same place
     in every formation, so a shape that grows gathers from close by, never from across the screen.
   Colours are given in sRGB and stored linear, with the brightness folded in. Budgets are shares
   of N, so phones (fewer particles) get the same pages, sparser. */

export const PW = 7.6, PH = 10.6;
export const OUTLINE = .12;
export const F = { DUST: 0, TITLE: 1, CONTENTS: 2, SHEET: 3, DOSSIER: 4, ARTICLE: 5, RECORD: 6, STAR: 7, LETTER: 8, ENVELOPE: 9, POINT: 10 };

// a small seeded random generator: the same pages on every load
export function random(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const lin = v => (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
const hex = h => [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
export const PAL = {
  ice: hex('#C9D8FF'), steel: hex('#8FA8E8'), blue: hex('#4C74D9'), deep: hex('#2B4A92'), night: hex('#1A2C66'),
  orange: hex('#E07A1F'), ember: hex('#FF9A3C'), gold: hex('#F0C35C'), amber: hex('#F2B866'), white: hex('#FFFFFF'),
};
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const TAU = Math.PI * 2;
// a point along a rectangle's outline (q from 0 to 1, clockwise from the top left), in -.5 to .5
const outline = q => { const t = (q % 1) * 4, s = Math.floor(t), u = t - s; return s === 0 ? [u - .5, .5] : s === 1 ? [.5, .5 - u] : s === 2 ? [.5 - u, -.5] : [-.5, u - .5]; };
// a 3 x 5 dot font for the figures on the pages
const GLYPH = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
};

// the haze: where each particle waits while a formation has no use for it
function makeHaze(N, R) {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (R() - .5) * 11.5; pos[i * 3 + 1] = (R() - .5) * 14.5; pos[i * 3 + 2] = (R() - .5) * 4; }
  return pos;
}

// one formation being filled: put() places the next particle (with the current tag); done() sends
// the rest to the haze, dark
function former(N, haze) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), key = new Float32Array(N), tag = new Float32Array(N);
  let i = 0;
  const f = {
    tag: -1,
    get count() { return i; },
    put(x, y, z, c, b = 1, k = 0) {
      if (i >= N) return false;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
      key[i] = k; tag[i] = f.tag;
      i++;
      return true;
    },
    // keys of the particles placed so far, from `from` on, set to k (a part lit from the start)
    light(from, k = 0) { for (let j = from; j < i; j++) key[j] = k; },
    done(anchors = {}, extra = {}) {
      for (let j = i; j < N; j++) { pos[j * 3] = haze[j * 3]; pos[j * 3 + 1] = haze[j * 3 + 1]; pos[j * 3 + 2] = haze[j * 3 + 2]; key[j] = -1; tag[j] = -1; }
      const fm = { pos, col, key, tag, anchors, used: i, ghost: 0, sealC: [0, 0, 0], ...extra };
      fm.box = boxOf(fm);
      return fm;
    },
  };
  return f;
}

// the pen and its kit: runs, rings, dot-font figures, lines of text, rules; strokes are declared in
// any order and written by write(k0, k1) top to bottom, then left to right, each keyed in proportion
// to its length with a short lift of the pen between them
function kit(N, seed, haze) {
  const R = random(seed), f = former(N, haze), n = q => Math.max(1, Math.round(N * q));
  let off = [0, 0, 0];
  const at = (u, v, w, c, b, k) => f.put(u + off[0], v + off[1], w + off[2], c, b, k);
  const run = (u0, v0, u1, v1, m, c, b, w, kOf, jit = .02) => {
    for (let q = 0; q < m; q++) { const s = R(); at(u0 + (u1 - u0) * s + (R() - .5) * jit, v0 + (v1 - v0) * s + (R() - .5) * jit, w, c, b, kOf(s)); }
  };
  const ring = (cu, cv, r, m, c, b, w, kOf, jit = .025) => {
    for (let q = 0; q < m; q++) { const t = R(), a = Math.PI / 2 - t * TAU, rr = r + (R() - .5) * jit; at(cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, w, c, b, kOf(t)); }
  };
  const digits = (u0, v0, str, cell, c, b, kOf, w = 0) => [...str].forEach((ch, ci) => {
    const g = GLYPH[ch];
    if (!g) return;
    for (let r = 0; r < 5; r++) for (let cl = 0; cl < 3; cl++) {
      if (g[r * 3 + cl] !== '1') continue;
      for (let q = 0, m = Math.max(3, n(.00007)); q < m; q++) at(u0 + (ci * 4 + cl + R() * .8) * cell, v0 - (r + R() * .8) * cell, w, c, b, kOf((ci * 3 + cl + .5) / (str.length * 3)));
    }
  });
  const strokes = [];
  const put = (v, u, len, draw) => strokes.push([v, u, len, draw, off, f.tag]);
  // a line of text: words of random length, written left to right
  const text = (u0, v, len, c, b, h, dens, { w = 0, wmin = .2, wmax = .95, gap = .12 } = {}) => put(v, u0, len, k => {
    const words = [];
    for (let x = 0; x < len - .08;) { const wl = Math.min(len - x, wmin + R() * (wmax - wmin)); words.push([x, wl]); x += wl + gap; }
    const ink = words.reduce((t, wd) => t + wd[1], 0);
    for (let q = 0, m = n(dens * len); q < m; q++) {
      let r = R() * ink, j = 0;
      while (j < words.length - 1 && r > words[j][1]) { r -= words[j][1]; j++; }
      const s = words[j][0] + Math.min(r, words[j][1]);
      at(u0 + s, v + (R() - .5) * h, w, c, b * (.85 + R() * .3), k(s / len));
    }
  });
  const rule = (u0, v0, u1, v1, c, b, dens, w = 0) => put(Math.max(v0, v1), Math.min(u0, u1), Math.hypot(u1 - u0, v1 - v0), k => run(u0, v0, u1, v1, n(dens * Math.hypot(u1 - u0, v1 - v0)), c, b, w, k, .015));
  // a run of blocks like a document code (as in MW-CSR-0712), centred on cu or from u0
  const blocks = (u0, v, groups, cell, c, b) => {
    const cells = [];
    let x = 0;
    groups.forEach(len => { for (let q = 0; q < len; q++) cells.push(x + q * cell); x += len * cell + cell * .7; });
    put(v + .08, u0, x, k => cells.forEach((cx, j) => { for (let q = 0, m = Math.max(3, n(.00016)); q < m; q++) at(u0 + cx + R() * cell * .72, v + (R() - .5) * .15, 0, c, b, k(j / cells.length)); }));
    return x - cell * .7;
  };
  const write = (k0, k1, lift = .15) => {
    strokes.sort((p, q) => q[0] - p[0] || p[1] - q[1]);
    const total = strokes.reduce((t, s) => t + s[2] + lift, 0) || 1;
    let acc = 0;
    strokes.forEach(([, , len, draw, o, tg]) => {
      const a = k0 + (k1 - k0) * acc / total, b = k0 + (k1 - k0) * (acc + len) / total;
      off = o; f.tag = tg;
      draw(s => a + (b - a) * s);
      acc += len + lift;
    });
    strokes.length = 0;
  };
  return { R, f, n, at, run, ring, digits, put, text, rule, blocks, write, offset(o) { off = o; } };
}

// the page's frame: its edge drawn clockwise from the top left, crop marks outside its corners as the
// edge passes them (on the first page only), and the sheet itself, barely there, filling in from the
// top; all of it within the outline's keys
function frame(K, { crop = false, edge = .045, fill = .035, w = 0 } = {}) {
  const { n, at, R, run } = K, ko = (a, b, s) => .9 * OUTLINE * (a + (b - a) * s);
  for (let q = 0, m = n(edge); q < m; q++) { const s = q / m, [ou, ov] = outline(s); at(ou * PW + (R() - .5) * .02, ov * PH + (R() - .5) * .02, w, PAL.ice, .95, ko(.03, .62, s)); }
  if (crop) [[-1, 1, 0], [1, 1, .25], [1, -1, .5], [-1, -1, .75]].forEach(([su, sv, s]) => {
    const k = ko(.03, .62, s), cu = su * PW / 2, cv = sv * PH / 2;
    run(cu + su * .22, cv, cu + su * .66, cv, n(.0008), PAL.steel, .75, w, () => k);
    run(cu, cv + sv * .22, cu, cv + sv * .66, n(.0008), PAL.steel, .75, w, () => k);
  });
  for (let q = 0, m = n(fill); q < m; q++) { const u = (R() - .5) * PW * .98, v = (R() - .5) * PH * .98; at(u, v, w - .03, mix3(PAL.night, PAL.steel, R() * .6), .05 + R() * .05, ko(.05, .66, (PH / 2 - v) / PH)); }
  // the margin's ticks, one a line, top to bottom
  for (let j = 0; j < 22; j++) { const v = 4.1 - j * .41; run(-PW / 2 + .14, v, -PW / 2 + .28, v, Math.max(4, n(.0002)), PAL.steel, .5, w, () => ko(.68, .9, j / 22), .01); }
}

// a seal: an outer ring, ticks inward, an inner ring and a word across, gold with ember ticks;
// keyed k0 to k1 (pressed on last: the caller tags it 11)
function seal(K, cu, cv, r, w, k0, k1, s = 1) {
  const { n, at, R } = K, kk = t => k0 + (k1 - k0) * t;
  for (let q = 0, m = n(.011 * s); q < m; q++) { const t = R(), a = Math.PI / 2 - t * TAU, rr = r + (R() - .5) * .03; at(cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, w, PAL.gold, 1.25, kk(t * .5)); }
  for (let tk = 0; tk < 36; tk++) {
    const t = tk / 36, a = Math.PI / 2 - t * TAU;
    for (let q = 0, m = Math.max(4, n(.00013 * s)); q < m; q++) { const rr = r * (.8 + R() * .13); at(cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, w, PAL.ember, 1, kk(t * .5)); }
  }
  for (let q = 0, m = n(.005 * s); q < m; q++) { const a = R() * TAU, rr = r * .74 + (R() - .5) * .02; at(cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, w, PAL.gold, .85, kk(.5 + .15 * R())); }
  for (let q = 0, m = n(.007 * s); q < m; q++) at(cu - r * .5 + R() * r, cv + (R() - .5) * r * .15, w, PAL.gold, 1.35, kk(.68 + .3 * R()));
  for (const dv of [.36, -.36]) for (let q = 0, m = n(.0012 * s); q < m; q++) { const a = R() * TAU, rr = .045 * Math.sqrt(R()); at(cu + Math.cos(a) * rr, cv + dv * r + Math.sin(a) * rr, w, PAL.gold, 1.2, kk(.9)); }
}

/* the loading screen's dust: a loose cloud around the page, thicker toward it, which gathers into
   the title page's outline as the counter runs */
function dust(N, haze) {
  const R = random(2100), f = former(N, haze);
  for (let i = 0, m = Math.round(N * .62); i < m; i++) {
    const r = Math.pow(R(), .65), th = R() * TAU, ph = Math.acos(2 * R() - 1);
    f.put(Math.sin(ph) * Math.cos(th) * 15 * r, Math.cos(ph) * 10.5 * r, Math.sin(ph) * Math.sin(th) * 8 * r, mix3(PAL.night, PAL.steel, R() * .55), .1 + R() * .2, 0);
  }
  return f.done({});
}

/* 00 the title page: a centred title block, a rule in orange, small lines beneath, and at the foot a
   double rule in gold, the place and the date */
function title(N, haze) {
  const K = kit(N, 2101, haze), { text, rule, blocks, write } = K;
  frame(K, { crop: true });
  const L = -3.3, RT = 3.3;
  blocks(-.62, 4.66, [2, 3, 2], .16, PAL.steel, .7);
  rule(L, 4.3, RT, 4.3, PAL.steel, .38, .0008);
  text(-2.8, 2.6, 5.6, PAL.white, 1.2, .3, .0046, { wmin: .55, wmax: 1.6, gap: .22 });
  text(-2.05, 1.82, 4.1, PAL.white, 1.2, .3, .0046, { wmin: .55, wmax: 1.6, gap: .22 });
  rule(-.85, 1.08, .85, 1.08, PAL.orange, 1.15, .0024);
  text(-2.35, .45, 4.7, PAL.ice, .92, .13, .0028);
  text(-1.75, .02, 3.5, PAL.ice, .92, .13, .0028);
  text(-1.2, -1.3, 2.4, PAL.steel, .72, .07, .002);
  text(-1.6, -1.66, 3.2, PAL.steel, .55, .06, .0018);
  text(-.9, -2.02, 1.8, PAL.steel, .55, .06, .0018);
  rule(-.62, -3.82, .62, -3.82, PAL.gold, .75, .0018);
  rule(-.62, -3.93, .62, -3.93, PAL.gold, .75, .0018);
  text(-1.1, -4.42, 2.2, PAL.steel, .62, .06, .0018);
  text(-.7, -4.8, 1.4, PAL.steel, .45, .05, .0015);
  write(OUTLINE + .03, .985);
  return K.f.done({ title: [0, 2.6, 0] });
}

/* 01 the contents page: a heading and a rule, then the five practices, each with its number in
   orange, its title (as long as its name), a line under it, a dotted leader and its page number;
   each entry is its own group (tag 0 to 4), lit brighter when its link is pointed at */
const ENTRY = [2.9, 3.7, 3.5, 1.3, 2.2], ENTRY_V = j => 1.95 - j * 1.24;
function contents(N, haze) {
  const K = kit(N, 2102, haze), { text, rule, put, digits, at, R, n, write } = K;
  frame(K);
  const L = -3.3, RT = 3.3;
  text(L, 4.62, 1.5, PAL.steel, .5, .06, .0016);
  rule(L, 4.3, RT, 4.3, PAL.steel, .38, .0008);
  text(L, 3.48, 2.5, PAL.white, 1.2, .28, .0046, { wmin: 1.2, wmax: 2.6 });
  rule(L, 2.92, RT, 2.92, PAL.ice, .55, .0011);
  const anchors = {};
  ENTRY.forEach((tw, j) => {
    const v = ENTRY_V(j);
    K.f.tag = j;
    put(v + .2, L, .55, k => digits(L, v + .2, '0' + (j + 1), .085, PAL.orange, 1.2, k));
    text(L + .9, v, tw, PAL.ice, 1.08, .17, .0036, { wmin: .5, wmax: 1.3 });
    // the leader: dots from the title to the page number
    const x0 = L + .9 + tw + .22, x1 = RT - .5, dots = Math.max(2, Math.floor((x1 - x0) / .17));
    put(v - .02, x0, x1 - x0, k => { for (let d = 0; d <= dots; d++) { const u = x0 + (x1 - x0) * d / dots; for (let q = 0, m = Math.max(4, n(.00011)); q < m; q++) { const a = R() * TAU, r = .028 * Math.sqrt(R()); at(u + Math.cos(a) * r, v - .06 + Math.sin(a) * r, 0, PAL.steel, .75, k(d / dots)); } } });
    put(v + .2, RT - .27, .27, k => digits(RT - .27, v + .2, String(j + 2), .085, PAL.ice, 1, k));
    text(L + .9, v - .44, [2.5, 3.1, 2.8, 2.2, 2.7][j], PAL.steel, .48, .05, .0016);
    anchors['e' + j] = [L + .9 + tw, v, 0];
  });
  K.f.tag = -1;
  rule(L, -4.4, RT, -4.4, PAL.steel, .38, .0008);
  text(L, -4.76, 1.6, PAL.steel, .45, .05, .0014);
  write(OUTLINE + .03, .985);
  return K.f.done(anchors);
}

/* 02 the page of a clinical study report: the header band with its code and page number, the title,
   a numbered section, then two columns: text on the left; a table and a figure on the right; a
   signature at the foot. The same page, the same particles, tops the dossier below */
function csr(K) {
  const { text, rule, put, digits, run, at, R, n, blocks } = K;
  const L = -3.35, RT = 3.35;
  rule(L, 4.42, RT, 4.42, PAL.steel, .4, .0008);
  blocks(L, 4.72, [2, 3, 4, 2], .2, PAL.steel, .75);
  put(4.8, RT - .6, .6, k => digits(RT - 7 * .085, 4.72 + 2.5 * .085, '01', .085, PAL.ice, 1, k));
  text(L, 3.85, 5.9, PAL.white, 1.15, .2, .0036);
  text(L, 3.3, 4.3, PAL.white, 1.15, .2, .0036);
  text(L, 2.85, 3.4, PAL.steel, .55, .07, .0017);
  rule(L, 2.55, RT, 2.55, PAL.steel, .45, .0008);
  put(2.2, L, .35, k => digits(L, 2.05 + 2 * .085, '1', .085, PAL.orange, 1.2, k));
  text(L + .5, 2.05, 2.6, PAL.ice, 1.05, .14, .0028);
  [1.55, 1.15, .75, .35].forEach((v, j) => text(L, v, j === 3 ? 4.1 : RT - L, PAL.steel, .6, .06, .002));
  for (let j = 0; j < 9; j++) text(L, -.25 - j * .4, j === 8 ? 1.9 : 3.1, PAL.steel, .6, .06, .002);
  const T0 = .3, cols = [T0, 1.42, 2.38], top = -.15, mid = -.5, rowV = j => -.72 - j * .33, foot = -1.92;
  rule(T0, top, RT, top, PAL.ice, .75, .0011);
  rule(1.33, top, 1.33, foot, PAL.steel, .4, .0008);
  rule(2.29, top, 2.29, foot, PAL.steel, .4, .0008);
  cols.forEach((u, c) => text(u + .06, -.32, [.75, .6, .65][c], PAL.ice, .95, .09, .003));
  rule(T0, mid, RT, mid, PAL.steel, .55, .0009);
  for (let j = 0; j < 4; j++) cols.forEach((u, c) => text(u + .06, rowV(j), c ? .45 + R() * .25 : .7 + R() * .2, PAL.steel, .6, .05, .0022));
  rule(T0, foot, RT, foot, PAL.ice, .75, .0011);
  const X0 = .55, X1 = 3.3, Y0 = -2.3, Y1 = -3.85;
  rule(X0, Y0, X0, Y1, PAL.steel, .65, .001);
  const curve = (amp, rate, c, b) => put(Y0 - .05, X0, X1 - X0, k => {
    const y = x => Y1 + (Y0 - Y1) * (.12 + amp * (1 - Math.exp(-rate * x)));
    for (let q = 0, m = n(.0075); q < m; q++) { const x = R(); at(X0 + .05 + x * (X1 - X0 - .1), y(x) + (R() - .5) * .035, 0, c, b, k(x)); }
  });
  curve(.78, 2.6, PAL.orange, 1.15);
  curve(.4, 1.8, PAL.blue, 1.05);
  put(Y1, X0, X1 - X0, k => run(X0, Y1, X1, Y1, n(.0028), PAL.steel, .65, 0, k, .015));
  put(-4.35, L, 1.75, k => {
    for (let q = 0, m = n(.0045); q < m; q++) {
      const s = R(), u = L + .1 + s * 1.7, v = -4.5 + .14 * Math.sin(s * 17) * (1 - .45 * s) + .07 * Math.sin(s * 41 + 1);
      at(u + (R() - .5) * .02, v + (R() - .5) * .02, 0, PAL.ice, .95, k(s));
    }
  });
  rule(L, -4.75, -1.3, -4.75, PAL.steel, .45, .0008);
  text(L, -4.95, 1.3, PAL.steel, .45, .05, .0014);
}
// the page as it arrives: a little in front of where the dossier will take it
const SHEET_AT = [0, .55, 1.2];
function sheet(N, haze) {
  const K = kit(N, 2103, haze);
  K.offset(SHEET_AT);
  frame(K);
  csr(K);
  K.write(OUTLINE + .03, .985);
  return K.f.done({});
}

/* 02 the dossier: the same page settled on top of a stack of six more, each a little further back,
   right and down, showing only where the ones in front leave it; three tabs stand out of its right
   side (CSR, CTD and IB, which the film's note names) and a spine binds its left edge, with a clip
   near the top and the foot. Everything under the top page is tagged 10: it stays, and fades, while
   the top page turns. The top page is lit from the start (it arrived written); the stack, the tabs
   and the binding come in as the chapter's reveal runs on */
export const STACK = 6;
function dossier(N, haze) {
  const K = kit(N, 2103, haze), { n, at, R, run } = K;
  frame(K);
  csr(K);
  K.write(OUTLINE + .03, .985);
  K.f.light(0, 0);
  const anchors = {};
  K.f.tag = 10;
  const pages = [[0, 0, 0], ...Array.from({ length: STACK }, (_, j) => [(j + 1) * .1, -(j + 1) * .085, -(j + 1) * .36])];
  const inside = (p, u, v) => Math.abs(u - p[0]) < PW / 2 - .015 && Math.abs(v - p[1]) < PH / 2 - .015;
  for (let j = 1; j <= STACK; j++) {
    const [du, dv, dw] = pages[j], kj = .72 + .08 * (j - 1) / STACK;
    for (let q = 0, m = n(.016); q < m; q++) {
      const s = R(), [ou, ov] = outline(s), u = du + ou * PW, v = dv + ov * PH;
      if (pages.slice(0, j).some(p => inside(p, u, v))) continue;
      at(u, v, dw, PAL.steel, .62 - j * .05, kj + .04 * s);
    }
  }
  // the stack's depth at the corners that show: from the top page's corners back to the last page's
  const last = pages[STACK];
  [[1, 1], [1, -1], [-1, -1]].forEach(([su, sv], c) => {
    for (let q = 0, m = n(.0016); q < m; q++) { const s = R(); at(su * PW / 2 + last[0] * s, sv * PH / 2 + last[1] * s, last[2] * s, PAL.steel, .55, .74 + .02 * c); }
  });
  // the tabs: on pages 2, 4 and 6, at three heights, in orange, gold and ice, each with its label
  const tabs = [[2, 3.25, PAL.orange], [4, 1.55, PAL.gold], [6, -.15, PAL.ice]];
  tabs.forEach(([j, vc, c], t) => {
    const [du, , dw] = pages[j], u0 = du + PW / 2, u1 = u0 + .58, k0 = .82 + .025 * t;
    for (let q = 0, m = n(.0042); q < m; q++) { const [ou, ov] = outline(R()), u = u0 + .29 + ou * .58, v = vc + ov * .92; if (u > u0 + .01) at(u, v, dw, c, 1.1, k0 + .02 * R()); }
    for (let q = 0, m = n(.0011); q < m; q++) at(u0 + .14 + R() * .3, vc + (Math.floor(R() * 3) - 1) * .17 + (R() - .5) * .03, dw, c, .9, k0 + .02);
    if (t === 1) anchors.tabs = [u1, vc, dw];
  });
  // the binding: a spine down the left edge across the stack's depth, its stitches, and two clips
  const S0 = -PW / 2 - .3, S1 = -PW / 2 + .04, d = last[2];
  run(S0, PH / 2, S0, -PH / 2, n(.006), PAL.ice, .85, .06, s => .88 + .1 * s, .012);
  run(S1, PH / 2, S1, -PH / 2, n(.004), PAL.ice, .6, .06, s => .88 + .1 * s, .012);
  run(S0, PH / 2, S0, -PH / 2, n(.003), PAL.steel, .5, d, s => .88 + .1 * s, .012);
  for (let t = 0; t < 22; t++) { const v = PH / 2 - .3 - t * (PH - .6) / 21; run(S0, v, S1, v, Math.max(4, n(.00022)), PAL.steel, .75, .06, () => .88 + .1 * t / 21, .008); }
  [3.75, -3.75].forEach((vc, c) => {
    for (let q = 0, m = n(.004); q < m; q++) { const [ou, ov] = outline(R()); at(-PW / 2 - .06 + ou * .82, vc + ov * .36, .1, PAL.gold, 1.15, .9 + .07 * c); }
  });
  anchors.binding = [S0, -1.6, .06];
  K.f.tag = -1;
  return K.f.done(anchors);
}

/* 03 the journal article: two columns with a figure and a table, an abstract in a box, the title,
   three pages under it (tag 10), and last of all the gold seal that says it was accepted (tag 11),
   which presses on at the end of the chapter */
function article(N, haze) {
  const K = kit(N, 2105, haze), { n, at, R, text, rule, put, run } = K;
  K.f.tag = 10;
  for (let p = 1; p <= 3; p++) for (let q = 0, m = n(.011); q < m; q++) { const [ou, ov] = outline(q / m); at(ou * PW + p * .15, ov * PH - p * .12, -p * .42, PAL.steel, .3 - p * .05, .01 + .08 * q / m); }
  K.f.tag = -1;
  frame(K);
  const L = -3.25, RT = 3.25;
  text(L, 4.75, 2.2, PAL.steel, .6, .07, .0018);
  text(RT - 1.4, 4.75, 1.4, PAL.steel, .45, .06, .0015);
  rule(L, 4.45, RT, 4.45, PAL.steel, .4, .0008);
  text(L, 3.95, 4.6, PAL.white, 1.15, .22, .0038, { wmin: .4, wmax: 1.2 });
  text(L, 3.42, 4.0, PAL.white, 1.15, .22, .0038, { wmin: .4, wmax: 1.2 });
  text(L, 2.95, 3.6, PAL.steel, .6, .07, .0018);
  const box = (u0, v0, u1, v1, c, b, dens) => { rule(u0, v0, u1, v0, c, b, dens); rule(u1, v0, u1, v1, c, b, dens); rule(u0, v1, u1, v1, c, b, dens); rule(u0, v0, u0, v1, c, b, dens); };
  box(L, 2.62, RT, .95, PAL.steel, .5, .001);
  for (let l = 0; l < 4; l++) text(L + .18, 2.28 - l * .36, l === 3 ? 3.4 : 6.1, PAL.steel, .58, .05, .0018);
  for (let l = 0; l < 11; l++) text(L, .5 - l * .42, l === 10 ? 1.6 : 3.0, PAL.steel, .52, .05, .0018);
  const F0 = .3, F1 = RT, FT = .55, FB = -1.9;
  box(F0, FT, F1, FB, PAL.steel, .55, .0011);
  const curve = (drops, c) => put(FT - .1, F0 + .15, F1 - F0 - .3, k => {
    for (let q = 0, m = n(.012); q < m; q++) { const x = R(); let y = .92; drops.forEach(([dx, dy]) => { if (x >= dx) y = dy; }); at(F0 + .15 + x * (F1 - F0 - .3), FB + .12 + y * (FT - FB - .3), 0, c, 1.15, k(x)); }
  });
  curve([[.1, .82], [.24, .72], [.4, .63], [.58, .55], [.75, .5], [.9, .46]], PAL.orange);
  curve([[.08, .76], [.2, .6], [.33, .45], [.48, .33], [.63, .25], [.8, .19], [.94, .16]], PAL.blue);
  for (let r = 0; r < 5; r++) text(F0, -2.32 - r * .42, F1 - F0, PAL.steel, .48, .05, .0017);
  for (const u of [1.3, 2.3]) put(-2.25, u, 1.9, k => run(u, -2.2, u, -4.1, n(.0012), PAL.steel, .42, 0, k, .01));
  rule(F0, -2.12, F1, -2.12, PAL.ice, .6, .001);
  K.write(OUTLINE + .03, .86);
  K.f.tag = 11;
  const SC = [2.42, 3.7, .1], SR = .86;
  seal(K, SC[0], SC[1], SR, SC[2], .905, .985);
  K.f.tag = -1;
  return K.f.done({ seal: [SC[0] + SR, SC[1] - .1, SC[2]], title: [L, 3.95, 0] }, { sealC: SC });
}

/* 04 a page of the record: a numbered list of references, each a long line and a shorter one under
   it, hanging from its number in orange. It dissolves into the star below */
function record(N, haze) {
  const K = kit(N, 2106, haze), { text, rule, put, digits, R, write } = K;
  frame(K);
  const L = -3.3, RT = 3.3;
  text(L, 4.62, 1.8, PAL.steel, .5, .06, .0016);
  rule(L, 4.3, RT, 4.3, PAL.steel, .38, .0008);
  text(L, 3.6, 2.8, PAL.white, 1.2, .26, .0044, { wmin: 1.4, wmax: 2.8 });
  rule(L, 3.08, RT, 3.08, PAL.ice, .5, .001);
  for (let j = 0; j < 8; j++) {
    const v = 2.5 - j * .9;
    put(v + .14, L, .25, k => digits(L, v + .15, String(j + 1), .066, PAL.orange, 1.2, k));
    text(L + .55, v, 5.3 + R() * .7, PAL.ice, .82, .07, .0022);
    text(L + .55, v - .34, 2.4 + R() * 2.6, PAL.steel, .55, .05, .0018);
  }
  rule(L, -4.62, RT, -4.62, PAL.steel, .38, .0008);
  text(L, -4.95, 1.2, PAL.steel, .45, .05, .0014);
  write(OUTLINE + .03, .985);
  return K.f.done({});
}

/* 04 the star: every particle of that page, gathered into one bright star a little above the page's
   centre (a hot core, a soft glow, four long rays and four short ones) with a few faint companions,
   as if the record were a constellation */
export const STAR_AT = [0, 1.2, .3];
function star(N, haze, count) {
  const R = random(2107), f = former(N, haze), c = STAR_AT, part = q => Math.round(count * q);
  const g = () => (R() + R() + R() - 1.5) / 1.5;
  for (let q = 0, m = part(.18); q < m; q++) f.put(c[0] + g() * .16, c[1] + g() * .16, c[2] + g() * .1, mix3(PAL.white, PAL.amber, R() * .5), .05 + R() * .05, 0);
  for (let q = 0, m = part(.36); q < m; q++) {
    const r = .18 + (-Math.log(1 - R() * .985)) * .32, a = R() * TAU, z = (R() - .5) * .3;
    f.put(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2] + z, mix3(PAL.gold, PAL.ice, R() * .6), .016 + .03 * Math.exp(-r), 0);
  }
  for (let q = 0, m = part(.3); q < m; q++) {
    const ray = q % 8, long = ray % 2 === 0, len = long ? 3.6 : 1.4, a = ray * Math.PI / 4, t = Math.pow(R(), 1.8), j = (R() - .5) * .022 * (1 - t);
    f.put(c[0] + Math.cos(a) * t * len - Math.sin(a) * j, c[1] + Math.sin(a) * t * len + Math.cos(a) * j, c[2], mix3(PAL.white, PAL.gold, t), (long ? .26 : .18) * (1 - t * .85), 0);
  }
  const mates = [[-2.6, 2.4], [2.9, 1.9], [-1.7, -1.6], [2.2, -2.3], [-3.4, -.2], [.9, 3.6], [3.6, .1], [-.6, -3.2], [1.6, -.4]];
  for (let q = 0, m = part(.16); q < m; q++) { const [mu, mv] = mates[q % mates.length], b = q % 3 === 0 ? .2 : .12; f.put(c[0] + mu + g() * .05, c[1] + mv + g() * .05, c[2] - .4, mix3(PAL.ice, PAL.gold, R() * .4), b, 0); }
  return f.done({ star: c });
}
/* 04 on the way to the star: every particle of the page drawn into one point of light where the star
   will be, so the page collapses into it whole before the star opens out of it */
function point(N, haze, count) {
  const R = random(2110), f = former(N, haze), c = STAR_AT, g = () => (R() + R() + R() - 1.5) / 1.5;
  for (let q = 0; q < count; q++) f.put(c[0] + g() * .07, c[1] + g() * .07, c[2] + g() * .05, mix3(PAL.white, PAL.amber, R() * .6), .012 + R() * .012, 0);
  return f.done({ star: c });
}

/* 05 the letter: a letterhead with a rule in orange, the date, the address, the salutation, three
   paragraphs, the close, a signature and the name under it. It folds into the envelope below */
function letter(N, haze) {
  const K = kit(N, 2108, haze), { text, rule, put, at, R, n, write } = K;
  frame(K);
  const L = -3.25, RT = 3.25, full = RT - L;
  text(L, 4.62, 2.3, PAL.white, 1.12, .17, .0036, { wmin: .6, wmax: 1.2 });
  text(L, 4.25, 3.3, PAL.steel, .55, .06, .0016);
  rule(L, 3.95, RT, 3.95, PAL.orange, .95, .0012);
  text(RT - 1.6, 3.4, 1.6, PAL.steel, .62, .06, .0017);
  [2.85, 2.52, 2.19].forEach((v, j) => text(L, v, [2.2, 2.8, 1.8][j], PAL.steel, .6, .06, .0017));
  text(L, 1.6, 1.5, PAL.ice, .95, .1, .0026);
  [[1.05, .7, .35, 0], [-.55, -.9, -1.25], [-1.8, -2.15]].forEach(par => par.forEach((v, j) => text(L, v, j === par.length - 1 ? 2.6 + R() * 2 : full, PAL.steel, .6, .06, .002)));
  text(L, -2.85, 1.6, PAL.ice, .88, .09, .0022);
  put(-3.35, L, 1.9, k => {
    for (let q = 0, m = n(.0045); q < m; q++) {
      const s = R(), u = L + .1 + s * 1.8, v = -3.55 + .15 * Math.sin(s * 15) * (1 - .4 * s) + .07 * Math.sin(s * 37 + 2);
      at(u + (R() - .5) * .02, v + (R() - .5) * .02, 0, PAL.ice, .95, k(s));
    }
  });
  text(L, -4.2, 2.0, PAL.steel, .62, .06, .0017);
  text(L, -4.52, 2.6, PAL.steel, .45, .05, .0015);
  write(OUTLINE + .03, .985);
  return K.f.done({});
}

/* 05 the envelope, its back to the reader, long and narrow like a DL envelope: inside it the letter,
   folded in three (every one of the letter's particles, where the shader's fold leaves them, dimmed
   by the paper between); around it the envelope's edge, the flap from its top corners down to the
   tip, the folds under it, and on the tip a seal of wax with a gold rim (tag 11, pressed on last).
   The envelope is drawn in as the chapter's reveal runs on, after the fold */
export const FOLD = PH / 6;
// the letter folded in three, exactly as the shader folds it (renderer.js, fold): its top third
// over toward the reader and down, its bottom third up
const folded = (x, y, z) => y > FOLD ? [x, 2 * FOLD - y, z] : y < -FOLD ? [x, -2 * FOLD - y, z] : [x, y, z];
export const ENV = { w: 8.3, h: 4.15, cy: 0 };
function envelope(N, haze, letterFm) {
  const K = kit(N, 2109, haze), { at, R, run, n, f } = K;
  for (let i = 0; i < letterFm.used; i++) {
    const p = folded(letterFm.pos[i * 3], letterFm.pos[i * 3 + 1], letterFm.pos[i * 3 + 2]), c = [letterFm.col[i * 3], letterFm.col[i * 3 + 1], letterFm.col[i * 3 + 2]];
    f.put(p[0], p[1], p[2], c, .3, 0);
  }
  const { w: EW, h: EH, cy } = ENV, tip = [0, cy - .5], w = .14;
  for (let q = 0, m = n(.034); q < m; q++) { const s = q / m, [ou, ov] = outline(s); at(ou * EW + (R() - .5) * .02, cy + ov * EH + (R() - .5) * .02, w, PAL.ice, 1, .6 + .14 * s); }
  run(-EW / 2, cy + EH / 2, tip[0], tip[1], n(.016), PAL.ice, 1.05, w + .01, s => .76 + .06 * s, .015);
  run(EW / 2, cy + EH / 2, tip[0], tip[1], n(.016), PAL.ice, 1.05, w + .01, s => .76 + .06 * s, .015);
  run(-EW / 2, cy - EH / 2, -1.5, cy - .3, n(.007), PAL.steel, .6, w, s => .83 + .04 * s, .015);
  run(EW / 2, cy - EH / 2, 1.5, cy - .3, n(.007), PAL.steel, .6, w, s => .83 + .04 * s, .015);
  for (let q = 0, m = n(.016); q < m; q++) { const v = (R() - .5) * EH * .98; at((R() - .5) * EW * .98, cy + v, w - .02, mix3(PAL.night, PAL.steel, R() * .6), .06 + R() * .05, .62 + .2 * (EH / 2 - v) / EH); }
  K.f.tag = 11;
  const r = .5;
  for (let q = 0, m = n(.011); q < m; q++) { const a = R() * TAU, rr = r * Math.sqrt(R()); at(tip[0] + Math.cos(a) * rr, tip[1] + Math.sin(a) * rr, w + .04, mix3(PAL.ember, PAL.orange, R()), .32 + R() * .12, .9 + .05 * R()); }
  for (let q = 0, m = n(.0042); q < m; q++) { const a = R() * TAU, rr = r + (R() - .5) * .03; at(tip[0] + Math.cos(a) * rr, tip[1] + Math.sin(a) * rr, w + .04, PAL.gold, 1.25, .93 + .03 * R()); }
  for (let q = 0, m = n(.0022); q < m; q++) { const a = R() * TAU, rr = r * .66 + (R() - .5) * .02; at(tip[0] + Math.cos(a) * rr, tip[1] + Math.sin(a) * rr, w + .04, PAL.gold, .9, .95 + .03 * R()); }
  for (let q = 0, m = n(.002); q < m; q++) { const a = Math.floor(R() * 6) * TAU / 6 + Math.PI / 2, t = R() * r * .48; at(tip[0] + Math.cos(a) * t, tip[1] + Math.sin(a) * t, w + .04, PAL.gold, 1.3, .97 + .02 * R()); }
  K.f.tag = -1;
  return K.f.done({ seal: [tip[0] + r, tip[1], w + .04], envelope: [EW / 2, cy + EH / 2, w] }, { sealC: [tip[0], tip[1], w + .04] });
}

// the box a formation fills, from its placed particles (the haze is left out): { c, size }
export function boxOf(fm) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < fm.key.length; i++) {
    if (fm.key[i] < -.5) continue;
    for (let c = 0; c < 3; c++) { const v = fm.pos[i * 3 + c]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; }
  }
  if (lo[0] === Infinity) return { c: [0, 0, 0], size: [1, 1, 1] };
  return { c: lo.map((v, c) => (v + hi[c]) / 2), size: lo.map((v, c) => Math.max(.01, hi[c] - v)) };
}

// all of them, built when first asked for (the loading screen asks for one a frame); in the order of F.
// Two pairs change shape on the spot, and in each the particles the first shape has no use for wait,
// dark, where the second will need them, so they appear in place rather than fly in: the sheet's wait
// in the dossier's places (its haze is the dossier), the letter's in the envelope's (set once both exist)
export function createPages(N, seed = 1104) {
  const haze = makeHaze(N, random(seed)), built = [];
  const pair = () => {
    const l = letter(N, haze), e = envelope(N, haze, l);
    for (let j = l.used * 3; j < N * 3; j++) l.pos[j] = e.pos[j];
    built[F.ENVELOPE] = e;
    return l;
  };
  const BUILD = [
    () => dust(N, haze), () => title(N, haze), () => contents(N, haze), () => sheet(N, get(F.DOSSIER).pos), () => dossier(N, haze),
    () => article(N, haze), () => record(N, haze), () => star(N, haze, get(F.RECORD).used), pair, () => (get(F.LETTER), built[F.ENVELOPE]),
    () => point(N, haze, get(F.RECORD).used),
  ];
  const get = i => built[i] || (built[i] = BUILD[i]());
  return { get, count: BUILD.length, built: i => !!built[i] };
}
