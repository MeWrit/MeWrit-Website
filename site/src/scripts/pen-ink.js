/* The pen's path along the logo's ECG line, and the ink it leaves. Both logo animations use
   these: the loading intro (intro.js) and the header version (header-logo.js).
   The ink is the logo's own line pixels: each pixel appears when the pen's nib passes nearest
   to it, so the line always comes out exactly as in the logo. The data (path points traced from
   the logo, the pen's box and nib, the line pixels) is src/data/intro.json. */

// arc length, drawing weight (spike strokes a little quicker) and running maximum x
export function penPath(D) {
  const pts = D.points;
  const cum = [0], cw = [0], maxX = [pts[0][0]];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], ds = Math.hypot(dx, dy);
    cum.push(cum[i - 1] + ds);
    cw.push(cw[i - 1] + ds * (1 - .25 * (ds ? Math.abs(dy) / ds : 0)));
    maxX.push(Math.max(maxX[i - 1], pts[i][0]));
  }
  const L = cum[cum.length - 1], WT = cw[cw.length - 1];
  // the point at drawing weight w: position, arc length s, furthest x reached so far
  function atWeight(w) {
    const n = pts.length - 1;
    if (w <= 0) return { x: pts[0][0], y: pts[0][1], s: 0, mx: maxX[0] };
    if (w >= WT) return { x: pts[n][0], y: pts[n][1], s: L, mx: maxX[n] };
    let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cw[mid] <= w) lo = mid; else hi = mid; }
    const f = (w - cw[lo]) / ((cw[hi] - cw[lo]) || 1);
    const x = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f;
    return { x, y: pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f, s: cum[lo] + (cum[hi] - cum[lo]) * f, mx: Math.max(maxX[lo], x) };
  }
  return { pts, cum, L, WT, atWeight };
}

// the ink (and optionally a pulse of light over it) drawn into canvases sized to the logo.
// With opts.fit the ink canvas instead matches its size on screen: the ink is kept at full size
// off screen and scaled down with high-quality smoothing, because a small logo (the header) left
// to the compositor's plain downscaling turns the thin line jagged. Call fit() after resizes.
export function createInk(D, path, inkCanvas, pulseCanvas, opts = {}) {
  const LW = D.logo[0], LH = D.logo[1], { pts, cum, L } = path;
  let store = inkCanvas, vctx = null;
  if (opts.fit) { store = document.createElement('canvas'); store.width = LW; store.height = LH; vctx = inkCanvas.getContext('2d'); }
  const ictx = store.getContext('2d'), pctx = pulseCanvas ? pulseCanvas.getContext('2d') : null;
  function present() {
    if (!vctx) return;
    vctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    vctx.imageSmoothingEnabled = true; vctx.imageSmoothingQuality = 'high';
    vctx.drawImage(store, 0, 0, inkCanvas.width, inkCanvas.height);
  }
  function fit() {
    if (!vctx) return;
    const r = inkCanvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 3);
    inkCanvas.width = Math.max(1, Math.round(r.width * d)); inkCanvas.height = Math.max(1, Math.round(r.height * d));
    present();
  }
  const TIE = 1.5, PULSE = 110;
  let order = null, sAt = null, src = null, inkImg = null, pulseImg = null, unmatched = 0;
  const lowerBound = (arr, v) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m; } return lo; };

  // every line pixel gets the arc length at which the pen passes nearest to it
  async function prepare() {
    const img = new Image(); img.src = D.lineLayer;   // a data URL: a canvas may read it on any host
    await (img.decode ? img.decode() : new Promise(r => { img.onload = r; }));
    const off = document.createElement('canvas'); off.width = LW; off.height = LH;
    const octx = off.getContext('2d', { willReadFrequently: true }); octx.drawImage(img, 0, 0);
    src = octx.getImageData(0, 0, LW, LH).data;
    const CELL = 8, gw = Math.ceil(LW / CELL) + 2, grid = new Map();
    pts.forEach((p, i) => { const key = Math.floor(p[0] / CELL) + Math.floor(p[1] / CELL) * gw; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(i); });
    const idx = [], sv = [];
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const i = (y * LW + x) * 4;
      if (!src[i + 3]) continue;
      const cx = Math.floor((x + .5) / CELL), cy = Math.floor((y + .5) / CELL);
      // the pen passes some pixels twice (out to each tip and back, and where two strokes
      // merge): any pass within TIE px of the nearest counts, and the earliest wins, so the
      // ink appears on the first pass and a stroke never fills in speckled
      let best = 1e9, bestS = L;
      for (let pass = 0; pass < 2; pass++) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const list = grid.get((cx + ox) + (cy + oy) * gw);
        if (!list) continue;
        for (const k of list) {
          const d = Math.hypot(pts[k][0] - (x + .5), pts[k][1] - (y + .5));
          if (pass === 0) { if (d < best) best = d; }
          else if (d <= best + TIE && cum[k] < bestS) bestS = cum[k];
        }
      }
      if (best > 1e8) unmatched++;
      idx.push(i); sv.push(bestS);
    }
    const ord = idx.map((_, j) => j).sort((a, b) => sv[a] - sv[b]);
    order = new Int32Array(ord.map(j => idx[j]));
    sAt = new Float32Array(ord.map(j => sv[j]));
    inkImg = ictx.createImageData(LW, LH);
    if (pctx) pulseImg = pctx.createImageData(LW, LH);
  }

  // show every pixel the pen has reached by arc length s (going back clears and redraws)
  let revealed = 0, revealedS = -1;
  function revealTo(s) {
    if (!order) return;
    const d = inkImg.data;
    const reset = s < revealedS;
    if (reset) { d.fill(0); revealed = 0; ictx.clearRect(0, 0, LW, LH); }
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    while (revealed < order.length && sAt[revealed] <= s) {
      const i = order[revealed++];
      d[i] = src[i]; d[i + 1] = src[i + 1]; d[i + 2] = src[i + 2]; d[i + 3] = src[i + 3];
      const p = i >> 2, x = p % LW, y = (p / LW) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 >= 0) ictx.putImageData(inkImg, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    if (x1 >= 0 || reset) present();
    revealedS = s;
  }

  // a pulse of light over the real line pixels (brightest at its head); hq runs 0 to 1
  let lit = [0, 0];
  function pulseAt(hq) {
    if (!order || !pctx) return;
    const d = pulseImg.data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    const touch = i => { const p = i >> 2, x = p % LW, y = (p / LW) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    for (let j = lit[0]; j < lit[1]; j++) { const i = order[j]; d[i + 3] = 0; touch(i); }
    lit = [0, 0];
    if (hq > 0 && hq < 1) {
      const head = hq * (L + PULSE), env = Math.sin(Math.PI * hq);
      const a = lowerBound(sAt, head - PULSE), b = lowerBound(sAt, head);
      for (let j = a; j < b; j++) {
        const i = order[j], k = 1 - (head - sAt[j]) / PULSE;
        d[i] = 255; d[i + 1] = 228; d[i + 2] = 200; d[i + 3] = Math.round(src[i + 3] * env * k * .85);
        touch(i);
      }
      lit = [a, b];
    }
    if (x1 >= 0) pctx.putImageData(pulseImg, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }

  const ready = prepare();
  return { ready, revealTo, pulseAt, fit, stats: () => ({ pixels: order ? order.length : 0, unmatched }) };
}
