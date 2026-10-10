/* The worlds of the lamplight film, in chapter order: the places where medical writing lives, drawn
   as luminous engravings (engrave.js is the engraver's kit). The film shows one or two at a time and
   cross-fades them; the test bench is src/pages/lamplight/worlds.astro.

   The contract:
     WORLDS[id](THREE, { quality: 'high' | 'low' }) builds a world once (low for phones: about a third
     of the strokes and points) and returns
     {
       id,          // 'desk', 'archive', 'reading', 'sky', 'dawn', 'auditorium' or 'workshop'
       group,       // a THREE.Group holding everything; every world shares the one origin and frame
       grade,       // { top, bottom, fog, fogDensity, light, glow: [colour, strength] }: the chapter's
                    // colour grade, for the film's background gradient, its glow and its bloom tint.
                    // fogDensity is per unit of depth beyond the page: the light that survives is
                    // exp(-fogDensity * max(0, distance from the eye - the page's distance from the eye))
       stage,       // { anchor, dir, fov, size }: the page's centre, the camera's preferred direction
                    // (from the anchor toward the camera), the field of view, and the box (centred on
                    // the anchor) that the camera should frame: the page and its nearby context
       setWeight(w),               // 0..1, the whole world's visibility; 0 hides it (group.visible = false)
       update(time, dt, camera),   // the animation (lamps, dust, twinkle, clouds) and the fog's start; cheap,
                                   // allocates nothing; time in seconds
       dispose(),
       stats,       // { buildMs, lineVerts, points, calls }: what the world costs (for the test bench)
     }
   The page is about 7.6 wide by 10.6 tall, upright at stage.anchor, facing +z; y is up; the camera
   looks roughly along -z. Anything the eye sees within about 4.5 by 6 of the anchor (behind the
   page or in front of it, carried along the line of sight to the page's plane) is held down by the
   worlds' own shaders, so the page stays readable from any angle.

   Drawing order: each world draws as one block among the film's transparent things, between
   renderOrder -9.5 and 1.9 (after a background at -10; the film's page draws at 5), and its first
   draw clears the depth buffer, so one world's solids never hide another's strokes during a
   cross-fade.
   The two day worlds, auditorium and workshop, are drawn to be shown by day as ink on paper (their
   strokes alone, mapped to ink; the test bench's ?ink shows how); workshop also carries `handouts`,
   the places on its desks where the page's copies lie.
   Leave group.renderOrder at 0 (a group's renderOrder sorts all its children first). The page is
   best drawn without depth testing (it stands in front of everything anyway). Everything lies within
   about 160 of the anchor: a camera far plane of 220 or more takes it all. */
import { desk } from './desk.js';
import { archive } from './archive.js';
import { reading } from './reading.js';
import { sky } from './sky.js';
import { dawn } from './dawn.js';
import { auditorium } from './auditorium.js';
import { workshop } from './workshop.js';

export const WORLDS = { desk, archive, reading, sky, dawn, auditorium, workshop };
