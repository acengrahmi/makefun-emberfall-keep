// The siege road: polyline waypoints, arc-length lookup, build plots.

import { PATH_POINTS, PATH_END, PLOTS } from './config.js';

export class Path {
  constructor() {
    this.points = [...PATH_POINTS, { ...PATH_END }];
    this.segments = [];
    this.total = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const a = this.points[i], b = this.points[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      this.segments.push({ a, b, len, start: this.total });
      this.total += len;
    }
  }

  // Position at arc-length d along the road.
  at(d) {
    d = Math.max(0, Math.min(this.total, d));
    for (const s of this.segments) {
      if (d <= s.start + s.len || s === this.segments[this.segments.length - 1]) {
        const t = s.len === 0 ? 0 : (d - s.start) / s.len;
        return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
      }
    }
    return { ...this.points[this.points.length - 1] };
  }

  // Distance from a point to the nearest point on the road.
  distToRoad(x, y) {
    let best = Infinity;
    for (const s of this.segments) {
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((x - s.a.x) * dx + (y - s.a.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = s.a.x + dx * t, py = s.a.y + dy * t;
      best = Math.min(best, Math.hypot(x - px, y - py));
    }
    return best;
  }
}

export function plotAt(x, y, plots) {
  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (Math.hypot(x - p.x, y - p.y) < 34) return i;
  }
  return -1;
}

export function makePlots() {
  return PLOTS.map((p) => ({ ...p, tower: null }));
}
