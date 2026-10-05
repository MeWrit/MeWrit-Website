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

Review switches (add to the address): `?intro` replays the logo intro (it normally plays
once per browser session), `?nointro` skips it, `?static` turns all motion off, and
`?hero=ribbons` or `?hero=ecg` shows just one of the two hero animations.

## Where things are

| What | Where |
| --- | --- |
| Home page copy (lorem ipsum marks text still to come) | `src/data/home.ts` |
| Navigation, contact details, footer links | `src/data/site.ts` |
| Page sections | `src/components/` (one file each), put together in `src/pages/index.astro` |
| Head, header, menu, footer, boot script | `src/layouts/Base.astro` |
| Styles | `src/styles/` (imported in order by `Base.astro`; the order matters) |
| Behaviour and animations | `src/scripts/` (`main.js` loads the rest in order) |
| Founder photo | `src/assets/` (resized and converted to WebP at build time) |
| Logo, logo without its line, pen | `public/brand/` (served exactly as they are) |
| Logo intro data: the pen's path and the logo's line pixels | `src/data/intro.json` |

## Notes

- The logo intro draws the heartbeat by uncovering the logo's own line pixels in the order
  the pen passes them. If the logo ever changes, `public/brand/*` and `src/data/intro.json`
  must be regenerated together from the new logo; do not re-save or optimise those PNGs.
- The enquiry form is a sample: it validates and thanks the visitor but sends nothing yet.
- Fonts (Fraunces and Inter) are served from this site, not from Google.
