/* The film's chapters, in scroll order: the order of the MeWriT deck (site/docs/redesign-plan.md,
   section 10.2). src/pages/lamplight/index.astro sets their words, matched by id, from
   src/data/lamp.ts. Each names its room (world: an engraved world from worlds/index.js, or 'study',
   the drawn morning room of study.js, laid out in depth), its light (1 by day: ink on paper; 0 by
   night: the engraved worlds as light) and how many screens of scroll it takes (span). In the study:
   which view of the room the camera holds (view: wide, display, close), the late afternoon's warmth
   (warm) and the document open in the editor on the display (editor: draft, contents, ai, terms). In
   the other rooms: the page, drawn as on the design board (sheets.js), as it arrives (page) and as it
   rests (rest, where the page changes on the spot: the record into a star, the sheet into the
   dossier, the letter sealed), a turn of the camera about the page (yaw; pitch, which lowers the
   camera to look up, degrees), center: the page (the star) in the middle of the frame rather than
   beside the caption, and room: how much of the room the shot takes in beyond the page (1 is the
   page with its close surroundings). And how the camera gets there from the chapter before (move): one
   house, joined by its windows and doors (section 10.3); film.js has the paths:
     view     in the study, from one view of it to another (in to the display, out to the desk)
     dusk     to the study's window, the light going; out through it and up to the stars
     down     down from the stars into the archive, through its skylight, along the moonbeam
     through  down the archive's aisle to the far door, and on into the reading room
     dawn     first light in the reading room's windows; then next door into the auditorium
     across   across the hall: the camera turns from the auditorium into the workshop room
     back     back at the desk: from the workshop to the study, in to the display
     sunset   to the study's window at sunset, out through it and on toward the horizon
   Also how present the world is (weight), the footnote and the colophon. */
export const CHAPTERS = [
  { id: 'title-page', world: 'study', light: 1, view: 'wide', span: .55, editor: 'draft' },
  { id: 'contents', world: 'study', light: 1, view: 'display', span: 1.3, editor: 'contents', pick: true, move: 'view' },
  { id: 'on-the-record', world: 'sky', light: 0, span: 2.3, page: 'record', rest: 'star', pitch: -20, center: true, move: 'dusk', footnote: true },
  { id: 'regulatory-writing', world: 'archive', light: 0, span: 1.9, page: 'sheet', rest: 'dossier', move: 'down' },
  { id: 'scientific-publications', world: 'reading', light: 0, span: 1.9, page: 'article', move: 'through' },
  { id: 'medical-communications', world: 'auditorium', light: 1, span: 2.0, page: 'slide', room: 1.3, move: 'dawn' },
  { id: 'training', world: 'workshop', light: 1, span: 1.6, page: 'handout', room: 1.3, move: 'across' },
  { id: 'ai-ml-advisory', world: 'study', light: 1, view: 'close', span: 1.6, editor: 'ai', move: 'back' },
  { id: 'how-we-work', world: 'study', light: 1, view: 'wide', warm: 1, span: 1.3, editor: 'terms', move: 'view' },
  { id: 'correspondence', world: 'dawn', light: 0, span: 2.0, page: 'letterOpen', rest: 'letter', move: 'sunset', colophon: true },
];
