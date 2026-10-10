/* The record's lettered band, measured once for the hall's 3D (hall.js) and for its words and loader
   (src/pages/house/index.astro, film.js): the cartouche with the logo, the frieze lettered "Twenty-two
   years, on the record", and the four ivory boards with the figures. All three lie in one plane on the
   record's face, so the words laid on them in perspective and the loader's flat card of the same band
   line up exactly. Units are the house's (about 10 cm); in the band, x runs from its left edge and y
   down from its top. No three.js here: the page reads it at build time. */
export const FLOOR = -7.5;
export const REC = { x0: -54.5, bay: 11, bays: 4, z: -96, depth: 2.4, plinth: 1.2, shelves: 8, pitch: 2.6 };
// heights (y up, in the hall): the shelves' tops, the boards, the frieze, the cornice, the cartouche
export const SHELF0 = FLOOR + REC.plinth;
export const SHELF_TOP = SHELF0 + REC.shelves * REC.pitch;
export const BOARD = [SHELF_TOP + .3, SHELF_TOP + 4.2];
export const FRIEZE = [BOARD[1] + .3, BOARD[1] + 3.7];
export const CORNICE = [FRIEZE[1], FRIEZE[1] + 1.1];
export const CREST = [CORNICE[1] + .5, CORNICE[1] + 4.7];
export const RX0 = REC.x0, RX1 = REC.x0 + REC.bays * REC.bay, RCX = (RX0 + RX1) / 2;
// the face the words lie on (z) and the band's extent in the hall
export const FACE = REC.z + REC.depth + .33;
export const BAND = { x0: RX0 - .4, x1: RX1 + .4, top: CREST[1], bottom: BOARD[0] };
// the loader's card: the band, a little wall above the cartouche and the top shelf of volumes below the
// boards, shown as a picture of the 3D itself (public/house/record-band.webp: rendered by the
// scratchpad's band_shot.js from this same frame) with the words live on it
export const CARD = { x0: BAND.x0 - .6, x1: BAND.x1 + .6, top: BAND.top + .5, bottom: BOARD[0] - REC.pitch - .25 };
// the band's parts as rectangles in the card: { x, y, w, h }
const part = (x0, x1, y0, y1) => ({ x: x0 - CARD.x0, y: CARD.top - y1, w: x1 - x0, h: y1 - y0 });
export const LAYOUT = {
  w: CARD.x1 - CARD.x0, h: CARD.top - CARD.bottom,
  crest: part(RCX - 6.5, RCX + 6.5, CREST[0], CREST[1]),
  frieze: part(BAND.x0, BAND.x1, FRIEZE[0], FRIEZE[1]),
  boards: Array.from({ length: REC.bays }, (_, b) => part(RX0 + b * REC.bay + .7, RX0 + (b + 1) * REC.bay - .7, BOARD[0], BOARD[1])),
};
// the HTML is set out at this many px to a unit, then scaled onto the band
export const PX = 50;
