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
other page added later gets no logo animation unless it asks for one (`intro` on
`src/layouts/Base.astro`).

## The hero's drawing

"From molecule to manuscript": a technical drawing of the work behind a medicine, in seven
stages that hand over to one another (drug development, clinical trials, medical research, data
and statistics, analysis, reporting, manuscript and publication). Twenty-four dots carry through
every stage, from the atoms of a molecule to the seal on the accepted paper. The figures in it
(the trial size, the hazard ratio and so on) are illustrative. Code: `src/scripts/pipeline.js`,
frame in `src/components/HeroVisual.astro`; the labels are set in IBM Plex Mono (open font licence).

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

Review switches (add to the address): `?nointro` skips the logo animation, `?static` turns
all motion off, and `?hero=ribbons` or `?hero=drawing` shows just one of the two hero animations.

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
| Behaviour and animations | `src/scripts/` (`main.js` loads the rest in order): `intro.js` (A), `header-logo.js` (B), `pen-ink.js` (the pen and ink both use), `ribbons.js`, `pipeline.js` (the hero's drawing), `page.js`, `nav-variants.js` and `glass.js` (the navigation), `tickers.js` (the counting numbers) |
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
- Fonts (Fraunces and Inter) are served from this site, not from Google.
