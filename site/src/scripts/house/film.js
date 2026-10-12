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
import { buildReading, READING } from './reading.js';
import { buildPublication } from './publication.js';
import { buildLecture, LECTURE } from './lecture.js';
import { buildComms } from './comms.js';
import { OUTSIDE_K } from './outside.js';

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
  // (the stage never scrolls inside itself: a link to a chapter, #regulatory-writing, would otherwise
  // scroll it to bring that chapter's words to its top, and everything laid in it would sit too high;
  // house.css clips it without making it scrollable, and where a browser cannot, it is put back)
  const unscroll = () => { if (stage.scrollTop || stage.scrollLeft) { stage.scrollTop = 0; stage.scrollLeft = 0; } };
  unscroll(); stage.addEventListener('scroll', unscroll, { passive: true });
  const capEls = [...sec.querySelectorAll('.hs-cap')], heads = capEls.map(c => c.querySelector('.hs-hl'));
  // the navigation (plan 11.21): the chapter bar along the letterhead's foot and the full list, their links
  // to the chapters built (data-go); the running head beside the logo
  const list = [...sec.querySelectorAll('.hs-bar a, .hx-list a')], lhRun = sec.querySelector('.lh-run');
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
    // (04 performs from where the glide in ends to the reading stand, and rests there: end)
    { id: 'scientific-publications', view: 'reading', end: 'readingStand', walk: 'reading', hour: 'night', spot: 0, doc: 'contents', pub: true, pair: 'archiveReading' },
    // (05: from the reading stand, left to the north door, through it into the lecture room as dawn comes)
    { id: 'medical-communications', view: 'lecture', walk: 'lecture', hour: 'dawn', spot: 0, doc: 'contents', comms: true, pair: 'readingLecture', darkWords: true },
  ].slice(0, scroll.length).map((c, i) => {
    const [move, dwell, perform = 0] = scroll[i] || [1, .3], span = move + perform + dwell;
    // (02's words are on the record itself; its caption is the source line beneath)
    return { ...c, span, A: move / span, B: (move + perform) / span, cap: capEls.find(el => el.dataset.ch === c.id) || (c.record && recParts ? recParts.note : null) };
  });
  const S = CH.length, RI = CH.findIndex(c => c.record), AI = CH.findIndex(c => c.dossier), PI = CH.findIndex(c => c.pub), CI = CH.findIndex(c => c.comms);
  // (where a chapter rests: its own view, or where its performance ends)
  const restView = c => c.end || c.view;
  // the walks: from the display, left to the doorway, through it, and on and left into the hall, to the
  // record (the eyes between the two views'). From the record, turning left (east) toward the door in
  // the hall's east wall, through it into the archive, to stand looking down the archive's table (each
  // point's fourth number: the way the camera faces there; every walk round the house turns left once)
  const WALKS = {
    door: route([[-7.55, 8.8, 3.4], [-7.55, 9, -7.25], [-13.8, 9.1, -16.5]]),
    // (it keeps its head up through the hall, and looks down at the table as it comes to the door)
    archive: route([[-41, 9.05, -38.5, -22], [-55, 8.7, -48.5, -62], [-63.6, 8.2, -52, -88]], undefined, e => sstep(.45, 1, e)),
    // from the strong room on to the reading room: no walk round the table, one straight glide down it on the
    // room's axis, under its lamps and over the writer's desk, as the far door opens, and through it
    reading: route([[-86, 7.7, -52, -90], [-104, 8.1, -52, -90], [-112, 8.3, -52, -90]]),
    // from the reading stand: a turn to the left (north), across to the north door, through it into the lecture
    // room, and on to the back of its seats, looking up the room to the stage
    lecture: route([[-147.5, 8.6, -45, -150], [-151.4, 8.8, -34, -180], [-151.4, 9.6, -25, -182], [-138, 12, -24.2, -180]]),
    // (on a phone, its narrow screen: turned to the door sooner, so the doorway leads the way and the bookcases
    // beside it pass at the screen's edges, never across it)
    lecturePhone: route([[-147.2, 8.7, -45.5, -170], [-151.4, 8.8, -35, -180], [-151.4, 9.6, -25, -182], [-138, 12, -24.2, -180]]),
    // (and from 03's desk, where a phone's view stands close and low: rising over the desk first)
    readingPhone: route([[-85, 9.6, -52, -90], [-104, 8.4, -52, -90], [-112, 8.3, -52, -90]]),
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
    reading: { c: [-133, 6, -52], hw: 36, top: 32, bottom: -32 },
    archiveReading: { c: [-110, 6, -52], hw: 60, top: 46, bottom: -46 },
    lecture: { c: [-128, 10, 8], hw: 56, top: 56, bottom: -56 },
    readingLecture: { c: [-134, 6, -14], hw: 64, top: 50, bottom: -50 },
  };
  const boxMix = (a, b, k) => ({ c: a.c.map((v, j) => mix(v, b.c[j], k)), hw: mix(a.hw, b.hw, k), top: mix(a.top, b.top, k), bottom: mix(a.bottom, b.bottom, k) });
  const setBox = B => world.setShadowBox(B.c, B.hw, B.top, B.bottom);
  // the box for where the film is: a chapter's room, or on the walk to it
  const ROOM = { 'title-page': 'study', contents: 'study', 'on-the-record': 'hall', 'regulatory-writing': 'archive', 'scientific-publications': 'reading', 'medical-communications': 'lecture' };
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
  let W = 0, H = 0, aspect = 1.6, capTops = [], edCompact = false, listRight = 0, footTop = 1, headH = 76;
  // (a phone held upright: the study's display stands in portrait, as a pivoting monitor does, 3.4 by 5.9 on the
  // same neck, and its editor is laid out 440 px wide; decided once, by the page's first script: plan 11.21)
  const PORTRAIT = root.classList.contains('hs-tall');
  if (PORTRAIT) STUDY.SCREEN = [[4.8, 7.45, -5.285], [8.2, 7.45, -5.285], [8.2, 1.55, -5.285], [4.8, 1.55, -5.285]];
  const SCR = STUDY.SCREEN, SCR_TOP = SCR[0][1] + .13, SCR_FOOT = SCR[2][1] - .13;
  // the editor's own size: 1000 px wide, in the glass's proportions
  const ED_W = PORTRAIT ? 440 : 1000, ED_H = ED_W * (SCR[0][1] - SCR[2][1]) / (SCR[1][0] - SCR[0][0]);
  const VIEWS = {
    wide: { p: [6.5, 10.4, 19.5], fov: 40, gap: 0, cap: .985, top: [[6.5, SCR_TOP, -5.3], [12.9, STUDY.WIN.y1 + .35, -7], [-1.05, 5.95, -6.9]], foot: [6.5, 0, STUDY.DESK.z0], safe: [[-4.2, 4, -7], [16.4, 4, -7]] },
    // (the contents' words are on the screen: the whole display shows, down to its stand's foot)
    // (the eye a little high, so the slope before the display stays below the frame, never cut by it)
    display: { p: [6.5, 8.6, 6.0], fov: 40, gap: .04, top: [[6.5, SCR_TOP, -5.3]], foot: [6.5, 0, STUDY.CUP[2] + 1.05], safe: [[2.9, 4, -5.3], [10.1, 4, -5.3], [STUDY.CUP[0] + 1.1, 1, STUDY.CUP[2]]] },
    // 02: level with the record and facing it down the hall, the whole of it from its cartouche to its
    // plinth, its ends inside the frame
    // (its lettering kept clear of the chapter list down the left, where the list shows: clearList)
    record: { p: [-32.5, 9.2, -32], fov: 40, gap: .035, top: [[-32.5, RECORD_TOP + .5, FACE]], foot: [-32.5, HALL.FLOOR, FACE + .6], safe: [[BAND.x0 - 1.4, 4, FACE], [BAND.x1 + 1.4, 4, FACE]], clearList: true },
    // 03: in the strong room, on its axis just clear of the door's swing (it shuts behind the camera),
    // the eye a little lower than a standing reader's, looking slightly down the room: the table running
    // away to the far door, the screen raised on it and square to the reader, the two storeys either side
    // (held, not composed: fixed; the lens widened only so the room's width shows on a narrow window)
    archive: { p: [-73.6, 7.4, ARCHIVE.TABLE.z], yaw: -90, pitch: -10, fov: 50, wide: 74, fixed: true },
    // (and while its work is done: over the writer's chair at the desk; standing before the bay of
    // clinical study reports as it opens; bent over its shelf to read the report, square to its pages: the
    // reading view is set from the report itself once the room is built, archiveRead)
    archiveDesk: { p: [-79.6, 6.6, ARCHIVE.TABLE.z], yaw: -90, pitch: -30, fov: 46, wide: 70, fixed: true },
    archiveCab: { p: [-92.8, 7.8, -66.4], yaw: 0, pitch: -30, fov: 46, wide: 66, fixed: true },
    archiveRead: { p: [-92.4, 7.2, -70.2], yaw: 0, pitch: -50, fov: 42, wide: 60, fixed: true, aim: 4.4 },
    // 04: just inside the reading room from the strong room's door, looking east down the aisle between the
    // green lamps to the reading stand before the east window, the vault over it (held)
    reading: { p: [-115.5, 8.4, -52], yaw: -90, pitch: 2, fov: 56, wide: 76, fixed: true },
    // (and while its work is done: over the writer's shoulder at the south table, turned a little to the
    // writer's left as the journal comes from the cart, then sweeping slowly right across the rising work;
    // over the folio; down the aisle; at the reading stand, where 04 rests. Their eyes are set from the
    // things themselves once the room is built; they keep clear of the chapter list down the left)
    // (sy: the picture lifted a little, so the work sits above the chapter's words)
    readingDesk: { p: [0, 0, 0], yaw: -4, pitch: -36, fov: 46, wide: 66, fixed: true, aim: 7.2, clearList: true, sy: .1 },
    readingDeskL: { p: [0, 0, 0], yaw: -38, pitch: -34, fov: 46, wide: 66, fixed: true, aim: 7.6, clearList: true, sy: .1 },
    readingDeskR: { p: [0, 0, 0], yaw: 10, pitch: -36, fov: 46, wide: 66, fixed: true, aim: 7.2, clearList: true, sy: .1 },
    readingProof: { p: [0, 0, 0], yaw: 6, pitch: -56, fov: 42, wide: 60, fixed: true, aim: 4.2, clearList: true, sy: .08 },
    readingAisle: { p: [-132, 7.8, -52], yaw: -90, pitch: -8, fov: 48, wide: 70, fixed: true },
    readingStand: { p: [0, 0, 0], yaw: -90, pitch: -34, fov: 44, wide: 64, fixed: true, aim: 5.6, sy: .12 },
    // 05: at the back of the lecture room by the door, looking up the room to the stage, the screen and the
    // dawn in the east windows (held). On the middle aisle at the back
    lecture: { p: [-128, 12.6, -24.2], yaw: -180, pitch: -4, fov: 60, wide: 80, fixed: true },
    // (and while its work is done, the camera goes round the room: to the panel's table; back to see the
    // screen come down; over the front row's booklet; down the east aisle under the windows; over the side
    // table by the door; and back to the room's view, turned on round (yaw 180). Eyes set from the things)
    lecture2: { p: [-128, 12.6, -24.2], yaw: 180, pitch: -4, fov: 60, wide: 80, fixed: true },
    lecPanel: { p: [0, 0, 0], yaw: -180, pitch: -24, fov: 46, wide: 66, fixed: true, aim: 19, clearList: true, sy: .08 },
    lecStage: { p: [0, 0, 0], yaw: -180, pitch: 9, fov: 50, wide: 70, fixed: true, aim: 40, sy: .06 },
    lecSeats: { p: [0, 0, 0], yaw: -180, pitch: -52, fov: 44, wide: 64, fixed: true, aim: 7.5, sy: .1 },
    lecAisle: { p: [-152.3, 13, 2], yaw: -90, pitch: -10, fov: 50, wide: 70, fixed: true },
    lecDoor: { p: [0, 0, 0], yaw: -270, pitch: -50, fov: 46, wide: 66, fixed: true, aim: 9, clearList: true, sy: .1 },
    // (turning back from the side table to the room's view, past the congress posters on the west wall)
    // (from the booklet to the side table: up over the seats, turning toward the west wall)
    lecOver: { p: [-112, 14.5, 4], yaw: -228, pitch: -22, fov: 50, wide: 70, fixed: true },
    lecPosters: { p: [-120, 13, -10], yaw: 90, pitch: -2, fov: 52, wide: 72, fixed: true },
  };
  // the phone framings (plan 11.21, phonePose): each aimed at what its view is for, that much of it across the
  // frame (w), at that row; a room's view level at an eye's height (eye). The focus of a view aimed at a thing
  // is the thing (set when the room is built)
  // (02 on a phone: the record is too wide to read whole on a narrow screen, so as it fills the camera goes along
  // it bay by bay, each board and its figure across the screen, and then stands back for the whole record; the
  // bays' views are a phone's only)
  for (let b = 0; b < 4; b++) VIEWS[`recB${b}`] = { p: VIEWS.record.p, yaw: 0, pitch: 0, fov: 40, wide: 60 };
  // (03 on a phone: the expert's pad on its slope to the screen's right, too far from the screen to read both;
  // the camera goes to it as the pen writes and the agency's letter comes: a phone's only view)
  VIEWS.archivePad = { p: VIEWS.archiveDesk.p, yaw: -90, pitch: -58, fov: 46, wide: 66, fixed: true };
  // (04 on a phone: the journal close as it lies open at its limits; the manuscript faced low and close, so its
  // pop-ups, standing cards, are read from the front, never from above: a phone's only views)
  VIEWS.readingJournal = { p: VIEWS.reading.p, yaw: -10, pitch: -50, fov: 46, wide: 66, fixed: true };
  VIEWS.readingBook = { p: VIEWS.reading.p, yaw: -4, pitch: -24, fov: 46, wide: 66, fixed: true };
  // (05 on a phone: the statement's folder close as it opens; on the side table the leaflet as it unfolds, then
  // the paper as it opens: a phone's only views)
  VIEWS.lecFolder = { p: VIEWS.lecture.p, yaw: -180, pitch: -46, fov: 46, wide: 66, fixed: true };
  VIEWS.lecLeaflet = { p: VIEWS.lecture.p, yaw: -270, pitch: -52, fov: 46, wide: 66, fixed: true };
  VIEWS.lecPaper = { p: VIEWS.lecture.p, yaw: -270, pitch: -52, fov: 46, wide: 66, fixed: true };
  const PHONE = {
    wide: { at: [6.5, 4.6, -5.3], eye: 10.4, fov: 60, w: 18, row: .46, maxD: 36 },
    display: { at: [6.5, 4.5, -5.285], eye: 4.9, fov: 50, w: 4.1, row: .5 },
    record: { at: [-32.5, 21.5, FACE], eye: 9.2, fov: 62, w: 46.5, row: .36, maxD: -18 - FACE },
    recB0: { at: [-49, 16.8, FACE], eye: 9.2, fov: 56, w: 14, row: .3 }, recB1: { at: [-38, 16.8, FACE], eye: 9.2, fov: 56, w: 14, row: .3 },
    recB2: { at: [-27, 16.8, FACE], eye: 9.2, fov: 56, w: 14, row: .3 }, recB3: { at: [-16, 16.8, FACE], eye: 9.2, fov: 56, w: 14, row: .3 },
    archive: { pitch: -16, fov: 52, w: 6.4, row: .34, maxD: 14 },
    archiveDesk: { pitch: -12, fov: 50, w: 4.6, row: .38 },
    archivePad: { yaw: -82, pitch: -58, fov: 48, w: 2.7, row: .38 },
    archiveCab: { at: [-92.8, 3.4, -73.8], pitch: -22, fov: 54, w: 8, row: .36 },
    archiveRead: { pitch: -52, fov: 48, w: 2.9, row: .38 },
    reading: { pitch: -1, fov: 62 },
    readingDesk: { pitch: -26, fov: 50, w: 4.4, row: .4 },
    readingDeskL: { yaw: -30, pitch: -34, fov: 52, w: 7.5, row: .38 },
    readingDeskR: { yaw: 6, pitch: -26, fov: 50, w: 4.4, row: .4 },
    readingJournal: { yaw: -10, pitch: -50, fov: 48, w: 3.1, row: .38, shift: [-.65, 0, 0] },
    readingBook: { yaw: -4, pitch: -24, fov: 48, w: 3.6, row: .42, shift: [0, .2, 0] },
    readingProof: { pitch: -60, fov: 46, w: 2.2, row: .38 },
    readingAisle: { fov: 60 },
    readingStand: { pitch: -36, fov: 48, w: 3.4, row: .34 },
    lecture: { eye: 12.6, fov: 56, w: 30, row: .28, maxD: 64 },
    lecture2: { eye: 12.6, fov: 56, w: 30, row: .28, maxD: 64 },
    lecPanel: { pitch: -24, fov: 50, w: 7.5, row: .38, shift: [-5.75, 0, 0] },
    lecFolder: { pitch: -46, fov: 46, w: 5.2, row: .4 },
    lecStage: { pitch: 8, fov: 54, w: 28, row: .3, maxD: 64 },
    lecSeats: { pitch: -50, fov: 48, w: 3.5, row: .38 },
    lecDoor: { pitch: -50, fov: 50, w: 7, row: .36 },
    lecLeaflet: { pitch: -52, fov: 46, w: 3.6, row: .38 },
    lecPaper: { pitch: -52, fov: 46, w: 3.6, row: .38 },
    lecAisle: { fov: 60 }, lecOver: { fov: 60 }, lecPosters: { fov: 60 },
  };
  for (const k in PHONE) VIEWS[k].phone = PHONE[k];
  const headRow = () => (headH + 18) / Math.max(1, H);   // the letterhead's foot, and a little air
  // A phone held upright, or any window much taller than wide (plan 11.21): each view's own framing for a tall
  // frame (its `phone`), where it has one: the camera placed and aimed for the tall frame at a natural lens,
  // its subject across the width above the chapter's words. (The wide window's framing, its lens widened until
  // its width fitted, stretched the picture up and down and still cut off its sides.) A view aimed at a thing
  // has its phone eye set back from that thing (eye, below)
  const tall = () => aspect < .8;
  // (a framing aimed at a thing (its `at`, or the view's own focus, moved by its `shift`): the eye set back along
  // the way it faces just far enough that `w` units across the thing fill the frame's width, and the lens shifted
  // so the thing sits `row` of the way down the frame: above the chapter's words; one without `w` keeps the
  // view's eye and only takes its own lens and tilt)
  function phonePose(v, q) {
    const yaw = q.yaw ?? v.yaw ?? 0, pitch = q.pitch ?? v.pitch ?? 0, base = q.at || v.focus;
    if (!q.w || !base) return { p: q.p || v.p, yaw, pitch, fov: q.fov, sx: 0, sy: q.sy ?? 0, aim: v.aim };
    const at = q.shift ? base.map((x, j) => x + q.shift[j]) : base;
    // (never further back than the room allows, maxD: on a narrow phone the lens widens instead, to 74 degrees at
    // most; standing further back would put the camera behind the room's wall)
    let fov = q.fov, T = Math.tan(fov * Math.PI / 360), D = q.w / 2 / (T * aspect * .94);
    if (q.maxD && D > q.maxD) { D = q.maxD; T = Math.min(Math.tan(37 * Math.PI / 180), q.w / 2 / (D * aspect * .94)); fov = 2 * Math.atan(T) * R2D; }
    // (a room's view stands level at an eye's height (eye), its verticals upright, and only the lens moves the
    // thing to its row; a thing on a desk is looked down at)
    if (q.eye !== undefined) {
      const y = yaw * Math.PI / 180;
      return { p: [at[0] - Math.sin(y) * D, q.eye, at[2] + Math.cos(y) * D], yaw, pitch: 0, fov, sx: 0, sy: .5 - .5 * (at[1] - q.eye) / D / T - (q.row ?? .36), aim: D };
    }
    return { p: eyeOf(yaw, pitch, D, at), yaw, pitch, fov, sx: 0, sy: .5 - (q.row ?? .36), aim: D };
  }
  function compose(v, capTop) {
    if (tall() && v.phone) return phonePose(v, v.phone);
    // (a view faces south unless it says otherwise: yaw, degrees from -z toward +x; its points are
    // measured along the way it faces (depth) and across it)
    const [cx, cy, cz] = v.p, yw = (v.yaw || 0) * Math.PI / 180, fx = Math.sin(yw), fz = -Math.cos(yw);
    const depth = q => (q[0] - cx) * fx + (q[2] - cz) * fz, across = q => (q[0] - cx) * -fz + (q[2] - cz) * fx;
    const tn = q => (cy - q[1]) / depth(q);
    // (the view's foot stays above the chapter's words and above the stationery's foot line)
    const topRow = headRow(), footRow = Math.min(capTop, footTop) - v.gap, tTop = Math.min(...v.top.map(tn)), tFoot = tn(v.foot);
    // (the share of the frame's width the view may use either side of its middle: all of it, or what
    // the chapter list leaves)
    const room = v.clearList && listRight > 0 ? Math.max(.4, 1 - 2 * (listRight + 18) / Math.max(1, W)) : 1;
    if (v.tilt) return tilted(v, depth, across, topRow, footRow, room);
    let T = Math.tan(v.fov * Math.PI / 360);
    T = Math.max(T, .5 * (tFoot - tTop) / Math.max(.2, footRow - topRow));
    for (const q of v.safe) T = Math.max(T, Math.abs(across(q)) / depth(q) / aspect * 1.04 / room);
    T = Math.min(T, Math.tan(35 * Math.PI / 180));
    return { p: v.p, yaw: v.yaw || 0, pitch: 0, fov: 2 * Math.atan(T) * R2D, sx: 0, sy: .5 + tFoot / (2 * T) - footRow };
  }
  // a held view (03's strong room): its eye, the way it faces and its tilt fixed, the lens wide enough
  // that the room's width shows on a narrow window (wide: the least lens across, in degrees), and never
  // wider than 75 degrees up and down
  function held(v) {
    if (tall() && v.phone) return phonePose(v, v.phone);
    const T = Math.min(Math.tan(37.5 * Math.PI / 180), Math.max(Math.tan(v.fov * Math.PI / 360), Math.tan(v.wide * Math.PI / 360) / aspect));
    // (a view that keeps clear of the chapter list: its picture shifted right by half the list's width)
    const sx = v.clearList && listRight > 0 ? (listRight + 18) / (2 * Math.max(1, W)) : 0;
    return { p: v.p, yaw: v.yaw, pitch: v.pitch, fov: 2 * Math.atan(T) * R2D, sx, sy: v.sy || 0, aim: v.aim };
  }
  // A view that looks well down (03's table) tilts down instead of only shifting its lens: a level camera
  // shifted that far stretches the picture (a thing 40 degrees below the eye is drawn a third taller
  // than it is), while a tilted one leans the room's verticals. It takes v.tilt of the tilt that would
  // frame its points with the lens unshifted, and the lens's shift does the rest: its highest point just
  // below the letterhead, its foot just above the chapter's words, the lens widening only as far as the
  // frame's width needs (then the foot keeps its row and the top has room to spare)
  function tilted(v, depth, across, topRow, footRow, room) {
    const cy = v.p[1], ang = q => Math.atan2(q[1] - cy, depth(q)), a = .5 - topRow, b = .5 - footRow;
    const at = Math.max(...v.top.map(ang)), af = ang(v.foot);
    // (the tilt that sets both on their rows unshifted: between the two directions, by halving)
    let lo = af, hi = at;
    for (let i = 0; i < 48; i++) { const p = (lo + hi) / 2; if (Math.tan(at - p) * b - Math.tan(af - p) * a < 0) lo = p; else hi = p; }
    const pitch = v.tilt * (lo + hi) / 2;
    let T = (Math.tan(at - pitch) - Math.tan(af - pitch)) / (2 * (footRow - topRow)), sy = .5 - Math.tan(at - pitch) / (2 * T) - topRow;
    // (the things across: their distance along the way the camera looks, tilted)
    const wide = Math.max(...v.safe.map(q => Math.abs(across(q)) / (depth(q) * Math.cos(pitch) + (q[1] - cy) * Math.sin(pitch)) / aspect * 1.04 / room));
    const Tmin = Math.max(Math.tan(v.fov * Math.PI / 360), wide);
    if (T < Tmin) { T = Math.min(Tmin, Math.tan(35 * Math.PI / 180)); sy = .5 - Math.tan(af - pitch) / (2 * T) - footRow; }
    return { p: v.p, yaw: v.yaw || 0, pitch: pitch * R2D, fov: 2 * Math.atan(T) * R2D, sx: 0, sy };
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
      archive: held(VIEWS.archive), archiveDesk: held(VIEWS.archiveDesk), archiveCab: held(VIEWS.archiveCab), archiveRead: held(VIEWS.archiveRead), archivePad: held(VIEWS.archivePad),
      reading: held(VIEWS.reading), readingDesk: held(VIEWS.readingDesk), readingDeskL: held(VIEWS.readingDeskL), readingDeskR: held(VIEWS.readingDeskR),
      readingProof: held(VIEWS.readingProof), readingAisle: held(VIEWS.readingAisle), readingStand: held(VIEWS.readingStand), readingJournal: held(VIEWS.readingJournal), readingBook: held(VIEWS.readingBook),
      recB0: held(VIEWS.recB0), recB1: held(VIEWS.recB1), recB2: held(VIEWS.recB2), recB3: held(VIEWS.recB3),
      lecture: held(VIEWS.lecture), lecture2: held(VIEWS.lecture2), lecPanel: held(VIEWS.lecPanel), lecStage: held(VIEWS.lecStage),
      lecFolder: held(VIEWS.lecFolder), lecLeaflet: held(VIEWS.lecLeaflet), lecPaper: held(VIEWS.lecPaper), lecSeats: held(VIEWS.lecSeats), lecAisle: held(VIEWS.lecAisle), lecDoor: held(VIEWS.lecDoor), lecPosters: held(VIEWS.lecPosters), lecOver: held(VIEWS.lecOver),
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
  // the writer's screen shown while loading 03: square to the 3D glass in the archive (it leans back a
  // little, so the camera looks a little down at it), at the distance where the glass fills the card,
  // the lens shifted so it sits where the card is
  function dossierCardPose() {
    const s = stage.getBoundingClientRect(), r = dosScreen.getBoundingClientRect(), G = archive.dossier.screen, T = Math.tan(20 * Math.PI / 180);
    const D = G.width * Math.max(1, H) / (2 * T * Math.max(1, r.width)), [nx, ny] = G.normal;
    return { p: [G.centre[0] + nx * D, G.centre[1] + ny * D, G.centre[2]], yaw: -90, pitch: -Math.asin(ny) * R2D, fov: 40, sx: (r.left - s.left + r.width / 2) / Math.max(1, W) - .5, sy: .5 - (r.top - s.top + r.height / 2) / Math.max(1, H) };
  }
  // MeWriT's slip shown while loading 04: square to the 3D slip in the journal on the reading stand (it lies
  // on the sloping desk, so the camera looks well down at it), at the distance where the slip fills the
  // card, the lens shifted so it sits where the card is
  function slipCardPose() {
    const s = stage.getBoundingClientRect(), r = slipEl.getBoundingClientRect(), T = Math.tan(20 * Math.PI / 180);
    const c = pub.slip.centre(), n = pub.slip.normal(), D = pub.slip.width * Math.max(1, H) / (2 * T * Math.max(1, r.width));
    return { p: [c[0] + n[0] * D, c[1] + n[1] * D, c[2] + n[2] * D], yaw: Math.atan2(-n[0], n[2]) * R2D, pitch: -Math.asin(n[1]) * R2D, fov: 40, sx: (r.left - s.left + r.width / 2) / Math.max(1, W) - .5, sy: .5 - (r.top - s.top + r.height / 2) / Math.max(1, H) };
  }
  // the slide shown while loading 05: square to the 3D slide on the lecture room's screen, at the distance
  // where it fills the card, the lens shifted so it sits where the card is
  function slideCardPose() {
    const el = sec.querySelector('.cm-slide'), s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), T = Math.tan(20 * Math.PI / 180);
    const c = comms.slide.centre(), n = comms.slide.normal(), D = comms.slide.width * Math.max(1, H) / (2 * T * Math.max(1, r.width));
    return { p: [c[0] + n[0] * D, c[1] + n[1] * D, c[2] + n[2] * D], yaw: Math.atan2(-n[0], n[2]) * R2D, pitch: -Math.asin(n[1]) * R2D, fov: 40, sx: (r.left - s.left + r.width / 2) / Math.max(1, W) - .5, sy: .5 - (r.top - s.top + r.height / 2) / Math.max(1, H) };
  }
  // the screen card shown while loading the contents: level with the display's glass, at the distance
  // where the glass fills the card exactly, the lens shifted so it sits where the card is
  function screenPose() {
    const s = stage.getBoundingClientRect(), r = ed.getBoundingClientRect(), T = Math.tan(20 * Math.PI / 180);
    const gw = SCR[1][0] - SCR[0][0], gx = (SCR[0][0] + SCR[1][0]) / 2, gy = (SCR[0][1] + SCR[2][1]) / 2;
    const D = gw * Math.max(1, H) / (2 * T * Math.max(1, r.width));
    return { p: [gx, gy, SCR[0][2] + D], yaw: 0, pitch: 0, fov: 40, sx: (r.left - s.left + r.width / 2) / Math.max(1, W) - .5, sy: .5 - (r.top - s.top + r.height / 2) / Math.max(1, H) };
  }
  // a view aimed at a thing: its eye set back from the thing (aim: how far) along the way it faces; the thing
  // kept as the view's focus (its phone framing is aimed at it too)
  function eyeOf(yaw, pitch, aim, at) { const y = yaw * Math.PI / 180, p = pitch * Math.PI / 180; return [at[0] - Math.sin(y) * Math.cos(p) * aim, at[1] - Math.sin(p) * aim, at[2] + Math.cos(y) * Math.cos(p) * aim]; }
  const eye = (v, at) => { v.p = eyeOf(v.yaw, v.pitch, v.aim, at); v.focus = at; };
  const lerpPose = (a, b, k) => ({ p: a.p.map((v, j) => mix(v, b.p[j], k)), yaw: mix(a.yaw, b.yaw, k), pitch: mix(a.pitch, b.pitch, k), fov: mix(a.fov, b.fov, k), sx: mix(a.sx, b.sx, k), sy: mix(a.sy, b.sy, k) });
  // 03's camera while its work is done (its share k, dossier.js's STEPS and MARKS): the views it rests at
  // and the moves between them. Each move is one even glide, eased in at its start and out at its end,
  // passing through any views on its way (via) without stopping: from where the walk ends, over the
  // writer's chair to the desk; from the desk round to the bay of clinical study reports as it opens and
  // on in over the report as it comes out; back the same way to the desk; back to where it began
  // (three beats, dossier.js's BEATS: at the desk as the dossier is laid out; to the bay of study reports as
  // it opens, the report on its shelf, the problem's scale; back to the desk for the work and the answer)
  const DOS_PATH = [
    [0, 'archive'], [.08, 'archiveDesk'],
    [.15, 'archiveDesk'], [.25, 'archiveRead', ['archiveCab'], 'first'],
    [.3, 'archiveRead'], [.4, 'archiveDesk', ['archiveCab'], 'last'],
    [.88, 'archiveDesk'], [.96, 'archive'], [1, 'archive'],
  ];
  // 04's camera while its work is done (its share k, publication.js's STEPS and MARKS): from where the glide
  // in ends, it turns to the writer's place and comes over the writer's shoulder, looking left at the
  // problem (the report's four volumes, the journal coming from the cart to lie beside them and opening at
  // its limits); turns to the manuscript as its cover opens; one slow sweep to the right as the pop-ups
  // stand, never turning back; over the folio for the proof; and down the aisle to the reading stand
  const PUB_PATH = [
    [0, 'reading'], [.17, 'readingDeskL', [], 'first'],
    [.33, 'readingDeskL'], [.39, 'readingDesk'], [.68, 'readingDeskR'],
    [.705, 'readingProof'], [.818, 'readingProof'],
    [.93, 'readingStand', ['readingAisle'], 'first'], [1, 'readingStand'],
  ];
  // (and on a phone: the four volumes as the journal comes from the cart; the journal close as it lies open at
  // its limits; the manuscript faced low and close as its cover opens and each spread's pop-ups stand, read
  // from the front; the folio's proof; the stand)
  const PUB_PATH_PHONE = [
    [0, 'reading'], [.15, 'readingDeskL', [], 'first'], [.285, 'readingDeskL'], [.315, 'readingJournal'], [.36, 'readingJournal'],
    [.39, 'readingBook'], [.69, 'readingBook'], [.712, 'readingProof'], [.818, 'readingProof'],
    [.93, 'readingStand', ['readingAisle'], 'first'], [1, 'readingStand'],
  ];
  // 05's camera while its work is done (comms.js's STEPS and MARKS): once round the room. The panel's
  // table as the statement opens; back to the stage as the screen comes down and lights; over the front
  // row's booklet; down the east aisle under the windows to the side table, the leaflet and the paper; and
  // back to the room's view as the house lights come up
  // 02's camera on a phone while the record fills (hall.js setFill: bay b fills over k from b/4 to (b+1)/4): in from
  // the whole record to the first bay as it begins, along to each bay in turn as it fills, and back for the whole
  const REC_PATH_PHONE = [
    [0, 'record'], [.07, 'recB0'], [.2, 'recB0'], [.27, 'recB1'], [.45, 'recB1'], [.52, 'recB2'], [.7, 'recB2'], [.77, 'recB3'], [.9, 'recB3'], [1, 'record'],
  ];
  const COMMS_PATH = [
    // (every turn or tilt spread over several of the wheel's steps: never a swing in one)
    [0, 'lecture'], [.08, 'lecPanel', [], 'first'],
    [.25, 'lecPanel'], [.34, 'lecStage'], [.46, 'lecStage'], [.55, 'lecSeats'], [.63, 'lecSeats'],
    [.76, 'lecDoor', ['lecOver']], [.86, 'lecDoor'], [.97, 'lecture'], [1, 'lecture'],
  ];
  // (and on a phone: the evidence on the panel's table, then the statement's folder close as it opens; the screen
  // as it comes down and lights; the booklet as it opens; over the seats to the side table, the leaflet as it
  // unfolds, then the paper as it opens; back to the room as its lights come up)
  const COMMS_PATH_PHONE = [
    [0, 'lecture'], [.08, 'lecPanel', [], 'first'], [.165, 'lecPanel'], [.195, 'lecFolder'], [.27, 'lecFolder'],
    [.345, 'lecStage'], [.5, 'lecStage'], [.555, 'lecSeats'], [.64, 'lecSeats'],
    [.765, 'lecLeaflet', ['lecOver']], [.812, 'lecLeaflet'], [.83, 'lecPaper'], [.875, 'lecPaper'], [.97, 'lecture'], [1, 'lecture'],
  ];
  // the camera, the hour and the lamp's pool at a place in the film (st), and the display's documents
  function sceneAt(st, V, docMix = {}) {
    let cam, hA, hB = null, hK = 0, spot = 0;
    if (st.phase === 0) {
      const a = CH[st.i - 1], b = CH[st.i];
      if (b.walk) {
        // a walk: one continuous way through its points (route.js), the day going as it goes
        cam = ((tall() && WALKS[b.walk + 'Phone']) || WALKS[b.walk]).pose(V[restView(a)], V[b.view], st.m); hA = a.hour; hB = b.hour; hK = easeSine(st.m); spot = 0;
      } else if (b.via) {
        if (st.m < b.split) { const k = easeSine(st.m / b.split); cam = lerpPose(V[restView(a)], V[b.via], k); hA = a.hour; hB = b.hour; hK = k; spot = a.spot * (1 - k); }
        else { const k = easeSine((st.m - b.split) / (1 - b.split)); cam = lerpPose(V[b.via], V[b.view], k); hA = b.hour; spot = 0; }
      } else { const k = easeSine(st.m); cam = lerpPose(V[restView(a)], V[b.view], k); hA = a.hour; hB = b.hour; hK = k; spot = mix(a.spot, b.spot, k); }
      // (on a phone the views at either end are close, narrow lenses: walked with, the room's bookcases and doors
      // passed on the way filled the screen and looked walked through. On the way the lens opens to a walker's
      // own width, 72 degrees, and closes again as the camera arrives)
      if (tall() && cam.fov < 72) cam = { ...cam, fov: cam.fov + (72 - cam.fov) * Math.sin(Math.PI * st.m) };
      // (the display's document changes on the way, unless both chapters keep the same one)
      const d = sstep(.55, .85, st.m); docMix[a.doc] = 1 - d; docMix[b.doc] = (docMix[b.doc] || 0) + d;
    } else {
      // (a chapter that performs close to its object draws back to its own view for the end of it)
      const c = CH[st.i]; cam = st.phase === 1 && c.dossier ? dossierCam(V, st.k) : st.phase === 1 && c.pub ? camPath(tall() ? PUB_PATH_PHONE : PUB_PATH, V, st.k) : st.phase === 1 && c.comms ? camPath(tall() ? COMMS_PATH_PHONE : COMMS_PATH, V, st.k) : st.phase === 1 && c.record && tall() ? camPath(REC_PATH_PHONE, V, st.k) : V[restView(c)]; hA = c.hour; spot = c.spot; docMix[c.doc] = 1;
    }
    return { cam, hA, hB, hK, spot, docMix };
  }
  function camPath(PATH, V, k) {
    let i = 0;
    while (i < PATH.length - 2 && k >= PATH[i + 1][0]) i++;
    const [k0, a] = PATH[i], [k1, b, via, turn] = PATH[i + 1];
    if (a === b) return V[a];
    const e = easeSine((k - k0) / (k1 - k0));
    return via ? through([V[a], ...via.map(n => V[n]), V[b]], e, turn) : lerpPose(V[a], V[b], e);
  }
  // (and on a phone: to the screen as the dossier is built; to the cabinet and the report as it comes out; back
  // to the screen; to the pad as the pen corrects the figure, back for the count; to the pad again as the agency's
  // letter comes and the pen marks it answered; back to the screen for the closing card)
  const DOS_PATH_PHONE = [
    [0, 'archive'], [.07, 'archiveDesk', [], 'first'],
    [.145, 'archiveDesk'], [.21, 'archiveCab', [], 'first'], [.235, 'archiveRead'], [.3, 'archiveRead'],
    [.37, 'archiveDesk', ['archiveCab'], 'last'],
    [.475, 'archiveDesk'], [.505, 'archivePad'], [.555, 'archivePad'], [.59, 'archiveDesk'],
    [.675, 'archiveDesk'], [.71, 'archivePad'], [.815, 'archivePad'], [.85, 'archiveDesk'],
    [.96, 'archiveDesk'], [1, 'archive'],
  ];
  const dossierCam = (V, k) => camPath(tall() ? DOS_PATH_PHONE : DOS_PATH, V, k);
  // a pose e of the way along a smooth curve through poses: its place and lens measured by distance, so
  // the pace is even, and shaped so it never overshoots a pose it passes (a monotone cubic, each number on
  // its own). Its eye: going to something ('first'), it turns to face it before it travels, then travels
  // with its eye held on it; coming away ('last'), it travels back with its eye still on what it leaves,
  // then turns to where it is going
  const fwdOf = v => { const y = v.yaw * Math.PI / 180, p = v.pitch * Math.PI / 180; return [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)]; };
  const lookAt = v => { const f = fwdOf(v), d = v.aim || 10; return [v.p[0] + f[0] * d, v.p[1] + f[1] * d, v.p[2] + f[2] * d]; };
  function through(P, e, turn) {
    const pts = P.map(v => [v.p[0], v.p[1], v.p[2], v.fov, v.sx, v.sy]), n = pts.length, s = [0];
    for (let i = 1; i < n; i++) { const a = pts[i - 1], b = pts[i]; s.push(s[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) + 1e-6); }
    const ep = easeSine(turn === 'first' ? (e - .22) / .78 : turn === 'last' ? e / .78 : e), el = easeSine(turn === 'first' ? e / .5 : turn === 'last' ? (e - .5) / .5 : e);
    const d = ep * s[n - 1];
    let i = 0;
    while (i < n - 2 && d > s[i + 1]) i++;
    const h = s[i + 1] - s[i], t = (d - s[i]) / h, t2 = t * t, t3 = t2 * t;
    const v = pts[0].map((_, j) => {
      const del = q => (pts[q + 1][j] - pts[q][j]) / (s[q + 1] - s[q]);
      const m = q => {
        if (q === 0) return del(0);
        if (q === n - 1) return del(n - 2);
        const a = del(q - 1), b = del(q), h0 = s[q] - s[q - 1], h1 = s[q + 1] - s[q];
        return a * b <= 0 ? 0 : 3 * (h0 + h1) / ((2 * h1 + h0) / a + (h1 + 2 * h0) / b);
      };
      return (2 * t3 - 3 * t2 + 1) * pts[i][j] + (t3 - 2 * t2 + t) * h * m(i) + (3 * t2 - 2 * t3) * pts[i + 1][j] + (t3 - t2) * h * m(i + 1);
    });
    const toward = T => { const q = [T[0] - v[0], T[1] - v[1], T[2] - v[2]], l = Math.hypot(...q) || 1; return q.map(x => x / l); };
    const [f0, f1] = turn === 'last' ? [toward(lookAt(P[0])), fwdOf(P[n - 1])] : [fwdOf(P[0]), toward(lookAt(P[n - 1]))];
    const f = f0.map((x, j) => x + (f1[j] - x) * el), fl = Math.hypot(...f) || 1;
    return { p: [v[0], v[1], v[2]], yaw: Math.atan2(f[0], -f[2]) * R2D, pitch: Math.asin(f[1] / fl) * R2D, fov: v[3], sx: v[4], sy: v[5] };
  }
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
  // the fastest the film may go at P, in chapters a second (plan 11.21): a chapter's move in no less than 2.4 s,
  // its work in no less than 1.9 s a beat (02's filling is one beat, the others three), its rest at once
  const PACE_MOVE = 2.4, PACE_BEAT = 1.9;
  const paceAt = P => {
    const st = at(Math.min(Math.max(P, 0), S - 1e-6)), c = CH[st.i];
    if (st.phase === 0) return c.A / PACE_MOVE;
    if (st.phase === 1) return (c.B - c.A) / ((tall() ? 2.6 : PACE_BEAT) * (c.record ? (tall() ? 4 : 1) : 3));
    return 1;
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
  // ---------- flying to a chapter (the list, the letterhead, the display's contents) ----------
  // The camera leaves the scroll and flies the house's own way there: each move between the rooms in turn
  // (through their doorways, every door opening as it comes), never stopping for a room's work (a room it
  // passes shows its work's start, and the work is held where it was), at one steady pace eased only at
  // the flight's two ends, and lands at the chapter's start (just arrived, its work not begun). Then the
  // page is put at that place, and the scroll takes over again from there
  const startOf = i => i === 0 ? 0 : CH[i].B > CH[i].A ? i + CH[i].A + .003 : restP(i);
  const invSine = e => Math.acos(1 - 2 * clamp(e)) / Math.PI;   // (undoes the moves' own easing: an even pace)
  const workK = (j, st) => st.i > j ? 1 : st.i < j || st.phase === 0 ? 0 : st.k;   // (how far chapter j's work is, at st)
  let flight = null, lastCam = null;
  // (each move's way, roughly: from where the chapter before rests to where this one starts; for the
  // flight's pace only)
  const moveLen = (V, j) => { const a = V[restView(CH[j - 1])].p, b = V[CH[j].view].p; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 1.15 + 4; };
  const poseLen = (a, b) => Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]) + Math.abs(a.yaw - b.yaw) / 9 + Math.abs(a.pitch - b.pitch) / 9;
  function flyTo(t) {
    if (!introDone || !world) return;
    const P0 = Math.min(flight ? flightP : Pr, S - 1e-6), a = at(P0), PT = startOf(t);
    if (!motion) { window.scrollTo({ top: Math.round(scrollFor(PT)), behavior: 'instant' }); return; }
    if (Math.abs(PT - P0) < 1e-3 && !flight) return;
    glide = null;
    const V = views(), segs = [], hold = {};
    const move = (j, e0, e1) => segs.push({ move: j, e0, e1, len: Math.abs(e1 - e0) * moveLen(V, j) });
    const turn = (from, to, P) => { const A = typeof from === 'string' ? V[from] : from, B = V[to]; const len = poseLen(A, B); if (len > .05) segs.push({ from: A, to, P, len }); };
    const here = (flight && flightPose) || lastCam;
    // (the chapter the reader is in: the scroll winds back to its start, its work going back with it)
    if (t === a.i && a.phase > 0) { flight = null; glideTo(PT); return; }
    if (t >= a.i) {
      // forward: finish the move under way; then in each room, turn from where the camera is (or where the
      // room's move ended) to where the room rests, and take the next move
      if (a.phase === 0) move(a.i, easeSine(a.m), 1);
      for (let j = a.i; j < t; j++) {
        const now0 = j === a.i && a.phase > 0;
        turn(now0 ? here : CH[j].view, restView(CH[j]), now0 ? P0 : j + CH[j].A);
        move(j + 1, 0, 1);
        hold[j] = j === a.i ? workK(j, a) : 0;
      }
    } else {
      // back: undo the move under way, or turn to where this chapter's move ends, and go back along it
      if (a.phase === 0) move(a.i, easeSine(a.m), 0);
      // (the house as at this chapter's start while the camera turns to go: its doors open for the way back)
      else { turn(here, CH[a.i].view, a.i + CH[a.i].A + 1e-4); move(a.i, 1, 0); }
      hold[a.i] = workK(a.i, a);
      for (let j = a.i - 1; j > t; j--) { turn(restView(CH[j]), CH[j].view, j + CH[j].A); move(j, 1, 0); hold[j] = 1; }
      turn(restView(CH[t]), CH[t].view, PT);
      hold[t] = 0;
    }
    if (!segs.length || segs.reduce((s, g) => s + g.len, 0) < .01) { window.scrollTo({ top: Math.round(scrollFor(PT)), behavior: 'instant' }); return; }
    // One way, not pieces: the moves and turns are sampled close together, and the samples are smoothed
    // along the way (a turn in a room becomes a turn made while still moving, a corner is rounded a little,
    // well inside the doorways), then the camera travels it at one even pace by distance, eased only at
    // its two ends. The house's state goes with it, sample by sample
    const pts = [];
    segs.forEach((g, gi) => {
      const n = Math.max(6, Math.ceil(g.len / .5));
      for (let k = gi ? 1 : 0; k <= n; k++) {
        const u = k / n;
        if (g.move !== undefined) {
          const e = g.e0 + (g.e1 - g.e0) * u, P = g.move + CH[g.move].A * invSine(e) * (1 - 1e-6);
          // (a move that goes by way of a wide view, the display's, only passed on the way: flown straight, no
          // drawing out and in; when the display is where the flight goes, the full move)
          const c = CH[g.move], cam = c.via && t !== g.move ? lerpPose(V[restView(CH[g.move - 1])], V[c.view], e) : sceneAt(at(P), V).cam;
          pts.push({ ...cam, P, mv: true });
        } else {
          const B = V[g.to], A = g.from;
          pts.push({ ...lerpPose(A, B, u), yaw: A.yaw + ((((B.yaw - A.yaw) % 360) + 540) % 360 - 180) * u, P: g.P });
        }
      }
    });
    // (flying back, the camera goes back along the house's ways facing as it faces walking them forward: it
    // flies in reverse, so it only ever looks the way the rooms are made to be seen)
    // (the heading made continuous, then everything smoothed by distance along the way; the two ends held)
    for (let i = 1; i < pts.length; i++) pts[i].yaw = pts[i - 1].yaw + ((((pts[i].yaw - pts[i - 1].yaw) % 360) + 540) % 360 - 180);
    const arc = list => { const s = [0]; for (let i = 1; i < list.length; i++) { const a = list[i - 1], b = list[i]; s.push(s[i - 1] + Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]) + Math.hypot(a.yaw - b.yaw, a.pitch - b.pitch) / 3.6); } return s; };   // (a turn counts as distance: 90 degrees as 25 units, so the camera never spins)
    const s0 = arc(pts), L0 = s0[s0.length - 1];
    // (one lens through the flight: the views it passes have lenses of their own, close and wide in turn, and the
    // picture seemed to breathe in and out as it flew. The lens goes from where it starts to a steady one, holds
    // it, and goes to the landing's own over the flight's last stretch; the picture's shift likewise to none)
    {
      const FL = tall() ? 64 : 58;
      pts.forEach((q, i) => { const u = L0 > 0 ? s0[i] / L0 : 0, k = Math.min(sstep(0, .14, u), 1 - sstep(.86, 1, u)); q.fov += (FL - q.fov) * k; q.sx *= 1 - k; q.sy *= 1 - k; });
    }
    // (each sample against its neighbours within three widths only, outward from it: quick even for a
    // long flight, so the flight starts at once)
    const smooth = (get, sig) => pts.map((_, i) => {
      let w = 0, v = 0;
      for (let j = i; j < pts.length && s0[j] - s0[i] <= 3 * sig; j++) { const d = s0[j] - s0[i], k = Math.exp(-d * d / (2 * sig * sig)); w += k; v += k * get(pts[j]); }
      for (let j = i - 1; j >= 0 && s0[i] - s0[j] <= 3 * sig; j--) { const d = s0[j] - s0[i], k = Math.exp(-d * d / (2 * sig * sig)); w += k; v += k * get(pts[j]); }
      const edge = Math.min(1, s0[i] / (2 * sig), (L0 - s0[i]) / (2 * sig));
      return get(pts[i]) + (v / w - get(pts[i])) * Math.max(0, edge);
    });
    const sp = [0, 1, 2].map(c => smooth(q => q.p[c], 1.4)), sy = smooth(q => q.yaw, 4.5), spi = smooth(q => q.pitch, 4.5), sf = smooth(q => q.fov, 4.5), ssx = smooth(q => q.sx, 4.5), ssy = smooth(q => q.sy, 4.5);
    const path = pts.map((q, i) => ({ p: [sp[0][i], sp[1][i], sp[2][i]], yaw: sy[i], pitch: spi[i], fov: sf[i], sx: ssx[i], sy: ssy[i], P: q.P }));
    const s = arc(path), len = s[s.length - 1];
    // (quick, never hasty: about twenty-two units a second at its steadiest)
    flight = { path, s, len, hold, t, PT, t0: performance.now(), dur: Math.min(6500, Math.max(1400, 700 + len / 22 * 1000)) };
    wake();
  }
  // where the flight is: the camera's pose on its way, and the place in the film it shows (for the house)
  let flightPose = null, flightP = 0;
  function flightAt(now) {
    const f = flight, u = clamp((now - f.t0) / f.dur), d = (.5 - .5 * Math.cos(Math.PI * u)) * f.len;
    let lo = 0, hi = f.s.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (f.s[mid] <= d) lo = mid; else hi = mid; }
    const a = f.path[lo], b = f.path[hi], t = f.s[hi] > f.s[lo] ? (d - f.s[lo]) / (f.s[hi] - f.s[lo]) : 0;
    flightPose = { ...lerpPose(a, b, t), yaw: mix(a.yaw, b.yaw, t) };
    flightP = t < .5 ? a.P : b.P;
    return { P: flightP, u };
  }
  // (the work of a room the flight passes is held where it was)
  const heldK = (j, k) => flight && flight.hold[j] !== undefined ? flight.hold[j] : k;
  // (a jump closes the foot and the full list, if they are open, so the way there is seen)
  sec.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); setFoot(false); setIndex(false); flyTo(+a.dataset.go); }));
  // the contents on the display: a practice not yet built stays where it is (the look test), and the
  // screen's foot says so for a moment
  if (ed) {
    const hint = ed.querySelector('.ed-hint');
    let hintT = 0;
    ed.querySelectorAll('.ed-toc a').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      // (a practice whose chapter is built: the camera goes there)
      const to = CH.findIndex(c => c.id === a.dataset.chapter);
      if (to >= 0) { setFoot(false); flyTo(to); return; }
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
      stage.dataset.dark = CH[c].hour === 'night' || CH[c].darkWords ? 'on' : 'off';
      // the address names the chapter (shared, it opens there); the title page keeps the plain address
      try { history.replaceState(null, '', c > 0 ? `#${CH[c].id}` : location.pathname + location.search); } catch (e) { /* sandboxed */ }
      // (the running head: the chapter's number and name, as its segment of the bar gives them)
      const lb = list.find(a => a.getAttribute('href') === `#${CH[c].id}` && a.closest('.hs-bar'));
      if (lhRun && lb) { lhRun.querySelector('.n').innerHTML = lb.querySelector('.lb .n').innerHTML; lhRun.querySelector('.t').textContent = lb.querySelector('.lb .t').textContent; }
      list.forEach(a => { if (a.getAttribute('href') === `#${CH[c].id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
  }

  // the chapter bar's label: one, under the segment the pointer is on. Shown only as the pointer really moves
  // over the bar (the browser's own hover comes back to a pointer left resting there each time the page stops
  // scrolling: that showed labels that popped up and flickered); hidden at once as the pointer leaves, as the
  // page scrolls, or as a segment is clicked. By keyboard, the segment with the focus
  const bar = sec.querySelector('.hs-bar'), tip = sec.querySelector('.hs-tip'), head = sec.querySelector('.lp-lh');
  const barItems = bar ? [...bar.querySelectorAll('li')] : [];
  let tipAt = -1;
  function showTip(li) {
    const i = li ? barItems.indexOf(li) : -1;
    if (!tip || i === tipAt) return;
    tipAt = i;
    barItems.forEach((x, j) => x.classList.toggle('hot', j === i));
    if (i < 0) { tip.classList.remove('on'); return; }
    tip.innerHTML = li.querySelector('.lb').innerHTML;
    // (centred under its segment, kept within the bar's ends)
    const hb = head.getBoundingClientRect(), bb = bar.getBoundingClientRect(), r = li.getBoundingClientRect(), w = tip.offsetWidth;
    tip.style.left = `${Math.round(Math.min(Math.max(r.left + r.width / 2 - w / 2, bb.left), bb.right - w) - hb.left)}px`;
    tip.classList.add('on');
  }
  if (bar && tip) {
    bar.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) showTip(e.target.closest('li')); });
    bar.addEventListener('pointerleave', () => showTip(null));
    bar.addEventListener('click', () => showTip(null));
    bar.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) showTip(e.target.closest('li')); });
    bar.addEventListener('focusout', () => showTip(null));
    addEventListener('wheel', () => showTip(null), { passive: true });
    addEventListener('scroll', () => { if (tipAt >= 0) showTip(null); }, { passive: true });
  }

  // ---------- how much of each chapter has been seen: its segment of the chapter bar, and its line in the
  // full list ----------
  // Where the reader stands: the chapters behind full, the one the reader is in filled as far as the scroll
  // has gone through it from its arrival (emptying again, right to left, as the reader scrolls back), the
  // ones ahead empty. A refresh at a chapter's end shows it full
  // (the bar's lines are drawn every frame the film moves; the full list's only while it is open, and brought
  // up to date as it opens: its lines are not seen otherwise, and every line changed is the page's work)
  const meterOf = sel => CH.map(c => { const a = list.find(x => x.getAttribute('href') === `#${c.id}` && x.matches(sel)); return a ? a.querySelector('.sg b, .mt b') : null; });
  const barMeters = meterOf('.hs-bar a'), idxMeters = meterOf('.hx-list a');
  const shownV = CH.map(() => -1), shownIdx = CH.map(() => -1);
  let idxOpen = false;
  function meters(P) {
    const i = Math.min(S - 1, Math.max(0, Math.floor(P))), c = CH[i];
    // (the dwell's last stretch counts as the end: a chapter at rest is complete)
    const v = i === 0 ? 1 : clamp((P - i - c.A) / Math.max(1e-6, (c.B + (1 - c.B) * .12) - c.A));
    CH.forEach((_, j) => {
      const x = j < i ? 1 : j > i ? 0 : Math.round(v * 300) / 300;
      if (shownV[j] !== x && barMeters[j]) { shownV[j] = x; barMeters[j].style.setProperty('--v', x); }
      if (idxOpen && shownIdx[j] !== x && idxMeters[j]) { shownIdx[j] = x; idxMeters[j].style.setProperty('--v', x); }
    });
  }

  // ---------- the 3D ----------
  let world = null, study = null, hall = null, archive = null, reading = null, pub = null, lecture = null, comms = null, ready = false, benchMs = 0, slideReady = null;
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
    // where the foot line begins (no list down the left any more, plan 11.21: listRight stays 0)
    // (and the letterhead's own height: slimmer on a phone)
    const lhEl = sec.querySelector('.lp-lh');
    headH = lhEl && lhEl.offsetHeight ? lhEl.offsetHeight : 76;
    const fb = sec.querySelector('.hf-bar');
    footTop = fb ? Math.min(1, (fb.getBoundingClientRect().top - s.top) / Math.max(1, H)) : 1;
    // the editor's setting for this window: the glass's width on the screen at the display's resting view
    const rest = compose(VIEWS.display, capTops[1] || 1), D = VIEWS.display.p[2] - SCR[0][2];
    edCompact = !PORTRAIT && (SCR[1][0] - SCR[0][0]) * H / (2 * D * Math.tan(rest.fov * Math.PI / 360)) / ED_W < .55;
    if (world) { world.resize(canvas.clientWidth || W, canvas.clientHeight || H); lastKey = ''; wake(); }
  }
  new ResizeObserver(sizeUp).observe(stage);
  sizeUp();
  if (document.fonts) document.fonts.ready.then(sizeUp);

  const fonts = document.fonts ? Promise.race([Promise.all([document.fonts.load('600 22px Caveat'), document.fonts.load('600 20px "Fraunces Variable"'), document.fonts.load('italic 400 20px "Fraunces Variable"'), document.fonts.load('500 20px "Inter Variable"')]), new Promise(r => setTimeout(r, 2500))]).catch(() => null) : Promise.resolve();
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
    body: page && page.querySelector('.pg-body') ? { text: page.querySelector('.pg-body').textContent.trim(), mark: (page.querySelector('.pg-body mark') || {}).textContent || '' } : null,
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
    // (03's reading view, from the report itself: bent over its shelf from 52 degrees above it, a little off
    // square to its pages, looking 3 degrees further down so the report sits above the caption)
    if (archive.room && archive.room.special) {
      const F = archive.room.special.focus();
      VIEWS.archiveRead.pitch = -52; eye(VIEWS.archiveRead, F.c); VIEWS.archiveRead.pitch = -55;
    }
    // (on a phone, the room's view and the desk's are aimed at the writer's screen)
    if (archive.dossier && archive.dossier.screen) VIEWS.archive.focus = VIEWS.archiveDesk.focus = archive.dossier.screen.centre;
    if (archive.dossier && archive.dossier.padAt) VIEWS.archivePad.focus = archive.dossier.padAt();
    mark('archive');
    // the reading room, through the strong room's east door (04)
    reading = buildReading({ hi: big });
    bake(reading.group);
    world.scene.add(reading.group);
    addReadingLights();
    if (reading.doorN) world.scene.add(reading.doorN.group);
    // 04's work at the south table: the pop-up manuscript, the journal, the folio, the stand's journal
    pub = buildPublication({ room: reading });
    world.scene.add(pub.group);
    // (04's views at the desk, over the folio and at the stand: each eye set back from what it looks at,
    // along the way it faces)
    {
      const F = pub.focus();
      eye(VIEWS.readingDesk, F.book); eye(VIEWS.readingDeskR, F.book);
      eye(VIEWS.readingDeskL, F.journal);
      eye(VIEWS.readingProof, F.fix); eye(VIEWS.readingStand, F.stand);
      VIEWS.readingJournal.focus = F.journalAt; VIEWS.readingBook.focus = F.book;
    }
    mark('reading');
    // the lecture room, through the reading room's north door (05), and its work
    if (CI >= 0) {
      lecture = buildLecture({ hi: big });
      bake(lecture.group);
      world.scene.add(lecture.group);
      if (lecture.doorW) world.scene.add(lecture.doorW.group);
      comms = buildComms();
      world.scene.add(comms.group);
      addLectureLights();
      const F = comms.focus();
      eye(VIEWS.lecPanel, F.panel); eye(VIEWS.lecStage, F.screen); eye(VIEWS.lecSeats, F.booklet); eye(VIEWS.lecDoor, F.side);
      // (on a phone, the room's view is aimed at the screen over the stage)
      VIEWS.lecture.focus = VIEWS.lecture2.focus = F.screen;
      VIEWS.lecFolder.focus = F.folder; VIEWS.lecLeaflet.focus = F.leaflet; VIEWS.lecPaper.focus = F.paper;
      slideReady = paintSlide();
      mark('lecture');
    }
    world.addLamp({ at: study.lamp.at, aim: study.lamp.aim, power: 46, angle: .58 });
    world.addGlow(study.lamp.bulb, { size: 1.5, k: .85 });
    // the sun's shadows: drawn over the room the camera is in (BOXES), widened on the way between two
    setBox(BOXES.study);
    world.setHour('early');
    addLife(); addRoomLife();
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
    Promise.all([new Promise(r => setTimeout(r, wait)), loaderDrawn, fromI === CI ? slideReady : null]).then(() => {
      if (STATIC) { finishIntro(); return; }
      mark('intro');
      if (fromI === AI && AI >= 0) {
        // the archive: the camera stands square to the writer's screen, where the 3D glass fills the card
        // (the workspace is laid on it where the card already is), the paper clears, and the camera
        // draws back to the archive's view
        introFrom = dossierCardPose();
        introStart = performance.now();
        world.aim(introFrom);
        placeDossier();
        page.classList.add('quad'); placePage();   // (the title page placed, or hidden, before the paper clears)
        root.classList.add('hs-in'); root.classList.remove('hs-loading', 'hs-lock');
        if (veil) veil.classList.add('off');
        wake();
        return;
      }
      if (fromI === CI && CI >= 0) {
        // the lecture room: the camera stands square to the slide on the screen, where the 3D slide (traced
        // from the card itself) fills the card; the card and the paper clear, and the camera draws back to
        // the room's view
        introFrom = slideCardPose();
        introStart = performance.now();
        world.aim(introFrom);
        page.classList.add('quad'); placePage();
        root.classList.add('hs-in'); root.classList.remove('hs-loading', 'hs-lock');
        if (veil) veil.classList.add('off');
        wake();
        return;
      }
      if (fromI === PI && PI >= 0) {
        // the reading room: the camera stands square to MeWriT's slip in the journal on the stand, where the
        // 3D slip fills the card (its logo is laid on it where the card already is), the card's paper clears
        // to the slip's own, and the camera draws back to the journal open on the stand
        introFrom = slipCardPose();
        introStart = performance.now();
        world.aim(introFrom);
        placeSlip();
        page.classList.add('quad'); placePage();
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
        page.classList.add('quad'); placePage();   // (the title page placed, or hidden, before the paper clears)
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
        page.classList.add('quad'); placePage();   // (the title page, on the manuscript below the frame)
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
    // (the display's glass painted with the contents' page once the page is in its final layout: its logo docked)
    if (first) setTimeout(paintGlass, 400);
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
  // 03's words: the writer's screen (laid on its glass; on 03's loader, the card on the paper), its panes
  // and the parts the work reaches; the steps said in the caption's place
  const dos = sec.querySelector('.hs-dos'), dosScreen = dos && dos.querySelector('.dos-screen'), dosLogo = dosScreen && dosScreen.querySelector('.ld');
  const dosPanes = dosScreen ? [...dosScreen.querySelectorAll('.ds-pane')] : [], dosMarks = dos ? [...dos.querySelectorAll('[data-mark]')] : [], dosSteps = dos ? [...dos.querySelectorAll('.dos-steps li')] : [];
  // 04's slip: MeWriT's compliments slip in the journal on the reading stand, its logo laid on it
  const slipEl = sec.querySelector('.pub-slip'), slipLogo = slipEl && slipEl.querySelector('.ld');
  const players = new Map();
  const playerOf = el => { if (!el) return null; if (!players.has(el)) players.set(el, createLogoPlayer(el, { speed: LOGO_SPEED })); return players.get(el); };
  let loaderDrawn = Promise.resolve();
  if (!STATIC && !REDUCE) {
    if (fromI === 0 && sheetLogo) loaderDrawn = playerOf(sheetLogo).play();
    else if (fromI === 1 && bootLogo) loaderDrawn = playerOf(bootLogo).play().then(() => { ed.classList.add('docked'); return new Promise(r => setTimeout(r, 750)); });
    else if (fromI === RI && crestLogo) loaderDrawn = playerOf(crestLogo).play();
    else if (fromI === AI && AI >= 0 && dosLogo) loaderDrawn = playerOf(dosLogo).play().then(() => { dosScreen.classList.add('checked', 'done'); return new Promise(r => setTimeout(r, 1300)); });
    else if (fromI === PI && PI >= 0 && slipLogo) loaderDrawn = playerOf(slipLogo).play().then(() => new Promise(r => setTimeout(r, 600)));
  }
  // (04's slip waits with its logo not yet written, unless its own loader is writing it now)
  if (slipLogo && !(fromI === PI && !STATIC)) slipLogo.classList.add('ld-first');
  // (03's closing card waits with its logo not yet written, unless its own loader is writing it now;
  // there its rows are checked once the logo is written: house.css)
  if (dosLogo && !(fromI === AI && !STATIC)) dosLogo.classList.add('ld-first');
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
    if (open) setIndex(false);
    foot.dataset.open = open ? 'true' : 'false';
    footBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) footPanel.removeAttribute('inert'); else footPanel.setAttribute('inert', '');
    footBy = open ? by : '';
  }
  if (footBtn) footBtn.addEventListener('click', () => setFoot(foot.dataset.open !== 'true', 'reader'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && foot && foot.dataset.open === 'true') { setFoot(false); footBtn.focus(); } });
  // ---------- the full list (plan 11.21): opened from the letterhead's Chapters, closed by its own button,
  // Escape, a click outside it, or a jump; opening it closes the foot ----------
  const index = sec.querySelector('.hs-index'), idxBtn = sec.querySelector('.lh-idx'), idxClose = index && index.querySelector('.hx-close');
  function setIndex(open, focus = false) {
    if (!index || (index.dataset.open === 'true') === open) return;
    if (open) setFoot(false);
    // (its lines brought up to date as it opens)
    idxOpen = open;
    if (open && introDone) meters(Math.min(flight ? flightP : Pr, S - 1e-6));
    index.dataset.open = open ? 'true' : 'false';
    if (idxBtn) idxBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) index.removeAttribute('inert'); else index.setAttribute('inert', '');
    // (opened, the chapter the reader is in has the focus; closed from inside, the focus goes back to the button)
    if (open && focus) { const cur = index.querySelector('.hx-list a[aria-current="true"]') || index.querySelector('a'); if (cur) cur.focus({ preventScroll: true }); }
    if (!open && focus && idxBtn) idxBtn.focus({ preventScroll: true });
  }
  if (idxBtn) idxBtn.addEventListener('click', e => { e.stopPropagation(); setIndex(index.dataset.open !== 'true', e.detail === 0); });
  if (idxClose) idxClose.addEventListener('click', () => setIndex(false, true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && index && index.dataset.open === 'true') setIndex(false, true); });
  document.addEventListener('pointerdown', e => { if (index && index.dataset.open === 'true' && !index.contains(e.target) && !(idxBtn && idxBtn.contains(e.target))) setIndex(false); });
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

  // ---------- the reading room's lamps: the green lamps on its tables (their glows, their pools on the
  // wood), the two lanterns over the aisle, the writer's lamp lighting the manuscript (with its shadows, so
  // its pop-ups cast theirs on the pages), a warm light for the room; on as the reader comes in ----------
  const rdLights = [], rdGlows = [], rdPools = [];
  let rdRoom = null;
  function addReadingLights() {
    const wl = reading.lamps[reading.lamps.length - 1];
    rdLights.push(world.addLamp({ at: [wl[0] + .4, wl[1] + .2, wl[2] + .6], aim: [READING.DESK.x, READING.TTOP, READING.DESK.z], power: 26, angle: .95, penumbra: .8, decay: 1.4, shadow: true, color: '#FFD9A6' }));
    rdLights.forEach(l => world.setLampK(l, 0));
    rdRoom = new THREE.PointLight('#FFCF98', 0, 90, 1);
    rdRoom.position.set(-133, 18, -52);
    world.scene.add(rdRoom);
    reading.lamps.forEach(p => rdGlows.push({ s: world.addGlow(p, { size: 2.4, k: 0, color: '#FFE6B8' }), k: .85 }));
    reading.lanterns.forEach(p => rdGlows.push({ s: world.addGlow(p, { size: 4.4, k: 0, color: '#FFE0B0' }), k: .8 }));
    reading.lamps.forEach(([x, , z]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 6), new THREE.MeshBasicMaterial({ map: poolTex, color: '#FFB86A', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, READING.TTOP + .01, z); m.userData.noG = true; m.renderOrder = 2;
      world.scene.add(m); rdPools.push(m);
    });
  }
  const rdState = { on: -1 };
  function readingLamps(on) {
    if (!reading || Math.abs(on - rdState.on) < 1e-4) return;
    rdState.on = on;
    rdLights.forEach(l => world.setLampK(l, on));
    rdRoom.intensity = 34 * on;
    rdGlows.forEach(g => { g.s.material.opacity = g.k * on; });
    rdPools.forEach(p => { p.material.opacity = .38 * on; });
    world.dirty = true;
  }

  // ---------- the lecture room's house lights: its six opal globes (their glows) and a warm light for the
  // room, off in the dawn, coming up when the talk begins (05's result) ----------
  const lcGlows = [];
  let lcRoom = null;
  function addLectureLights() {
    lcRoom = new THREE.PointLight('#FFD7A4', 0, 80, 1);
    lcRoom.position.set(LECTURE.XM, 18, -12);
    world.scene.add(lcRoom);
    lecture.lamps.forEach(p => lcGlows.push(world.addGlow(p, { size: 4.2, k: 0, color: '#FFE6BE' })));
  }
  const lcState = { on: -1 };
  function lectureLamps(on) {
    if (!lecture || Math.abs(on - lcState.on) < 1e-4) return;
    lcState.on = on;
    lcRoom.intensity = 30 * on;
    lcGlows.forEach(s => { s.material.opacity = .8 * on; });
    world.dirty = true;
  }

  // 05's slide: traced from the page's own slide (the loader's card), so the 3D screen shows exactly what
  // the card shows; once the fonts have come
  async function paintSlide() {
    const el = sec.querySelector('.cm-slide');
    if (!el || !comms) return;
    try { await document.fonts.ready; } catch (e) { /* no font loading API */ }
    const cv = await traceEl(el, 960, 540, 2);
    if (!cv) return;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    comms.setSlide(tex);
    world.dirty = true; lastKey = ''; wake();
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
    addSteam([STUDY.CUP[0], .95, STUDY.CUP[2]]);
  }
  // steam: three wisps over a cup, each a soft line that waves and breaks as it rises (at, the cup's mouth)
  function addSteam(at, phase = 0) {
    const fxU = world.fxU;
    const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, .5, 0);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uPhase: { value: i * 2.1 + phase }, uK: { value: motion }, tSceneDepth: fxU.tSceneDepth, uScreen: fxU.uScreen },
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
      m.position.set(at[0] + (i - 1) * .16, at[1], at[2] + (i - 1) * .1);
      m.frustumCulled = false;
      world.fx.add(m); steam.push(m);
    }
  }
  // and in the other rooms: specks drifting slowly in each lamp's light, under its shade, seen only while
  // that room's lamps are on (each room one set of points, drawn over the kept frame like the study's dust)
  const motes = [];
  function addMotesUnder(lights, state, { drop, r, n }) {
    if (!lights || !lights.length) return;
    const N = lights.length * n, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    lights.forEach((l, j) => {
      for (let i = 0; i < n; i++) {
        const q = j * n + i, d = .2 + Math.random() * drop, rr = r * (.25 + .75 * d / drop) * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
        pos[q * 3] = l[0] + Math.cos(a) * rr; pos[q * 3 + 1] = l[1] - d; pos[q * 3 + 2] = l[2] + Math.sin(a) * rr; seed[q] = Math.random();
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.Points(g, dust.material.clone());
    m.material.uniforms.tSceneDepth = world.fxU.tSceneDepth; m.material.uniforms.uScreen = world.fxU.uScreen;
    m.frustumCulled = false; m.userData.state = state;
    world.fx.add(m); motes.push(m);
  }
  // the sky: clouds drifting slowly round the house, seen through every window (white by day, moonlit grey
  // at night, passing over the moon); a ring of sky far out, drawn over the kept frame where the sky shows
  let clouds = null;
  function addClouds() {
    const ge = new THREE.CylinderGeometry(420, 420, 170, 96, 1, true);
    clouds = new THREE.Mesh(ge, new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, side: THREE.BackSide,
      uniforms: { uTime: { value: 0 }, uDay: { value: 1 }, tSceneDepth: world.fxU.tSceneDepth, uScreen: world.fxU.uScreen },
      vertexShader: /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`${behind}
uniform float uTime, uDay;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float v = 0., a = .5; for (int k = 0; k < 5; k++) { v += a * n(p); p = p * 2.03 + 7.1; a *= .5; } return v; }
void main() {
  if (hidden_()) discard;
  // (around the ring and up it; the clouds drift along it, their shapes slowly changing)
  vec2 p = vec2(vUv.x * 40. + uTime * .012, vUv.y * 5.5);
  float d = fbm(p + vec2(0., uTime * .002)) - .48 + .1 * fbm(p * 3. - uTime * .01);
  float band = smoothstep(.06, .2, vUv.y) * (1. - smoothstep(.55, .9, vUv.y));
  float a = smoothstep(0., .22, d) * band;
  if (a < .01) discard;
  vec3 day = mix(vec3(.86, .89, .95), vec3(1.), smoothstep(.1, .35, d));
  vec3 night = mix(vec3(.17, .2, .3), vec3(.55, .59, .72), smoothstep(.1, .38, d));
  gl_FragColor = vec4(mix(night, day, uDay), a * mix(.8, .7, uDay));
}`,
    }));
    clouds.position.set(-70, 85, -45); clouds.frustumCulled = false;
    world.fx.add(clouds);
  }
  // the lecture room clock's second hand: a thin red hand with its counterweight, sweeping round once a minute
  // (real time), drawn over the kept frame
  let secondHand = null;
  function addSecondHand(ck) {
    const ge = new THREE.PlaneGeometry(.09, ck.r * 1.05); ge.translate(0, ck.r * .32, 0);
    const m = new THREE.Mesh(ge, new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: { tSceneDepth: world.fxU.tSceneDepth, uScreen: world.fxU.uScreen },
      vertexShader: /* glsl */`void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`${behind}
void main() { if (hidden_()) discard; gl_FragColor = vec4(.72, .16, .1, 1.); }`,
    }));
    m.position.set(ck.c[0], ck.c[1], ck.c[2] - .18); m.rotation.y = Math.PI; m.frustumCulled = false;   // (clear of the face for the depth test, far off)
    world.fx.add(m); secondHand = m;
  }
  function addRoomLife() {
    if (lecture && lecture.clock) addSecondHand(lecture.clock);
    if (!dust) return;
    addClouds();
    // (the writer's tea at night in the strong room; each room has its own things that move, never the same)
    if (archive && archive.dossier && archive.dossier.cup) addSteam(archive.dossier.cup, 2.6);
    if (hall) { addMotesUnder(hall.pendants, hallState, { drop: 6, r: 2.2, n: 26 }); addMotesUnder(hall.lamps, hallState, { drop: 1.6, r: .8, n: 8 }); }
    if (archive) addMotesUnder(archive.pendants, arcState, { drop: 6, r: 2, n: 30 });
    if (reading) { addMotesUnder(reading.lamps, rdState, { drop: 1.5, r: .8, n: 10 }); addMotesUnder(reading.lanterns, rdState, { drop: 7, r: 2.6, n: 34 }); }
  }
  function life(time, sunK) {
    if (dust) { dust.material.uniforms.uTime.value = time; dust.material.uniforms.uPx.value = world.ratio; dust.material.uniforms.uK.value = sunK; }
    steam.forEach(s => { s.material.uniforms.uTime.value = time; });
    // (the specks in the lamplight as bright as the sun's, a little more: easy to catch drifting)
    // (the clouds' light follows the hour: OUTSIDE_K is 1 by day and .4 at night)
    if (secondHand) { const d = new Date(); secondHand.rotation.z = -(d.getSeconds() + d.getMilliseconds() / 1000) * Math.PI / 30; }   // (clockwise as the room sees it: the hand's frame faces south)
    if (clouds) { clouds.material.uniforms.uTime.value = time; clouds.material.uniforms.uDay.value = Math.max(0, Math.min(1, (OUTSIDE_K.value - .4) / .6)); }
    motes.forEach(m => { const u = m.material.uniforms; u.uTime.value = time; u.uPx.value = world.ratio; u.uK.value = 1.15 * Math.max(0, m.userData.state.on || 0); });
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
    // (when the surface is near square to the camera, a flat transform puts its fourth corner within two
    // pixels: then a plain 2D one. Chrome can leave tiles of a layer under a perspective transform unpainted,
    // blank patches over the words; a 2D layer it always paints whole)
    const ax = x1 - x0, ay = y1 - y0, bx2 = x3 - x0, by2 = y3 - y0;
    if (Math.hypot(x0 + ax + bx2 - x2, y0 + ay + by2 - y2) < 2) return `matrix(${f6(ax / w)},${f6(ay / w)},${f6(bx2 / h)},${f6(by2 / h)},${f6(x0)},${f6(y0)})`;
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
  // the contents' page painted on the display's glass, a copy under the laid-on words: traced from the page's
  // own layout (each word where the page sets it, in its own font, size and colour; its fills and rules;
  // the logo), once the fonts have come. Where the browser fails to draw a part of the laid-on page, the
  // same page shows beneath it, never a blank glass
  async function paintGlass() {
    if (!ed || !study || !study.glass) return;
    try { await document.fonts.ready; } catch (e) { /* no font loading API */ }
    const doc = ed.querySelector('[data-doc="contents"]');
    if (!doc) return;
    const cv = await traceEl(ed, ED_W, ED_H, 2, doc);
    if (!cv) return;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = study.glass.material;
    m.map = tex; m.emissiveMap = tex; m.color.set('#FFFFFF'); m.emissive.set('#FFFFFF'); m.emissiveIntensity = .5; m.needsUpdate = true;
    world.dirty = true; lastKey = '';
    wake();
  }
  // a laid-on page traced into a canvas from its own layout (box: the element whose box is the canvas, w by
  // h px, drawn at scale S; from: the part of it to trace): every word where the page sets it, in its font,
  // size and colour; its fills and rules; its images and the logo. Measured untransformed, in one step (no
  // frame passes, so nothing is seen to move)
  async function traceEl(box, w, h, S, from = box) {
    const logoImg = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = sec.dataset.logo; });
    const imgs = [...from.querySelectorAll('img')];
    await Promise.all(imgs.map(im => im.complete ? null : new Promise(r => { im.onload = im.onerror = r; })));
    const cv = document.createElement('canvas'); cv.width = Math.round(w * S); cv.height = Math.round(h * S);
    const c = cv.getContext('2d'); c.scale(S, S);
    const tf = box.style.transform; box.style.transform = 'none';
    const R0 = box.getBoundingClientRect(), rel = r => [r.left - R0.left, r.top - R0.top, r.width, r.height];
    const clear = v => !v || v === 'transparent' || /,\s*0\)$/.test(v);
    const bg = getComputedStyle(box).backgroundColor;
    c.fillStyle = clear(bg) ? '#FDFBF6' : bg; c.fillRect(0, 0, w, h);
    const range = document.createRange(), CAPS = ['normal', 'small-caps', 'all-small-caps', 'petite-caps', 'all-petite-caps', 'unicase', 'titling-caps'];
    const rule = (cs, side, x, y, w, h) => {
      const bw = parseFloat(cs[`border${side}Width`]), st = cs[`border${side}Style`];
      if (!(bw > 0) || st === 'none') return;
      c.fillStyle = cs[`border${side}Color`];
      const ry = side === 'Top' ? y : y + h - bw;
      if (st === 'dotted') for (let px = x; px < x + w; px += bw * 3) c.fillRect(px, ry, bw, bw);
      else c.fillRect(x, ry, w, bw);
    };
    const walk = el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      const [x, y, w, h] = rel(el.getBoundingClientRect());
      if (!clear(cs.backgroundColor)) { c.fillStyle = cs.backgroundColor; c.fillRect(x, y, w, h); }
      rule(cs, 'Top', x, y, w, h); rule(cs, 'Bottom', x, y, w, h);
      if (el.tagName === 'IMG') { if (el.naturalWidth) c.drawImage(el, x, y, w, h); return; }
      if (el.classList.contains('ed-logo')) { if (logoImg) { const lh = w * logoImg.height / logoImg.width; c.drawImage(logoImg, x, y + (h - lh) / 2, w, lh); } return; }
      if (el instanceof SVGElement) return;
      for (const n of el.childNodes) {
        if (n.nodeType === 1) { walk(n); continue; }
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if ('letterSpacing' in c) c.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
        if ('fontVariantCaps' in c) c.fontVariantCaps = CAPS.includes(cs.fontVariantCaps) ? cs.fontVariantCaps : 'normal';
        c.fillStyle = cs.color; c.textBaseline = 'alphabetic';
        const t = n.textContent, re = /\S+/g;
        let mt;
        while ((mt = re.exec(t))) {
          range.setStart(n, mt.index); range.setEnd(n, mt.index + mt[0].length);
          // (a word broken across two lines, at its hyphen, is set letter by letter, each where it falls)
          const parts = range.getClientRects().length > 1 ? [...mt[0]].map((ch, j) => [ch, mt.index + j]) : [[mt[0], mt.index]];
          for (const [txt, at0] of parts) {
            range.setStart(n, at0); range.setEnd(n, at0 + txt.length);
            const [rx, ry, , rh] = rel(range.getBoundingClientRect()), word = cs.textTransform === 'uppercase' ? txt.toUpperCase() : txt;
            const me = c.measureText(word), asc = me.fontBoundingBoxAscent || rh * .8, des = me.fontBoundingBoxDescent || rh * .2;
            c.fillText(word, rx, ry + rh * asc / (asc + des));
          }
        }
      }
    };
    walk(from);
    box.style.transform = tf;
    return cv;
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

  // 03: the writer's screen, its workspace laid on the glass in perspective (as the study's display);
  // its pane is the step being done, its parts show as the work reaches them (dossier.js's MARKS), and
  // the closing card's logo is written by the pen as it shows, then its rows are checked (house.css).
  // Seen from the hall the screen shows through the archive's door, its words cut to the doorway's
  // opening; from nowhere else
  // (on 03's own loader the card is already on, its logo written: the intro does not write it again)
  const dosState = { tf: '', vis: '', clip: '', pane: -1, step: -1, marks: [], qc: '', st: '', end: fromI === AI && !STATIC };
  const STATES = ['Building', 'Authoring', 'Linking', 'Checking', 'Publishing', 'Responding', 'Validated'];
  const dosSeq = dosScreen && dosScreen.querySelector('.ds-bar b'), dosNum = dosScreen && dosScreen.querySelector('.ds-n'), dosSt = dosScreen && dosScreen.querySelector('.ds-st'), dosQc = dosScreen && dosScreen.querySelector('.ds-qc'), dosWrap = dos && dos.querySelector('.ds-wrap');
  const dosStep = k => { const s = archive.dossier.steps; let i = 0; while (i < s.length - 1 && k >= s[i + 1]) i++; return i; };
  const AD = HALL.DOOR, ADX = HALL.X0 - HALL.T / 2, archDoor = [[ADX, AD.top, AD.z + AD.w / 2], [ADX, AD.top, AD.z - AD.w / 2], [ADX, HALL.FLOOR, AD.z - AD.w / 2], [ADX, HALL.FLOOR, AD.z + AD.w / 2]];
  function placeDossier() {
    if (!dosScreen || !archive) return;
    if (fromI === AI && !introStart && !introDone) return;   // (the screen is the loader's card until its intro begins)
    const D = archive.dossier, k = dosK, cp = world.camera.position, cx = cp.x;
    // (only once the camera is in the room: from the hall the screen is a small lit glass far off, and
    // the door swinging in would stand before it; its glass shows a faint picture of the workspace. And
    // only while the camera is before the glass: gliding on down the table to the reading room, it passes
    // over the screen and leaves it behind)
    const G = D.screen, before = (cp.x - G.centre[0]) * G.normal[0] + (cp.y - G.centre[1]) * G.normal[1] > .05;
    const q = cx < ADX && cx > READING.X1 && before ? project4(D.screen.corners) : null, clip = 'none';
    if (q) { const tf = quad(dosScreen.offsetWidth, dosScreen.offsetHeight, q); if (dosState.tf !== tf) { dosState.tf = tf; dosScreen.style.transform = tf; } }
    const vis = q ? 'visible' : 'hidden';
    if (dosState.vis !== vis) { dosState.vis = vis; dosScreen.style.visibility = vis; }
    if (dosWrap && dosState.clip !== clip) { dosState.clip = clip; dosWrap.style.clipPath = clip; }
    // (the words take over from the glass's own picture of them over the camera's first steps into the
    // room, the two the same, so nothing is seen to change)
    const fade = q ? Math.min(1, (ADX - cx) / 1.5).toFixed(3) : '0';
    if (dosState.fade !== fade) { dosState.fade = fade; dosScreen.style.opacity = fade; }
    // the pane: the step being done (at rest, the closing card)
    const s = dosStep(k);
    if (dosState.pane !== s) { dosState.pane = s; dosPanes.forEach((p, i) => p.classList.toggle('on', i === s)); if (dosNum) dosNum.textContent = STATES[s]; }
    // the parts the work has reached; 2.5's figure caught, then corrected
    dosMarks.forEach((el, j) => { const on = k >= (D.marks[el.dataset.mark] ?? 2); if (dosState.marks[j] !== on) { dosState.marks[j] = on; el.classList.toggle('on', on); } });
    const qc = k < D.marks.c25 ? '' : k < D.marks.fix ? 'bad' : 'fixed';
    if (dosQc && dosState.qc !== qc) { dosState.qc = qc; dosQc.classList.toggle('bad', qc === 'bad'); dosQc.classList.toggle('fixed', qc === 'fixed'); }
    // the sequence in the bar: the answer to the agency goes as the dossier's next eCTD sequence
    const seq = k >= D.marks.a;
    if (dosSeq && dosState.seq !== seq) { dosState.seq = seq; dosSeq.classList.toggle('s1', seq); }
    // the state in the bar
    const st = k >= D.marks.end ? 'Validated' : k <= 0 ? 'Ready' : STATES[s];
    if (dosState.st !== st) { dosState.st = st; if (dosSt) dosSt.textContent = st; dosScreen.classList.toggle('done', st === 'Validated'); }
    // the closing card: its logo written as it shows, then its rows checked
    const end = !!q && k >= D.marks.end;
    if (end !== dosState.end) {
      dosState.end = end;
      const p = dosLogo ? playerOf(dosLogo) : null;
      if (!end) { dosScreen.classList.remove('checked'); if (p) p.reset(); }
      else if (!p || REDUCE) { if (p) p.settle(); dosScreen.classList.add('checked'); }
      else p.play().then(() => { if (dosState.end) dosScreen.classList.add('checked'); });
    }
    // the step being done, said in the caption's place (house.css)
    const bt = (() => { const B = archive.dossier.beats || [0]; let i = 0; while (i < B.length - 1 && k >= B[i + 1]) i++; return i; })();
    if (dosState.step !== bt) { dosState.step = bt; dosSteps.forEach((li, i) => li.classList.toggle('on', i === bt)); }
  }

  // 04: MeWriT's slip in the journal on the stand, its logo laid on it in perspective while the camera is in
  // the reading room and the journal lies open at the article (the slip is in plain view there); the pen
  // writes the logo as it comes, and it is made ready to be written again when the reader leaves
  const slipState = { tf: '', vis: '' };
  let slipArrived = fromI === PI && !STATIC;
  function placeSlip() {
    if (!slipEl || !pub || PI < 0) return;
    if (fromI === PI && !introStart && !introDone) return;   // (the slip is the loader's card until its intro begins)
    const open = !introDone ? fromI === PI : pubK >= .966 && world.camera.position.x < READING.X1;
    const q = open ? project4(pub.slip.corners()) : null;
    if (q) { const tf = quad(slipEl.offsetWidth, slipEl.offsetHeight, q); if (slipState.tf !== tf) { slipState.tf = tf; slipEl.style.transform = tf; } }
    const vis = q ? 'visible' : 'hidden';
    if (slipState.vis !== vis) { slipState.vis = vis; slipEl.style.visibility = vis; }
    if (!!q !== slipArrived) {
      slipArrived = !!q;
      const p = slipLogo ? playerOf(slipLogo) : null;
      if (p) { if (!slipArrived) p.reset(); else if (REDUCE) p.settle(); else p.play(); }
    }
  }

  // 04: the step being done, said in the caption's place (house.css); there is no screen in 04, the work is
  // in the book and the room
  const pubSteps = [...sec.querySelectorAll('.pub-steps li')], pubState = { step: -1 };
  function placePub() {
    if (!pub || !pubSteps.length) return;
    const s = pub.steps; let i = 0;
    while (i < s.length - 1 && pubK >= s[i + 1]) i++;
    if (pubState.step !== i) { pubState.step = i; pubSteps.forEach((li, j) => li.classList.toggle('on', j === i)); }
  }

  // 05: the beat being done, said in the caption's place (house.css)
  const cmSteps = [...sec.querySelectorAll('.cm-steps li')], cmState = { step: -1 };
  function placeComms() {
    if (!comms || !cmSteps.length) return;
    const s = comms.steps; let i = 0;
    while (i < s.length - 1 && commsK >= s[i + 1]) i++;
    if (cmState.step !== i) { cmState.step = i; cmSteps.forEach((li, j) => li.classList.toggle('on', j === i)); }
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
  let Pr = startP, time = 0, last = 0, raf = 0, lastKey = '', lastShow = 0, probe = null, recShares = null, dosK = 0, doorU = 0, doorU2 = 0, doorNU = 0, pubK = 0, commsK = 0;
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
    // (a smoothing that never overshoots, unhurried: a wheel's step is a glide of about half a second, never
    // a jump; and never faster than the film can be followed: a fast flick plays each move and each beat in
    // at least its own time (paceAt), unless the reader is more than a chapter away, plan 11.21)
    if (motion) {
      let step = (Pt - Pr) * (1 - Math.exp(-dt * 3.6));
      if (!glide && introDone) { const lim = paceAt(Pr) * dt * (1 + Math.max(0, Math.abs(Pt - Pr) - 1) * 3); step = Math.max(-lim, Math.min(lim, step)); }
      Pr += step;
    } else Pr = Pt;
    if (Math.abs(Pt - Pr) < 1e-4) Pr = Pt;
    time += dt;
    // (a flight to a chapter shows its own place in the film; landing, the page is put there)
    let Pf = Pr, fu = 0;
    if (flight && world && ready) {
      const f = flightAt(now); Pf = f.P; fu = f.u;
      if (f.u >= 1) { Pr = Pf = flight.PT; window.scrollTo({ top: Math.round(scrollFor(flight.PT)), behavior: 'instant' }); flight = null; flightPose = null; }
    }
    const st = at(Math.min(Pf, S - 1e-6));
    if (introDone) meters(Math.min(flight ? Pf : Pr, S - 1e-6));
    // (while a chapter's loader plays and the camera draws back, the list already names that chapter)
    if (flight) activate(fu > .8 ? flight.t : -1); else if (introDone) activate(capOf(st)); else if (introStart) activate(fromI);
    // the scroll cue: at the title page only, until the reader scrolls
    const cue = introDone && Pt < .02 && !glide && !flight ? 'on' : 'off';
    if (stage.dataset.cue !== cue) stage.dataset.cue = cue;
    // and at the record, while it fills (from the moment the camera settles before it)
    const stP = st;
    // (and at the archive while the dossier is made: each chapter that performs says so in its own words)
    const performing = introDone && !glide && !flight && (stP.i === RI || stP.i === AI || stP.i === PI || stP.i === CI) && ((stP.phase === 0 && stP.m > .94) || (stP.phase === 1 && stP.k < .985));
    const fillCue = !performing ? 'off' : stP.i === RI ? 'on' : stP.i === AI ? 'dos' : stP.i === CI ? 'cm' : 'pub';
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
      const atEnd = introDone && !flight && Pt > S - .02;
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
      cam = introStart ? lerpPose(introFrom, V[restView(c)], easeIO(intro)) : V[restView(c)];
      hA = c.hour; spot = c.spot || 0; docMix[c.doc] = 1;
    } else ({ cam, hA, hB, hK, spot } = sceneAt(st, V, docMix));
    // (a held pose for review: in its own hour if it names one, without the title page's pool)
    if (flight && flightPose) cam = flightPose;
    lastCam = cam;
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
      const fill = probe && probe.fill !== undefined ? probe.fill : !introDone ? (fromI >= RI ? 1 : 0) : heldK(RI, fillOf(st));
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
      const dk = probe && probe.dossier !== undefined ? probe.dossier : !introDone ? (fromI >= AI ? 1 : 0) : heldK(AI, ci > AI ? 1 : ci < AI || st.phase === 0 ? 0 : st.k);
      // (its pieces cast the lamp's shadows: drawn again as they move)
      if (archive.dossier.set(dk)) world.shadowsDirty();
      dosK = dk;
      // the strong-room door: shut until the reader turns from the record to walk to it; it opens inward
      // (the wheel turns, the door swings into the room) well before the camera reaches it, and shuts
      // behind the camera once it stands in the room, clear of the door's swing; shut from then on, and
      // opened again if the reader goes back
      const du = probe && probe.door !== undefined ? probe.door : !introDone || ci !== AI ? 0 : st.phase === 0 ? sstep(.36, .62, st.m) : st.phase === 1 ? 1 - sstep(0, .05, st.k) : 0;
      if (archive.door && archive.door.set(du)) world.shadowsDirty();
      // the room taking part in the work (the bay of clinical study reports that opens)
      if (archive.room && archive.room.set(dk, archive.dossier.marks)) world.shadowsDirty();
      doorU = du;
      // the door on to the reading room: it opens into the strong room (as the hall door does) while the
      // camera glides down the table toward it, well before the camera reaches its swing, and shuts behind
      // the camera once it stands in the reading room
      const du2 = probe && probe.door2 !== undefined ? probe.door2 : !introDone || PI < 0 || ci !== PI ? 0 : st.phase === 0 ? sstep(.18, .5, st.m) : st.phase === 1 ? 1 - sstep(0, .06, st.k) : 0;
      if (archive.door2 && archive.door2.set(du2)) world.shadowsDirty();
      doorU2 = du2;
    }
    // the reading room: its lamps come on as the reader comes in; 04's work as far as it has got
    if (reading && PI >= 0) {
      const ci = introDone ? st.i : fromI;
      readingLamps(probe && probe.lamps !== undefined ? probe.lamps : ci > PI ? 1 : ci < PI ? 0 : !introDone || st.phase > 0 ? 1 : sstep(.35, .8, st.m));
      const pk = probe && probe.pub !== undefined ? probe.pub : !introDone ? (fromI >= PI ? 1 : 0) : heldK(PI, ci > PI ? 1 : ci < PI || st.phase === 0 ? 0 : st.k);
      if (pub && pub.set(pk)) world.shadowsDirty();
      pubK = pk;
    } else if (reading) readingLamps(probe && probe.lamps !== undefined ? probe.lamps : 0);
    // the lecture room: the reading room's north door opens as the reader walks to it and shuts behind the
    // camera once it stands in the lecture room; 05's work as far as it has got; the house lights come up
    // for the talk (05's result)
    let doorN = 0; doorNU = 0;
    if (lecture && CI >= 0) {
      const ci = introDone ? st.i : fromI;
      doorN = probe && probe.doorN !== undefined ? probe.doorN : !introDone || ci !== CI ? 0 : st.phase === 0 ? sstep(.22, .52, st.m) : st.phase === 1 ? 1 - sstep(0, .06, st.k) : 0;
      if (reading.doorN && reading.doorN.set(doorN)) world.shadowsDirty();
      doorNU = doorN;
      const ck = probe && probe.comms !== undefined ? probe.comms : !introDone ? (fromI >= CI ? 1 : 0) : heldK(CI, ci > CI ? 1 : ci < CI || st.phase === 0 ? 0 : st.k);
      if (comms && comms.set(ck)) world.shadowsDirty();
      commsK = ck;
      lectureLamps(probe && probe.lamps !== undefined ? probe.lamps : ci > CI ? 1 : ci < CI ? 0 : sstep(.88, .96, ck));
    }
    // (the reading room is not drawn while the camera is on the strong room's side of its shut east door, or
    // in the lecture room with the door between them shut, or further off: nothing of it can be seen, and it
    // is a hundred pieces of paper. Nor the lecture room, but from the reading room with its door open)
    const inLecture = cam.p[2] > LECTURE.Z1 && cam.p[0] < LECTURE.X1 + .5;
    if (reading) {
      const vis = !!probe || (cam.p[0] < READING.X1 && (!inLecture || doorN > 0)) || (cam.p[0] < ARCHIVE.X1 && doorU2 > 0);
      if (reading.group.visible !== vis) { reading.group.visible = vis; if (pub) pub.group.visible = vis; world.dirty = true; world.shadowsDirty(); }
    }
    if (lecture) {
      const vis = !!probe || inLecture || (cam.p[0] < READING.X1 && doorN > 0);
      if (lecture.group.visible !== vis) { lecture.group.visible = vis; if (comms) comms.group.visible = vis; world.dirty = true; world.shadowsDirty(); }
    }
    // (and the rooms behind, a phone's GPU spared their drawing: from the reading room or the lecture room nothing
    // of the study or the hall can be seen; from the lecture room with its door shut, nothing of the strong room;
    // from the strong room, nothing of the study. Never a room whose door is in view: the strong room's doors are
    // its own, so it stays while the reading room's door stands open)
    {
      const farEast = cam.p[0] < READING.X1 || inLecture, inStrong = cam.p[0] < ARCHIVE.X1 && cam.p[2] < -27;
      const show = (grp, vis) => { if (grp && grp.visible !== vis) { grp.visible = vis; world.dirty = true; world.shadowsDirty(); } };
      show(study && study.group, !!probe || !(farEast || inStrong));
      show(hall && hall.group, !!probe || !(farEast || (inStrong && doorU <= 0)));
      show(archive && archive.group, !!probe || !(inLecture && doorN <= 0));
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
      placeDossier();
      placePub();
      placeComms();
      placeSlip();
      show = true;
    }
    life(time, 1 - spot * .8);
    if (show || (motion && now - lastShow >= 33)) { world.present(); lastShow = now; }
    // keep running while anything is on its way (the scroll's smoothing, a glide, the intro); at rest
    // the loop runs only for the living things (and not at all with reduced motion)
    return glide || flight || Pt !== Pr || moved || !introDone || motion;
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
    get state() { const st = at(Math.min(Pr, S - 1e-6)); return { P: +Pr.toFixed(4), i: st.i, phase: st.phase, m: +st.m.toFixed(3), k: +st.k.toFixed(3), fill: +fillOf(st).toFixed(3), door: +doorU.toFixed(3), door2: +doorU2.toFixed(3), doorN: +doorNU.toFixed(3), flying: !!flight, cam: world ? world.camera.position.toArray().map(v => +v.toFixed(2)) : null }; },
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
