// @ts-check
import { defineConfig } from 'astro/config';

// Static site: `npm run build` writes plain HTML, CSS, JS and images to dist/.
// Published at mewrit.com by default; the GitHub Pages preview build sets SITE_URL and
// BASE_PATH (see .github/workflows/deploy.yml at the repository root).
export default defineConfig({
  site: process.env.SITE_URL || 'https://mewrit.com',
  base: process.env.BASE_PATH || '/',
});
