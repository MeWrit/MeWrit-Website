# MeWriT website

The new mewrit.com, built with [Astro](https://astro.build) 7 as a static site: every page
is plain HTML, CSS and a little JavaScript, with no framework running in the browser.

## Run it

Needs Node.js 22.12 or newer.

```sh
npm install        # once
npm run dev        # local site at http://localhost:4321, reloads as you edit
npm run build      # production site in dist/
npm run preview    # serve dist/ to check the production build
```

## Two versions of the home page

| Version | Address | Logo animation (on every load) |
| --- | --- | --- |
| A | `/` | The loading intro: the pen draws the logo over the page, with the hero's ribbons flowing behind it, then the logo glides into the header. Home page only. |
| B | `/version-b/` | No loading intro: the logo draws itself in the header (pen pops in, glides left, draws the line, docks; then the three labels appear). |

Both share everything else, including the hero ribbons, which flow through the copy and fade
out before the hero's drawing. In version A they are already flowing behind the loading
intro, on the same clock, so when the intro fades they carry straight on into the hero. Any
other page gets no logo animation on load unless it asks for one (`intro` on
`src/layouts/Base.astro`). On every page, though, the header logo draws itself again now and
then, in place: 30 seconds after the finished logo is on show (`LOGO_INTERVAL` in
`src/scripts/header-logo.js`), with the same pen and the logo's own ink. Not while the tab is
hidden, the header is off the screen or under an open menu, with reduced motion, or with `?static`.

## The hero's drawing

"From molecule to manuscript": a technical drawing of the work behind a medicine, in seven
stages that hand over to one another (drug development, clinical trials, medical research, data
and statistics, analysis, reporting, manuscript and publication). Twenty-four dots carry through
every stage, from the atoms of a molecule to the seal on the accepted paper. The figures in it
(the trial size, the hazard ratio and so on) are illustrative. Code: `src/scripts/pipeline.js`,
frame in `src/components/HeroVisual.astro`; the labels are set in IBM Plex Mono (open font licence).
The drawing itself is `src/scripts/pipeline-engine.js`.

## The experience (`/experience/`)

MeWriT's five practices as an immersive page: regulatory writing, scientific publications,
medical communications, training and AI/ML advisory. Each practice stands on its own and a client
chooses the ones they need, so the page presents a choice, not a sequence of steps. One cloud of
glowing particles (64,000 on computers, 24,000 on phones) carries the whole page. While it loads,
the dust gathers into a blank page and the page's outline (its frame, margin marks, header band and
page number) draws itself in step with the counter; as the loading screen lifts, the page moves
aside for the words and writes itself, top to bottom, in about four seconds. From there the
particles take a shape for each of eleven scenes as you scroll:

| Scene | Practice | Shape |
|---|---|---|
| `open` | (none) | a page of a clinical document, writing itself (the `PAGE` formation) |
| `practices` | (none) | the five practices as shapes, a button above each: a stack of pages under a seal, a journal page, a slide, a group of people, a small network (the `CHOICE` formation) |
| `reg-designs` | 01 Regulatory writing | two randomised arms flowing from one source |
| `reg-dossier` | 01 Regulatory writing | a fan of submission documents (CSR, CTD, MAA, narratives, CIP/CER, responses) |
| `pub-literature` | 02 Scientific publications | a spiral of papers, the ones in the review in orange |
| `pub-manuscript` | 02 Scientific publications | the accepted manuscript |
| `med-evidence` | 03 Medical communications | a landscape of real-world evidence |
| `med-narrative` | 03 Medical communications | Kaplan-Meier curves |
| `training` | 04 Training | an icon array of people, the trained ones lighting up |
| `ai` | 05 AI/ML advisory | a network in layers, a signal lit from input to output and a ring of expert review around the output (the `NETWORK` formation) |
| `close` | (none) | a globe with arcs from Ahmedabad, and the calls to action |

Past the close comes a tail: the globe dissolves into drifting dust, the words and the figures
fade out, and the dust stays, behind the rest of the page, for as long as you read on.

Each shape reveals itself as you scroll (the opening's page writes itself on time instead), labels
pin to its parts and figures sit in the corner. The practices along the foot (01 to 05) jump to
each practice; the one on screen fills as its scenes go by and empties as you move on. In the
practices scene a click on a shape's button jumps to that practice, and hovering or focusing a
button brightens its shape and dims the others. On computers the pointer parts the particles
anywhere on the page.

- The words: `src/data/experience.ts`, one entry per scene (copy and figures from the MeWriT deck,
  July 2026, and Dr Hetal's CV; for Dr Hetal to confirm). The practices, the scenes' shapes,
  labels, figures and camera shots: `src/scripts/xp/scenes.js`.
- The figures in the corner are MeWriT's own. The two scenes whose picture or figures are
  illustrative (the trial, the survival curves) say so under them.
- The 3D is drawn with three.js (MIT licence), pinned in `package.json`; every shape is generated
  in code, with no models or images (nothing on the page is drawn from the logo). It loads on its
  own, only on this page, so the words never wait for it; while the loading screen is up, every
  shape's buffers go up to the GPU (the last quarter of the counter), so a first change of shape
  does not stall a frame. Without WebGL the words still follow the scroll (the practices' buttons
  sit under their words), and with reduced motion the shapes change in place without flying and
  the opening's page appears written.
- The canvas is the page's backdrop: fixed, at z-index -1, under everything that follows, so the
  sections after the experience float over the dust. The page's body is made a stacking context of
  its own for that to hold (html and body both paint a background; see `xp.css`). It draws while
  the page is in view, every other frame on phones once only the dust is left, and pauses in a
  hidden tab.
- Framing: scenes are framed for a 1440 x 900 window, the shape right of the words and below the
  figures. Other computer screens scale and move the picture into the room they have (measured from
  their own words and panel); phones put it above the words, with their own shots where a scene's
  camera stands far back, and set the practices' five shapes in two rows. Where the five buttons
  would crowd each other (narrower computer screens), every other one hangs below its shape.
- Code: the page `src/pages/experience.astro`, styles `src/styles/xp.css`, and in `src/scripts/xp/`
  the shapes (`formations.js`), the scenes, their camera shots and the tail's look (`scenes.js`),
  the renderer (`world.js`) and what ties them to the scroll (`experience.js`).
- Review switch: `?static` skips the loading screen (the opening's page appears written).

## Small touches

- The labels above the section headings are set in the monospace and decode into place the first
  time they come into view (`src/scripts/decode.js`); screen readers get them as they are.
- Moving between pages, the page fades across, the capsule stays put and Dr Hetal's photo moves
  from the home page to her profile (view transitions, in `src/styles/base.css`; browsers without
  them simply change page).

## Profiles

Dr Hetal Shah's full profile is `/leadership/hetal-shah/` (`src/pages/leadership/hetal-shah.astro`),
with her recognition as an honours roll (`src/components/Recognition.astro`). The home page names
three of her honours in one line and links to it.

## Navigation

The floating capsule, on desktop and on phones, in a frosted liquid glass: the bar lifts off
the top edge and tightens as you scroll. On desktop a drop of glass glides to the link you
point at, and About and Services open a glass panel of small document cards. On phones the
capsule holds the logo and a Menu button, slips away while you read on down and comes back
when you scroll up; Menu grows the capsule into a glass card with the same entries and
cards. On computers running Chrome, Edge or another Chromium browser the glass's rim also
bends what is behind it like the edge of a thick lens (`src/scripts/glass.js`); phones,
tablets, Safari and Firefox show the same frosted glass without the bending (it costs smooth
scrolling on phones), as does `?glass=flat`. Code: the liquid glass and capsule
sections of `src/styles/nav-variants.css`, `src/scripts/nav-variants.js` (the lens and the
phone card), `src/components/CapsuleMenu.astro` (the phone card).

Review switches (add to the address): `?nointro` skips the page's own logo animation (the
replays still run), `?static` turns all motion off, `?logoloop=6` shortens the wait before each
logo replay from 30 to 6 seconds, and `?hero=ribbons` or `?hero=drawing` shows just one of the two
hero animations.

## Dark pages

`<Base theme="dark">` dresses the page chrome for a dark, immersive page
(`src/styles/theme-dark.css`): the capsule, its panels, the phone capsule and its card turn to
dark navy glass with ice text and gold highlights, and the quick contact goes dark (WhatsApp
stays green). The page itself gets a dark background (#030817), light text and headings and a
gold focus ring, unless its own sections set them. The logo is never recoloured or redrawn: it
is a registered trade mark, so on a dark page it sits unchanged on a plate of frosted white glass
inside the capsule (as it does on the footer's white plate), and so does its drawing.

## Nav lab

`/nav-lab/` is the home page with a switcher for the navigation experiments, opening on the
chosen floating capsule: on desktop the standard bar, the heartbeat rail (the logo's pen
writes the underline on a trace that follows the section being read) and the floating
capsule; on phones the floating capsule, the menu button or a bottom dock with sheets. The
same variants work on any page with `?nav=capsule|classic|rail` and
`?phone=capsule|menu|dock` (`?dock` and `?dock=0`, from the first lab, still work). Code:
`src/styles/nav-variants.css`, `src/scripts/nav-variants.js`, `src/components/PhoneDock.astro`,
`src/components/NavLab.astro`.

The switcher's "New places" row moves the links out of the top bar (desktop only):
`?nav=spine` (a heartbeat trace down the left edge, one beat per section), `tabs` (divider
tabs on the right edge), `dock` (a dock at the bottom),
`ask` (a search field in the header that fills in the enquiry form), `comments` (a review
pane on the right with a comment per section) and `corners` (no bar: logo, call to action,
index and "you are here" in the four corners). Code: `src/styles/nav-experiments.css`,
`src/scripts/nav-experiments.js`, `src/components/NavExperiments.astro`,
`src/components/AskBar.astro`; the ask bar's index is `askIndex` in `src/data/site.ts`, and
`src/scripts/nav-spy.js` tracks the section being read for all of them.

## Where things are

| What | Where |
| --- | --- |
| Home page copy (lorem ipsum marks text still to come) | `src/data/home.ts` |
| Navigation, contact details, footer links | `src/data/site.ts` |
| Page sections | `src/components/` (one file each), put together in `src/components/HomeSections.astro` |
| The two home pages | `src/pages/index.astro` (A) and `src/pages/version-b.astro` (B) |
| Head, header, menu, footer, boot script | `src/layouts/Base.astro` |
| Styles | `src/styles/` (imported in order by `Base.astro`; the order matters) |
| Behaviour and animations | `src/scripts/` (`main.js` loads the rest in order): `intro.js` (A), `header-logo.js` (B), `pen-ink.js` (the pen and ink both use), `ribbons.js`, `pipeline.js` (the hero's drawing) on `pipeline-engine.js`, `page.js`, `nav-variants.js` and `glass.js` (the navigation), `tickers.js` (the counting numbers) |
| Founder photo | `src/assets/` (resized and converted to WebP at build time) |
| Logo, logo without its line, pen | `public/brand/` (served exactly as they are) |
| Logo intro data: the pen's path and the logo's line pixels | `src/data/intro.json` |

## Notes

- Both logo animations draw the heartbeat by uncovering the logo's own line pixels in the
  order the pen passes them. If the logo ever changes, `public/brand/*`, `src/data/intro.json`
  and the label clip boxes in `src/styles/header-logo.css` must be regenerated together from
  the new logo; do not re-save or optimise those PNGs.
- Colour: the logo's blue (#1C3472) and orange on a soft blue-grey page, with deep blue bands
  for the testimonials and the footer (`src/styles/tokens.css`). Orange text and buttons use
  `--accent-ink`, a shade deeper than before so it keeps 4.5:1 on the tinted page. Mustard
  (`--gold`) appears in a few places only: the hover highlights, gold on the deep blue (the
  numbers card on phones, the testimonials) and the heading of the founder's recognition.
- Hero text contrast is protected by a veil the ribbons script cuts under the copy (strength
  per text in `src/scripts/ribbons.js`). If the hero copy or its colours change, re-check it.
- The numbers in the hero (and in their block after it on phones) count up once the page's
  load animation is over (`src/scripts/tickers.js`); they read from the numbers in
  `src/data/home.ts`, so changing a number there is all it takes.
- The enquiry form is a sample: it validates and thanks the visitor but sends nothing yet.
- In Chrome the capsule's glass and its panels currently show what is behind them without the
  blur: `.site-header` carries a `view-transition-name` (`src/styles/base.css`, for the page
  transitions), and with it the header's glass cannot reach the page behind (measured: with the
  name removed the panels blur again). Giving the header its name only during a page transition
  would bring the blur back. The dark theme's tints are set to read well either way.
- Fonts (Fraunces and Inter) are served from this site, not from Google.
