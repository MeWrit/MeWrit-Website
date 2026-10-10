/* The camera's fit, shared by the film (film.js) and the inner page (inner.js): a shot that stands as
   far back along a direction as a box needs to fill a rectangle on the screen, and shifts the
   picture so the box's centre lands on the rectangle's (from src/scripts/xp/experience.js); and a
   page's place in the world, as a matrix. Plain arithmetic, no three.js. */
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// a shot that fits `box` ({ c, size }) into the target t ({ x, y, w, h }, fractions of the frame),
// looking along -dir: [camera x, y, z, the point looked at x, y, z, fov, shift right, shift up].
// A first guess from the box against the target, then rounds of measuring where its corners land
// and standing back by the overflow; past dmax the view widens instead (particles fade far away)
export function fitShot(box, dir, fov, t, aspect, dmax = 60) {
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
    if (d > dmax) { tn *= d / dmax; d = dmax; }
  }
  const r = rect(d);
  return [c[0] + dir[0] * d, c[1] + dir[1] * d, c[2] + dir[2] * d, c[0], c[1], c[2], Math.atan(tn) * 360 / Math.PI, t.x + t.w / 2 - (r[0] + r[2]) / 2, (r[1] + r[3]) / 2 - (t.y + t.h / 2)];
}

// a direction turned about the vertical by yaw and tipped up by pitch (radians)
export function turnDir(d, yaw = 0, pitch = 0) {
  const n = norm(d), c = Math.cos(yaw), s = Math.sin(yaw);
  const x = c * n[0] + s * n[2], z = -s * n[0] + c * n[2], h = Math.hypot(x, z) || 1, a = Math.atan2(n[1], h) + pitch;
  return norm([x / h * Math.cos(a), Math.sin(a), z / h * Math.cos(a)]);
}

// a page's place in the world: on its anchor, turned and tipped part of the way (k) toward the
// camera's direction so it reads, as a 4 x 4 matrix in the order three.js keeps one (by columns)
export function placement(anchor, dir, k = .3) {
  const n = norm(dir), yaw = Math.atan2(n[0], n[2]) * k, pitch = -Math.atan2(n[1], Math.hypot(n[0], n[2])) * k;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return [cy, 0, -sy, 0, sy * sp, cp, cy * sp, 0, sy * cp, -sp, cy * cp, 0, anchor[0], anchor[1], anchor[2], 1];
}
// a point through such a matrix
export const apply = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
