/* The site's loader (src/components/SiteLoader.astro): paper over the page while it gets ready, the
   logo written on it by the pen (version B's drawing: logo-player.js, a little quicker than version B's
   own), a hairline under it filling with the page's progress (window.mewritLoader.p, 0 to 1). When the
   drawing is done and the page is ready (mewritLoader.ready: a page that waits sets it itself; any
   other is ready at its own load), 'mewrit:loaderout' tells the page to show itself (the home page puts
   the reader back where they were), and the logo glides on a soft arc into the header's logo while the
   paper lifts away; then the header's real logo takes over, the loader goes and 'mewrit:loaderdone'
   follows.
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

  function lift() {
    lifting = true; L.out = true;
    if (fill) fill.style.transform = 'scaleX(1)';
    document.dispatchEvent(new Event('mewrit:loaderout'));
    // where the header's logo is (none showing: the logo only fades)
    const head = document.getElementById('headerLogo');
    const src = logo.getBoundingClientRect(), dst = head && head.getClientRects().length ? head.getBoundingClientRect() : null;
    const flip = !REDUCE && dst && dst.width ? { x: dst.left - src.left, y: dst.top - src.top, s: dst.width / src.width } : null;
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
      // the paper lifts away like a sheet, up off the screen (a fade would pass through a muddy grey,
      // cream over the night); with reduced motion it fades
      if (flip) paper.style.transform = `translate3d(0,${(-100 * easeInOutCubic(clamp((u - .04) / .92))).toFixed(2)}%,0)`;
      else paper.style.opacity = (1 - easeInOutSine(u)).toFixed(3);
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
