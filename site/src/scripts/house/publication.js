/* 04's work (site/docs/redesign-plan.md, 11.17): the writer's place at the reading room's south table,
   before the first south window (reading.js). Three beats, each a thing anyone can follow without words
   (problem, change, result), as 04 performs (set(k), k from 0 to 1):
     1. The problem. The trial's report stands on the table as a stack of four thick bound volumes; the
        target journal comes off the periodicals cart, lands beside it, slim, and opens at its instructions
        for authors (an abstract of 250 words, five figures and tables).
     2. The change. The manuscript on its walnut rest opens; its leaves curl over as they turn, and from
        each spread a paper pop-up unfolds out of the spine (a V-fold: a card folded at the gutter, its two
        halves glued across the two pages, so it stands as the spread opens and lies flat as it closes):
        who took part (480 people, split by the fold into two groups of 240), what was found (28% lower
        risk), who did the work (the authors, and the writing support acknowledged). Then the folio opens and
        the expert's pen corrects the one mistyped figure in the galley proof (0.98 back to 0.89).
     3. The result. The journal on the reading stand opens at the published article, MeWriT's slip marking
        the page.
   STEPS, where each beat begins; MARKS, when each thing happens. Units as the house's (about 10 cm).
   Everything here moves, so it is kept apart from the room's merged meshes (userData.keep). */
import * as THREE from 'three';
import { PAL, mat, at, rbox, cyl, group, contact, oakTex, boundVolume } from './kit.js';
import { sheet, font, wrap, written, onSheet } from './paper.js';
import { READING } from './reading.js';

export const STEPS = [0, .36, .82];
// the journal's journey and opening; the manuscript's turns (the cover, then two leaves); the folio; the
// journal on the stand
export const MARKS = {
  cart: [.19, .25], journalOpen: [.25, .29],
  turns: [[.39, .445], [.505, .56], [.62, .675]],
  folio: [.698, .745], standCover: [.903, .932], standLeaves: [.932, .966],
};
export const PEN = { go: .748, down: .755, from: .759, to: .793, up: .797, back: .809 };

const SERIF = '"Fraunces Variable", Georgia, serif', SANS = '"Inter Variable", Inter, system-ui, sans-serif', HAND = 'Caveat, cursive';
// MeWriT's compliments slip in the journal on the stand: its size (units), its print's canvas (px: the
// orange rule's depth, "with compliments" at its baseline and size), shared with its card (house.css)
export const SLIP = { w: .44, h: .62, px: [284, 400], band: 12, note: [118, 17] };
const INK = '#13244F', BODY = '#2B3550', MUTED = 'rgba(19,36,79,.55)', RULE = 'rgba(19,36,79,.16)', OK = '#1F6B47', PEN_INK = '#1D4FA0', ORANGE = '#B4500F';
const JOURNAL = 'Annals of Clinical Evidence', JCOL = '#1E5A63';
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const seg = (k, [a, b]) => sm((k - a) / (b - a));

// ---------- the print: lines of type as a page shows them, set in the canvas ----------
// a paragraph of real words, wrapped and set from y; returns the y after it
function para(c, text, x, y, w, lh) { for (const l of wrap(c, text, w)) { c.fillText(l, x, y); y += lh; } return y; }
// running text, set small in real words (the trial's own story), n lines of it from y: the reader is not
// meant to read it here, but up close it is type, never bars. The colour's alpha is raised to read as ink
const PROSE = 'Participants were adults with a history of a major outcome event and at least one further risk factor. They were assigned in a 1:1 ratio, by a central computer system, to receive the treatment once daily or a matching placebo, and were followed for a median of 2.6 years. The primary outcome was the first occurrence of a major event, assessed by an independent committee unaware of the assignments. The analysis followed the intention-to-treat principle; the hazard ratio was estimated with a Cox model stratified by region. Adverse events were recorded at every visit and reviewed by the data monitoring committee. The trial was registered before the first participant was enrolled, and the protocol and statistical analysis plan were published in advance. ';
function greyLines(c, x, y, w, n, lh, col = 'rgba(43,53,80,.22)', seed = 1) {
  const size = Math.max(7, Math.round(lh * .62));
  font(c, `400 ${size}px ${SERIF}`);
  c.fillStyle = col.replace(/,\s*\.?\d*\.?\d+\)$/, ',.62)');
  const words = PROSE.split(' ').filter(Boolean);
  let wi = (seed * 7) % words.length;
  for (let i = 0; i < n; i++) {
    const last = i % 6 === 5 || i === n - 1, maxW = last ? w * (.45 + ((seed + i) % 4) * .1) : w;
    let line = '';
    for (;;) { const t = line ? line + ' ' + words[wi % words.length] : words[wi % words.length]; if (line && c.measureText(t).width > maxW) break; line = t; wi++; }
    c.fillText(line, x, y + i * lh + size * .8);
  }
  return y + n * lh;
}
const paper = (c, W, H, col = '#FBF8F2') => { c.fillStyle = col; c.fillRect(0, 0, W, H); };
// the soft shadow where an open page curves down into the fold (on its left edge, its right, or both)
const gutter = (c, W, H, sides = 'l') => { for (const s of sides) { const x0 = s === 'l' ? 0 : W, gr = c.createLinearGradient(x0, 0, s === 'l' ? W * .09 : W * .91, 0); gr.addColorStop(0, 'rgba(40,44,56,.1)'); gr.addColorStop(.4, 'rgba(40,44,56,.03)'); gr.addColorStop(1, 'rgba(40,44,56,0)'); c.fillStyle = gr; c.fillRect(s === 'l' ? 0 : W * .91, 0, W * .09, H); } };
const kicker = (c, t, x, y, col = ORANGE, size = 26) => { font(c, `600 ${size}px ${SERIF}`, 5); c.fillStyle = col; c.fillText(t.toUpperCase(), x, y); };
const pageFoot = (c, W, H, t, n) => { c.fillStyle = RULE; c.fillRect(60, H - 74, W - 120, 2); font(c, `500 20px ${SERIF}`, 3); c.fillStyle = MUTED; c.fillText(t, 60, H - 40); c.textAlign = 'right'; c.fillText(n, W - 60, H - 40); c.textAlign = 'left'; };
// a line of type set as large as it may be (size px at most) and still fit its width
function fit(c, text, weight, family, size, maxW, spacing = 0) {
  let fs = size; font(c, `${weight} ${fs}px ${family}`, spacing);
  while (fs > 8 && c.measureText(text).width > maxW) { fs -= 1; font(c, `${weight} ${fs}px ${family}`, spacing); }
  return fs;
}

export function buildPublication({ room }) {
  const g = new THREE.Group(); g.userData.keep = true;
  const TT = READING.TTOP, D = READING.DESK;
  const walnut = mat('#5A3A26', { map: oakTex('#5A3A26', '#2E1D12', 61, [.6, .6]), r: .5 });
  const brass = mat(PAL.gold, { r: .3, m: .85 });
  const cloth = mat('#22325A', { r: .8 });
  const edge = mat('#EFE8DA', { r: .9 });
  const planeMat = (tex, o = {}) => new THREE.MeshStandardMaterial({ map: tex, roughness: .9, side: o.side ?? THREE.FrontSide });
  const shadowed = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  // a flat plane facing up (+y), its texture's top toward -z (the far edge, as a page is read)
  const upPlane = (w, h, m) => { const ge = new THREE.PlaneGeometry(w, h); ge.rotateX(-Math.PI / 2); return new THREE.Mesh(ge, m); };
  // facing down (-y), its texture reading the right way once its leaf has turned over (about z)
  const downPlane = (w, h, m) => { const ge = new THREE.PlaneGeometry(w, h); ge.rotateX(Math.PI / 2); ge.rotateY(Math.PI); return new THREE.Mesh(ge, m); };
  const cardBack = mat('#F1EBDD', { r: .9, side: THREE.BackSide });

  // ---------- the trial's report: four thick bound volumes, stacked on the table at the writer's left ----------
  const RX = D.x - 6.85, RZ = D.z + 1.05;
  {
    const VW = 1.75, VT = .46, VD = 2.35;
    const spine = n => sheet(700, 184, (c, W, H) => {
      c.fillStyle = '#1B2A4D'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(201,164,92,.9)'; c.fillRect(0, 16, W, 3); c.fillRect(0, H - 19, W, 3);
      c.textBaseline = 'middle';
      fit(c, 'CLINICAL STUDY REPORT', 600, SERIF, 44, W * .62, 4); c.fillStyle = '#E9D29A'; c.fillText('CLINICAL STUDY REPORT', 40, H / 2 + 2);
      c.textAlign = 'right'; font(c, `600 40px ${SANS}`, 2); c.fillText(`${n} / 4`, W - 40, H / 2 + 2);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }).tex;
    const label = sheet(600, 806, (c, W, H) => {
      c.fillStyle = '#1B2A4D'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#F4EEE2'; c.fillRect(110, 180, W - 220, 300);
      c.strokeStyle = 'rgba(19,36,79,.4)'; c.lineWidth = 3; c.strokeRect(124, 194, W - 248, 272);
      c.textAlign = 'center';
      // (each line fitted inside the label's frame, 272 px less a margin)
      const inner = W - 248 - 48;
      fit(c, 'CLINICAL STUDY REPORT', 600, SERIF, 24, inner, 4); c.fillStyle = MUTED; c.fillText('CLINICAL STUDY REPORT', W / 2, 256);
      fit(c, 'The trial, in full', 500, SERIF, 40, inner); c.fillStyle = INK; c.fillText('The trial, in full', W / 2, 330);
      fit(c, 'Volume 4 of 4', 'italic 400', SERIF, 26, inner); c.fillStyle = BODY; c.fillText('Volume 4 of 4', W / 2, 380);
      fit(c, 'ICH E3 · ILLUSTRATIVE', 500, SANS, 18, inner, 2); c.fillStyle = MUTED; c.fillText('ICH E3 · ILLUSTRATIVE', W / 2, 432);
      c.textAlign = 'left';
    }).tex;
    const vols = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Group();
      // (a hardback, its spine toward the writer, north: boundVolume's spine faces -z, so turned round)
      const bv = boundVolume({ w: VW, th: VT, d: VD, cloth, spine: spine(i + 1) }); bv.rotation.y = Math.PI; v.add(bv);
      if (i === 3) { const top = upPlane(VW - .02, VD - .02, planeMat(label)); top.position.y = VT / 2 + .001; v.add(top); }
      v.position.set([0, .03, -.04, .02][i], VT / 2 + i * (VT + .004), [0, -.04, .03, -.02][i]); v.rotation.y = [.02, -.035, .03, -.015][i];
      vols.add(v);
    }
    vols.position.set(RX, TT, RZ); vols.rotation.y = .06;
    g.add(shadowed(vols));
    g.add(contact(VW + 1, VD + 1, RX, RZ, { y: TT, k: .24 }));
  }

  // ---------- the book: on a walnut rest at the writer's place, tilted a little toward the writer ----------
  // The writer sits facing south (-z): the book's gutter runs along z, its right page west (+x), the tops
  // of its pages away from the writer (-z). Each leaf turns about the gutter (z), from the right (0) to the
  // left (pi). Leaf 0 is the front cover (a board, turning flat); leaves 1 to 3 are paper and curl as they
  // turn; each carries a spread's right page on its front and the next spread's left page on its back
  const PW = 2.3, PH = 3.1, TILT = .17;
  // the leaves' heights in the two stacks: unturned on the right (the cover on top, a board), turned on the
  // left (the cover at the bottom); each gap holds a pop-up folded flat
  const STACK_R = [.16, .1, .065, .03], STACK_L = [-.01, .045, .08, .115];
  const book = new THREE.Group();
  {
    // the rest: a low walnut wedge, its slope rising away from the writer, a lip along its near edge
    const RL = PH + .5, RW = 2 * PW + .7, rise = RL * Math.sin(TILT);
    const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(RL * Math.cos(TILT), 0), new THREE.Vector2(RL * Math.cos(TILT), rise + .12), new THREE.Vector2(0, .12)]);
    const wg = new THREE.ExtrudeGeometry(sh, { depth: RW, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2 });
    wg.translate(-RL * Math.cos(TILT) / 2, 0, -RW / 2); wg.rotateY(Math.PI / 2);
    const rest = new THREE.Mesh(wg, walnut); rest.castShadow = rest.receiveShadow = true;
    const restG = group(rest, at(rbox(RW, .16, .08, .02, walnut), 0, .14, RL * Math.cos(TILT) / 2 - .02));
    restG.position.set(D.x, TT, D.z); g.add(restG);
    g.add(contact(RW + .8, RL + .8, D.x, D.z, { y: TT, k: .22 }));
    // the book lies on the slope: its frame tilted (the far edge raised), its gutter on the rest's middle
    book.rotation.x = TILT; book.position.set(D.x, TT + .12 + rise / 2 + .04, D.z - .05);
    g.add(book);
  }
  // the back board and the block of the manuscript's other pages under the right stack
  book.add(at(rbox(PW + .12, .05, PH + .14, .02, cloth), PW / 2 + .02, -.05, 0));
  book.add(at(rbox(PW - .04, .05, PH - .04, .01, edge), PW / 2, -.01, 0));
  // (the spine, under the gutter)
  book.add(at(rbox(.16, .14, PH + .14, .05, cloth), 0, -.06, 0));

  // a paper leaf's shape as it turns: each strip from the gutter out lies at the leaf's angle plus a curl
  // that grows toward its free edge and with the turn's middle (none flat on either side), so the page
  // bends over like paper rather than swinging like a board
  const NS = 16, CURL = .62;
  const angleAt = (th, u) => th + CURL * Math.sin(th) * Math.pow(u / PW, 2.2);
  // a leaf's two faces, built as strips along the page (u from the gutter) and bent in place each frame
  const leafGeom = (back) => {
    const ge = new THREE.BufferGeometry(), n = (NS + 1) * 2;
    const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    for (let i = 0; i <= NS; i++) for (let j = 0; j < 2; j++) {
      const v = (i * 2 + j);
      uv[v * 2] = back ? 1 - i / NS : i / NS; uv[v * 2 + 1] = j === 0 ? 1 : 0;   // (j 0 the page's top, -z)
    }
    for (let i = 0; i < NS; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      if (back) idx.push(a, c, b, c, d, b); else idx.push(a, b, c, c, b, d);
    }
    ge.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); ge.setIndex(idx);
    return ge;
  };
  const bend = (rec, th) => {
    let x = 0, y = 0;
    const du = PW / NS, F = rec.front.geometry.attributes.position, B = rec.back.geometry.attributes.position;
    for (let i = 0; i <= NS; i++) {
      const a = angleAt(th, i * du), nx = -Math.sin(a), ny = Math.cos(a);
      for (let j = 0; j < 2; j++) {
        const z = j === 0 ? -PH / 2 : PH / 2, v = i * 2 + j;
        F.setXYZ(v, x + nx * .003, y + ny * .003, z); B.setXYZ(v, x - nx * .003, y - ny * .003, z);
      }
      if (i < NS) { const m = angleAt(th, (i + .5) * du); x += Math.cos(m) * du; y += Math.sin(m) * du; }
    }
    F.needsUpdate = B.needsUpdate = true;
    rec.front.geometry.computeVertexNormals(); rec.back.geometry.computeVertexNormals();
    rec.front.geometry.computeBoundingSphere(); rec.back.geometry.computeBoundingSphere();
  };

  const leaves = [];
  const coverLeaf = (front, back) => {
    const L = new THREE.Group();
    L.add(at(rbox(PW + .1, .05, PH + .12, .02, cloth), PW / 2 + .02, 0, 0));
    const f = upPlane(PW - .1, PH - .2, planeMat(front)); f.position.set(PW / 2 + .02, .027, 0); L.add(f);
    const b = downPlane(PW, PH, planeMat(back)); b.position.set(PW / 2, -.027, 0); L.add(b);
    shadowed(L); book.add(L);
    const rec = { L, board: true }; leaves.push(rec); return rec;
  };
  const paperLeaf = (front, back) => {
    const L = new THREE.Group();
    const f = new THREE.Mesh(leafGeom(false), planeMat(front)), b = new THREE.Mesh(leafGeom(true), planeMat(back));
    L.add(f, b); shadowed(L); book.add(L);
    const rec = { L, front: f, back: b, th: -1 }; leaves.push(rec); return rec;
  };

  // ---------- the pages' print ----------
  const PX = 600, PY = Math.round(PX * PH / PW);   // (a page's canvas: 600 px wide, in the page's proportion)
  const coverP = sheet(PX, PY, (c, W, H) => {
    c.fillStyle = '#22325A'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${i % 2 ? '255,255,255' : '0,0,0'},${.03 + (i % 7) * .006})`; c.fillRect((i * 97) % W, (i * 53) % H, 2, 1); }
    c.fillStyle = '#F4EEE2'; c.fillRect(90, 150, W - 180, 290);
    c.strokeStyle = 'rgba(19,36,79,.4)'; c.lineWidth = 3; c.strokeRect(104, 164, W - 208, 262);
    c.textAlign = 'center';
    font(c, `600 22px ${SERIF}`, 6); c.fillStyle = MUTED; c.fillText('MANUSCRIPT', W / 2, 222);
    font(c, `500 34px ${SERIF}`); c.fillStyle = INK; c.fillText('Original research', W / 2, 280);
    font(c, `italic 400 24px ${SERIF}`); c.fillStyle = BODY; c.fillText('Draft for the authors', W / 2, 322);
    font(c, `500 18px ${SANS}`, 1); c.fillStyle = MUTED; c.fillText('Medical writing support · MeWriT', W / 2, 392);
    c.textAlign = 'left';
  });
  // a page of the manuscript: its section's kicker and heading at the head, running text below where the
  // pop-up does not stand
  const textPage = (kick, head, foot, n, seed) => sheet(PX, PY, (c, W, H) => {
    paper(c, W, H);
    kicker(c, kick, 60, 84, ORANGE, 20);
    font(c, `500 26px ${SERIF}`); c.fillStyle = INK; c.fillText(head, 60, 122);
    greyLines(c, 60, 166, W - 120, 17, 28, 'rgba(43,53,80,.2)', seed);
    pageFoot(c, W, H, foot, n);
  });
  // spread 1, left: the title page (the cover's inside)
  const titleP = sheet(PX, PY, (c, W, H) => {
    paper(c, W, H);
    kicker(c, 'Original research', 60, 96, ORANGE, 22);
    font(c, `600 38px ${SERIF}`); c.fillStyle = INK;
    let y = para(c, 'Effect of once-daily treatment on major outcome events: a randomised, double-blind, placebo-controlled trial', 60, 160, W - 120, 48);
    font(c, `italic 400 24px ${SERIF}`); c.fillStyle = BODY; c.fillText('for the Trial Investigators', 60, y + 22);
    c.fillStyle = RULE; c.fillRect(60, y + 60, W - 120, 2);
    font(c, `500 21px ${SANS}`);
    [['Target journal', JOURNAL], ['Abstract', '248 of 250 words'], ['Figures, tables', '5 of 5']].forEach(([a, b], i) => { c.fillStyle = MUTED; c.fillText(a, 60, y + 108 + i * 40); c.fillStyle = INK; c.fillText(b, 250, y + 108 + i * 40); });
    font(c, `600 19px ${SERIF}`, 4); c.fillStyle = MUTED; c.fillText('CONSORT 2025 · ICMJE · GPP 2022', 60, H - 120);
    pageFoot(c, W, H, 'MANUSCRIPT · ILLUSTRATIVE', 'i');
  });
  const partP = textPage('Methods', 'Participants', 'METHODS', '6', 3);
  const resP = textPage('Results', 'Primary outcome', 'RESULTS', '9', 5);
  const outP = textPage('Results', 'Hazard ratio, by group', 'RESULTS', '10', 7);
  const contribP = sheet(PX, PY, (c, W, H) => {
    paper(c, W, H);
    kicker(c, 'Contributors', 60, 92, ORANGE, 22);
    font(c, `400 21px ${SERIF}`); c.fillStyle = BODY;
    let y = para(c, 'Every author meets all four ICMJE criteria:', 60, 140, W - 120, 30) + 10;
    ['Substantial contribution to the work', 'Drafting or critical revision', 'Final approval of the version published', 'Accountable for every part of the work'].forEach((t, i) => { font(c, `600 21px ${SANS}`); c.fillStyle = OK; c.fillText(`${i + 1}`, 60, y); font(c, `400 21px ${SERIF}`); c.fillStyle = BODY; y = para(c, t, 92, y, W - 160, 28) + 10; });
    y += 16; font(c, `italic 400 21px ${SERIF}`); c.fillStyle = MUTED; para(c, 'Writing support that does not meet them is acknowledged, never hidden.', 60, y, W - 120, 28);
    pageFoot(c, W, H, 'CONTRIBUTORS', '17');
  });
  const ackP = textPage('Acknowledgements', 'Writing support', 'ACKNOWLEDGEMENTS', '18', 9);
  const blankP = sheet(8, 8, c => paper(c, 8, 8));

  const cover = coverLeaf(coverP.tex, titleP.tex);
  paperLeaf(partP.tex, resP.tex);
  paperLeaf(outP.tex, contribP.tex);
  paperLeaf(ackP.tex, blankP.tex);

  // ---------- the pop-ups: V-folds across the gutter ----------
  // A card folded in half at the gutter: each half's foot is glued along a line on its page that leaves
  // the gutter at G from the gutter's line, toward the reader, and the fold stands square to both feet. As
  // the spread opens the fold rises out of the gutter and the card stands, its halves in a shallow V
  // toward the reader; as it closes the card folds flat between the pages. w: each half's width along its
  // foot; h: the card's height; z0: where its fold meets the gutter (+z toward the reader); its print one
  // canvas across both halves (the left half on its left half)
  const G = 1.33, Z = new THREE.Vector3(0, 0, 1);
  const cards = [];
  const vfold = (spread, { w, h, z0, layer, tex }) => {
    const ge = new THREE.BufferGeometry();
    ge.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    ge.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([.5, 0, 1, 0, 1, 1, .5, 1, .5, 0, 0, 0, 0, 1, .5, 1]), 2));
    ge.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
    const front = new THREE.Mesh(ge, new THREE.MeshStandardMaterial({ map: tex, roughness: .85 })), back = new THREE.Mesh(ge, cardBack);
    front.castShadow = front.receiveShadow = back.castShadow = back.receiveShadow = true;
    book.add(front, back);
    const rec = { spread, w, h, z0, layer, front, back, ge };
    cards.push(rec);
    return rec;
  };
  const rR = new THREE.Vector3(), rL = new THREE.Vector3(), cr = new THREE.Vector3(), O = new THREE.Vector3(), tmp = new THREE.Vector3();
  // stand a card with its spread's right page at angle a and its left at b (radians about the gutter), the
  // gutter's height y
  const standCard = (rec, a, b, y) => {
    // (the pages' direction where the feet are glued, a little out from the gutter, curl and all)
    const u = rec.w * .5 * Math.sin(G);
    const pa = angleAt(a, u), pb = angleAt(b, u);
    rR.set(Math.cos(pa) * Math.sin(G), Math.sin(pa) * Math.sin(G), Math.cos(G));
    rL.set(Math.cos(pb) * Math.sin(G), Math.sin(pb) * Math.sin(G), Math.cos(G));
    cr.crossVectors(rL, rR);
    if (cr.lengthSq() < 1e-10) { tmp.set(-Math.sin(pa), Math.cos(pa), 0); cr.crossVectors(tmp, rR); }
    cr.normalize();
    O.set(0, y + .004 + rec.layer * .0025, rec.z0);
    const P = rec.ge.attributes.position, h = rec.h, w = rec.w;
    const put = (i, base, s, t) => { tmp.copy(O).addScaledVector(base, s).addScaledVector(cr, t); P.setXYZ(i, tmp.x, tmp.y, tmp.z); };
    put(0, rR, 0, 0); put(1, rR, w, 0); put(2, rR, w, h); put(3, rR, 0, h);
    put(4, rL, 0, 0); put(5, rL, w, 0); put(6, rL, w, h); put(7, rL, 0, h);
    P.needsUpdate = true; rec.ge.computeVertexNormals(); rec.ge.computeBoundingSphere();
  };

  // the cards' print: (W by H px across both halves; the fold down the middle)
  const cardSheet = (W, H, draw) => sheet(W, H, (c) => { c.fillStyle = '#FFFEF9'; c.fillRect(0, 0, W, H); draw(c, W, H); c.textAlign = 'left'; }, { scale: 1.4 }).tex;
  const centred = (c, t, x, y, weight, family, size, maxW, col, sp = 0) => { fit(c, t, weight, family, size, maxW, sp); c.fillStyle = col; c.textAlign = 'center'; c.fillText(t, x, y); };
  // 1: who took part. The 480 people, one dot each; the fold divides them, as the trial did, into two
  // groups of 240
  const peopleTex = cardSheet(880, 572, (c, W, H) => {
    c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(12, 12, W - 24, H - 24);
    centred(c, '480 people took part', W / 2, 84, 600, SERIF, 52, W - 90, INK);
    const cols = 16, rows = 15, gx = (W / 2 - 92) / (cols - 1), gy = (H - 290) / (rows - 1);
    for (const [side, col] of [[0, INK], [1, ORANGE]]) {
      const x0 = side ? W / 2 + 46 : 46;
      c.fillStyle = col;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { c.beginPath(); c.arc(x0 + q * gx, 130 + r * gy, 7.5, 0, Math.PI * 2); c.fill(); }
    }
    centred(c, '240 · treatment', W / 4, H - 44, 700, SANS, 44, W / 2 - 60, INK);
    centred(c, '240 · placebo', W * 3 / 4, H - 44, 700, SANS, 44, W / 2 - 60, ORANGE);
  });
  const screenTex = cardSheet(760, 200, (c, W, H) => {
    c.fillStyle = 'rgba(19,36,79,.06)'; c.fillRect(0, 0, W, H);
    centred(c, '612 screened', W / 4, H * .56, 600, SANS, 46, W / 2 - 50, INK);
    centred(c, '132 not eligible', W * 3 / 4, H * .56, 600, SANS, 46, W / 2 - 50, MUTED);
    centred(c, 'CONSORT 2025 FLOW', W / 2, H - 22, 600, SERIF, 20, W - 60, MUTED, 4);
  });
  // 2: what was found. The risk of a major event, placebo and treatment side by side, either side of the fold
  const riskTex = cardSheet(880, 572, (c, W, H) => {
    c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(12, 12, W - 24, H - 24);
    centred(c, '28% lower risk', W / 2, 96, 600, SERIF, 72, W - 90, OK);
    centred(c, 'of a major event, with the treatment', W / 2, 142, 400, SERIF, 32, W - 90, BODY);
    const base = H - 92, full = H - 92 - 236;
    const bar = (x, f, col, t, n) => { c.fillStyle = col; c.fillRect(x - 80, base - full * f, 160, full * f); centred(c, n, x, base - full * f - 14, 700, SANS, 38, 200, col); centred(c, t, x, base + 52, 700, SANS, 42, W / 2 - 60, col); };
    c.fillStyle = RULE; c.fillRect(46, base, W - 92, 3);
    bar(W / 4, 1, MUTED, 'Placebo', '100');
    bar(W * 3 / 4, .72, OK, 'Treatment', '72');
  });
  const hrTex = cardSheet(760, 200, (c, W, H) => {
    c.fillStyle = 'rgba(31,107,71,.07)'; c.fillRect(0, 0, W, H);
    centred(c, 'HR 0.72', W / 4, H * .56, 600, SANS, 50, W / 2 - 50, INK);
    centred(c, '95% CI 0.58 to 0.89', W * 3 / 4, H * .56, 600, SANS, 40, W / 2 - 50, INK);
    centred(c, 'PRIMARY OUTCOME', W / 2, H - 22, 600, SERIF, 20, W - 60, MUTED, 4);
  });
  // 3: who did the work. The four authors, two each side; before them the band that names the writing support
  const authorsTex = cardSheet(880, 572, (c, W, H) => {
    c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(12, 12, W - 24, H - 24);
    centred(c, 'The authors', W / 2, 84, 600, SERIF, 52, W - 90, INK);
    for (let i = 0; i < 4; i++) {
      const x = W * (i < 2 ? .14 + i * .2 : .66 + (i - 2) * .2), y = 250;
      c.fillStyle = 'rgba(34,50,90,.85)'; c.beginPath(); c.arc(x, y - 40, 38, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x, y + 66, 72, 54, 0, Math.PI, 0); c.fill();
      c.fillStyle = OK; c.beginPath(); c.arc(x + 46, y + 70, 26, 0, Math.PI * 2); c.fill();
      font(c, `700 30px ${SANS}`); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.fillText('✓', x + 46, y + 81);
    }
    centred(c, 'each meets the four ICMJE criteria', W / 2, H - 52, 400, SERIF, 30, W - 90, BODY);
  });
  const creditTex = cardSheet(760, 200, (c, W, H) => {
    c.fillStyle = '#F6EFE0'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(201,164,92,.9)'; c.fillRect(0, 0, W, 8);
    centred(c, 'Writing support by MeWriT, acknowledged', W / 2, H * .55, 600, SERIF, 44, W - 60, INK);
    centred(c, 'GPP 2022', W / 2, H - 22, 600, SERIF, 20, W - 60, MUTED, 4);
  });
  // (each spread: the tall card behind, the low band before it, nearer the reader)
  const BACK = { w: 1.0, h: 1.3, z0: -.2, layer: 0 }, FRONT = { w: .95, h: .5, z0: .95, layer: 1 };
  [[peopleTex, screenTex], [riskTex, hrTex], [authorsTex, creditTex]].forEach(([b, f], i) => { vfold(i + 1, { ...BACK, tex: b }); vfold(i + 1, { ...FRONT, tex: f }); });

  // ---------- the periodicals cart, pulled up at the writer's left; the target journal on its top ----------
  const C = READING.CART, FLOOR = READING.FLOOR;
  // an issue's cover: the masthead (the name in its band, the volume and number on a rule beneath it), the
  // lead article's title over a figure of its kind (two survival curves parting), and the issue's contents
  // (other journals on the cart: their own names, colours and cover figures; the names checked not to be
  // real journals' titles)
  const OTHER = {
    trial: { top: 'JOURNAL OF', name: 'APPLIED TRIAL SCIENCE', col: '#24345E', fig: 'forest' },
    practice: { top: 'EVIDENCE IN', name: 'PRACTICE QUARTERLY', col: '#7A2E2A', fig: 'bars' },
  };
  const journalCover = (no, lead, items = ['Registries that last', 'Outcomes in the very old', 'Reporting harms well'], look = { top: 'ANNALS OF', name: 'CLINICAL EVIDENCE', col: JCOL, fig: 'curves' }) => sheet(420, 594, (c, W, H) => {
    paper(c, W, H, '#F7F2E7');
    const M = 28, band = 112, COL = look.col;
    c.fillStyle = COL; c.fillRect(0, 0, W, band);
    c.fillStyle = 'rgba(201,164,92,.95)'; c.fillRect(0, band, W, 4);
    fit(c, look.top, 600, SERIF, 22, W - 2 * M, 6); c.fillStyle = 'rgba(244,238,226,.82)'; c.fillText(look.top, M, 42);
    fit(c, look.name, 600, SERIF, 40, W - 2 * M, 2); c.fillStyle = '#F4EEE2'; c.fillText(look.name, M, 88);
    fit(c, no.toUpperCase(), 600, SANS, 14, W / 2, 2); c.fillStyle = COL; c.fillText(no.toUpperCase(), M, band + 30);
    c.textAlign = 'right'; c.fillText('ILLUSTRATIVE', W - M, band + 30); c.textAlign = 'left';
    c.fillStyle = RULE; c.fillRect(M, band + 42, W - 2 * M, 1.5);
    // the lead article
    font(c, `italic 500 25px ${SERIF}`); c.fillStyle = INK;
    const ly = para(c, lead, M, band + 82, W - 2 * M, 31);
    // its figure, of the lead article's kind: two survival curves parting; a forest plot; or bars by group
    const fx = M + 8, fy = ly + 6, fw = W - 2 * M - 16, fh = 150;
    c.fillStyle = 'rgba(19,36,79,.05)'; c.fillRect(M, fy - 6, W - 2 * M, fh + 34);
    c.strokeStyle = 'rgba(19,36,79,.45)'; c.lineWidth = 1.5;
    if (look.fig === 'curves') {
      c.beginPath(); c.moveTo(fx + 10, fy + 8); c.lineTo(fx + 10, fy + fh); c.lineTo(fx + fw - 6, fy + fh); c.stroke();
      const curve = (drop, col) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); let y = fy + 14; c.moveTo(fx + 12, y); for (let i = 1; i <= 14; i++) { const nx = fx + 12 + (fw - 20) * i / 14; c.lineTo(nx, y); y = fy + 14 + (fh - 30) * drop * (1 - Math.exp(-i / 6)); c.lineTo(nx, y); } c.stroke(); };
      curve(.95, '#B4500F'); curve(.62, COL);
      font(c, `500 13px ${SANS}`); c.fillStyle = MUTED; c.fillText('Years', fx + fw - 44, fy + fh + 20);
    } else if (look.fig === 'forest') {
      const mid = fx + fw * .55;
      c.setLineDash([4, 4]); c.beginPath(); c.moveTo(mid, fy + 6); c.lineTo(mid, fy + fh); c.stroke(); c.setLineDash([]);
      [[.32, .12, .5], [.4, .22, .58], [.28, .1, .46], [.45, .3, .62], [.36, .2, .52], [.38, .3, .46]].forEach(([p, a, b], i) => {
        const y = fy + 16 + i * 24, last = i === 5;
        c.strokeStyle = COL; c.lineWidth = 2; c.beginPath(); c.moveTo(fx + fw * a, y); c.lineTo(fx + fw * b, y); c.stroke();
        c.fillStyle = last ? '#B4500F' : COL;
        if (last) { c.beginPath(); c.moveTo(fx + fw * .3, y); c.lineTo(fx + fw * p, y - 7); c.lineTo(fx + fw * .46, y); c.lineTo(fx + fw * p, y + 7); c.closePath(); c.fill(); }
        else c.fillRect(fx + fw * p - 5, y - 5, 10, 10);
      });
      font(c, `500 13px ${SANS}`); c.fillStyle = MUTED; c.fillText('Favours treatment', fx, fy + fh + 20);
    } else {
      c.beginPath(); c.moveTo(fx + 10, fy + fh); c.lineTo(fx + fw - 6, fy + fh); c.stroke();
      [.8, .55, .68, .4, .6, .32].forEach((v, i) => { c.fillStyle = i % 2 ? '#B4500F' : COL; const bw = (fw - 40) / 9, x = fx + 20 + Math.floor(i / 2) * bw * 3 + (i % 2) * (bw + 4); c.fillRect(x, fy + fh - (fh - 20) * v, bw, (fh - 20) * v); });
      font(c, `500 13px ${SANS}`); c.fillStyle = MUTED; c.fillText('By region', fx, fy + fh + 20);
    }
    // in this issue
    let y = fy + fh + 64;
    fit(c, 'IN THIS ISSUE', 600, SERIF, 14, W, 4); c.fillStyle = ORANGE; c.fillText('IN THIS ISSUE', M, y);
    items.forEach((t, i) => {
      y += 30; font(c, `400 18px ${SERIF}`); c.fillStyle = BODY; c.fillText(t, M, y);
      font(c, `500 15px ${SANS}`); c.fillStyle = MUTED; c.textAlign = 'right'; c.fillText(String(412 + i * 11), W - M, y); c.textAlign = 'left';
    });
  }, { scale: 1.5 }).tex;
  // the journal's page, as an article is set in it: its masthead band, the article's head, two columns
  const journalPage = (c, W, H, { title = 'Effect of once-daily treatment on major outcome events', kick = 'Original research', ack = false, fig = '' } = {}) => {
    paper(c, W, H, '#FFFDF8');
    // (the masthead's name kept to the band's left two thirds: a bookmark may lie in its right end)
    c.fillStyle = JCOL; c.fillRect(0, 0, W, H * .075);
    fit(c, JOURNAL.toUpperCase(), 600, SERIF, Math.round(H * .027), W * .6, 3); c.fillStyle = '#F4EEE2'; c.fillText(JOURNAL.toUpperCase(), W * .06, H * .048);
    font(c, `600 ${Math.round(H * .02)}px ${SANS}`, 3); c.fillStyle = JCOL; c.fillText(kick.toUpperCase(), W * .06, H * .12);
    font(c, `600 ${Math.round(H * .036)}px ${SERIF}`); c.fillStyle = INK;
    const ty = para(c, title, W * .06, H * .17, W * .88, H * .043);
    const by = ty + H * .015;
    c.fillStyle = 'rgba(30,90,99,.08)'; c.fillRect(W * .06, by, W * .88, H * .2);
    c.fillStyle = JCOL; c.fillRect(W * .06, by, W * .008, H * .2);
    // (the abstract's key figures, if given, on its first line, set apart; its text below them)
    if (fig) { fit(c, fig, 600, SANS, Math.round(H * .024), W * .82); c.fillStyle = JCOL; c.fillText(fig, W * .09, by + H * .045); }
    greyLines(c, W * .09, by + H * (fig ? .065 : .03), W * .82, fig ? 5 : 6, H * .026, 'rgba(30,60,70,.3)', 3);
    const cy = by + H * .23, colW = W * .42;
    greyLines(c, W * .06, cy, colW, ack ? 10 : 14, H * .026, 'rgba(43,53,80,.24)', 7);
    greyLines(c, W * .52, cy, colW, ack ? 5 : 14, H * .026, 'rgba(43,53,80,.24)', 11);
    return cy;
  };
  const cart = new THREE.Group();
  const journal = new THREE.Group();   // the target journal: closed on the cart, open on the table
  let jCover = null;
  const JW = 1.3, JH = 1.82;   // (a journal's page, as it lies on the cart and the table: open, its spread fits between the report and the book's rest)
  {
    const oak = mat('#8E6A47', { map: oakTex('#8E6A47', '#4F3824', 71), r: .6 });
    const CL = 6, CD = 2.6, CH = 9.2;   // its length (along x), depth, height
    for (const s of [-1, 1]) cart.add(at(rbox(.3, CH, CD, .05, oak), s * (CL / 2 - .15), CH / 2 + .5, 0));
    cart.add(at(rbox(CL - .3, .2, CD - .1, .04, oak), 0, 1.4, 0), at(rbox(CL - .3, .2, CD - .1, .04, oak), 0, 4.8, 0));
    // the top: a sloped display shelf, its lip toward the writer's side (north, +z), the journals on it
    const top = group(at(rbox(CL - .3, .18, CD + .2, .04, oak), 0, 0, 0), at(rbox(CL - .3, .3, .12, .03, oak), 0, .2, CD / 2 + .1));
    top.rotation.x = .3; top.position.set(0, CH + .2, 0); cart.add(top);
    for (const [, x] of [[-1, -CL / 2 + .7], [1, CL / 2 - .7]]) for (const z of [-CD / 2 + .3, CD / 2 - .3]) { cart.add(at(cyl(.22, .22, .2, mat('#2A2A2E', { r: .6 }), 12), x, .22, z, { x: Math.PI / 2 })); cart.add(at(rbox(.12, .3, .12, .02, brass), x, .5, z)); }
    // two other issues on the top, lying in the shelf's slope
    [[-1.9, 'Vol 31 · No 2', 'Pooling twelve trials of one treatment', ['Subgroups that held up', 'When to stop a trial early', 'Blinding the assessors'], OTHER.trial],
      [-.1, 'Vol 8 · No 3', 'Who gets the treatment, and where', ['Registries that last', 'Outcomes in the very old', 'Costs in primary care'], OTHER.practice]]
      .forEach(([x, no, lead, items, look]) => { const m = upPlane(JW, JH, planeMat(journalCover(no, lead, items, look))); const t = group(m, at(rbox(JW, .06, JH, .01, edge), 0, -.035, 0)); t.position.set(x, .12, 0); top.add(shadowed(t)); });
    cart.position.set(C.x, FLOOR, C.z);
    shadowed(cart); g.add(cart);
    g.add(contact(CL + 1, CD + 1, C.x, C.z, { y: FLOOR, k: .24 }));
    // the target journal: covers and a block of pages; the cover turns about the spine (its left edge, x 0).
    // Inside its cover, the instructions for authors: the limits the manuscript must meet
    const covTex = journalCover('Vol 12 · No 5', 'Trials that changed practice');
    journal.add(at(rbox(JW, .03, JH, .01, mat('#F6F1E6', { r: .9 })), JW / 2, -.04, 0), at(rbox(JW - .04, .05, JH - .04, .01, edge), JW / 2, 0, 0));
    jCover = new THREE.Group();
    const cv = upPlane(JW, JH, planeMat(covTex)); cv.position.set(JW / 2, .03, 0);
    const inside = downPlane(JW, JH, planeMat(sheet(420, 594, (c, W, H) => {
      paper(c, W, H, '#FFFDF8');
      fit(c, 'INSTRUCTIONS FOR AUTHORS', 600, SERIF, 18, W - 56, 4); c.fillStyle = JCOL; c.fillText('INSTRUCTIONS FOR AUTHORS', 28, 60);
      c.fillStyle = JCOL; c.fillRect(28, 78, W - 56, 3);
      const rows = [['Abstract', '250 words'], ['Figures and tables', '5 in all']];
      rows.forEach(([a, b], i) => { const y = 150 + i * 170; font(c, `500 28px ${SANS}`); c.fillStyle = MUTED; c.fillText(a, 28, y); fit(c, b, 700, SANS, 84, W - 56); c.fillStyle = INK; c.fillText(b, 28, y + 86); });
      greyLines(c, 28, 480, W - 56, 3, 26, 'rgba(43,53,80,.2)', 9);
    }).tex));
    inside.position.set(JW / 2, .028, 0);
    jCover.add(cv, inside);
    // (the spine: the cover's paper wrapped round the fold, so open or shut the cover never parts from the pages)
    journal.add(at(cyl(.032, .032, JH, mat('#F6F1E6', { r: .9 }), 16), 0, -.004, 0, { x: Math.PI / 2 }));
    journal.add(jCover);
    const first = upPlane(JW - .035, JH - .06, planeMat(sheet(420, 594, (c, W, H) => journalPage(c, W, H, { title: 'Outcomes after a decade of follow-up' })).tex)); first.position.set(JW / 2 + .0125, .027, 0);
    journal.add(first);
    shadowed(journal);
    g.add(journal);
  }
  // where the journal lies: on the cart's top, and on the table between the report and the book, square to
  // the writer; between, it lifts out, crosses over and settles
  const cartTop = new THREE.Object3D(); cartTop.position.set(C.x + 1.7, FLOOR + 9.4 + .16, C.z);
  const onTable = new THREE.Object3D(); onTable.position.set(D.x - 3.65, TT + .06, D.z + .3);
  const qA = new THREE.Quaternion().setFromEuler(new THREE.Euler(.3, 0, 0)), qB = new THREE.Quaternion();
  const placeJournal = e => {
    journal.position.lerpVectors(cartTop.position, onTable.position, e); journal.position.y += Math.sin(Math.PI * e) * 1.4;
    journal.position.x -= JW / 2;   // (its middle, not its spine, travels the path)
    journal.quaternion.slerpQuaternions(qA, qB, e);
  };

  // ---------- the tablet in its leather folio, the journal's e-proof on it, the stylus ----------
  // (the proofs come as the journal's electronic proof: the page as it will print, in the proofing app,
  // corrected with the stylus; the correction goes back to the journal from there)
  const proofP = (() => {
    const lay = { strike: { x: 0, y: 0, w: 0 }, lines: [{ x: 0, y: 0, w: 0 }] };
    const s = sheet(420, 600, (c, W, H, st) => {
      c.fillStyle = '#E9EBEF'; c.fillRect(0, 0, W, H);
      // the app's bar: the proof's name and page, the annotation tool chosen
      c.fillStyle = '#1D2330'; c.fillRect(0, 0, W, 46);
      font(c, `600 15px ${SANS}`); c.fillStyle = '#F2F4F8'; c.fillText('E-proof · page 5 of 9', 16, 29);
      c.fillStyle = PEN_INK; c.beginPath(); c.roundRect ? c.roundRect(W - 112, 11, 96, 25, 12) : c.rect(W - 112, 11, 96, 25); c.fill();
      font(c, `600 13px ${SANS}`); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.fillText('✎ Annotate', W - 64, 28); c.textAlign = 'left';
      // the page itself, white, its text set in its column, a wide margin on the right for the marks
      const top = 58;
      c.fillStyle = '#FFFFFF'; c.fillRect(10, top, W - 20, H - top - 46);
      font(c, `600 13px ${SANS}`, 3); c.fillStyle = MUTED; c.fillText('ANNALS OF CLINICAL EVIDENCE · PROOF', 24, top + 24);
      c.fillStyle = RULE; c.fillRect(24, top + 34, W - 48, 2);
      const colW = W - 150;
      greyLines(c, 24, top + 50, colW, 7, 24, 'rgba(43,53,80,.24)', 21);
      font(c, `400 19px ${SERIF}`); c.fillStyle = BODY;
      const y = top + 50 + 7 * 24 + 22, pre = 'HR 0.72 (95% CI 0.58 to ';
      c.fillText(pre, 24, y); const px = 24 + c.measureText(pre).width; c.fillText('0.98', px, y); const fw = c.measureText('0.98').width; c.fillText(').', px + fw, y);
      greyLines(c, 24, y + 16, colW, 8, 24, 'rgba(43,53,80,.24)', 23);
      c.fillStyle = 'rgba(19,36,79,.1)'; c.fillRect(W - 116, top + 44, 1.5, H - top - 110);
      lay.strike = { x: px - 2, y: y - 7, w: fw + 4 };
      // the expert's correction in the app's ink: the figure struck through, the right one written in the
      // margin, a tick; once it is written, the app's foot says it has gone back to the journal
      const r = (st && st.r) || [0, 0];
      if (r[0] > 0) { c.strokeStyle = PEN_INK; c.lineWidth = 3; c.beginPath(); c.moveTo(lay.strike.x, lay.strike.y); c.lineTo(lay.strike.x + Math.min(r[0], lay.strike.w), lay.strike.y - 1); c.stroke(); }
      font(c, `600 30px ${HAND}`);
      lay.lines[0] = { x: W - 104, y: y + 6, w: 0 };
      lay.lines[0].w = written(c, [{ t: '0.89 ✓', col: PEN_INK }], W - 104, y + 6, r[1]);
      c.fillStyle = '#1D2330'; c.fillRect(0, H - 38, W, 38);
      font(c, `500 14px ${SANS}`);
      if (st && st.sent) { c.fillStyle = '#7FD3A6'; c.fillText('✓ 1 correction sent to the journal', 16, H - 14); }
      else { c.fillStyle = 'rgba(242,244,248,.7)'; c.fillText('0 corrections', 16, H - 14); }
    }, { scale: 1.6 });
    return Object.assign(s, { lay });
  })();
  const folio = new THREE.Group(), FW = 1.7, FH = 2.4;
  let folioCover = null, proof = null;
  {
    const leather = mat('#5B2A22', { r: .55 });
    folio.add(at(rbox(FW + .1, .04, FH + .1, .02, leather), FW / 2, 0, 0));
    // the tablet, held in the folio: its dark glass edge, then the lit screen
    folio.add(at(rbox(FW - .12, .035, FH - .22, .04, mat('#16181D', { r: .25, m: .3 })), FW / 2, .035, 0));
    proof = upPlane(FW - .2, FH - .3, new THREE.MeshStandardMaterial({ map: proofP.tex, emissive: '#FFFFFF', emissiveMap: proofP.tex, emissiveIntensity: .55, roughness: .22 }));
    proof.position.set(FW / 2, .054, 0); folio.add(proof);
    // (its cover hinged on its right edge, opening outward, away from the book)
    folioCover = new THREE.Group();
    folioCover.add(at(rbox(FW + .1, .04, FH + .1, .02, leather), -FW / 2, 0, 0), at(rbox(FW - .3, .005, FH - .4, .002, mat('#4A2019', { r: .6 })), -FW / 2, .022, 0));
    folioCover.position.set(FW, .05, 0); folio.add(folioCover);
    folio.position.set(D.x + 2.95, TT + .02, D.z + .2);
    shadowed(folio); g.add(folio);
    g.add(contact(FW + .9, FH + .9, D.x + 2.95 + FW / 2, D.z + .2, { y: TT, k: .2 }));
  }
  // the tablet's stylus on a small brass tray along the table's edge, before the folio
  const pen = new THREE.Group(), alu = mat('#C9CCD2', { r: .28, m: .8 });
  {
    const barrel = cyl(.042, .042, 1.2, alu, 20); barrel.rotation.x = Math.PI / 2; barrel.position.z = .05; pen.add(barrel);
    const flat = rbox(.05, .02, 1.0, .008, mat('#B5B9C0', { r: .3, m: .8 })); flat.position.set(0, .034, .1); pen.add(flat);
    const cone = cyl(.006, .042, .14, alu, 16); cone.rotation.x = -Math.PI / 2; cone.position.z = -.62; pen.add(cone);
    const nib = cyl(.006, .006, .04, mat('#E9EAEC', { r: .5 }), 10); nib.rotation.x = Math.PI / 2; nib.position.z = -.71; pen.add(nib);
    shadowed(pen);
    const tx = D.x + 3.7, tz = D.z + 2.55;
    g.add(at(rbox(1.6, .05, .42, .02, brass), tx, TT + .025, tz));
    pen.position.set(tx, TT + .12, tz); pen.rotation.y = -Math.PI / 2; g.add(pen);
  }
  const penRest = pen.position.clone(), qRest = pen.quaternion.clone();
  const DIR = new THREE.Vector3(.5, .8, .35).normalize(), qHold = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), DIR);
  const tip = new THREE.Vector3(), hold = new THREE.Vector3();

  // ---------- the journal on the reading stand: closed, MeWriT's slip in it at the article; it opens there ----------
  const stand = new THREE.Group();
  const standLeaves = [];
  let slip = null;
  {
    const S = READING.STAND, H = FLOOR + 11.4, tilt = .42, SW = 1.9, SH = 2.6;
    // (the stand's desk's frame: its slope falls toward the reader, west; the journal's top is up the slope)
    const frame = new THREE.Group(); frame.rotation.z = -tilt; frame.position.set(S.x, H, S.z); g.add(frame);
    stand.position.set(-.05, .14, 0); frame.add(stand);
    const articleTex = sheet(520, 711, (c, W, H) => {
      const cy = journalPage(c, W, H, { title: 'Effect of once-daily treatment on major outcome events: a randomised trial', ack: true, fig: '480 randomised · HR 0.72 (95% CI 0.58 to 0.89)' });
      font(c, `500 ${Math.round(H * .017)}px ${SANS}`); c.fillStyle = MUTED; c.fillText('Received 12 January · Revised 3 April · Accepted 28 April', W * .06, H * .885);
      // published online too: its DOI (Crossref's test prefix, 10.5555: illustrative) and a code to read it
      // on a phone, in the second column's foot
      const qx = W * .52, qy = cy + 6 * H * .026, qs = W * .1, n = 21, cell = qs / n;
      c.fillStyle = '#FFFFFF'; c.fillRect(qx - 6, qy - 6, qs + 12, qs + 12);
      c.fillStyle = INK;
      let sd = 17;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const fin = (a, b) => a >= 0 && a < 7 && b >= 0 && b < 7;
        const inF = fin(i, j) || fin(i - 14, j) || fin(i, j - 14);
        let on;
        if (inF) { const a = i >= 14 ? i - 14 : i, b = j >= 14 ? j - 14 : j; on = a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); }
        else { sd = (sd * 9301 + 49297) % 233280; on = sd / 233280 > .52; }
        if (on) c.fillRect(qx + i * cell, qy + j * cell, cell + .3, cell + .3);
      }
      font(c, `600 ${Math.round(H * .019)}px ${SANS}`); c.fillStyle = JCOL; c.fillText('Read online', qx + qs + 12, qy + qs * .4);
      fit(c, 'doi.org/10.5555/ace.2026.0412', 500, SANS, Math.round(H * .016), W * .94 - (qx + qs + 12)); c.fillStyle = MUTED; c.fillText('doi.org/10.5555/ace.2026.0412', qx + qs + 12, qy + qs * .78);
      c.fillStyle = RULE; c.fillRect(W * .06, H * .9, W * .88, 2);
      font(c, `italic 400 ${Math.round(H * .018)}px ${SERIF}`); c.fillStyle = BODY;
      para(c, 'Acknowledgements: medical writing support was provided by MeWriT, funded by the sponsor, in line with GPP 2022.', W * .06, H * .93, W * .88, H * .024);
      gutter(c, W, H, 'l');
    }).tex;
    const prevTex = sheet(520, 711, (c, W, H) => { paper(c, W, H, '#FFFDF8'); c.fillStyle = JCOL; c.fillRect(0, 0, W, H * .075); greyLines(c, W * .06, H * .14, W * .42, 30, H * .026, 'rgba(43,53,80,.22)', 5); greyLines(c, W * .52, H * .14, W * .42, 22, H * .026, 'rgba(43,53,80,.22)', 6); gutter(c, W, H, 'r'); }).tex;
    const plainTex = sheet(520, 711, (c, W, H) => { paper(c, W, H, '#FFFDF8'); greyLines(c, W * .06, H * .1, W * .42, 32, H * .026, 'rgba(43,53,80,.2)', 8); greyLines(c, W * .52, H * .1, W * .42, 32, H * .026, 'rgba(43,53,80,.2)', 9); gutter(c, W, H, 'lr'); }).tex;
    const bookOf = new THREE.Group(); stand.add(bookOf);
    // (laid on the slope: the journal's own x along the stand's -z (to the reader's right), its top up the
    // slope; built in the same frame as the manuscript's leaves, then turned into place)
    bookOf.rotation.y = Math.PI / 2;
    bookOf.add(at(rbox(SW, .04, SH, .01, mat('#F6F1E6', { r: .9 })), SW / 2, -.03, 0), at(rbox(SW - .04, .05, SH - .04, .01, edge), SW / 2 + .01, 0, 0));
    // a page that curves down into the fold: its strip nearest the spine dips (by depth, deepest at the
    // spine), so the two open pages meet at the fold at one height, as paper bound at its spine does
    const FOLD_Y = .028;
    const bentPlane = (w, h, m, down, depth) => {
      const ge = new THREE.PlaneGeometry(w, h, 48, 1); ge.rotateX(down ? Math.PI / 2 : -Math.PI / 2); if (down) ge.rotateY(Math.PI);
      const P = ge.attributes.position, w0 = .15;
      for (let i = 0; i < P.count; i++) { const u = P.getX(i) + w / 2; if (u < w0) { const t = 1 - u / w0; P.setY(i, P.getY(i) + (down ? 1 : -1) * depth * t * t); } }
      ge.computeVertexNormals();
      return new THREE.Mesh(ge, m);
    };
    const art = bentPlane(SW - .03, SH - .06, planeMat(articleTex), false, .045 - FOLD_Y); art.position.set((SW - .03) / 2 + .002, .045, 0); bookOf.add(art);
    // MeWriT's slip, marking the page: its foot on the masthead's empty right end, its head out over the
    // page's top edge. Its print: the orange rule at its head and "with compliments"; the logo above them is
    // the original logo, laid on it by the film and written by the pen when the journal is open (house.css
    // .pub-slip; the loader's card)
    slip = new THREE.Group();
    const slipTex = sheet(SLIP.px[0], SLIP.px[1], (c, W, H) => { paper(c, W, H, '#FFFFFF'); c.fillStyle = '#E07A1F'; c.fillRect(0, 0, W, SLIP.band); font(c, `italic 400 ${SLIP.note[1]}px ${SERIF}`); c.fillStyle = BODY; c.textAlign = 'center'; c.fillText('with compliments', W / 2, SLIP.note[0]); c.textAlign = 'left'; }).tex;
    const sp = upPlane(SLIP.w, SLIP.h, planeMat(slipTex)); slip.add(sp);
    slip.position.set(SW - SLIP.w / 2 - .02, .05, -SH / 2 - .1); bookOf.add(slip);
    // (each leaf's faces curve into the fold too: its front where it lies on the right, its back where it
    // lands on the left, at land, its height there)
    const turnLeaf = (front, back, y, land) => {
      const Lf = new THREE.Group(), Pf = new THREE.Group(); Lf.add(Pf);
      const f = bentPlane(SW - .02, SH - .04, planeMat(front), false, y + .003 - FOLD_Y); f.position.set((SW - .02) / 2 + .002, .003, 0); Pf.add(f);
      const b = bentPlane(SW - .02, SH - .04, planeMat(back), true, land + .003 - FOLD_Y); b.position.set((SW - .02) / 2 + .002, -.003, 0); Pf.add(b);
      Lf.position.y = y; bookOf.add(Lf); shadowed(Lf);
      standLeaves.push({ L: Lf, y });
      return Lf;
    };
    turnLeaf(plainTex, plainTex, .085, .05);
    turnLeaf(plainTex, prevTex, .07, .054);
    const sc = new THREE.Group();
    sc.add(at(rbox(SW + .04, .03, SH + .04, .01, mat('#F6F1E6', { r: .9 })), SW / 2, 0, 0));
    const scv = upPlane(SW, SH, planeMat(journalCover('Vol 12 · No 6', 'A once-daily treatment, tested against placebo'))); scv.position.set(SW / 2, .017, 0); sc.add(scv);
    const sci = downPlane(SW, SH, planeMat(plainTex)); sci.position.set(SW / 2, -.017, 0); sc.add(sci);
    sc.position.y = .1; bookOf.add(sc); shadowed(sc);
    standLeaves.unshift({ L: sc, y: .1 });
    shadowed(stand);
  }

  // ---------- set(k): 04's work as far as k ----------
  const turnOf = (k, w) => w ? Math.PI * sm((k - w[0]) / (w[1] - w[0])) : 0;
  let shown = -1;
  function set(k) {
    const key = Math.round(k * 4000);
    if (key === shown) return false;
    shown = key;
    const th = leaves.map((_, i) => turnOf(k, MARKS.turns[i]));
    // each leaf: its angle (a paper leaf bent along its curl), and its height (it leaves the right stack's
    // top and lands on the left's, lifting a little as it goes over)
    leaves.forEach((r, i) => {
      r.L.position.y = STACK_R[i] + (STACK_L[i] - STACK_R[i]) * (th[i] / Math.PI) + Math.sin(th[i]) * .02;
      if (r.board) r.L.rotation.z = th[i];
      else if (r.th !== th[i]) { r.th = th[i]; bend(r, th[i]); }
    });
    // spread s (1 to 3): its left page is leaf s-1's back, its right page leaf s's front; its cards stand
    // between them, on the right page's gutter
    cards.forEach(cd => {
      const s = cd.spread, a = th[s] || 0, b = th[s - 1];
      standCard(cd, a, Math.max(b, a), leaves[s].L.position.y + .003);
    });
    // the target journal: from the cart to the table, then its cover opens at the instructions for authors
    placeJournal(seg(k, MARKS.cart));
    jCover.rotation.z = Math.PI * .985 * seg(k, MARKS.journalOpen);
    jCover.position.y = Math.sin(jCover.rotation.z) * .02;
    // the folio's cover (it swings up and over, away from the book), then the pen's correction in the proof
    folioCover.rotation.z = -Math.PI * .97 * seg(k, MARKS.folio);
    const W = PEN, p = k <= W.from ? 0 : k >= W.to ? 1 : (k - W.from) / (W.to - W.from);
    const sTot = proofP.lay.strike.w, wTot = proofP.lay.lines[0].w, gap = 40, tot = sTot + gap + wTot, d = p * tot;
    const r = [Math.min(sTot, d), Math.max(0, d - sTot - gap)];
    proofP.paint({ r: r.map(v => Math.round(v / 3) * 3), sent: k >= W.up });
    const on = k > W.go && k < W.back;
    if (on) {
      const b = k < W.down ? sm((k - W.go) / (W.down - W.go)) : k > W.up ? 1 - sm((k - W.up) / (W.back - W.up)) : 1;
      // the nib: along the strike, across to the margin, along the figure written there
      let u, v;
      if (d <= sTot) { u = proofP.lay.strike.x + d; v = proofP.lay.strike.y; }
      else if (d <= sTot + gap) { const t = (d - sTot) / gap, L0 = proofP.lay.lines[0]; u = proofP.lay.strike.x + sTot + (L0.x - proofP.lay.strike.x - sTot) * t; v = proofP.lay.strike.y + (L0.y - 12 - proofP.lay.strike.y) * t; }
      else { const L0 = proofP.lay.lines[0]; u = L0.x + (d - sTot - gap); v = L0.y - 12; }
      const lift = k < W.from ? .3 * (1 - seg(k, [W.down, W.from])) : k > W.to ? .3 * seg(k, [W.to, W.up]) : (d > sTot && d < sTot + gap ? .12 : 0);
      g.updateMatrixWorld(true);
      const s = onSheet(u, v, proofP.w, proofP.h, FW - .2, FH - .3, 0);
      tip.copy(proof.localToWorld(new THREE.Vector3(s.x, .006, -s.y)));
      hold.copy(tip).addScaledVector(DIR, .7 + lift);
      pen.position.lerpVectors(penRest, hold, b); pen.position.y += Math.sin(Math.PI * b) * .4;
      pen.quaternion.slerpQuaternions(qRest, qHold, b);
    } else { pen.position.copy(penRest); pen.quaternion.copy(qRest); }
    // the journal on the stand: its cover opens, then its two leaves turn, to the article
    const sCov = turnOf(k, MARKS.standCover), [la, lb] = MARKS.standLeaves;
    standLeaves.forEach((s, i) => {
      const a = i === 0 ? sCov : turnOf(k, [la + (lb - la) * (i - 1) / 2, la + (lb - la) * i / 2]);
      s.L.rotation.z = a; s.L.position.y = s.y + (a / Math.PI) * ([.03, .05, .054][i] - s.y) + Math.sin(a) * .02;
    });
    g.updateMatrixWorld(true);
    return true;
  }
  set(0);
  // where the camera looks: the book's middle (a little above it, where the cards stand); between the
  // report and the cart's top, where the journal crosses; the proof's correction; the journal on the stand
  const focus = () => {
    g.updateMatrixWorld(true);
    const s = onSheet(proofP.lay.strike.x + 50, proofP.lay.strike.y, proofP.w, proofP.h, FW - .2, FH - .3, 0);
    const j = new THREE.Vector3((RX + onTable.position.x - JW / 2) / 2, TT + .9, D.z + .2);
    return {
      book: book.localToWorld(new THREE.Vector3(0, .5, 0)).toArray(), journal: j.toArray(), journalAt: onTable.position.toArray(),
      fix: proof.localToWorld(new THREE.Vector3(s.x, .006, -s.y)).toArray(), stand: stand.localToWorld(new THREE.Vector3(0, 0, 0)).toArray(),
    };
  };
  // the slip's face in the house, for its logo laid on it: its four corners as a reader sees them (top
  // left, top right, bottom right, bottom left), its middle, the way its face looks
  const slipMesh = slip.children[0], v3 = new THREE.Vector3();
  const slipFace = {
    width: SLIP.w,
    corners() { slipMesh.updateMatrixWorld(true); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => slipMesh.localToWorld(v3.set(sx * SLIP.w / 2, .002, sz * SLIP.h / 2)).toArray()); },
    centre() { slipMesh.updateMatrixWorld(true); return slipMesh.localToWorld(v3.set(0, .002, 0)).toArray(); },
    normal() { slipMesh.updateMatrixWorld(true); const o = slipMesh.localToWorld(new THREE.Vector3(0, 0, 0)); return slipMesh.localToWorld(new THREE.Vector3(0, 1, 0)).sub(o).normalize().toArray(); },
  };
  return { group: g, set, steps: STEPS, marks: MARKS, focus, slip: slipFace };
}
