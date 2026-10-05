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
