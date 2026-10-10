/* Old-style figures for Fraunces. The site's build of the font does not carry them (with onum it
   draws the same lining figures, checked pixel for pixel), so each digit is set by hand (lamp.css,
   .osf-*): 0, 1 and 2 at x-height on the line, 3, 4, 5, 7 and 9 at x-height dropped below it, 6 and 8
   at full height. Returns markup; used by the pages (set:html) and by film.js for the folio. */
const KIND = { 0: 'x', 1: 'x', 2: 'x', 3: 'd', 4: 'd', 5: 'd', 6: 'a', 7: 'd', 8: 'a', 9: 'd' };
export const osf = s => String(s).replace(/\d/g, d => `<span class="osf-${KIND[d]}">${d}</span>`);
