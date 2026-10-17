/* The experience's scenes, in scroll order (src/pages/experience.astro has their words, matched by
   id): an opening, then the five practices a client chooses from (CHAPTERS, the rail along the
   foot, and the shapes of the second scene; each practice stands on its own), then the close. Each
   scene names the formation the particles take (formations.js), the practice it belongs to
   (chapter, -1 for none), the camera's shot as the scene starts (a) and as it ends (b), and its
   look: the background, the floor grid, how the shape turns. Callouts pin a label to one of the formation's
   anchors once the reveal passes `min` (phone: false keeps one off phones, and off computer
   screens where the picture is drawn small enough to crowd it); readouts are the figures in the
   corner, counting up with the reveal where they have a `to` (a third value shows once the reveal
   is complete). The figures are MeWriT's own; a scene whose picture or figures are only
   illustrative says so in its `note`, shown under them. A shape may turn slowly on its own (spin,
   radians a second); nothing rocks, and within a scene the camera only glides one way with the
   scroll, round the shape and a little closer (experience.js: ORB, PUSH; the user found back-and-forth
   movement nauseating and wanted calm motion tied to the scroll, 2026-10-13 to 17). layout:
   'center' stands the shape between the words' two columns; used rarely, the rest keep one place.
   idle: the scene's small action at rest (the user chose "small real actions", 2026-10-17), on the
   shape's own drawing order (its keys): 'rewrite' fades back a stretch len long and the pen writes it
   again (a line of the page, a page of the dossier, a stretch of the curves), stepping through range;
   'pass' sends only the pen's front (the logo's orange) through range: a signal through the network,
   routes out from Ahmedabad. The crowd uses 'rewrite' (people inked again in turn): an orange front
   would vanish among its orange people. every: seconds from one action to the next; take: the pen's
   seconds. The molecule and the rivers have none (the rivers flow on their own).
   A shot is [camera position, the point it looks at, field of view, shift right, shift up], but
   only its direction (from the point looked at to the camera) and its field of view are used: the
   experience fits every shape to its frame on each screen (experience.js, fitShot), standing the
   camera as far back along that direction as the shape needs to fill the scene's target, and
   shifting the picture onto it. The move from a to b is the scene's slow drift. A scene may
   override what is fitted and where: box (a part of the shape, or a padded one: { c, size }),
   target and targetPhone (the rectangle on the stage, in fractions), pad (room in px kept clear
   inside the target, [top, right, bottom, left], for labels), over (the words may stand over the
   shape, on a stronger shade). light: 1 for a scene by day (cream, the shape in navy ink; world.js
   moves between night and day through a pastel dawn as the scroll crosses from one to the other),
   none for the night. */
import { F } from './formations.js';
import { YEARS } from '../../data/years';

const NAVY = ['#0B1A42', '#030817'], WARM = ['#1A1838', '#050817'], DEEP = ['#08122E', '#02050F'];

export const CHAPTERS = ['Regulatory writing', 'Scientific publications', 'Medical communications', 'Training', 'AI/ML advisory'];

// past the close, the tail: the shapes dissolve into dust that stays behind the rest of the page, on
// a plain night (the page's own background, #030817, at the foot), dimmer and with less bloom; the
// dust itself, faint behind the shapes in the scenes, is brought up (dust) and a little larger (size)
// so it still shows, as a field of faint motes
export const TAIL = { bg: ['#060C22', '#030817'], glow: ['#1C3472', .22], gain: .6, bloom: .35, dust: 6, size: 1.5 };

export const SCENES = [
  {
    // the page writes itself as the loading screen lifts (its reveal runs on time, not scroll)
    id: 'open', form: F.PAGE, chapter: -1, idle: { mode: 'rewrite', range: [.13, .97], len: .07, every: 6.5, take: 2.6 },
    a: [[0, .41, 27.45], [0, 0, 0], 38, .22, -.11], b: [[1.77, .97, 27.61], [0, .2, 0], 38, .22, -.1],
    bg: NAVY, glow: ['#1C3472', .55],
    readout: [['Since', '2017'], ['Experience', `${YEARS}+ years`], ['Practices', '05']],
  },
  {
    // who writes: a molecule (the science behind the words), centred, the words on one side and the
    // figures on the other
    id: 'who', form: F.MOLECULE, chapter: -1, layout: 'center',
    a: [[1.6, .9, 12], [0, 0, 0], 36, 0, 0], b: [[-1.8, 1.3, 11.6], [0, .1, 0], 36, 0, 0],
    bg: NAVY, glow: ['#1C3472', .5],
  },
  {
    // why: the opening's page again, now checked and approved
    id: 'why', form: F.PAGE, chapter: -1, idle: { mode: 'pass', range: [.13, .97], every: 9, take: 4.5 },
    a: [[-1.9, .5, 27.3], [0, 0, 0], 38, 0, 0], b: [[-.5, 1.1, 27.6], [0, .2, 0], 38, 0, 0],
    bg: NAVY, glow: ['#1C3472', .5],
    callouts: [{ at: 'figure', label: 'Checked against the source', min: .3 }, { at: 'seal', label: 'Reviewed and approved', min: .6, side: 'l' }],
  },
  {
    // the five practices to choose from, on dusk indigo (raw: the sky is not tone-mapped, world.js):
    // the list in the words; the shapes, a button above each on wider screens (experience.js pins
    // them; where they stand too close, every other one hangs below), so the fit keeps room above and
    // below the arc
    id: 'practices', form: F.CHOICE, chapter: -1, idle: { mode: 'pass', range: [.07, .91], every: 8, take: 4 },
    a: [[-2.37, 1.78, 35.56], [0, 0, 0], 42, .23, -.06], b: [[2.45, 2.67, 35.48], [0, .1, 0], 42, .23, -.06],
    target: { x: .46, y: .16, w: .52, h: .62 }, pad: [62, 6, 62, 6],
    raw: 1, bg: ['#34315D', '#1A1B3B'], glow: ['#4B447B', .3],
  },
  {
    id: 'reg-designs', form: F.STREAMS, chapter: 0, light: 1,
    a: [[0, 2.2, 12.5], [0, .2, -14], 46, .1, 0], b: [[0, 2.6, 7.5], [0, .8, -18], 50, .1, 0],
    box: { c: [0, .5, -5], size: [7, 3, 16] },   // the rivers run 42 deep: fit their first stretch, the rest runs off into the distance
    bg: DEEP, glow: ['#1C3472', .45], floor: [-1.9, .45],
    callouts: [{ at: 'split', label: 'Randomised 1:1', min: 0, dy: -30 }, { at: 'treatment', label: 'Arm A, treatment', min: 0 }, { at: 'control', label: 'Arm B, control', min: 0, side: 'l' }],
    readout: [['Trial documents', { to: 100 }, '100+'], ['Phases', 'I to IV'], ['Also', 'BA/BE, PMS, RWE, IITs']],
    note: 'The trial shown is illustrative',
  },
  {
    id: 'reg-dossier', form: F.DOSSIER, chapter: 0, light: 1, idle: { mode: 'rewrite', range: [.03, .89], len: .1, every: 6, take: 2.2 },
    a: [[0, 1.69, 23.93], [0, -.2, -2], 54, .2, -.04], b: [[1.88, .88, 22.91], [0, -.2, -2], 50, .18, -.04],
    bg: NAVY, glow: ['#1C3472', .5],
    callouts: ['CSR, ICH E3', 'CTD 2.5', 'CTD 2.7', 'MAA dossier', 'Narratives', 'CIP / CER', 'Regulatory response'].map((label, j) => ({ at: 'p' + j, label, min: .04 + .9 * j / 7 + .08, dy: j % 2 ? 60 : 12, phone: ![1, 2, 5, 6].includes(j) })),
    readout: [['CSRs, ICH E3', { to: 30 }, '30+'], ['CTD summaries', { to: 30 }, '30+'], ['Narratives', { to: 1500 }, '1,500+']],
  },
  {
    id: 'pub-literature', form: F.PAPERS, chapter: 1, light: 1, idle: { mode: 'pass', range: [.02, .975], every: 9, take: 5 },
    a: [[0, -4.87, 25.73], [0, 3.75, -3], 53, .12, -.05], b: [[0, 12.31, 24.71], [0, 3.75, -3], 53, .14, -.01],
    spin: .04, size: 1.2, bg: NAVY, glow: ['#1C3472', .5],
    callouts: [{ at: 'included', label: 'Included in the review', min: .55 }],
    readout: [['Publications and presentations', { to: 70 }, '70+'], ['Acknowledged in', { to: 25 }, '25+ papers'], ['Book chapters', '4']],
  },
  {
    id: 'pub-manuscript', form: F.MANUSCRIPT, chapter: 1, light: 1, idle: { mode: 'rewrite', range: [.03, .985], len: .12, every: 7, take: 2.6 },
    a: [[-2.38, .01, 21.33], [0, 1.3, 0], 47, .22, -.05], b: [[1.5, 2.14, 20.94], [0, 1.5, 0], 46, .22, -.04],
    bg: NAVY, glow: ['#1C3472', .5],
    callouts: [{ at: 'title', label: 'Title', min: .1 }, { at: 'abstract', label: 'Structured abstract', min: .3 }, { at: 'figure', label: 'Figure 2', min: .55 }, { at: 'stamp', label: 'Accepted', min: .98 }],
    readout: [['Guidelines', 'ICMJE, GPP'], ['Congress presentations', { to: 30 }, '30'], ['Status', 'In review', 'Accepted']],
  },
  {
    id: 'med-evidence', form: F.LANDSCAPE, chapter: 2, light: 1, idle: { mode: 'pass', range: [.02, .97], every: 9, take: 4.5 },
    a: [[-12, 16.34, 17.67], [0, -1, -9], 67, .21, -.01], b: [[14.07, 20.11, 12.11], [0, -1, -9], 65, .24, .01],
    size: 2, gain: 1.6, bg: DEEP, glow: ['#1C3472', .4], floor: [-2.75, .35], grid: .5,
    callouts: [{ at: 'peak', label: 'Primary outcome', min: .6, side: 'l' }, { at: 'second', label: 'Secondary outcome', min: .4 }, { at: 'near', label: 'Subgroup', min: .1, side: 'l' }],
    readout: [['Evidence', 'Real-world'], ['Readers', 'Clinicians, payers, regulators'], ['Formats', 'Papers, statements, reports']],
  },
  {
    id: 'med-narrative', form: F.CURVES, chapter: 2, light: 1, idle: { mode: 'rewrite', range: [.03, .93], len: .3, every: 9, take: 3.5 },
    a: [[-5.14, 2.41, 26.44], [0, .5, 0], 46, .24, -.07], b: [[4.43, .34, 24.71], [.6, .5, 0], 44, .23, -.07],
    bg: NAVY, glow: ['#1C3472', .45], grid: 1,
    callouts: [{ at: 'treatment', label: 'Treatment', min: .9 }, { at: 'control', label: 'Control', min: .9 }, { at: 'effect', label: 'HR 0.72, 95% CI 0.58 to 0.89', min: .62, side: 'l' }, { at: 'axis', label: 'Months', min: 0, side: 'l', phone: false }],
    readout: [['Hazard ratio', '0.72'], ['95% CI', '0.58 to 0.89'], ['p', '< 0.001']],
    note: 'Figures are illustrative',
  },
  {
    id: 'training', form: F.CROWD, chapter: 3, light: 1, idle: { mode: 'rewrite', range: [.02, .98], len: .16, every: 6.5, take: 2.4 },
    a: [[2.42, .46, 31.91], [0, .3, -2], 51, .23, -.11], b: [[-6.62, 2.09, 28.1], [.6, .4, -2], 57, .24, -.1],
    size: 1, gain: 1.7,
    bg: WARM, glow: ['#3A2A3A', .5],
    callouts: [{ at: 'participant', label: '3,000+ trained', min: .3 }, { at: 'left', label: 'Pharma and CRO teams', min: .5 }, { at: 'right', label: 'Clinicians and residents', min: .5, side: 'l' }, { at: 'far', label: 'Students', min: .5 }],
    readout: [['Professionals trained', { to: 3000 }, '3,000+'], ['Training since', '2008'], ['Formats', 'Half-day to 3 days']],
  },
  {
    id: 'ai', form: F.NETWORK, chapter: 4, light: 1, idle: { mode: 'pass', range: [.03, .98], every: 5.5, take: 2.4 },
    a: [[-7.62, 5.08, 25.4], [0, 0, 0], 47, .22, -.12], b: [[16.58, 3.33, 18.85], [.5, 0, 0], 43, .18, -.11],
    bg: NAVY, glow: ['#1C3472', .5], grid: .5,
    callouts: [{ at: 'input', label: 'Source data and drafts', min: .05 }, { at: 'model', label: 'The model', min: .35, side: 'l' }, { at: 'output', label: 'Generated content', min: .65 }, { at: 'review', label: 'Expert review, in the loop', min: .85, dy: 40 }],
    readout: [['Review', 'Human in the loop'], ['Checks', 'Accuracy, relevance, quality'], ['Engagement', 'Hourly advisory']],
  },
  {
    id: 'close', form: F.GLOBE, chapter: -1, idle: { mode: 'pass', range: [.04, .86], every: 7, take: 3 },
    a: [[0, 2.82, 23.83], [0, 0, 0], 41, .22, -.15], b: [[0, 6.19, 25.57], [0, 1.5, 0], 39, .21, -.06],
    // the globe, centred behind the words (the arcs to the far cities run past its box)
    box: { c: [0, .4, 0], size: [10.6, 10.6, 10.6] }, target: { x: .3, y: .1, w: .62, h: .78 }, over: true,
    spin: .03, spinFrom: -1.27, bg: DEEP, glow: ['#1C3472', .75], orbit: 1,
    callouts: [{ at: 'home', label: 'Ahmedabad', min: 0 }, ...['London', 'Boston', 'Singapore', 'Tokyo', 'Sydney'].map((c, j) => ({ at: c, label: c, min: .5, side: j % 2 ? 'l' : 'r', facing: true }))],
    readout: [['Working with', 'Sponsors, CROs, clinicians'], ['Based in', 'Ahmedabad, India'], ['Reach', 'Global']],
  },
];
