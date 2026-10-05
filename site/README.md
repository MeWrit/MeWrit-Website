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
| A | `/` | The loading intro: the pen draws the logo over the page, then the logo glides into the header. Home page only. |
| B | `/version-b/` | No loading intro: the logo draws itself in the header (pen pops in, glides left, draws the line, docks; then the three labels appear). |

Both share everything else, including the hero ribbons, which flow through the copy and fade
out before the heartbeat panel. Any other page added later gets no logo animation unless it
asks for one (`intro` on `src/layouts/Base.astro`).

Review switches (add to the address): `?nointro` skips the logo animation, `?static` turns
all motion off, and `?hero=ribbons` or `?hero=ecg` shows just one of the two hero animations.

## Where things are

| What | Where |
| --- | --- |
| Home page copy (lorem ipsum marks text still to come) | `src/data/home.ts` |
| Navigation, contact details, footer links | `src/data/site.ts` |
| Page sections | `src/components/` (one file each), put together in `src/components/HomeSections.astro` |
| The two home pages | `src/pages/index.astro` (A) and `src/pages/version-b.astro` (B) |
| Head, header, menu, footer, boot script | `src/layouts/Base.astro` |
| Styles | `src/styles/` (imported in order by `Base.astro`; the order matters) |
| Behaviour and animations | `src/scripts/` (`main.js` loads the rest in order): `intro.js` (A), `header-logo.js` (B), `pen-ink.js` (the pen and ink both use), `ribbons.js`, `heartbeat.js`, `page.js` |
| Founder photo | `src/assets/` (resized and converted to WebP at build time) |
| Logo, logo without its line, pen | `public/brand/` (served exactly as they are) |
| Logo intro data: the pen's path and the logo's line pixels | `src/data/intro.json` |

## Notes

- Both logo animations draw the heartbeat by uncovering the logo's own line pixels in the
  order the pen passes them. If the logo ever changes, `public/brand/*`, `src/data/intro.json`
  and the label clip boxes in `src/styles/header-logo.css` must be regenerated together from
  the new logo; do not re-save or optimise those PNGs.
- Hero text contrast is protected by a veil the ribbons script cuts under the copy (strength
  per text in `src/scripts/ribbons.js`). If the hero copy or its colours change, re-check it.
- The enquiry form is a sample: it validates and thanks the visitor but sends nothing yet.
- Fonts (Fraunces and Inter) are served from this site, not from Google.
