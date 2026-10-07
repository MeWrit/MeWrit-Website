/* The experience's scenes, in scroll order (src/pages/experience.astro has their words, matched by
   id). Each scene names the formation the particles take (formations.js), the camera's shot as the
   scene starts (a) and as it ends (b), and its look: the background, the floor grid, the
   construction rings, how the shape turns. Callouts pin a label to one of the formation's anchors
   once the reveal passes `min` (phone: false keeps one off phones); readouts are the figures in the corner, counting up with the reveal
   where they have a `to`. Every figure here is illustrative. A shape either turns (spin, radians
   a second) or rocks to and fro (rock: [how far, how fast]).
   A shot is [camera position, the point it looks at, field of view, shift right, shift up]; the
   shifts move the picture off centre (as a fraction of the screen) to leave room for the words. */
import { F } from './formations.js';

const NAVY = ['#0B1A42', '#030817'], WARM = ['#1A1838', '#050817'], DEEP = ['#08122E', '#02050F'];

export const CHAPTERS = ['Drug development', 'Clinical trials', 'Medical research', 'Data & statistics', 'Analysis', 'Reporting', 'Manuscript & publication'];

export const SCENES = [
  {
    id: 'open', form: F.MOLECULE, chapter: -1,
    a: [[0, .5, 18.5], [0, 0, 0], 36, .19, 0], b: [[1.5, .9, 16.5], [0, .1, 0], 36, .19, 0],
    rock: [.62, .32], gain: .9, bg: NAVY, glow: ['#1C3472', .55], rings: 1,
    readout: [['Status', 'Ready'], ['Particles', 'N'], ['Chapters', '07']],
  },
  {
    id: 'drug', form: F.MOLECULE, chapter: 0,
    a: [[3, 1.4, 16.5], [0, 0, 0], 38, .2, 0], b: [[-2, 1.9, 14.5], [0, .2, 0], 38, .2, 0],
    rock: [.62, .32], gain: .9, bg: NAVY, glow: ['#1C3472', .6], rings: 1,
    callouts: [{ at: 'core', label: 'Aromatic core', min: 0 }, { at: 'amide', label: 'Amide bond', min: 0 }, { at: 'carbonyl', label: 'Carbonyl', min: 0, side: 'l' }, { at: 'hydroxyl', label: 'Hydroxyl', min: 0, side: 'l' }],
    readout: [['Compound', 'MW-0712'], ['Stage', 'Preclinical'], ['Heavy atoms', '18']],
  },
  {
    id: 'enrol', form: F.CROWD, chapter: 1,
    a: [[1.5, .4, 19], [0, .3, -2], 42, .12, 0], b: [[-2.4, 1.1, 10.5], [.6, .4, -2], 42, .12, 0], size: .82, gain: 1.5,
    bg: WARM, glow: ['#3A2A3A', .5],
    callouts: [{ at: 'participant', label: 'Participant 001, enrolled', min: .15 }],
    readout: [['Screened', { to: 1306 }], ['Enrolled', { to: 480 }], ['Sites', '12']],
  },
  {
    id: 'randomise', form: F.STREAMS, chapter: 1,
    a: [[0, 2.2, 12.5], [0, .2, -14], 46, .1, 0], b: [[0, 2.6, 7.5], [0, .8, -18], 50, .1, 0],
    bg: DEEP, glow: ['#1C3472', .45], floor: [-1.9, .45],
    callouts: [{ at: 'source', label: 'Randomised 1:1', min: 0 }, { at: 'treatment', label: 'Arm A, treatment', min: 0 }, { at: 'control', label: 'Arm B, control', min: 0, side: 'l' }],
    readout: [['Allocation', '1:1'], ['Arm A', '240'], ['Arm B', '240']],
  },
  {
    id: 'research', form: F.PAPERS, chapter: 2,
    a: [[0, -3, 14.5], [0, -1.6, -3], 44, .12, 0], b: [[0, 9.6, 13.5], [0, 10.4, -3], 44, .12, 0],
    spin: .04, bg: NAVY, glow: ['#1C3472', .5],
    callouts: [{ at: 'included', label: 'Included in the review', min: .55 }],
    readout: [['Records', { to: 2400 }], ['Screened', { to: 312 }], ['Included', { to: 18 }]],
  },
  {
    id: 'data', form: F.LANDSCAPE, chapter: 3,
    a: [[-9, 5, 11], [0, -1, -6], 46, .1, 0], b: [[7, 6, 3.5], [-1, -1.2, -12], 46, .1, 0],
    bg: DEEP, glow: ['#1C3472', .4], floor: [-2.75, .35], grid: .5,
    callouts: [{ at: 'peak', label: 'Primary endpoint', min: .6 }, { at: 'second', label: 'Secondary endpoint', min: .4 }, { at: 'near', label: 'Subgroup', min: .1, side: 'l' }],
    readout: [['Variables', { to: 1326 }], ['Observations', { to: 38400 }], ['Missing', '0.4%']],
  },
  {
    id: 'analysis', form: F.CURVES, chapter: 4,
    a: [[-3.5, 1.8, 18], [0, .5, 0], 38, .06, 0], b: [[3, .4, 15.5], [.6, .5, 0], 38, .06, 0],
    bg: NAVY, glow: ['#1C3472', .45], grid: 1,
    callouts: [{ at: 'treatment', label: 'Treatment', min: .9 }, { at: 'control', label: 'Control', min: .9 }, { at: 'effect', label: 'HR 0.72, 95% CI 0.58 to 0.89', min: .62 }, { at: 'axis', label: 'Months', min: 0, side: 'l' }],
    readout: [['Hazard ratio', '0.72'], ['95% CI', '0.58 to 0.89'], ['p', '< 0.001']],
  },
  {
    id: 'reporting', form: F.DOSSIER, chapter: 5,
    a: [[0, 1.4, 20], [0, -.2, -2], 40, .1, -.02], b: [[1.4, .6, 16.5], [0, -.2, -2], 40, .1, -.02],
    bg: NAVY, glow: ['#1C3472', .5],
    callouts: ['Protocol', 'SAP', 'IB', 'CSR, ICH E3', 'CTD 2.5', 'CTD 2.7', 'Narratives'].map((label, j) => ({ at: 'p' + j, label, min: .04 + .9 * j / 7 + .08, dy: j % 2 ? 46 : 12, phone: ![1, 2, 5].includes(j) })),
    readout: [['Documents', { to: 7 }], ['Standard', 'ICH E3'], ['Pages', { to: 1840 }]],
  },
  {
    id: 'manuscript', form: F.MANUSCRIPT, chapter: 6,
    a: [[-2.4, 0, 21.5], [0, 1.3, 0], 40, .08, 0], b: [[1.4, 2.1, 19.5], [0, 1.5, 0], 40, .08, 0],
    bg: NAVY, glow: ['#1C3472', .5],
    callouts: [{ at: 'title', label: 'Title', min: .1 }, { at: 'abstract', label: 'Structured abstract', min: .3 }, { at: 'figure', label: 'Figure 2', min: .55 }, { at: 'stamp', label: 'Accepted', min: .98 }],
    readout: [['Guidelines', 'ICMJE, GPP'], ['Words', { to: 3480 }], ['Status', 'In review', 'Accepted']],
  },
  {
    id: 'publication', form: F.GLOBE, chapter: 6,
    a: [[0, 2.6, 22], [0, 0, 0], 38, .12, 0], b: [[-1.6, 4, 19], [0, .4, 0], 38, .12, 0],
    spin: .03, spinFrom: -1.27, spinBy: .9, bg: DEEP, glow: ['#1C3472', .7], orbit: 1,
    callouts: [{ at: 'home', label: 'Ahmedabad', min: 0 }, ...['London', 'Boston', 'Singapore', 'Tokyo', 'Sydney'].map((c, j) => ({ at: c, label: c, min: .5, side: j % 2 ? 'l' : 'r', facing: true }))],
    readout: [['Cities', { to: 16 }], ['From', 'Ahmedabad'], ['Readers', 'Worldwide']],
  },
  {
    id: 'close', form: F.GLOBE, chapter: -1,
    a: [[0, 4.5, 23], [0, .5, 0], 38, 0, -.04], b: [[0, 7, 30], [0, 1.5, 0], 38, 0, -.1],
    spin: .03, spinFrom: -.37, spinBy: .5, bg: DEEP, glow: ['#1C3472', .8], orbit: 1,
    readout: [['MeWriT', 'Writing Science Right']],
  },
];
