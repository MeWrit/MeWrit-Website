// Dr Hetal Shah's contact card, as a file a phone saves to its contacts (her card's Save contact, and the
// question it asks after a while: src/pages/hetal/index.astro). vCard 3.0, which iOS and Android both
// import: on an iPhone it opens the Add Contact screen with everything filled in, photo and all (one tap,
// Create New Contact, saves it: no website can save a contact without that tap); on Android the file
// downloads and opens in Contacts. Written at build from src/data/profile.ts, so it never disagrees with
// the card; her photo (src/assets/hetal-vcard.jpg, a 240px square of her portrait) is carried inside.
import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { profile } from '../../data/profile';

// a text value, escaped as vCard asks (backslash, comma, semicolon, newline)
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
// lines longer than 75 bytes are folded: the rest goes on the next line after one space (never splitting a
// character's bytes)
function fold(line: string) {
  const out: string[] = [];
  let cur = '', bytes = 0, limit = 75;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > limit) { out.push(cur); cur = ' '; bytes = 1; limit = 75; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
}

export const GET: APIRoute = () => {
  // (the base ends in a slash, so the card's address is found inside it, not beside it)
  const site = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), import.meta.env.SITE);
  const card = new URL('hetal/', site).href;
  const photo = readFileSync(join(process.cwd(), 'src', 'assets', 'hetal-vcard.jpg')).toString('base64');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(profile.family)};${esc(profile.given)};;${esc(profile.prefix)};${esc(profile.suffix)}`,
    `FN:${esc(profile.name)}`,
    `ORG:${esc(profile.org)}`,
    `TITLE:${esc(profile.title)}`,
    `ROLE:${esc(profile.subtitle)}`,
    `TEL;TYPE=CELL,VOICE,pref:${profile.phoneHref.replace(/^tel:/, '')}`,
    `EMAIL;TYPE=INTERNET,WORK,pref:${profile.email}`,
    // (the office: profile.office's lines, in the address's parts)
    `ADR;TYPE=WORK:;;${esc('710, Santorini Square, Lane Opp. Star Bazar, Satellite')};Ahmedabad;Gujarat;380015;India`,
    `item1.URL:${site.href}`,
    'item1.X-ABLabel:MeWriT',
    `item2.URL:${profile.linkedin}`,
    'item2.X-ABLabel:LinkedIn',
    `item3.URL:${card}`,
    'item3.X-ABLabel:Card',
    `NOTE:${esc(`${profile.credentials}. ${profile.line}`)}`,
    `PHOTO;ENCODING=b;TYPE=JPEG:${photo}`,
    'END:VCARD',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/vcard; charset=utf-8' } });
};
