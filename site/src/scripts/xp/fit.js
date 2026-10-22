/* Fitting a shape to a frame, for the inner pages' night bands (src/scripts/band.js): the same camera the
   film fits its scenes with (experience.js, fitShot: there it is kept as it is, so the film never moves
   because of a band). A shot is [camera x, y, z, look x, y, z, field of view, shift right, shift up]: the
   camera stands back along `dir` (from the shape to the camera) as far as the box needs to fill the
   target rectangle (fractions of the frame), and the picture shifts so the box's centre is the target's. */
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const DMAX = 36;   // the farthest the camera stands from a shape's centre (particles fade from 45 away)

export function fitShot(box, dir, fov, t, aspect) {
  const c = box.c, hs = box.size.map(v => v / 2), R = norm(cross([0, 1, 0], dir)), U = cross(dir, R);
  const corners = Array.from({ length: 8 }, (_, i) => [c[0] + (i & 1 ? hs[0] : -hs[0]), c[1] + (i & 2 ? hs[1] : -hs[1]), c[2] + (i & 4 ? hs[2] : -hs[2])]);
  let tn = Math.tan(fov * Math.PI / 360);
  const rect = d => {
    const p = [c[0] + dir[0] * d, c[1] + dir[1] * d, c[2] + dir[2] * d], r = [1e9, 1e9, -1e9, -1e9];
    corners.forEach(q => {
      const v = sub(q, p), z = Math.max(.3, -dot(v, dir)), x = .5 + dot(v, R) / (z * tn * aspect) / 2, y = .5 - dot(v, U) / (z * tn) / 2;
      r[0] = Math.min(r[0], x); r[1] = Math.min(r[1], y); r[2] = Math.max(r[2], x); r[3] = Math.max(r[3], y);
    });
    return r;
  };
  let d = Math.max(hs[1] / tn / t.h, Math.max(hs[0], hs[2]) / (tn * aspect) / t.w) * 1.06;
  for (let k = 0; k < 8; k++) {
    const r = rect(d), over = Math.max((r[2] - r[0]) / t.w, (r[3] - r[1]) / t.h);
    if (k >= 3 && over <= 1.005) break;
    d *= over;
    if (d > DMAX) { tn *= d / DMAX; d = DMAX; }
  }
  const r = rect(d);
  return [c[0] + dir[0] * d, c[1] + dir[1] * d, c[2] + dir[2] * d, c[0], c[1], c[2], Math.atan(tn) * 360 / Math.PI, t.x + t.w / 2 - (r[0] + r[2]) / 2, (r[1] + r[3]) / 2 - (t.y + t.h / 2)];
}
// a scene's direction: the middle of its two shots' (from the point looked at to the camera)
export function sceneDir(s) {
  const da = norm(sub(s.a[0], s.a[1])), db = norm(sub(s.b[0], s.b[1]));
  return norm([da[0] + db[0], da[1] + db[1], da[2] + db[2]]);
}
