/* The page in its forms, drawn as on the design board (src/pages/lamplight/board.astro): ivory paper,
   navy ink in stipple, the reviewer's orange. Each form is drawn into a canvas that the renderer lays
   on a plane at the page's place in its scene (renderer.js), so it stands in the world, in perspective,
   and changes like ink in water between chapters. Units: the page is 318 by 443 (its 7.6 by 10.6 in
   the world), drawn inside a margin for its shadow and whatever stands off its edges (the dossier's
   stack and tabs); the canvas is scaled up from these units so the dots and rules stay sharp when
   the texture is shown smaller. By night a page casts a dark shadow; by day a warm one. */
import { kit } from './study.js';

const PW = 318, PH = 443, UNIT = 7.6 / PW;   // world units per drawing unit
const PAPER = '#FBF8F2', INK = '19,36,79', PEN = '180,80,15';
const sheetShadow = (c, night) => { c.shadowColor = night ? 'rgba(0,0,0,.5)' : 'rgba(60,48,28,.24)'; c.shadowBlur = night ? 26 : 22; c.shadowOffsetY = night ? 8 : 7; };

// a sheet of paper with its shadow, then its edge
function sheet(K, c, x, y, w, h, night, fill = PAPER) {
  c.save(); sheetShadow(c, night); c.fillStyle = fill; c.fillRect(x, y, w, h); c.restore();
  K.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], .8, .35, true);
}
// the page of a clinical study report: a header line, the title block, an orange rule, lines of text
function report(K, c, x, y, w, h, o = {}) {
  const m = w * .12; let ly = y + h * .09;
  K.text(x + m, ly, w * .3, 1.1, .5, 2); K.text(x + w * .7, ly, w * .18, 1, .45, 1.8);
  ly += h * .075; K.text(x + m, ly, w * .66, 2.6, .95, 4.2); ly += h * .055; K.text(x + m, ly, w * .46, 2.6, .95, 4.2); ly += h * .05;
  c.fillStyle = `rgba(${PEN},.9)`; c.fillRect(x + m, ly, w * .2, 1.8); ly += h * .06;
  const n = o.lines ?? 15, gap = (y + h * .93 - ly) / n;
  for (let i = 0; i < n; i++) {
    if (o.hl === i) { c.fillStyle = 'rgba(224,168,46,.42)'; c.fillRect(x + m - 2, ly - 4, w * .58, 8); }
    K.text(x + m, ly, w * (i % 5 === 4 ? .42 : .76), 1.2, .72, 2.4); ly += gap;
  }
}
const FORMS = {
  // the CSR page on its own (regulatory writing, as it arrives)
  sheet: { night: true, seed: 1765, margin: [50, 50, 50, 50], draw(K, c) { sheet(K, c, 0, 0, PW, PH, true); report(K, c, 0, 0, PW, PH, { hl: 3 }); } },
  // the dossier: the same page on a stack of five, the module tabs standing off its right edge
  dossier: { night: true, seed: 1765, margin: [60, 80, 50, 50], draw(K, c) {
    for (let i = 5; i >= 1; i--) { const o = i * PW * .028; c.save(); sheetShadow(c, true); c.fillStyle = '#ECE6DA'; c.fillRect(o, -o * .85, PW, PH); c.restore(); K.poly([[o, -o * .85], [o + PW, -o * .85], [o + PW, PH - o * .85], [o, PH - o * .85]], .7, .35, true); }
    sheet(K, c, 0, 0, PW, PH, true); report(K, c, 0, 0, PW, PH, { hl: 3 });
    [[.16, '224,122,31', 'M2.7'], [.4, '224,168,46', 'M2.5'], [.64, '120,150,215', 'CSR']].forEach(([t, rgb, lab]) => {
      const ty = PH * t, tx = PW + 4, tb = [[tx, ty], [tx + PW * .1, ty + 3], [tx + PW * .1, ty + PH * .12], [tx, ty + PH * .12 + 3]];
      K.fill(tb, PAPER); K.fill(tb, `rgba(${rgb},.35)`); K.poly(tb, .9, .7, true);
      c.save(); c.translate(tx + PW * .068, ty + PH * .105); c.rotate(-Math.PI / 2); c.fillStyle = `rgba(${INK},.85)`; c.font = '600 14px "Fraunces Variable", Georgia, serif'; c.fillText(lab, 0, 0); c.restore();
    });
    K.ink = PEN; K.smooth([[PW * .1, PH * .175], [PW * .5, PH * .158], [PW * .82, PH * .18], [PW * .5, PH * .205], [PW * .1, PH * .19]], 1.4, .75); K.ink = INK;
  } },
  // a page of the record: selected publications, numbered in orange
  record: { night: true, margin: [50, 50, 50, 50], draw(K, c) {
    sheet(K, c, 0, 0, PW, PH, true);
    const m = PW * .11; let y = PH * .09;
    K.text(m, y, PW * .44, 2.4, .95, 4); y += PH * .045; c.fillStyle = `rgba(${PEN},.9)`; c.fillRect(m, y, PW * .18, 1.8); y += PH * .06;
    for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(${PEN},.9)`; c.font = '600 9px "Fraunces Variable", Georgia, serif'; c.fillText(String(i + 1), m - 2, y + 3); K.text(m + 16, y, PW * .66, 1.2, .78, 2.4); K.text(m + 16, y + 9, PW * (.36 + (i % 3) * .1), 1, .5, 2); y += PH * .066; }
  } },
  // the journal article: masthead, title, authors, an abstract in a box, two columns with a figure
  article: { night: true, margin: [50, 50, 50, 50], draw(K, c) {
    sheet(K, c, 0, 0, PW, PH, true);
    const m = PW * .09, iw = PW - 2 * m;
    K.text(m, PH * .045, PW * .34, 1.1, .6, 2); K.text(m + iw * .72, PH * .045, iw * .28, 1, .45, 1.8);
    c.fillStyle = `rgba(${INK},.85)`; c.fillRect(m, PH * .062, iw, 1.6);
    K.text(m, PH * .105, iw * .94, 2.7, .95, 4.6); K.text(m, PH * .14, iw * .6, 2.7, .95, 4.6); K.text(m, PH * .177, iw * .72, 1, .55, 2);
    c.fillStyle = 'rgba(224,168,46,.14)'; c.fillRect(m, PH * .2, iw, PH * .12); c.fillStyle = `rgba(${PEN},.85)`; c.fillRect(m, PH * .2, 2, PH * .12);
    for (let i = 0; i < 5; i++) K.text(m + 8, PH * (.218 + i * .021), iw * (i === 4 ? .5 : .9) - 8, 1.1, .6, 2);
    const gap = PW * .05, cw = (iw - gap) / 2, top = PH * .35;
    [m, m + cw + gap].forEach((cx0, col) => {
      let ly = top;
      if (col === 1) {
        const fh = PH * .2;
        c.strokeStyle = `rgba(${INK},.5)`; c.lineWidth = 1; c.beginPath(); c.moveTo(cx0, ly); c.lineTo(cx0, ly + fh); c.lineTo(cx0 + cw, ly + fh); c.stroke();
        [[.045, `rgba(${INK},.85)`], [.08, 'rgba(224,122,31,.9)']].forEach(([drop, col2]) => {
          c.strokeStyle = col2; c.lineWidth = 1.4; c.beginPath(); let yy = ly + 4; c.moveTo(cx0, yy);
          for (let k = 0; k < 9; k++) { const xx = cx0 + cw * (k + 1) / 10; c.lineTo(xx, yy); yy += fh * drop * (.6 + ((k * 37) % 7) / 10); c.lineTo(xx, yy); }
          c.lineTo(cx0 + cw, yy); c.stroke();
        });
        ly += fh + PH * .03; K.text(cx0, ly, cw * .8, 1, .5, 1.8); ly += PH * .03;
      }
      let i = 0;
      while (ly < PH * .93) { K.text(cx0, ly, cw * (i % 6 === 5 ? .6 : .98), 1.1, .68, 2.2); ly += PH * .024; i++; }
    });
  } },
  // a slide on the auditorium's screen: a title bar, the evidence charted, a source line
  slide: { night: false, w: 420, h: 236, margin: [44, 44, 44, 44], draw(K, c, W, H) {
    sheet(K, c, 0, 0, W, H, false);
    c.fillStyle = `rgba(${INK},.92)`; c.fillRect(0, 0, W, H * .13);
    K.ink = '246,242,234'; K.text(W * .05, H * .065, W * .42, 2.2, .95, 3.6); K.ink = INK;
    const bx = W * .07, by = H * .24, bw = W * .55, bh = H * .58;
    c.strokeStyle = `rgba(${INK},.5)`; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + bh); c.lineTo(bx + bw, by + bh); c.stroke();
    [.42, .55, .5, .72, .64, .86].forEach((v, i) => { c.fillStyle = i === 5 ? 'rgba(224,122,31,.9)' : `rgba(${INK},${.55 + i * .06})`; c.fillRect(bx + 12 + i * bw * .155, by + bh * (1 - v), bw * .1, bh * v); });
    for (let i = 0; i < 6; i++) K.text(W * .68, H * (.3 + i * .085), W * (i % 3 === 2 ? .18 : .26), 1.2, .7, 2.4);
    c.fillStyle = `rgba(${PEN},.9)`; c.fillRect(W * .68, H * .24, W * .1, 1.8);
    K.text(W * .07, H * .91, W * .4, 1, .5, 1.8);
  } },
  // a handout from a workshop: the exercise, numbered, with boxes to tick and lines to write on
  handout: { night: false, margin: [50, 50, 50, 50], draw(K, c) {
    sheet(K, c, 0, 0, PW, PH, false);
    const m = PW * .11;
    K.text(m, PH * .07, PW * .3, 1.1, .55, 2); c.fillStyle = `rgba(${PEN},.9)`; c.fillRect(m, PH * .085, PW * .78, 1.4);
    K.text(m, PH * .13, PW * .6, 2.6, .95, 4.4); K.text(m, PH * .165, PW * .4, 1, .55, 2);
    let y = PH * .23;
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = `rgba(${INK},.7)`; c.lineWidth = 1; c.strokeRect(m, y - 5, 9, 9);
      if (i < 2) { K.ink = PEN; K.smooth([[m + 1, y - 1], [m + 4, y + 3], [m + 11, y - 8]], 1.4, .9); K.ink = INK; }
      K.text(m + 18, y, PW * .62, 1.2, .78, 2.4);
      for (let j = 1; j <= 2; j++) { c.fillStyle = `rgba(${INK},.18)`; c.fillRect(m + 18, y + j * 14, PW * .62, .8); }
      y += PH * .13;
    }
  } },
  // the letter: an address, an orange rule, the salutation, the body, a signature and a seal
  letter: letter(true),
  // the same letter before it is sealed
  letterOpen: letter(false),
};
function letter(seal) {
  return { night: true, seed: 1777, margin: [50, 50, 50, 50], draw(K, c) {
    sheet(K, c, 0, 0, PW, PH, true);
    const m = PW * .12; let ly = PH * .1;
    K.text(PW * .56, ly, PW * .3, 1.1, .5, 2); K.text(PW * .56, ly + PH * .03, PW * .26, 1.1, .5, 2);
    c.fillStyle = `rgba(${PEN},.9)`; c.fillRect(m, PH * .17, PW * .76, 1.4);
    ly = PH * .24; K.text(m, ly, PW * .2, 1.6, .85, 2.6); ly += PH * .06;
    for (let i = 0; i < 12; i++) { K.text(m, ly, PW * (i % 4 === 3 ? .5 : .76), 1.2, .72, 2.4); ly += PH * .036; if (i === 5) ly += PH * .025; }
    K.smooth([[m, PH * .84], [m + PW * .05, PH * .8], [m + PW * .1, PH * .845], [m + PW * .16, PH * .805], [m + PW * .24, PH * .835]], 1.3, .7);
    if (!seal) return;
    const sx = PW * .78, sy = PH * .82, sr = PW * .07;
    K.fill(Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2, r = sr * (1 + (i % 2 ? .06 : -.03)); return [sx + Math.cos(a) * r, sy + Math.sin(a) * r]; }), 'rgba(196,92,30,.95)');
    K.fill(Array.from({ length: 20 }, (_, i) => [sx + Math.cos(i / 20 * Math.PI * 2) * sr * .62, sy + Math.sin(i / 20 * Math.PI * 2) * sr * .62]), 'rgba(226,150,72,.9)');
  } };
}

// a form of the page drawn into a canvas: { canvas, size: [w, h] in world units }. scale: canvas
// pixels per drawing unit
export function drawPage(kind, { scale = 3.4 } = {}) {
  const f = FORMS[kind];
  if (!f) throw new Error(`no page form "${kind}"`);
  const w = f.w || PW, h = f.h || PH, [mt, mr, mb, ml] = f.margin, cw = w + ml + mr, ch = h + mt + mb;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cw * scale); canvas.height = Math.round(ch * scale);
  const c = canvas.getContext('2d');
  c.setTransform(scale, 0, 0, scale, ml * scale, mt * scale);
  // forms that change into each other on the spot share a seed, so the text they share is the same
  f.draw(kit(c, f.seed ?? 1700 + kind.length * 13), c, w, h);
  c.setTransform(1, 0, 0, 1, 0, 0);
  // the plane's size, where the page's centre sits on it (the margins are not even) and the page's
  // own size, all in world units
  return { canvas, size: [cw * UNIT, ch * UNIT], offset: [((ml + w / 2) - cw / 2) * UNIT, (ch / 2 - (mt + h / 2)) * UNIT], page: [w * UNIT, h * UNIT] };
}

// the star the page becomes on the record: a white core, a gold ring, four long rays, a wide glow, on
// black, to be added as light
export function drawStar({ size = 512 } = {}) {
  // drawn like the chart's own bright stars (worlds/sky.js): a small white point with a little warmth
  // about it, a fine gold ring, and a second fainter one; short fine rays, no flare
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d'), m = size / 2, s = size / 512;
  c.fillStyle = '#000'; c.fillRect(0, 0, size, size);
  c.globalCompositeOperation = 'lighter';
  const glow = (r, rgb, a) => { const g = c.createRadialGradient(m, m, 0, m, m, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.4, `rgba(${rgb},${a * .25})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, size, size); };
  glow(110 * s, '240,214,160', .22); glow(34 * s, '255,244,220', .75);
  [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dy]) => { const g = c.createLinearGradient(m, m, m + dx * 58 * s, m + dy * 58 * s); g.addColorStop(0, 'rgba(255,246,226,.8)'); g.addColorStop(1, 'rgba(255,246,226,0)'); c.strokeStyle = g; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(m, m); c.lineTo(m + dx * 58 * s, m + dy * 58 * s); c.stroke(); });
  c.strokeStyle = 'rgba(240,195,92,.85)'; c.lineWidth = 1.6 * s; c.beginPath(); c.arc(m, m, 21 * s, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = 'rgba(240,195,92,.3)'; c.lineWidth = 1 * s; c.beginPath(); c.arc(m, m, 34 * s, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(255,252,244,1)'; c.beginPath(); c.arc(m, m, 5.5 * s, 0, Math.PI * 2); c.fill();
  return { canvas, size: [6, 6], offset: [0, 0], page: [1.2, 1.2] };
}

export const PAGE_FORMS = Object.keys(FORMS);
