// Events and the Gallery (src/pages/events/, src/pages/gallery/, under the header's Showcase): Dr Hetal's
// record of workshops, talks, panels and conference roles (from her CV, August 2026, and the current site),
// and her photo albums (the current site's Gallery). They name the hospitals, universities, companies and
// societies involved, and live in src/private/: kept out of git at first, the repo being public, then
// committed and published on the user's word (2026-10-23: "push all that too, everything"; "we can git
// rebase later if we want to remove from history"). Where the folder is present the pages are built and
// the header leads to them; without it they are not, and the header marks Events and Gallery Soon
// (MEWRIT_PUBLIC=1 builds as if it were absent). Each album belongs to an event (its `event`); an event's
// albums are found from them.
import type { ImageMetadata } from 'astro';

export type EventKind = 'workshop' | 'talk' | 'panel' | 'organising';
export type MewritEvent = {
  id: string; start: string; end?: string; title: string; kind: EventKind; mewrit?: boolean;
  role: string; host?: string; place?: string; venue?: string; mode?: 'in person' | 'online'; time?: string;
  summary?: string; note?: string; audience?: string; sessions?: string[]; series?: string;
  highlights?: string[]; attend?: string[]; includes?: string[];
  fee?: { full: string; fullNote?: string; early?: string; earlyNote?: string; group?: string; covers?: string };
  register?: string | null; email?: string; poster?: string[];
};
export type AlbumKind = 'workshop' | 'talk' | 'panel' | 'award' | 'mewrit';
export type Album = { id: string; date: string; kind: AlbumKind; title: string; caption: string; text?: string; event?: string; photos: string[] };

const PUBLIC_BUILD = typeof process !== 'undefined' && process.env.MEWRIT_PUBLIC === '1';
const eventsFile = import.meta.glob<{ events: MewritEvent[] }>('../private/events.json', { eager: true, import: 'default' });
const galleryFile = import.meta.glob<{ albums: Album[] }>('../private/gallery.json', { eager: true, import: 'default' });
const images = import.meta.glob<ImageMetadata>('../private/{gallery,events,pieces}/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
// the collages, cut into their photos on this computer (the user, 2026-10-23: many album images were
// collages; none of the photos may go to an outside service): where each piece was in its image, made by
// the scratchpad's collage_split.js; checked and corrected by hand in the review page (/gallery/review/)
export type Piece = { file: string; x: number; y: number; w: number; h: number };
// (by: "found", not yet looked at; "review <date>", drawn or kept whole by the user; "confirmed <date>")
export type Cut = { W: number; H: number; method: 'whole' | 'gutter' | 'seam' | 'manual'; by: string; pieces: Piece[]; flags: string[] };
const piecesFile = import.meta.glob<{ files: Record<string, Cut> }>('../private/pieces.json', { eager: true, import: 'default' });
export const cuts: Record<string, Cut> = PUBLIC_BUILD ? {} : Object.values(piecesFile)[0]?.files ?? {};

// newest first; a date known only to its month or year ("2018-11", "2017") goes after that period's dated ones
const sortKey = (d: string) => (d + '-00-00').slice(0, 10);
export const events: MewritEvent[] = PUBLIC_BUILD ? [] : [...(Object.values(eventsFile)[0]?.events ?? [])].sort((a, b) => sortKey(b.start).localeCompare(sortKey(a.start)));
export const albums: Album[] = PUBLIC_BUILD ? [] : [...(Object.values(galleryFile)[0]?.albums ?? [])].sort((a, b) => sortKey(b.date).localeCompare(sortKey(a.date)));
export const hasEvents = events.length > 0;
export const hasGallery = albums.length > 0;
// a menu's entry marked Soon (src/data/site.ts) stays so unless its page is built here: Events and the Gallery
const built: Record<string, boolean> = { '/events/': hasEvents, '/gallery/': hasGallery };
export const navSoon = (l: { soon?: boolean; href: string }) => !!l.soon && !built[l.href];

export const photoOf = (dir: 'gallery' | 'events' | 'pieces', file: string): ImageMetadata | undefined => images[`../private/${dir}/${file}`];
// an album's photos as the pages show them: each collage replaced by the photos cut from it, in order
export type Shown = { src: ImageMetadata; from: string; part: number };
export function albumPhotos(a: Album): Shown[] {
  return a.photos.flatMap(f => {
    const c = cuts[f], own = photoOf('gallery', f);
    const parts = c && c.pieces.length ? c.pieces.map((p, k) => ({ src: photoOf('pieces', p.file), from: f, part: k + 1 })) : [{ src: own, from: f, part: 0 }];
    return parts.filter((p): p is Shown => !!p.src);
  });
}
export const albumsOf = (id: string) => albums.filter(a => a.event === id);
export const eventById = (id?: string) => events.find(e => e.id === id);

// how each kind is named: a row's label, a filter's
export const KIND: Record<EventKind, string> = { workshop: 'Workshop', talk: 'Talk', panel: 'Panel', organising: 'Organising' };
export const ALBUM_KIND: Record<AlbumKind, string> = { workshop: 'Workshop', talk: 'Talk', panel: 'Panel', award: 'Award', mewrit: 'MeWriT event' };

// dates as the pages write them: "26 September 2026", "10 to 11 July 2026", "31 January to 2 February
// 2025", "November 2018", "2017"; and in short, for a row: "26 Sep"
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (d: string) => d.split('-').map(Number) as [number, number?, number?];
export function dateLabel(start: string, end?: string): string {
  const [y, m, d] = parts(start);
  if (!m) return String(y);
  if (!end) return d ? `${d} ${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${y}`;
  const [y2, m2, d2] = parts(end);
  if (!d || !d2) return y === y2 ? `${MONTHS[m - 1]} to ${MONTHS[(m2 || m) - 1]} ${y}` : `${MONTHS[m - 1]} ${y} to ${MONTHS[(m2 || 1) - 1]} ${y2}`;
  if (y === y2 && m === m2) return `${d} to ${d2} ${MONTHS[m - 1]} ${y}`;
  if (y === y2) return `${d} ${MONTHS[m - 1]} to ${d2} ${MONTHS[(m2 || 1) - 1]} ${y}`;
  return `${d} ${MONTHS[m - 1]} ${y} to ${d2} ${MONTHS[(m2 || 1) - 1]} ${y2}`;
}
export function shortDate(start: string): string {
  const [, m, d] = parts(start);
  if (!m) return '';
  return d ? `${d} ${MONTHS[m - 1].slice(0, 3)}` : MONTHS[m - 1].slice(0, 3);
}
export const yearOf = (d: string) => Number(d.slice(0, 4));
// the weekday of a full date ("Saturday"), from the calendar itself
export function weekday(d: string): string {
  const [y, m, day] = parts(d);
  if (!m || !day) return '';
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
}
// still to come on the day of the build (its last day not yet past); the page checks again in the visitor's browser
export function isComing(e: MewritEvent, today = new Date().toISOString().slice(0, 10)): boolean {
  const last = e.end || e.start;
  return last.length === 10 && last >= today;
}
