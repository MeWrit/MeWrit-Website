// Site-relative links and file paths, prefixed with the base path the site is built for:
// "/" for mewrit.com, "/MeWrit-Website/" for the GitHub Pages preview (astro.config.mjs).
// Anything that is not site-relative ("#", "https://", "mailto:", "tel:") passes through.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const href = (path: string): string =>
  path.startsWith('/') && !path.startsWith('//') ? base + path : path;
