// The therapeutic areas' icons (src/pages/therapeutic-areas.astro): line drawings on a 32 x 32 grid, drawn
// for the site, in its navy (currentColor) with the logo's orange for one part of each (class "a": a
// stroke; "af": a fill). Each is the inside of an <svg viewBox="0 0 32 32">, stroked 1.6 with round ends.
export const areaIcons: Record<string, string> = {
  // an awareness ribbon
  oncology: '<path d="M16 19.5c-3.3-3.8-5.2-7-5.2-9.6 0-2.9 2.3-5.2 5.2-5.2s5.2 2.3 5.2 5.2c0 2.6-1.9 5.8-5.2 9.6z"/><path class="a" d="M13.6 16.3 21.6 28M18.4 16.3 10.4 28"/>',
  // a heart, a trace of its rhythm across it
  cardiology: '<path d="M16 26.5S6 20.4 6 13.3C6 9.6 8.6 7 11.8 7c1.9 0 3.4.9 4.2 2.3C16.8 7.9 18.3 7 20.2 7 23.4 7 26 9.6 26 13.3c0 7.1-10 13.2-10 13.2z"/><path class="a" d="M7.6 16h4.2l1.7-3.3 2.5 6.6 2-4.6 1.3 1.3h5.1"/>',
  // the lungs, the airway branching into them
  respiratory: '<path d="M12.8 9.2c-2.6.4-6 5.5-6 11.8 0 2.7 1.3 4.3 3.3 4.3 2.4 0 3.4-1.5 3.4-4V10.5c0-.8-.2-1.4-.7-1.3zM19.2 9.2c2.6.4 6 5.5 6 11.8 0 2.7-1.3 4.3-3.3 4.3-2.4 0-3.4-1.5-3.4-4V10.5c0-.8.2-1.4.7-1.3z"/><path class="a" d="M16 4.5v9M16 13.5c0 1.6-1.3 2.8-2.9 2.8M16 13.5c0 1.6 1.3 2.8 2.9 2.8"/>',
  // an antibody, its binding sites
  autoimmune: '<path d="M16 27.5V18M16 18l-6.2-6.2M16 18l6.2-6.2M13.2 20.6l-5.4-5.4M18.8 20.6l5.4-5.4"/><circle class="a" cx="8.2" cy="10.2" r="2"/><circle class="a" cx="23.8" cy="10.2" r="2"/>',
  // the stomach: the gullet in at the top, the bag bulging to the left, the outlet on the right; a fold
  gastro: '<path d="M15 3v5C13.5 6.6 10 6.5 8.3 9.2 6.8 11.6 6.6 15.5 7.4 19c1.2 5 6 7.4 11 6.8 3.6-.4 6.2-2.6 7.2-6.2M25.2 16.8c-1.4 1.4-3.8 1.8-5.4.6-1.2-.9-1.3-2.4-1.3-4.2V3"/><path class="a" d="M25.6 19.6h2.8M25.2 16.8h3.2M11 18.8c1.8 1.6 4.3 2 6.6 1.2"/>',
  // a ring of the body's chemistry, turning
  metabolic: '<path d="M16 11l4.33 2.5v5L16 21l-4.33-2.5v-5z"/><path class="a" d="M21.25 6.91A10.5 10.5 0 0 1 21.25 25.09M23.84 25.32 21.25 25.09l1.1-2.36M10.75 25.09A10.5 10.5 0 0 1 10.75 6.91M8.16 6.68l2.59.23-1.1 2.36"/>',
  // a drop of blood, glucose's ring in it
  diabetes: '<path d="M16 4.5c-4.2 5.6-8 10-8 14.5a8 8 0 0 0 16 0c0-4.5-3.8-8.9-8-14.5z"/><path class="a" d="M16 16.3l2.77 1.6v3.2L16 22.7l-2.77-1.6v-3.2z"/>',
  // a bacterium
  infectious: '<rect x="8" y="12" width="16" height="8" rx="4" transform="rotate(-35 16 16)"/><circle class="af" cx="13.6" cy="16.9" r="1"/><circle class="af" cx="18.1" cy="14.6" r="1"/><path class="a" d="M8.4 21.4c-1.2.3-1.6 1.4-1.1 2.4s0 2.1-1.2 2.4M9.8 22.6c-.3 1.2.4 2.1 1.5 2.3s1.6 1.3 1.1 2.4M24.4 9.6c1.2-.3 1.6-1.4 1.1-2.4s0-2.1 1.2-2.4"/>',
  // a bone
  ortho: '<path transform="rotate(-45 16 16)" d="M10.95 14H21.05A2.5 2.5 0 1 1 23.5 16A2.5 2.5 0 1 1 21.05 18H10.95A2.5 2.5 0 1 1 8.5 16A2.5 2.5 0 1 1 10.95 14z"/><path class="a" transform="rotate(-45 16 16)" d="M13.5 16h5"/>',
  // the uterus, the ovaries
  gyn: '<path d="M12 10.5h8a1 1 0 0 1 1 1.2l-1.3 7.6a3 3 0 0 1-2.2 2.4V26h-3v-4.3a3 3 0 0 1-2.2-2.4L11 11.7a1 1 0 0 1 1-1.2zM12 11c-1.6-1.6-3.6-2.2-5-1.2M20 11c1.6-1.6 3.6-2.2 5-1.2"/><circle class="a" cx="6.2" cy="12" r="1.8"/><circle class="a" cx="25.8" cy="12" r="1.8"/>',
  // a syringe
  vaccines: '<g transform="rotate(-45 16 16)"><rect x="10" y="12.5" width="12" height="7" rx="1.2"/><path d="M10 16H5.5M5.5 12.8v6.4M22 16h6"/><rect class="af soft" x="15.2" y="13.9" width="6.2" height="4.2" rx=".6"/><path class="a" d="M14 12.5v2.2M17 12.5v2.2M20 12.5v2.2"/></g>',
  // a child's face
  paeds: '<circle cx="16" cy="17" r="9"/><circle class="af" cx="12.8" cy="16.2" r="1.1"/><circle class="af" cx="19.2" cy="16.2" r="1.1"/><path d="M12.8 20.5c1.8 1.9 4.6 1.9 6.4 0"/><path class="a" d="M15 8.2c-.4-1.9.8-3.5 2.5-3.4 1.4.1 2 1.5 1.2 2.4-.6.7-1.7.4-1.8-.4"/>',
  // an eye
  ophthalmo: '<path d="M4 16s4.5-7.5 12-7.5S28 16 28 16s-4.5 7.5-12 7.5S4 16 4 16z"/><circle cx="16" cy="16" r="4"/><circle class="af" cx="16" cy="16" r="1.7"/>',
  // a sample in a test tube
  ivd: '<path d="M11.5 5h9M12.5 5v17a3.5 3.5 0 0 0 7 0V5"/><path class="af soft" d="M12.5 15h7v7a3.5 3.5 0 0 1-7 0z"/><path class="a" d="M12.5 15h7"/><circle class="af" cx="15" cy="19" r=".8"/><circle class="af" cx="17.3" cy="21.4" r=".6"/>',
  // a stethoscope
  devices: '<path d="M8.5 5h3M20.5 5h3M10 5v6a6 6 0 0 0 12 0V5M16 17v3.5a5 5 0 0 0 10 0V19"/><circle class="a" cx="26" cy="16.5" r="2.5"/>',
  // a capsule and a leaf
  nutra: '<g transform="rotate(-40 12.5 13.5)"><rect x="4.5" y="10" width="16" height="7" rx="3.5"/><path class="af soft" d="M12.5 10H8a3.5 3.5 0 0 0 0 7h4.5z"/><path d="M12.5 10v7"/></g><path d="M18 27.5c-.4-5.8 3.2-9.6 9-10 .3 5.9-3.3 9.7-9 10z"/><path class="a" d="M18 27.5l6-6"/>',
  // the coronavirus
  covid: '<circle cx="16" cy="16" r="6.5"/><path d="M22.5 16h2.8M20.6 20.6l1.98 1.98M16 22.5v2.8M11.4 20.6l-1.98 1.98M9.5 16H6.7M11.4 11.4 9.42 9.42M16 9.5V6.7M20.6 11.4l1.98-1.98"/><g class="a"><circle cx="26.7" cy="16" r="1.4"/><circle cx="23.57" cy="23.57" r="1.4"/><circle cx="16" cy="26.7" r="1.4"/><circle cx="8.43" cy="23.57" r="1.4"/><circle cx="5.3" cy="16" r="1.4"/><circle cx="8.43" cy="8.43" r="1.4"/><circle cx="16" cy="5.3" r="1.4"/><circle cx="23.57" cy="8.43" r="1.4"/></g><circle class="af" cx="14" cy="14.6" r="1"/><circle class="af" cx="18" cy="17.6" r="1"/>',
};
