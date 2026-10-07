/* Every script on the page, in the order the prototype ran them. One module graph keeps
   that order: shared helpers, page behaviour, hero ribbons, the hero's drawing, and the
   logo animations (each runs only on a page that has it: the loading intro on the home
   page, the header version on version B). */
import './page.js';
import './ribbons.js';
import './pipeline.js';
import './intro.js';
import './header-logo.js';
import './nav-variants.js';
import './nav-experiments.js';
import './glass.js';
import './tickers.js';
import './decode.js';
