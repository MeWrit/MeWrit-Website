/* Helpers shared by the page's scripts. The boot script in the <head> (src/layouts/Base.astro)
   has already set the classes on <html> (js, static, intro-on, pre-enter) before any of this runs. */
export const $ = id => document.getElementById(id);
export const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
export const easeOut = p => 1 - Math.pow(1 - p, 3);
export const easeInOutCubic = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const easeInOutSine = p => -(Math.cos(Math.PI * p) - 1) / 2;
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const STATIC = document.documentElement.classList.contains('static');
export const INTRO = document.documentElement.classList.contains('intro-on');
// background animations wait until the intro has prepared the page (or start at once without one)
export const whenPrepared = fn => {
  if (!INTRO || document.documentElement.classList.contains('intro-prepared')) fn();
  else document.addEventListener('mewrit:prepare', fn, { once: true });
};
// text decodes into place: each character cycles through look-alikes, settling left to right
// over `dur` ms (spaces and punctuation stay put). e is the time since it started.
const GLYPHS = '0123456789ABCDEFHKLMNPRSTUXZ#%+';
export const scramble = (text, e, dur = 520) => {
  const n = text.length, done = clamp(e / dur) * n;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (i < done || ' .·,:/&'.includes(ch)) { out += ch; continue; }
    out += GLYPHS[(i * 7 + Math.floor(e / 45) * 13) % GLYPHS.length];
  }
  return out;
};
