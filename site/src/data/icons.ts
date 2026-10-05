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
} as const;

export type IconName = keyof typeof icons;
