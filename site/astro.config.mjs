// @ts-check
import { defineConfig } from 'astro/config';

// Static site: `npm run build` writes plain HTML, CSS, JS and images to dist/.
// Published at mewrit.com by default; the GitHub Pages preview build sets SITE_URL and
// BASE_PATH (see .github/workflows/deploy.yml at the repository root).
// redirect targets are not given the base by Astro, so they carry it here
const B = (process.env.BASE_PATH || '/').replace(/\/$/, '');
export default defineConfig({
  site: process.env.SITE_URL || 'https://mewrit.com',
  base: process.env.BASE_PATH || '/',
  // the experience became the home page on 2026-10-13; the drafts before it live on in /archive/,
  // and their old addresses (links already sent out) lead there
  redirects: {
    '/experience': B + '/',
    '/house': B + '/archive/house/',
    '/house-wip': B + '/archive/house-wip/',
    '/version-b': B + '/archive/original-b/',
    '/nav-lab': B + '/archive/nav-lab/',
    '/lamplight': B + '/archive/lamplight/',
    '/lamplight/board': B + '/archive/lamplight/board/',
    '/lamplight/regulatory-writing': B + '/archive/lamplight/regulatory-writing/',
    '/lamplight/worlds': B + '/archive/lamplight/worlds/',
  },
});
