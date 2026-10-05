/* Every script on the page, in the order the prototype ran them. One module graph keeps
   that order: shared helpers, page behaviour, hero ribbons, hero heartbeat panel, and the
   logo animations (each runs only on a page that has it: the loading intro on the home
   page, the header version on version B). */
import './page.js';
import './ribbons.js';
import './heartbeat.js';
import './intro.js';
import './header-logo.js';
