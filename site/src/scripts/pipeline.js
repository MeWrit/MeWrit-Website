/* The hero's drawing, "From molecule to manuscript" (the drawing itself: pipeline-engine.js). It plays
   on a clock, in a loop of about 27 s: only on screen, only once the loading intro has landed, with a
   pause button; with reduced motion or ?static it shows its last stage, the accepted paper, as a
   still. */
import { $, REDUCE, STATIC, INTRO } from './shared.js';
import { createPipeline, IN, HOLD, STAGE, LOOP } from './pipeline-engine.js';

const svg = $('heroSvg');
if (svg && document.documentElement.dataset.hero !== 'ribbons') {
  const { renderAt } = createPipeline(svg);
  let clock = 0, last = null, raf = 0, onScreen = true, userPaused = false, allowed = false;
  const STILL = 6 * STAGE + IN + HOLD - 200;   // the paper, accepted
  function frame(now) { raf = requestAnimationFrame(frame); if (last !== null) clock += Math.min(now - last, 100); last = now; renderAt(clock); }
  function update() {
    const run = allowed && onScreen && !userPaused && !document.hidden;
    if (run && !raf) { last = null; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  const btn = $('heroPause');
  function setPaused(p) { userPaused = p; btn.setAttribute('aria-pressed', String(p)); btn.setAttribute('aria-label', p ? 'Play animation' : 'Pause animation'); update(); }
  btn.addEventListener('click', () => setPaused(!userPaused));
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; update(); }).observe($('heroVisual'));
  document.addEventListener('visibilitychange', update);
  renderAt(0);
  // with an intro, the drawing starts once the logo has landed (a panel that animates while it is
  // first revealed made the glide stall, measured); until then it shows its first frame
  const startWhenSettled = fn => {
    if (!INTRO || document.documentElement.classList.contains('logo-landed')) fn();
    else document.addEventListener('mewrit:introdone', fn, { once: true });
  };
  if (REDUCE || STATIC) { clock = STILL; renderAt(STILL); setPaused(true); } else startWhenSettled(() => { allowed = true; update(); });
  // review and test hook
  window.mewritHero = { seek(t) { clock = t; renderAt(t); }, pause() { setPaused(true); }, play() { setPaused(false); }, isRunning: () => !!raf, loopMs: LOOP, still: STILL, stageMs: STAGE };
}
