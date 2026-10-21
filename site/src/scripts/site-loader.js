/* The site's loader (src/components/SiteLoader.astro): paper over the page while it gets ready, the
   logo written on it by the pen (version B's drawing: logo-player.js, a little quicker than version B's
   own), a hairline under it filling with the page's progress (window.mewritLoader.p, 0 to 1). When the
   drawing is done and the page is ready (mewritLoader.ready: a page that waits sets it itself; any
   other is ready at its own load), 'mewrit:loaderout' tells the page to show itself (the home page puts
   the reader back where they were), and the logo glides on a soft arc into the header's logo while the
   paper folds up into the header's bar; then the header's real logo takes over, the loader goes and
   'mewrit:loaderdone' follows.
   A tap, key or wheel hurries the drawing. With reduced motion the logo stands written and the paper
   only fades. Whatever happens, the page shows after FAILSAFE. */
import { clamp, easeInOutCubic, easeInOutSine, REDUCE } from './shared.js';
import { createLogoPlayer } from './logo-player.js';

const L = window.mewritLoader, el = document.getElementById('siteLoader');
if (L && el) start();

function start() {
  const root = document.documentElement;
  const logo = el.querySelector('.sl-logo'), paper = el.querySelector('.sl-paper'), bar = el.querySelector('.sl-bar'), fill = bar && bar.querySelector('b');
  const SPEED = 2, GLIDE = 900, FAILSAFE = 12000;   // (SPEED: twice version B's pace, about two and a quarter seconds)
  let drawn = false, lifting = false, shown = -1;
  // a page that does not report is ready at its own load
  if (!L.wait) {
    const loaded = () => { L.p = 1; L.ready = true; };
    if (document.readyState === 'complete') loaded(); else addEventListener('load', loaded, { once: true });
  }
  // the logo written by the pen (with reduced motion, standing written)
  const player = createLogoPlayer(logo, { speed: SPEED });
  if (REDUCE) { player.settle(); drawn = true; } else player.play().then(() => { drawn = true; });
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(ev => addEventListener(ev, () => { if (!lifting) player.hurry(); }, { passive: true }));
  setTimeout(() => { if (!lifting) { drawn = true; L.ready = true; L.p = 1; player.settle(); } }, FAILSAFE);

  // the hairline follows the page's progress; once the drawing is done and the page ready, the paper lifts
  const watch = () => {
    if (lifting) return;
    const p = Math.round(clamp(L.p || 0) * 1000) / 1000;
    if (fill && p !== shown) { shown = p; fill.style.transform = `scaleX(${p})`; }
    if (drawn && L.ready) lift(); else requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);

  // a colour without its transparency (the header's bar is a little translucent; the paper turns to its
  // full tone)
  const solid = c => { const m = /rgba?\(([^,]+),([^,]+),([^,)]+)/.exec(c || ''); return m ? `rgb(${m[1]},${m[2]},${m[3]})` : c; };
  function lift() {
    lifting = true; L.out = true;
    if (fill) fill.style.transform = 'scaleX(1)';
    document.dispatchEvent(new Event('mewrit:loaderout'));
    // where the header's logo is, and the header's bar the paper folds into (none showing: the logo and
    // the paper only fade)
    const head = document.getElementById('headerLogo'), hdr = document.getElementById('siteHeader');
    const src = logo.getBoundingClientRect(), dst = head && head.getClientRects().length ? head.getBoundingClientRect() : null;
    const flip = !REDUCE && dst && dst.width ? { x: dst.left - src.left, y: dst.top - src.top, s: dst.width / src.width } : null;
    const hb = flip && hdr && hdr.getClientRects().length ? hdr.getBoundingClientRect() : null;
    const H0 = paper.offsetHeight, fold = hb && hb.bottom > 0 ? hb.bottom : 0;
    if (fold) paper.style.setProperty('--sl-bar', solid(getComputedStyle(hdr).backgroundColor));
    const t0 = performance.now(), dur = flip ? GLIDE : 420;
    const step = now => {
      const u = clamp((now - t0) / dur), g = easeInOutCubic(u);
      if (flip) {
        // on a soft arc: it rises first, then settles across (as the first intro's logo did); the header's
        // own logo comes in under it as it lands
        const cx = flip.x * .1, cy = flip.y * .92, x = 2 * (1 - g) * g * cx + g * g * flip.x, y = 2 * (1 - g) * g * cy + g * g * flip.y;
        logo.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${(1 + (flip.s - 1) * g).toFixed(4)})`;
        head.style.opacity = clamp((u - .82) / .18).toFixed(3);
      } else logo.style.opacity = (1 - u).toFixed(3);
      if (fold) {
        // the paper folds up into the header's bar: its foot rises to the bar's while its colour turns to
        // the bar's, then it gives way to the bar itself, the bar's words coming in (a fade of the whole
        // sheet passed through a muddy grey, cream over the night)
        const e = easeInOutCubic(clamp(u / .86));
        paper.style.height = `${(H0 + (fold - H0) * e).toFixed(1)}px`;
        paper.style.setProperty('--sl-k', e.toFixed(3));
        paper.style.opacity = (1 - clamp((u - .84) / .16)).toFixed(3);
      } else paper.style.opacity = (1 - easeInOutSine(u)).toFixed(3);
      if (bar) bar.style.opacity = (1 - clamp(u / .25)).toFixed(3);
      if (u < 1) requestAnimationFrame(step); else land(head);
    };
    requestAnimationFrame(step);
  }
  function land(head) {
    root.classList.remove('sl-on');   // the page scrolls again, the header's own logo shows
    if (head) head.style.opacity = '';
    el.remove();
    document.dispatchEvent(new Event('mewrit:loaderdone'));
  }
}
