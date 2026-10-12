/* 03's work (site/docs/redesign-plan.md, 11.13 to 11.15): the writer's place at the near end of the
   strong room's long table, a workstation a person could sit down at: a chair pulled up to it
   (archive.js); the display on its stand, the keyboard before it; to its right the expert's pad on a small
   writing slope, the fountain pen on its lip. The film lays their words on the glass, the pad and the
   agency's letter in perspective (house.css). As 03 performs (set(k), k from 0 to 1) the work is done at
   the desk, and the room answers where the work needs it (archive.js, room.set): STEPS, where each step
   begins; MARKS, when each thing happens:
     1. the dossier is built on the screen, module by module, to the ICH common technical document;
     2. ours: the summaries and the reports MeWriT writes, marked on the screen;
     3. a claim in 2.7.3 and the table it cites; at its cabinet on the south wall the doors open and the
        bound report slides out on its reference shelf, open at Table 14.2.1, the claim's rows marked;
        back at the desk the citation is checked;
     4. one figure checked in every module; 2.5's is caught and the expert corrects it with the pen;
     5. one core dossier, four markets (FDA, EMA, ASEAN, CDSCO): only Module 1 changes;
     6. the agency's letter arrives on the slope; the answer is drafted from the traced table, signed;
     7. the closing card on the screen.
   Units as the house's (about 10 cm). Kept apart from the room's merged meshes (userData.keep). */
import * as THREE from 'three';
import { PAL, mat, at, rbox, cyl, canvasTex, roundRect, oakTex, contact, teacup } from './kit.js';
import { sheet, font, wrap, written, inkAt, onSheet } from './paper.js';

// (plan 11.17: told in three beats, BEATS, said in the caption's place: the problem, the change, the
// result. STEPS are the screen's panes within them: the dossier's structure; ours; the claim at its
// source; one figure everywhere; (the four markets, no longer shown: no time of its own); the agency's
// question; the closing card)
export const BEATS = [0, .3, .7];
export const STEPS = [0, .3, .4, .44, .7, .7, .87];
export const MARKS = {
  m3: .09, m4: .1, m5: .11, m2: .12, m1: .13,
  open: .16, shelf: .18,
  o24: .31, o25: .32, o26: .33, o27: .34, o4: .355, o5: .37,
  l3: .425, put: .435,
  c5: .45, c27: .465, c25: .48, fix: .54, zero: .555,
  fda: .7, ema: .7, asean: .7, cdsco: .7,
  q: .735, a: .765, ok: .8, end: .875,
};
// the pen's two writings (when it leaves its lip, touches down, writes from and to, lifts, is back on the
// lip): the correction on the pad, the note on the letter; the letter's coming from the tray
export const PEN = {
  fix: { go: .495, down: .503, from: .507, to: .54, up: .544, back: .554 },
  ok: { go: .772, down: .779, from: .783, to: .8, up: .804, back: .814 },
  letter: [.7, .735],
};

// the display: its glass (the workspace laid out 1000 px wide on it), its bezel, how high its stand
// holds it above the table, how far it leans back
const GLASS = { w: 4.2, h: 4.2 / 1.5455, side: .13, foot: .15, lift: .95, recline: 6 };
// (the glass's own picture, for when the workspace's words are not laid on it: seen from the hall, its
// words would stand over the door and the wall before it. Painted as the workspace shows itself at the
// start of 03's work, line for line as house.css lays it out, so nothing changes when the words take over
// at the doorway)
const uiTex = () => sheet(1000, 647, (c, W, H) => {
  const ink = '#13244F', body = '#45506A', line = 'rgba(19,36,79,.12)', SANS = '"Inter Variable", Inter, system-ui, sans-serif', SER = '"Fraunces Variable", Georgia, serif', MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
  const round = (x, y, w, h, r) => { roundRect(c, x, y, w, h, r); };
  c.fillStyle = '#FDFBF6'; c.fillRect(0, 0, W, H);
  // the bar: its dots, the dossier's name, its state, the two at work in it
  c.fillStyle = '#F6F2E9'; c.fillRect(0, 0, W, 66); c.fillStyle = line; c.fillRect(0, 64.5, W, 1.5);
  [['rgba(224,122,31,.75)', 35.5], ['rgba(224,168,46,.75)', 59.5], ['rgba(19,36,79,.22)', 83.5]].forEach(([f, x]) => { c.fillStyle = f; c.beginPath(); c.arc(x, 33, 7.5, 0, Math.PI * 2); c.fill(); });
  c.textBaseline = 'middle'; font(c, `600 23px ${SANS}`); c.fillStyle = ink; c.fillText('Dossier · eCTD sequence 0000', 113, 34);
  const av = [887, 934];
  c.fillStyle = ink; c.beginPath(); c.arc(av[0] + 20, 33, 20, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#FFF6EC'; c.beginPath(); c.arc(av[1] + 20, 33, 19.25, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(180,80,15,.45)'; c.lineWidth = 1.5; c.stroke();
  c.textAlign = 'center'; font(c, `600 15px ${SANS}`); c.fillStyle = '#FFFFFF'; c.fillText('HS', av[0] + 20, 34);
  font(c, `600 19px ${SANS}`); c.fillStyle = '#B4500F'; c.fillText('✦', av[1] + 20, 34); c.textAlign = 'left';
  font(c, `400 21px ${SANS}`); const rw = c.measureText('Ready').width, sx = 865 - rw - 23;
  c.fillStyle = 'rgba(224,122,31,.18)'; c.beginPath(); c.arc(sx + 6, 33, 11, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#E07A1F'; c.beginPath(); c.arc(sx + 6, 33, 6, 0, Math.PI * 2); c.fill();
  c.fillStyle = body; c.fillText('Ready', sx + 23, 34);
  // the first pane: its kicker and heading, the five modules (none yet built), the standards
  c.textBaseline = 'alphabetic';
  font(c, `600 18px ${SER}`, 4); c.fillStyle = '#B4500F'; c.fillText('STRUCTURE', 56, 120);
  font(c, `500 52px ${SER}`, -1); c.fillStyle = ink; c.fillText('The common technical document', 56, 177);
  const mods = [['m1', 'Regional'], ['m2', 'Summaries'], ['m3', 'Quality'], ['m4', 'Nonclinical'], ['m5', 'Clinical']];
  c.globalAlpha = .34;
  mods.forEach(([code, name], i) => {
    const x = i % 2 ? 522 : 56, y = 215 + Math.floor(i / 2) * 59.5, cy = y + 29;
    font(c, `600 22px ${MONO}`); const cw = c.measureText(code).width + 18;
    c.fillStyle = 'rgba(201,164,92,.17)'; round(x, cy - 16.5, cw, 33, 6); c.fill();
    c.fillStyle = '#8C6418'; c.textBaseline = 'middle'; c.fillText(code, x + 9, cy + 1);
    font(c, `500 32px ${SANS}`); c.fillStyle = ink; c.fillText(name, x + cw + 16, cy + 1); c.textBaseline = 'alphabetic';
    c.strokeStyle = 'rgba(19,36,79,.18)'; c.lineWidth = 2; c.beginPath(); c.arc(x + 422 - 18, cy, 17, 0, Math.PI * 2); c.stroke();
    c.fillStyle = line; c.fillRect(x, y + 58, 422, 1.5);
  });
  c.globalAlpha = 1;
  let tx = 56;
  for (const t of ['CTD · ICH M4', 'eCTD · ICH M8']) {
    font(c, `600 21px ${SANS}`); const tw = c.measureText(t).width + 32;
    c.strokeStyle = line; c.lineWidth = 1.5; round(tx, 419, tw, 38, 19); c.stroke();
    c.fillStyle = body; c.textBaseline = 'middle'; c.fillText(t, tx + 16, 439); c.textBaseline = 'alphabetic';
    tx += tw + 14;
  }
  // the foot
  c.fillStyle = line; c.fillRect(0, 595, W, 1.5);
  font(c, `400 19px ${SANS}`); c.fillStyle = body; c.textBaseline = 'middle'; c.fillText('Step 1 of 7', 28, 621);
  c.textAlign = 'right'; c.fillText('Illustrative', W - 28, 621); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
}, { scale: 1 }).tex;
// the keyboard's top, its keys drawn (as the study's)
const keysTex = () => canvasTex(1024, 400, (c, w, h) => {
  c.fillStyle = '#CFCAC0'; c.fillRect(0, 0, w, h);
  const rows = [[.62, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], [1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5]], [1, [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], [1, [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.7]], [1, [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2]], [1, [1, 1, 1.2, 5.6, 1.2, 1, 1, 1]]];
  const pad = 22, gap = 9, totalH = rows.reduce((a, r) => a + r[0], 0), unitH = (h - pad * 2 - gap * (rows.length - 1)) / totalH;
  let y = pad;
  rows.forEach(([rh, keys]) => {
    const units = keys.reduce((a, k) => a + k, 0), unitW = (w - pad * 2 - gap * (keys.length - 1)) / units, kh = rh * unitH;
    let x = pad;
    keys.forEach(k => { const kw = k * unitW; c.fillStyle = 'rgba(80,72,60,.35)'; roundRect(c, x, y + 3, kw, kh, 7); c.fill(); c.fillStyle = '#F7F4EE'; roundRect(c, x, y, kw, kh - 2, 7); c.fill(); x += kw + gap; });
    y += kh + gap;
  });
});

// a flat sheet's four corners in the house (top left, top right, bottom right, bottom left as the reader
// sees it): from the sheet's plane (its own +y is up the sheet, +x to the reader's right)
function corners(o, w, h, lift = .004) {
  const pts = [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]].map(([x, y]) => new THREE.Vector3(x, y, lift));
  return () => { o.updateMatrixWorld(true); return pts.map(p => o.localToWorld(p.clone()).toArray()); };
}

export function buildDossier({ SX, Z, TT }) {
  const g = new THREE.Group(); g.userData.keep = true;
  const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const seg = (k, a, b) => sm((k - a) / (b - a));
  const body = mat(PAL.navy, { r: .35, m: .2 }), steel = mat(PAL.steel, { r: .35, m: .7 }), paper = mat('#FBF8F2', { r: .92 });
  const walnut = mat('#6E4A33', { map: oakTex('#6E4A33', '#3E2817', 13, [.6, .6]), r: .5 }), leather = mat('#22385F', { r: .62 });

  // ---------- the display on its stand, square to the chair ----------
  const screen = (() => {
    const { w, h, side, foot, lift, recline } = GLASS, Wd = w + 2 * side, Hd = h + side + foot, r = recline * Math.PI / 180;
    const dev = new THREE.Group();
    dev.add(at(rbox(.24, Hd, Wd, .08, body), -.12, Hd / 2, 0));
    // (a screen gives its own light: its picture shown in its own colours, as the words laid on it are)
    const pic = uiTex(), glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: pic, toneMapped: false }));
    glass.rotation.y = Math.PI / 2; glass.position.set(.004, foot + h / 2, 0); dev.add(glass);
    dev.rotation.z = r; dev.position.set(SX, TT + lift, Z);
    g.add(dev);
    // the stand: a neck behind the display down to its foot on the table
    // (in graphite aluminium, as a modern display's stand: a slim neck, a thin base with rounded corners and
    // a bevelled edge, not a pale slab that the lamp turns cream)
    const graphite = mat('#3B3F47', { r: .32, m: .65 });
    g.add(at(rbox(.26, lift + Hd * .45, .5, .1, graphite), SX - .45, TT + (lift + Hd * .45) / 2, Z));
    g.add(at(rbox(1.25, .045, 1.75, .02, graphite), SX - .5, TT + .0225, Z));
    g.add(at(rbox(1.15, .012, 1.65, .006, mat('#55595F', { r: .28, m: .7 })), SX - .5, TT + .048, Z));
    g.add(contact(2.1, 2.6, SX - .5, Z, { y: TT, k: .24 }));
    dev.updateMatrixWorld(true);
    const cs = [[h, w / 2], [h, -w / 2], [0, -w / 2], [0, w / 2]].map(([v, z]) => dev.localToWorld(new THREE.Vector3(.005, foot + v, z)).toArray());
    return { corners: cs, centre: dev.localToWorld(new THREE.Vector3(.005, foot + h / 2, 0)).toArray(), normal: [Math.cos(r), Math.sin(r), 0], width: w, height: h };
  })();

  // ---------- the keyboard before it ----------
  {
    const kb = new THREE.Group();
    kb.add(at(rbox(1.15, .13, 3.0, .05, mat('#D3CFC6', { r: .5, m: .3 })), 0, .065, 0));
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.08), mat('#FFFFFF', { map: keysTex(), r: .5 }));
    top.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); top.position.y = .133; kb.add(top);
    kb.position.set(SX + 3.6, TT, Z); kb.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
    g.add(kb, contact(1.8, 3.6, SX + 3.6, Z, { y: TT, k: .16 }));
  }

  // ---------- the writer's tea at the keyboard's left, steaming (its steam drawn by the film) ----------
  const CUP = [SX + 3.3, TT, Z + 2.55];
  {
    const cup = teacup();
    cup.position.set(CUP[0], CUP[1], CUP[2]); cup.rotation.y = 2.2;
    g.add(cup, contact(1.2, 1.2, CUP[0], CUP[2], { y: TT, k: .2 }));
  }

  // ---------- the writing slope to the right: the expert's pad on it, the pen on its lip; behind it a
  // two-tier letter tray, the agency's letter on its upper tier (in) ----------
  const slope = (() => {
    const cz = Z - 3.5, cx = SX + 2.3, L = 2.6, h0 = .25, tilt = .32, Wd = 2.4, ct = Math.cos(tilt), st = Math.sin(tilt);
    const sg = new THREE.Group();
    // (built facing +x, toward the chair: its foot toward the chair, its face rising away from it)
    const side = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(L * ct, 0), new THREE.Vector2(L * ct, h0 + L * st), new THREE.Vector2(0, h0)]);
    const wg = new THREE.ExtrudeGeometry(side, { depth: Wd, bevelEnabled: false }); wg.translate(0, 0, -Wd / 2);
    const wedge = new THREE.Mesh(wg, walnut); wedge.rotation.y = Math.PI; sg.add(wedge);
    const onFace = (m, t, lift) => { m.rotation.order = 'YXZ'; m.rotation.y = Math.PI / 2; m.rotation.x = -(Math.PI / 2 - tilt); m.position.set(-t * ct + lift * st, h0 + t * st + lift * ct, 0); m.updateMatrix(); return m; };
    sg.add(onFace(new THREE.Mesh(new THREE.PlaneGeometry(Wd - .2, L - .2), leather), L / 2, .006));
    sg.add(at(rbox(.12, .16, Wd - .1, .03, mat('#5A3B27', { r: .5 })), -.06, h0 + .08, 0));
    // the pad: the expert's notes are written on its top sheet (padSheet)
    const padP = padSheet(), PADU = { w: Wd - .5, h: L - .55 };
    const pad = onFace(new THREE.Mesh(new THREE.PlaneGeometry(PADU.w, PADU.h), new THREE.MeshStandardMaterial({ map: padP.tex, roughness: .92 })), L / 2 + .05, .03);
    sg.add(pad);
    // the letter tray behind the slope, a little to its right: two walnut tiers on brass posts, papers on
    // each; the agency's letter on top of the upper tier's, raised so it shows over the slope's back
    // (sized to its papers, the letter's size: an even margin of .1 all round inside its walls)
    const T = { x: -5.75, z: -.3, d: 2.49, w: 2.34, y1: .05, y2: .8 };
    const tray = (m, x, y, z, r) => sg.add(at(m, T.x + x, y, T.z + z, r));
    for (const y of [T.y1, T.y2]) {
      tray(rbox(T.d, .05, T.w, .02, walnut), 0, y, 0);
      tray(rbox(.07, .2, T.w, .02, walnut), -T.d / 2 + .035, y + .1, 0);
      for (const s of [-1, 1]) tray(rbox(T.d, .2, .07, .02, walnut), 0, y + .1, s * (T.w / 2 - .035));
      tray(rbox(.07, .2, T.w, .02, walnut), T.d / 2 - .035, y + .1, 0);   // (its front as high as its back and sides)
      for (let i = 0; i < 3; i++) tray(rbox(2.15, .012, 2.0, .004, mat(i % 2 ? '#F3EEE3' : '#ECE5D6', { r: .92 })), 0, y + .035 + i * .014, 0);
    }
    for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) tray(cyl(.035, .035, T.y2 - T.y1, mat(PAL.gold, { r: .3, m: .85 }), 8), dx * (T.d / 2 - .07), (T.y1 + T.y2) / 2, dz * (T.w / 2 - .07));
    // the agency's letter: in the upper tier until step 6, when it comes over the slope's back and settles
    // on its face over the pad (place(e): e from 0, in the tray, to 1, on the slope)
    const letP = letterSheet(), LETU = { w: Wd - .4, h: L - .45 };
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(LETU.w, LETU.h), new THREE.MeshStandardMaterial({ map: letP.tex, roughness: .9 }));
    letter.rotation.order = 'YXZ'; letter.rotation.y = Math.PI / 2; sg.add(letter);
    const inTray = new THREE.Vector3(T.x, T.y2 + .085, T.z), onSlope = new THREE.Vector3(-(L / 2 + .02) * ct + .055 * st, h0 + (L / 2 + .02) * st + .055 * ct, 0);
    const placeLetter = e => {
      letter.position.lerpVectors(inTray, onSlope, e); letter.position.y += Math.sin(Math.PI * e) * .7;
      letter.rotation.x = -(Math.PI / 2 - tilt * sm((e - .25) / .75)); letter.rotation.z = 0;
      letter.updateMatrix();
    };
    placeLetter(0);
    // the fountain pen on the lip
    const pen = new THREE.Group(), lac = mat('#162244', { r: .2, m: .25 }), gold = mat(PAL.gold, { r: .25, m: .9 });
    const barrel = cyl(.05, .056, 1.0, lac, 20); barrel.rotation.x = Math.PI / 2; pen.add(barrel);
    const cap = cyl(.062, .058, .52, lac, 20); cap.rotation.x = Math.PI / 2; cap.position.z = .73; pen.add(cap);
    const band = cyl(.064, .064, .05, gold, 20); band.rotation.x = Math.PI / 2; band.position.z = .48; pen.add(band);
    const nib = cyl(.007, .05, .2, gold, 14); nib.rotation.x = -Math.PI / 2; nib.position.z = -.6; pen.add(nib);
    pen.position.set(-.2, h0 + .22, 0); sg.add(pen);
    sg.position.set(cx, TT, cz); sg.rotation.y = .16;   // (turned a little toward the chair)
    sg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.add(sg, contact(3.4, 3, cx - 1.1, cz, { y: TT, k: .2 }), contact(2.9, 2.9, cx - 3.95 * Math.cos(.16) - .3 * Math.sin(.16), cz + 3.95 * Math.sin(.16) - .3 * Math.cos(.16), { y: TT, k: .18 }));
    // the pen in the hand: its nib on the sheet, its barrel leaning back toward the writer's right hand;
    // at b 0 on the lip, at 1 in the hand (an arc between), lifted off the paper along its own length
    const D = new THREE.Vector3(.45, .8, -.4).normalize(), qHold = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), D);
    const pRest = pen.position.clone(), qRest = pen.quaternion.clone(), tip = new THREE.Vector3(), hold = new THREE.Vector3();
    const penTo = (b, mesh, P, U, u, v, lift) => {
      tip.copy(onSheet(u, v, P.w, P.h, U.w, U.h, .006)).applyMatrix4(mesh.matrix);
      hold.copy(tip).addScaledVector(D, .7 + lift);
      pen.position.lerpVectors(pRest, hold, b); pen.position.y += Math.sin(Math.PI * b) * .4;
      pen.quaternion.slerpQuaternions(qRest, qHold, b);
    };
    return { pad, padP, PADU, letter, letP, LETU, placeLetter, pen, penTo, rest: () => { pen.position.copy(pRest); pen.quaternion.copy(qRest); } };
  })();

  // a writing with the pen (PEN: when it leaves the lip, touches down, writes from and to, lifts, is back):
  // the pen's place and how far each line is written, at k
  function writing(k, W, P) {
    const p = k <= W.from ? 0 : k >= W.to ? 1 : (k - W.from) / (W.to - W.from), at = inkAt(P.lay.lines, p);
    const b = k < W.down ? sm((k - W.go) / (W.down - W.go)) : k > W.up ? 1 - sm((k - W.up) / (W.back - W.up)) : 1;
    const lift = k < W.from ? .3 * (1 - seg(k, W.down, W.from)) : k > W.to ? .3 * seg(k, W.to, W.up) : at.lift * .12;
    return { b, u: at.u, v: at.v, lift, reveal: at.reveal.map(r => Math.round(r / 5) * 5), on: k > W.go && k < W.back };
  }
  let shown = -1;
  function set(k) {
    const key = Math.round(k * 4000);
    if (key === shown) return false;
    shown = key;
    // 6: the agency's letter, from the tray's upper tier over the slope's back on to its face
    slope.placeLetter(sm((k - PEN.letter[0]) / (PEN.letter[1] - PEN.letter[0])));
    // 4: the expert writes the correction on the pad; 6: notes on the letter where it was answered
    const a = writing(k, PEN.fix, slope.padP), b = writing(k, PEN.ok, slope.letP);
    slope.padP.paint({ r: a.reveal }); slope.letP.paint({ r: b.reveal });
    if (a.on) slope.penTo(a.b, slope.pad, slope.padP, slope.PADU, a.u, a.v, a.lift);
    else if (b.on) slope.penTo(b.b, slope.letter, slope.letP, slope.LETU, b.u, b.v, b.lift);
    else slope.rest();
    g.updateMatrixWorld(true);
    return true;
  }
  set(0);
  // (where the expert's pad lies on its slope, in the house: on a phone the camera goes to it as the pen writes)
  const padAt = () => { g.updateMatrixWorld(true); return slope.pad.localToWorld(new THREE.Vector3(0, 0, 0)).toArray(); };
  return { group: g, set, steps: STEPS, beats: BEATS, marks: MARKS, screen, padAt, cup: [CUP[0], CUP[1] + .47, CUP[2]] };
}

// ---------- the papers on the desk, their words part of them (paper.js) ----------
const SERIF = '"Fraunces Variable", Georgia, serif', HAND = 'Caveat, cursive';
// the expert's pad: ruled, its heading; the correction written at step 4 (state r: how far each line is
// written, px)
function padSheet() {
  const lay = { lines: [{ x: 60, y: 216, w: 0 }, { x: 60, y: 292, w: 0 }] };
  const s = sheet(760, 820, (c, W, H, st) => {
    c.fillStyle = '#FBF8F2'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(60,90,150,.16)'; for (let y = 150; y < H - 30; y += 74) c.fillRect(0, y, W, 2);
    font(c, `600 30px ${SERIF}`, 5); c.fillStyle = 'rgba(19,36,79,.7)'; c.fillText('QC · MODULE 2', 60, 76);
    c.fillStyle = 'rgba(180,80,15,.5)'; c.fillRect(60, 96, W - 120, 3);
    const r = (st && st.r) || [0, 0];
    font(c, `600 64px ${HAND}`); lay.lines[0].w = written(c, [{ t: '2.5 · randomised ', col: '#1D4FA0' }, { t: '408', col: 'rgba(180,54,30,.85)', strike: true }, { t: ' 480 ✓', col: '#1D4FA0' }], 60, 216, r[0]);
    font(c, `600 48px ${HAND}`); lay.lines[1].w = written(c, [{ t: 'as CSR Table 14.2.1', col: 'rgba(29,79,160,.82)' }], 60, 292, r[1]);
  }, { scale: 1.4 });
  return Object.assign(s, { lay });
}
// the agency's letter: its heading, the question, the request for a response; where it was answered,
// noted by the expert at step 6
function letterSheet() {
  const lay = { lines: [{ x: 60, y: 640, w: 0 }] };
  const s = sheet(800, 860, (c, W, H, st) => {
    c.fillStyle = '#FFFEFA'; c.fillRect(0, 0, W, H);
    font(c, `600 30px ${SERIF}`, 4); c.fillStyle = '#45506A';
    c.fillText('INFORMATION REQUEST', 60, 76); c.textAlign = 'right'; c.fillText('QUESTION 3', W - 60, 76); c.textAlign = 'left';
    c.fillStyle = 'rgba(19,36,79,.3)'; c.fillRect(60, 100, W - 120, 3);
    font(c, `560 60px ${SERIF}`); c.fillStyle = '#0F1C40';
    wrap(c, 'Justify the efficacy claim in Module 2.7.3 against the primary analysis.', W - 120).forEach((l, i) => c.fillText(l, 60, 188 + i * 76));
    font(c, `italic 400 36px ${SERIF}`); c.fillStyle = '#7A8194'; c.fillText('Response requested', 60, H - 60);
    const r = (st && st.r) || [0];
    font(c, `600 56px ${HAND}`); lay.lines[0].w = written(c, [{ t: 'Answered: sequence 0001 ✓', col: '#1D4FA0' }], 60, 640, r[0]);
  }, { scale: 1.4 });
  return Object.assign(s, { lay });
}
