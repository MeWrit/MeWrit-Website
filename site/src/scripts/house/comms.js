/* 05's work (site/docs/redesign-plan.md, 11.18): in the lecture room at dawn (lecture.js), one body of
   evidence told to every audience. Three beats, as 05 performs (set(k), k from 0 to 1):
     1. The problem. On the panel's table the evidence lies as a pile: the trial's report in its volumes,
        the statistical tables, the registry data, the literature. The consensus statement waits in its folder.
     2. The change. The folder opens: the panel's recommendation, the trial's figures under it. Then the same
        message in every form: the projection screen rolls down over the stage and the projector lights it
        with the slide; on a front-row seat a booklet for physicians opens; by the door a patient leaflet
        unfolds, and the morning paper opens at its health page. Every figure the same in all of them.
     3. The result. The house lights come up for the talk (the film's lamps).
   STEPS, where each beat begins; MARKS, when each thing happens. Units as the house's (about 10 cm).
   Everything here moves, so it is kept apart from the room's merged meshes (userData.keep). */
import * as THREE from 'three';
import { PAL, mat, at, rbox, cyl, contact, oakTex, boundVolume } from './kit.js';
import { sheet, font, wrap } from './paper.js';
import { LECTURE } from './lecture.js';

export const STEPS = [0, .18, .87];
export const MARKS = {
  statement: [.19, .24], screen: [.36, .41], projector: [.41, .45], booklet: [.565, .61],
  leafletL: [.78, .8], leafletR: [.8, .82], paper: [.82, .855],
};

const SERIF = '"Fraunces Variable", Georgia, serif', SANS = '"Inter Variable", Inter, system-ui, sans-serif';
const INK = '#13244F', BODY = '#2B3550', MUTED = 'rgba(19,36,79,.55)', RULE = 'rgba(19,36,79,.16)', OK = '#1F6B47', ORANGE = '#B4500F';
const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const seg = (k, [a, b]) => sm((k - a) / (b - a));
const PROSE = 'Adults at high risk of a major event were assigned to the treatment once daily or a matching placebo and followed for a median of 2.6 years. The primary outcome was the first major event, judged by a committee unaware of the assignments. The panel weighed this trial with the registry data and the published literature before agreeing its advice. ';
// running text in real words, n lines from y, wrapped to w
function prose(c, x, y, w, n, lh, size, col, seed = 0) {
  font(c, `400 ${size}px ${SERIF}`); c.fillStyle = col;
  const words = PROSE.split(' ').filter(Boolean);
  let wi = (seed * 7) % words.length;
  for (let i = 0; i < n; i++) {
    const maxW = i === n - 1 ? w * .55 : w; let line = '';
    for (;;) { const t = line ? line + ' ' + words[wi % words.length] : words[wi % words.length]; if (line && c.measureText(t).width > maxW) break; line = t; wi++; }
    c.fillText(line, x, y + i * lh);
  }
  return y + n * lh;
}
function fit(c, text, weight, family, size, maxW, spacing = 0) {
  let fs = size; font(c, `${weight} ${fs}px ${family}`, spacing);
  while (fs > 8 && c.measureText(text).width > maxW) { fs -= 1; font(c, `${weight} ${fs}px ${family}`, spacing); }
  return fs;
}
function para(c, text, x, y, w, lh) { for (const l of wrap(c, text, w)) { c.fillText(l, x, y); y += lh; } return y; }
const paper = (c, W, H, col = '#FBF8F2') => { c.fillStyle = col; c.fillRect(0, 0, W, H); };

export function buildComms() {
  const g = new THREE.Group(); g.userData.keep = true;
  const { XM: xm, Z0, FLOOR, TOP } = LECTURE, ST = LECTURE.STAGE.top;
  const oak = mat('#9C774F', { map: oakTex('#9C774F', '#5A402A', 43), r: .62 });
  const darkOak = mat('#6E4A33', { map: oakTex('#6E4A33', '#3E2817', 13), r: .55 });
  const brass = mat(PAL.gold, { r: .3, m: .85 });
  const cloth = mat('#22325A', { r: .8 }), edge = mat('#EFE8DA', { r: .9 });
  const planeMat = tex => new THREE.MeshStandardMaterial({ map: tex, roughness: .9 });
  const shadowed = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  // (a placeholder picture for the screen and the laptop until the slide is traced: a material that gains a
  // map later is compiled again, a stall mid-flight)
  const blankTex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blankTex.needsUpdate = true;
  // a plane lying face up, its print's top toward the north (+z: read from the south, as the room faces)
  const upN = (w, h, m) => { const ge = new THREE.PlaneGeometry(w, h); ge.rotateX(-Math.PI / 2); ge.rotateY(Math.PI); return new THREE.Mesh(ge, m); };
  // and its print's top toward the south (-z: read from the north, looking down at the side table)
  const upS = (w, h, m) => { const ge = new THREE.PlaneGeometry(w, h); ge.rotateX(-Math.PI / 2); return new THREE.Mesh(ge, m); };

  // ---------- the panel's table across the stage's east side (2.4 m by 75 cm, 75 cm high): three panelists'
  // chairs behind it, facing the room; before each a microphone bent toward its speaker and a name card;
  // the evidence piled at the table's east end; the statement before the chair's place ----------
  const PT = { x: xm - 7, z: 34.6, w: 24, d: 7.5, top: ST + 7.5 };   // (its chairs clear of the north wall)
  const graphite = mat(PAL.graphite, { r: .4, m: .6 });
  const seatsX = [-3.5, 2.5, 8.5].map(d => PT.x + d);
  {
    g.add(at(rbox(PT.w, .45, PT.d, .08, darkOak), PT.x, PT.top - .225, PT.z));
    // (its front a modesty panel to the floor, its ends)
    g.add(at(rbox(PT.w - .6, 6.4, .3, .06, darkOak), PT.x, ST + 3.4, PT.z - PT.d / 2 + .5));
    for (const sx of [-1, 1]) g.add(at(rbox(.5, 7.05, PT.d - .4, .06, darkOak), PT.x + sx * (PT.w / 2 - .4), ST + 3.525, PT.z));
    g.add(contact(PT.w + 2, PT.d + 2, PT.x, PT.z, { y: ST, k: .22 }));
    const fabric = mat('#2C4566', { r: .85 });
    seatsX.forEach((cx, i) => {
      // the chair, its seat 46 cm up, facing south
      const c = new THREE.Group();
      c.add(at(rbox(4.6, 1.0, 4.4, .35, fabric), 0, 4.4, 0), at(rbox(4.6, 5.2, .8, .35, fabric), 0, 7.6, 2.0, { x: .12 }));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(at(cyl(.18, .18, 4.0, graphite, 10), sx * 1.9, 2.0, sz * 1.7));
      c.position.set(cx, ST, PT.z + 5.6); g.add(c);
      // the microphone, to the speaker's right: a weighted foot, its neck rising and bending toward the speaker
      const mx = cx - 2.2, mz = PT.z + 2.4;
      g.add(at(cyl(.45, .55, .22, graphite, 20), mx, PT.top + .11, mz));
      const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0, 2.2, -.1], [0, 3.5, .5], [0, 4.0, 1.6]].map(p => new THREE.Vector3(...p))), 24, .07, 8), graphite);
      neck.position.set(mx, PT.top + .2, mz); g.add(neck);
      g.add(at(cyl(.16, .2, .8, mat('#1E2026', { r: .5, m: .3 }), 12), mx, PT.top + 4.15, mz + 2.0, { x: Math.PI / 2 - .3 }));
      // the name card: a folded tent of card at the table's front edge, its face to the room
      const label = i === 1 ? 'PANEL CHAIR' : 'EXPERT PANEL';
      const cardTex = sheet(520, 170, (cc, W, H) => { paper(cc, W, H, '#FFFFFF'); cc.fillStyle = INK; cc.fillRect(0, H - 16, W, 16); fit(cc, label, 600, SERIF, 56, W - 60, 6); cc.fillStyle = INK; cc.textAlign = 'center'; cc.fillText(label, W / 2, 96); cc.textAlign = 'left'; }).tex;
      const tent = new THREE.Group();
      const face = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.3), planeMat(cardTex)); face.rotation.y = Math.PI; face.position.set(0, .62, -.2); face.rotation.x = 0; tent.add(face);
      tent.add(at(rbox(4.02, 1.32, .03, .01, edge), 0, .62, -.17), at(rbox(4.02, 1.32, .03, .01, edge), 0, .62, .17));
      tent.position.set(cx, PT.top, PT.z - 2.7); if (i !== 1) g.add(tent);   // (the chair's place holds the statement instead)
    });
    shadowed(g);
  }

  // ---------- the evidence at the table's east end: the trial's report in its four volumes, the statistical
  // tables, the registry, the literature; hardbacks, their spines to the room ----------
  const PILE = { x: PT.x - 9, z: PT.z - .9 };
  {
    const spine = (t, n, col) => sheet(900, 190, (c, W, H) => {
      c.fillStyle = col; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(201,164,92,.9)'; c.fillRect(0, 18, W, 3); c.fillRect(0, H - 21, W, 3);
      c.textBaseline = 'middle'; fit(c, t, 600, SERIF, 52, W * .72, 4); c.fillStyle = '#F1E3BF'; c.fillText(t, 40, H / 2 + 2);
      if (n) { c.textAlign = 'right'; font(c, `600 46px ${SANS}`); c.fillText(n, W - 40, H / 2 + 2); c.textAlign = 'left'; }
      c.textBaseline = 'alphabetic';
    }).tex;
    const stack = (list, x, z) => {
      let y = PT.top;
      list.forEach(([t, n, col, th], i) => {
        const v = boundVolume({ w: 3.0, th, d: 2.2, cloth: mat(col, { r: .8 }), spine: spine(t, n, col) });
        v.position.set(x + [0, .05, -.04, .03][i], y + th / 2, z); v.rotation.y = [.02, -.03, .025, -.015][i]; g.add(v);
        y += th + .005;
      });
    };
    stack([['CLINICAL STUDY REPORT', '1 / 4', '#1B2A4D', .62], ['CLINICAL STUDY REPORT', '2 / 4', '#1B2A4D', .62], ['CLINICAL STUDY REPORT', '3 / 4', '#1B2A4D', .62], ['CLINICAL STUDY REPORT', '4 / 4', '#1B2A4D', .62]], PILE.x, PILE.z);
    stack([['STATISTICAL TABLES', '', '#4F3A2A', .8], ['REGISTRY DATA', '', '#2F5B46', .6], ['LITERATURE · 212 PAPERS', '', '#6B2E2A', .7]], PILE.x - .2, PILE.z + 2.9);
    g.add(contact(4.4, 6, PILE.x, PILE.z + 1.4, { y: PT.top, k: .24 }));
  }

  // ---------- the consensus statement in its folder, before the chair's place: it opens ----------
  // (built square to a reader in the room, looking north: the print's top to the north, its left to the
  // west, +x; the spine on the left, the cover opening to the left)
  const SF = { x: seatsX[1], z: PT.z - 1.3, w: 2.3, h: 3.2 };   // (at the chair's place, at the table's front: in full view)
  let folderCover = null;
  {
    const page = sheet(510, 710, (c, W, H) => {
      paper(c, W, H, '#FFFDF8');
      c.fillStyle = INK; c.fillRect(0, 0, W, 54);
      fit(c, 'CONSENSUS STATEMENT · 2026', 600, SERIF, 24, W - 60, 5); c.fillStyle = '#F4EEE2'; c.fillText('CONSENSUS STATEMENT · 2026', 30, 36);
      font(c, `600 22px ${SANS}`, 3); c.fillStyle = ORANGE; c.fillText('RECOMMENDATION 3', 30, 104);
      font(c, `500 34px ${SERIF}`); c.fillStyle = INK; let y = para(c, 'Offer once-daily treatment to adults at high risk of a major event.', 30, 152, W - 60, 42);
      y += 10; font(c, `600 22px ${SANS}`); c.fillStyle = OK; c.fillText('Evidence: high · Strength: strong', 30, y + 6);
      c.fillStyle = RULE; c.fillRect(30, y + 30, W - 60, 2);
      font(c, `600 24px ${SANS}`); c.fillStyle = INK; c.fillText('480 randomised · HR 0.72', 30, y + 76); c.fillText('95% CI 0.58 to 0.89', 30, y + 108);
      prose(c, 30, y + 160, W - 60, 6, 28, 18, 'rgba(43,53,80,.75)', 3);
      font(c, `italic 400 18px ${SERIF}`); c.fillStyle = MUTED; c.fillText('Medical writing: MeWriT · illustrative', 30, H - 28);
    }).tex;
    const coverTex = sheet(510, 710, (c, W, H) => {
      c.fillStyle = '#1B2A4D'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#F4EEE2'; c.fillRect(60, 190, W - 120, 250);
      c.strokeStyle = 'rgba(19,36,79,.4)'; c.lineWidth = 3; c.strokeRect(74, 204, W - 148, 222);
      c.textAlign = 'center';
      fit(c, 'CONSENSUS STATEMENT', 600, SERIF, 30, W - 180, 5); c.fillStyle = MUTED; c.fillText('CONSENSUS STATEMENT', W / 2, 272);
      fit(c, 'For the expert panel', 500, SERIF, 34, W - 180); c.fillStyle = INK; c.fillText('For the expert panel', W / 2, 330);
      fit(c, 'Draft 4 · for agreement', 'italic 400', SERIF, 26, W - 180); c.fillStyle = BODY; c.fillText('Draft 4 · for agreement', W / 2, 378);
      c.textAlign = 'left';
    }).tex;
    const f = new THREE.Group();
    f.add(at(rbox(SF.w + .1, .04, SF.h + .1, .01, cloth), -SF.w / 2, 0, 0));
    const pg = upN(SF.w - .12, SF.h - .12, planeMat(page)); pg.position.set(-SF.w / 2, .028, 0); f.add(pg);
    folderCover = new THREE.Group();
    folderCover.add(at(rbox(SF.w + .1, .04, SF.h + .1, .01, cloth), -SF.w / 2, 0, 0));
    const cv = upN(SF.w - .12, SF.h - .12, planeMat(coverTex)); cv.position.set(-SF.w / 2, .022, 0); folderCover.add(cv);
    const ci = new THREE.Mesh(new THREE.PlaneGeometry(SF.w - .12, SF.h - .12).rotateX(Math.PI / 2), mat('#E8E2D4', { r: .9 })); ci.position.set(-SF.w / 2, -.022, 0); folderCover.add(ci);
    folderCover.position.set(0, .06, 0); f.add(folderCover);
    // (x 0 of the folder is its spine, on the reader's left, west)
    f.position.set(SF.x + SF.w / 2, PT.top + .02, SF.z);
    g.add(shadowed(f), contact(2.8, 3.8, SF.x, SF.z, { y: PT.top, k: .2 }));
  }

  // ---------- the lectern on the stage's west side, a laptop on it ----------
  // (1.1 m high, its desk sloping toward the speaker, who stands on its north side facing the room)
  const LT = { x: xm + 12, z: 35 };
  let laptopGlass = null;
  {
    const lt = new THREE.Group();
    lt.add(at(rbox(5.0, 10.2, 3.8, .12, darkOak), 0, 5.1, 0));
    lt.add(at(rbox(5.0, 1.0, 4.4, .1, darkOak), 0, .5, 0));
    lt.add(at(rbox(4.2, 7.6, .2, .06, oak), 0, 5.4, -1.95));
    // (the desk: rising toward the room, south, its lip on the speaker's side)
    lt.add(at(rbox(5.6, .3, 4.4, .08, darkOak), 0, 10.6, .1, { x: .2 }));
    lt.add(at(rbox(5.6, .5, .25, .06, darkOak), 0, 10.4, 2.25));
    // the laptop on the desk, open toward the speaker: its screen's back to the room
    const lp = new THREE.Group(), alu = mat('#B9BDC4', { r: .3, m: .8 });
    lp.add(at(rbox(3.0, .1, 2.1, .04, alu), 0, 0, 0));
    const lid = new THREE.Group(); lid.position.set(0, .05, -1.05); lid.rotation.x = -1.85 + Math.PI;
    lid.add(at(rbox(3.0, .08, 2.1, .04, alu), 0, 0, -1.05));
    laptopGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), new THREE.MeshBasicMaterial({ color: '#0E1220', map: blankTex, toneMapped: false }));
    laptopGlass.rotation.x = -Math.PI / 2; laptopGlass.position.set(0, .05, -1.05); lid.add(laptopGlass);   // (on the lid's inner face, toward the speaker, north)
    lp.add(lid); lp.position.set(0, 10.9, .3); lp.rotation.x = .2; lt.add(lp);
    lt.position.set(LT.x, ST, LT.z); g.add(shadowed(lt));
    laptopGlass.castShadow = false;
  }

  // ---------- the projection screen: its case high on the north wall; the screen rolls down from it; the
  // projector on the ceiling lights it with the slide (the slide's picture is the film's: setSlide) ----------
  const SC = { w: 26, h: 14.625, top: 32.6, z: Z0 - 1.2 };   // (2.6 m across, 16 by 9)
  const screen = new THREE.Group(), drop = new THREE.Group();
  let slideMat = null, bar = null, clothMesh = null, led = null;
  {
    screen.add(at(rbox(SC.w + 1.6, 1.2, 1.2, .3, mat('#E9E4DA', { r: .5 })), 0, .6, 0));
    for (const s of [-1, 1]) screen.add(at(rbox(.4, 1.1, 1.0, .06, mat(PAL.graphite, { r: .4, m: .5 })), s * (SC.w / 2 + .7), .6, .1));
    const cg = new THREE.PlaneGeometry(SC.w, SC.h); cg.translate(0, -SC.h / 2, 0);
    clothMesh = new THREE.Mesh(cg, mat('#FAF8F4', { r: .9 }));
    drop.add(clothMesh);
    slideMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', map: blankTex, transparent: true, opacity: 0, toneMapped: false });
    const sl = new THREE.Mesh(cg, slideMat); sl.position.z = .01; sl.renderOrder = 1; drop.add(sl);
    bar = at(rbox(SC.w + .3, .35, .35, .12, mat(PAL.graphite, { r: .4, m: .6 })), 0, -SC.h, .02); screen.add(bar);
    screen.add(drop);
    screen.rotation.y = Math.PI; screen.position.set(xm, SC.top, SC.z);
    g.add(screen);
    // the projector: hung from the ceiling over the middle of the room, its lens toward the screen
    const pj = new THREE.Group(), body = mat('#E9E6E0', { r: .45 });
    pj.add(at(rbox(4.0, 1.3, 3.2, .3, body), 0, 0, 0));
    pj.add(at(cyl(.5, .58, .5, mat(PAL.graphite, { r: .3, m: .4 }), 24), -.9, 0, 1.75, { x: Math.PI / 2 }));
    led = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), new THREE.MeshBasicMaterial({ color: '#4A4A4A', toneMapped: false })); led.position.set(1.4, .25, 1.62); pj.add(led);
    pj.add(at(cyl(.12, .12, 2.4, mat(PAL.graphite, { r: .4, m: .6 }), 10), 0, 1.85, 0), at(rbox(1.2, .15, 1.2, .04, mat(PAL.graphite, { r: .4, m: .6 })), 0, 3.0, 0));
    pj.position.set(xm + .9, TOP - 3.1, 4);
    g.add(shadowed(pj));
  }

  // ---------- the physicians' booklets on the front row's tablets; the one by the middle aisle opens ----------
  const BK = { w: 1.5, h: 2.1 };   // (A5)
  let bkCover = null, bkAt = null;
  {
    const coverTex = sheet(380, 520, (c, W, H) => {
      paper(c, W, H, '#F6F1E6');
      c.fillStyle = '#1F5D63'; c.fillRect(0, 0, W, H * .42);
      fit(c, 'FOR PHYSICIANS', 600, SANS, 22, W - 40, 4); c.fillStyle = 'rgba(244,238,226,.85)'; c.fillText('FOR PHYSICIANS', 24, 46);
      font(c, `600 40px ${SERIF}`); c.fillStyle = '#F4EEE2'; para(c, 'Once-daily treatment', 24, 110, W - 48, 44);
      font(c, `italic 400 28px ${SERIF}`); c.fillStyle = BODY; para(c, 'Who should receive it, how to start, what to watch for', 24, H * .42 + 54, W - 48, 34);
      font(c, `500 18px ${SANS}`, 2); c.fillStyle = MUTED; c.fillText('CONSENSUS 2026 · ILLUSTRATIVE', 24, H - 26);
    }, { scale: 1.4 }).tex;
    const innerL = sheet(380, 520, (c, W, H) => {
      paper(c, W, H, '#FFFDF8');
      font(c, `600 20px ${SANS}`, 3); c.fillStyle = ORANGE; c.fillText('IN BRIEF', 24, 46);
      font(c, `500 26px ${SERIF}`); c.fillStyle = INK; let y = para(c, 'The panel recommends once-daily treatment for adults at high risk.', 24, 92, W - 48, 32);
      prose(c, 24, y + 20, W - 48, 9, 25, 16, 'rgba(43,53,80,.75)', 5);
    }, { scale: 1.4 }).tex;
    const innerR = sheet(380, 520, (c, W, H) => {
      paper(c, W, H, '#FFFDF8');
      font(c, `600 20px ${SANS}`, 3); c.fillStyle = ORANGE; c.fillText('THE EVIDENCE', 24, 46);
      font(c, `600 64px ${SERIF}`); c.fillStyle = OK; c.fillText('28%', 24, 124);
      font(c, `500 24px ${SERIF}`); c.fillStyle = INK; para(c, 'lower risk of a major event', 24, 160, W - 48, 30);
      font(c, `600 20px ${SANS}`); c.fillStyle = BODY; c.fillText('480 randomised · HR 0.72', 24, 232); c.fillText('95% CI 0.58 to 0.89', 24, 260);
      c.fillStyle = RULE; c.fillRect(24, 284, W - 48, 2);
      prose(c, 24, 320, W - 48, 7, 25, 16, 'rgba(43,53,80,.75)', 8);
    }, { scale: 1.4 }).tex;
    const front = LECTURE.SEATS.filter(s => s.row === 0);
    const opening = front.reduce((a, s) => (s.x > xm && (!a || s.x < a.x) ? s : a), null);
    for (const s of front) {
      // (on the tablet, square to its reader looking north: x 0 its spine, on the reader's left, west; the
      // pages toward the east; the print's top to the north)
      const bx = s.x + 1.1, by = FLOOR + 7.03, bz = s.z + 2.9;
      const b = new THREE.Group();
      b.add(at(rbox(BK.w, .1, BK.h, .02, edge), -BK.w / 2, .05, 0));
      if (s === opening) {
        const pgR = upN(BK.w - .04, BK.h - .04, planeMat(innerR)); pgR.position.set(-BK.w / 2, .102, 0); b.add(pgR);
        bkCover = new THREE.Group();
        const cf = upN(BK.w, BK.h, planeMat(coverTex)); cf.position.set(-BK.w / 2, .006, 0); bkCover.add(cf);
        const ci = new THREE.Mesh(new THREE.PlaneGeometry(BK.w, BK.h).rotateX(Math.PI / 2), planeMat(innerL)); ci.position.set(-BK.w / 2, -.002, 0); bkCover.add(ci);
        bkCover.position.set(0, .104, 0); b.add(bkCover);
        bkAt = [bx, by, bz];
      } else {
        const cf = upN(BK.w, BK.h, planeMat(coverTex)); cf.position.set(-BK.w / 2, .106, 0); b.add(cf);
      }
      b.position.set(bx + BK.w / 2, by, bz);
      g.add(shadowed(b));
    }
  }

  // ---------- by the door: the rack of leaflets on the wall; on the table a leaflet and the morning paper ----------
  const S = LECTURE.SIDE, TT = S.top;
  const leafletOuter = (W, H) => (c) => {
    paper(c, W, H, '#FFFFFF');
    c.fillStyle = '#E07A1F'; c.fillRect(0, 0, W, H * .3);
    fit(c, 'FOR PATIENTS', 600, SANS, 22, W - 40, 4); c.fillStyle = '#FFFFFF'; c.fillText('FOR PATIENTS', 24, 46);
    font(c, `600 42px ${SERIF}`); c.fillStyle = '#FFFFFF'; para(c, 'Your treatment, explained', 24, 104, W - 48, 46);
    font(c, `italic 400 26px ${SERIF}`); c.fillStyle = BODY; para(c, 'What it is for, what the study found, and what to ask your doctor', 24, H * .3 + 56, W - 48, 34);
    font(c, `500 16px ${SANS}`, 2); c.fillStyle = MUTED; c.fillText('ILLUSTRATIVE', 24, H - 24);
  };
  {
    // the rack: a walnut back board on the wall, two tiers of clear pockets, leaflets in them
    const rack = new THREE.Group(), RW = 5.2, glassy = new THREE.MeshPhysicalMaterial({ color: '#DDE6EE', roughness: .08, transparent: true, opacity: .25, depthWrite: false });
    rack.add(at(rbox(RW, 7.4, .15, .04, darkOak), 0, 3.7, 0));
    const lt = sheet(300, 620, (c, W, H) => leafletOuter(W, H)(c), { scale: 1.2 }).tex;
    for (const ty of [.4, 3.9]) {
      rack.add(at(rbox(RW - .2, .12, .7, .03, darkOak), 0, ty, .38));
      for (let i = 0; i < 3; i++) {
        const lx = -RW / 2 + .95 + i * 1.65;
        const lf = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.06), planeMat(lt)); lf.position.set(lx, ty + 1.08, .17); lf.rotation.x = -.06; rack.add(lf);
        const front = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.1), glassy); front.position.set(lx, ty + .6, .66); front.userData.noG = true; rack.add(front);
      }
    }
    // (on the west wall beside the table, to its south, facing into the room)
    rack.rotation.y = -Math.PI / 2; rack.position.set(LECTURE.X1 - .1, TT + 1.2, S.z - 13); g.add(shadowed(rack));
  }
  // the leaflet on the table: folded in three (a letter fold): its middle panel down on the table, the right
  // panel folded over it, the left panel over that, its outside the cover; it unfolds, left then right
  // (the table's papers in its own frame, turned to face a reader looking west: lx along the wall, lz toward the
  // reader; the frame's -z is the wall)
  const sideG = new THREE.Group(); sideG.rotation.y = -Math.PI / 2; sideG.position.set(S.x, TT, S.z); g.add(sideG);
  const LF = { w: 1.0, h: 2.1, x: -2.5, z: .1 };
  let flapL = null, flapR = null;
  {
    const inside = sheet(900, 620, (c, W, H) => {
      paper(c, W, H, '#FFFFFF');
      const pw = W / 3;
      const panel = (i, kick, head, body) => {
        const x = i * pw + 22, w = pw - 44;
        font(c, `600 16px ${SANS}`, 3); c.fillStyle = '#E07A1F'; c.fillText(kick, x, 48);
        font(c, `600 28px ${SERIF}`); c.fillStyle = INK; let y = para(c, head, x, 96, w, 32);
        font(c, `400 19px ${SERIF}`); c.fillStyle = BODY; para(c, body, x, y + 16, w, 26);
      };
      panel(0, 'WHAT IS IT FOR?', 'Protecting people at high risk', 'A tablet once a day, for adults whose doctors judge them at high risk of a serious health event.');
      panel(1, 'WHAT DID THE STUDY FIND?', '480 people took part', 'Those taking the medicine had about a quarter fewer serious health events than those taking a dummy pill.');
      panel(2, 'TALK TO YOUR DOCTOR', 'Is it right for you?', 'Ask about your own risk, other medicines you take, and what to look out for.');
      c.fillStyle = 'rgba(40,44,56,.08)'; c.fillRect(pw - 1, 0, 2, H); c.fillRect(2 * pw - 1, 0, 2, H);
    }, { scale: 1.3 }).tex;
    const coverT = sheet(300, 620, (c, W, H) => leafletOuter(W, H)(c), { scale: 1.3 }).tex;
    const plain = mat('#FFFFFF', { r: .9 });
    // a panel's face showing a third of the inside sheet (i 0, 1, 2), facing up, print's top to the south
    const insidePanel = i => { const ge = new THREE.PlaneGeometry(LF.w, LF.h); ge.rotateX(-Math.PI / 2); const uv = ge.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, (i + uv.getX(q)) / 3); return new THREE.Mesh(ge, planeMat(inside)); };
    // (the table is read from its north side, looking south: the print's top to the south, its left to the
    // east, -x)
    const base = new THREE.Group();
    const mid = insidePanel(1); mid.position.set(0, .004, 0); base.add(mid);
    const under = new THREE.Mesh(new THREE.PlaneGeometry(LF.w, LF.h).rotateX(Math.PI / 2), plain); under.position.y = .001; base.add(under);
    // the left flap (-x), hinged at the middle panel's -x edge, folded on top: its outside is the cover
    flapL = new THREE.Group(); flapL.position.set(-LF.w / 2, .022, 0);
    { const f = insidePanel(0); f.position.set(-LF.w / 2, 0, 0); flapL.add(f); const o = new THREE.Mesh(new THREE.PlaneGeometry(LF.w, LF.h).rotateX(Math.PI / 2), planeMat(coverT)); o.position.set(-LF.w / 2, -.002, 0); o.rotation.y = Math.PI; flapL.add(o); }
    // the right flap (+x), hinged at the middle panel's +x edge, folded first, under the left
    flapR = new THREE.Group(); flapR.position.set(LF.w / 2, .008, 0);
    { const f = insidePanel(2); f.position.set(LF.w / 2, 0, 0); flapR.add(f); const o = new THREE.Mesh(new THREE.PlaneGeometry(LF.w, LF.h).rotateX(Math.PI / 2), plain); o.position.set(LF.w / 2, -.002, 0); flapR.add(o); }
    base.add(flapL, flapR);
    base.position.set(LF.x, .002, LF.z);
    sideG.add(shadowed(base));
  }
  // the morning paper, folded in half on the table, its health page outward; it opens toward the reader
  const NP = { w: 2.8, h: 3.8, x: 1.9, z: 0 };
  let npHalf = null;
  {
    const pageT = sheet(690, 870, (c, W, H) => {
      paper(c, W, H, '#F3EFE6');
      fit(c, 'MORNING EDITION', 700, SERIF, 52, W - 60, 6); c.fillStyle = '#1A1A1A'; c.textAlign = 'center'; c.fillText('MORNING EDITION', W / 2, 70); c.textAlign = 'left';
      c.fillStyle = '#1A1A1A'; c.fillRect(30, 90, W - 60, 3); c.fillRect(30, 97, W - 60, 1);
      c.fillStyle = '#B4361E'; c.fillRect(30, 116, 120, 34); font(c, `700 20px ${SANS}`, 3); c.fillStyle = '#FFFFFF'; c.fillText('HEALTH', 44, 140);
      font(c, `700 46px ${SERIF}`); c.fillStyle = '#141414'; let y = para(c, 'A daily pill cut serious health events by a quarter, trial finds', 30, 204, W - 60, 50);
      font(c, `italic 400 26px ${SERIF}`); c.fillStyle = '#3A3A3A'; y = para(c, 'Doctors’ panel issues new advice for patients at high risk', 30, y + 10, W - 60, 32);
      c.fillStyle = 'rgba(20,20,20,.25)'; c.fillRect(30, H / 2 - 2, W - 60, 1);
      // (the lower half: two columns of the story, a chart)
      const colW = (W - 90) / 2;
      prose(c, 30, H / 2 + 36, colW, 14, 25, 16, 'rgba(30,30,30,.82)', 2);
      const fx = 60 + colW, fy = H / 2 + 20, fw = colW, fh = 230;
      font(c, `600 18px ${SANS}`); c.fillStyle = '#141414'; c.fillText('Serious events, compared', fx, fy + 18);
      const bar2 = (yy, v, col, label) => { c.fillStyle = col; c.fillRect(fx, yy, fw * .8 * v, 34); font(c, `600 18px ${SANS}`); c.fillStyle = '#141414'; c.fillText(label, fx, yy + 58); };
      bar2(fy + 40, 1, '#8A8A8A', 'Dummy pill'); bar2(fy + 120, .72, '#B4361E', 'Daily pill: 28% fewer');
      prose(c, fx, fy + fh, colW, 6, 25, 16, 'rgba(30,30,30,.82)', 9);
      font(c, `500 15px ${SANS}`, 2); c.fillStyle = 'rgba(30,30,30,.5)'; c.fillText('ILLUSTRATIVE', 30, H - 22);
    }, { scale: 1.3 }).tex;
    const back = sheet(690, 435, (c, W, H) => { paper(c, W, H, '#F3EFE6'); prose(c, 30, 50, (W - 90) / 2, 15, 25, 16, 'rgba(30,30,30,.6)', 4); prose(c, 60 + (W - 90) / 2, 50, (W - 90) / 2, 15, 25, 16, 'rgba(30,30,30,.6)', 6); }).tex;
    // the page as two halves: the top half (its masthead and headline) lies to the south, flat; the lower
    // half is folded under... folded over it, back up, and swings open toward the reader (north)
    const half = (v0, m) => { const ge = new THREE.PlaneGeometry(NP.w, NP.h / 2); ge.rotateX(-Math.PI / 2); const uv = ge.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setY(q, v0 + uv.getY(q) * .5); return new THREE.Mesh(ge, m); };
    const np = new THREE.Group();
    const top = half(.5, planeMat(pageT)); top.position.set(0, .018, -NP.h / 4); np.add(top);
    np.add(at(rbox(NP.w, .02, NP.h / 2, .005, mat('#ECE6DA', { r: .9 })), 0, -.006, -NP.h / 4));
    npHalf = new THREE.Group(); npHalf.position.set(0, .03, 0);
    const lower = half(0, planeMat(pageT)); lower.position.set(0, 0, NP.h / 4); npHalf.add(lower);
    const lowBack = new THREE.Mesh(new THREE.PlaneGeometry(NP.w, NP.h / 2).rotateX(Math.PI / 2), planeMat(back)); lowBack.position.set(0, -.003, NP.h / 4); npHalf.add(lowBack);
    np.add(npHalf);
    // (built reading from the north: rotated so the masthead is to the south, the lower half toward the reader)
    np.position.set(NP.x, .002, NP.z);
    sideG.add(shadowed(np));
  }

  // ---------- set(k): 05's work as far as k ----------
  let shown = -1, slideOn = -1;
  function set(k) {
    const key = Math.round(k * 4000);
    if (key === shown) return false;
    shown = key;
    folderCover.rotation.z = -Math.PI * .985 * seg(k, MARKS.statement);
    folderCover.position.y = .06 + Math.abs(Math.sin(folderCover.rotation.z)) * .03;
    const d = seg(k, MARKS.screen), p = seg(k, MARKS.projector);
    drop.scale.y = Math.max(.002, d); bar.position.y = -SC.h * d - .18; drop.visible = d > .002;
    slideMat.opacity = p; slideMat.visible = p > 0;
    if (slideOn !== (p > .5)) { slideOn = p > .5; led.material.color.set(slideOn ? '#3DDC84' : '#4A4A4A'); }
    laptopGlass.material.color.set(p > 0 ? '#FFFFFF' : '#0E1220');
    bkCover.rotation.z = -Math.PI * .985 * seg(k, MARKS.booklet);
    bkCover.position.y = .104 + Math.abs(Math.sin(bkCover.rotation.z)) * .03;
    // the leaflet's flaps: folded flat over the middle (pi) to open (0)
    flapL.rotation.z = -Math.PI * (1 - seg(k, MARKS.leafletL));
    flapR.rotation.z = Math.PI * (1 - seg(k, MARKS.leafletR));
    // the paper's lower half: folded over (pi, face down on the top half) to open (0)
    npHalf.rotation.x = -Math.PI * (1 - seg(k, MARKS.paper)) * .99;
    g.updateMatrixWorld(true);
    return true;
  }
  set(0);
  // the slide's picture, once the film has traced it from the page's own slide (the loader's card)
  function setSlide(tex) {
    slideMat.map = tex; slideMat.needsUpdate = true;
    laptopGlass.material.map = tex; laptopGlass.material.needsUpdate = true;
    shown = -1;
  }
  const v3 = new THREE.Vector3();
  const focus = () => ({
    panel: [(PILE.x + SF.x) / 2, PT.top + 1.2, PT.z - .6],
    screen: [xm, SC.top - SC.h / 2, SC.z],
    booklet: bkAt ? [bkAt[0] - .1, bkAt[1], bkAt[2]] : [xm, FLOOR, -9],
    side: [S.x - .3, TT + .5, S.z],
    // (for a phone's close views: the statement's folder open, its spine its middle; the leaflet and the paper on
    // the side table, whose frame faces west: its x along the wall is the house's z)
    folder: [SF.x + SF.w / 2, PT.top + .3, SF.z],
    leaflet: [S.x - LF.z, TT + .1, S.z + LF.x],
    paper: [S.x - NP.z, TT + .1, S.z + NP.x],
  });
  // the slide's face in the house (down and lit): its middle, the way it faces, its width
  const slideFace = { width: SC.w, centre: () => [xm, SC.top - SC.h / 2, SC.z - .03], normal: () => [0, 0, -1] };
  void v3;
  return { group: g, set, steps: STEPS, marks: MARKS, focus, setSlide, slide: slideFace };
}
