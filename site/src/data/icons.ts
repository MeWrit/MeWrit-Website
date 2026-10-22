// Line icons on a 24 x 24 grid, drawn in currentColor. `fill: true` icons are solid shapes;
// the rest are strokes (the stroke width is set where the icon is used).
export const icons = {
  // services
  'doc-check': { body: '<path d="M9 12l2 2 4-4M7 3h10l4 4v14H3V3h4"/>' },
  'doc-lines': { body: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/>' },
  chat: { body: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' },
  cap: { body: '<path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5"/>' },
  flask: { body: '<path d="M10 2v6L4 20h16L14 8V2M8 2h8"/>' },
  pen: { body: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>' },
  // recognition
  medal: { body: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/>' },
  mortarboard: { body: '<path d="M12 3l9 5-9 5-9-5 9-5zM5 10.5V16c4 3 10 3 14 0v-5.5"/>' },
  people: { body: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/>' },
  // contact
  phone: { body: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/>' },
  whatsapp: { fill: true, body: '<path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z"/>' },
  mail: { body: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>' },
  // testimonials
  quote: { fill: true, body: '<path d="M7 7h4v4H8c0 2 1 3 3 3v3c-4 0-6-2-6-6V7zm8 0h4v4h-3c0 2 1 3 3 3v3c-4 0-6-2-6-6V7z"/>' },
  // the contact page: the office's pin, LinkedIn, copy to the clipboard
  pin: { body: '<path d="M12 22s7-6.4 7-12a7 7 0 10-14 0c0 5.6 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>' },
  linkedin: { fill: true, body: '<path d="M5 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-1.9 3.7-1.9 4 0 4.7 2.5 4.7 5.8V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V21h-4z"/>' },
  copy: { body: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>' },
  // Dr Hetal's card: the website, sharing the card, its QR code, saving her contact
  globe: { body: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>' },
  share: { body: '<path d="M12 15V3M8 7l4-4 4 4"/><path d="M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2"/>' },
  qr: { body: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4h-1M17 17v.01"/>' },
  'user-plus': { body: '<circle cx="10" cy="8" r="4"/><path d="M3 21v-1a6 6 0 016-6h2a6 6 0 016 6v1M19 8v6M16 11h6"/>' },
  // her recognition, one for each kind: a hall of fame, a business programme, an award, a startup
  // programme, a cardiology award
  trophy: { body: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3"/>' },
  briefcase: { body: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>' },
  star: { body: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>' },
  bulb: { body: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0012 3z"/>' },
  'heart-pulse': { body: '<path d="M20.5 8.5c0-2.8-2.2-5-4.9-5-1.6 0-3 .8-3.6 2-.6-1.2-2-2-3.6-2C5.7 3.5 3.5 5.7 3.5 8.5c0 5.6 8.5 11.5 8.5 11.5s8.5-5.9 8.5-11.5z"/><path d="M3.5 11h4l1.5-2.5 2.5 5 2-3.5 1.5 1h5"/>' },
  // events and the gallery: a date, a clock, photos
  calendar: { body: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
  clock: { body: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  camera: { body: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.6"/>' },
} as const;

export type IconName = keyof typeof icons;
