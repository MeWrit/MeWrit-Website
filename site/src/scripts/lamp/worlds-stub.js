/* A stand-in for the engraved worlds (src/scripts/lamp/worlds/index.js, built separately), with the
   same shape: five factories, in chapter order, each giving an empty group with a plausible grade
   and stage, so the film can be built and judged before the real worlds arrive. renderer.js imports
   WORLDS in one line; point that line at worlds/index.js to use the real ones.
   World = { id, group, grade: { top, bottom, fog, fogDensity, light, glow: [colour, strength] },
             stage: { anchor, dir, fov, size }, setWeight(w), update(time, dt, camera), dispose() } */
const make = (id, grade, stage) => (THREE, { quality = 'high' } = {}) => {
  const group = new THREE.Group();
  group.name = `world-${id}-${quality}`;
  group.visible = false;
  return {
    id, group, grade, stage,
    setWeight(w) { group.visible = w > 0; },
    update() {},
    dispose() {},
  };
};

// every stage stands on the same anchor (the page's centre); the camera comes from a different side
// in each world, so the travel between them shows
export const WORLDS = {
  desk: make('desk',
    { top: '#0B1A42', bottom: '#030817', fog: '#0A1430', fogDensity: .03, light: '#F2B866', glow: ['#2C2A4A', .55] },
    { anchor: [0, 0, 0], dir: [.3, .2, 1], fov: 38, size: [12, 13, 5] }),
  archive: make('archive',
    { top: '#0A1838', bottom: '#02060F', fog: '#0B1A36', fogDensity: .035, light: '#C9D8FF', glow: ['#1C3472', .5] },
    { anchor: [0, 0, 0], dir: [-.34, .1, 1], fov: 40, size: [12, 13, 5] }),
  reading: make('reading',
    { top: '#0C1A40', bottom: '#030817', fog: '#0A1632', fogDensity: .03, light: '#DCE6FF', glow: ['#203A6E', .5] },
    { anchor: [0, 0, 0], dir: [.32, .12, 1], fov: 40, size: [12, 13, 5] }),
  sky: make('sky',
    { top: '#040A1E', bottom: '#0B1A42', fog: '#060E26', fogDensity: .015, light: '#DCE6FF', glow: ['#1C3472', .42] },
    { anchor: [0, 0, 0], dir: [.06, -.42, 1], fov: 44, size: [12, 13, 5] }),
  dawn: make('dawn',
    { top: '#0B1A42', bottom: '#3A2A3A', fog: '#2A2238', fogDensity: .025, light: '#F2B866', glow: ['#6B4A3A', .45] },
    { anchor: [0, 0, 0], dir: [-.12, .06, 1], fov: 38, size: [12, 13, 5] }),
};
