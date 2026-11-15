// The living backdrop: ember sky, drifting clouds, the keep and its beacon.
// Drawn before everything else; pure canvas, seeded for determinism.

import { W, H, PALETTE, PATH_POINTS, PATH_END, PATH_WIDTH } from './config.js';
import { makeRng } from './random.js';

export class Background {
  constructor(seed = 7) {
    const rng = makeRng(seed);
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({ x: rng() * W, y: rng() * 300, r: 0.5 + rng() * 1.4, tw: rng() * Math.PI * 2 });
    }
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({ x: rng() * W, y: 40 + rng() * 140, w: 120 + rng() * 160, s: 4 + rng() * 7 });
    }
    this.embers = [];
    for (let i = 0; i < 70; i++) {
      this.embers.push({ x: rng() * W, y: rng() * H, vy: 12 + rng() * 26, vx: -6 + rng() * 12, s: 1 + rng() * 2.4, ph: rng() * 6 });
    }
    this.pines = [];
    for (let i = 0; i < 26; i++) {
      this.pines.push({ x: rng() * W, y: 640 + rng() * 70, h: 30 + rng() * 42, w: 18 + rng() * 14 });
    }
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    for (const c of this.clouds) { c.x += c.s * dt; if (c.x - c.w > W) c.x = -c.w; }
    for (const e of this.embers) {
      e.y += e.vy * dt; e.x += (e.vx + Math.sin(this.time + e.ph) * 8) * dt;
      if (e.y > H + 6) { e.y = -6; e.x = Math.random() * W; }
    }
  }

  draw(ctx, world) {
    const t = this.time;
    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.55, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars.
    for (const s of this.stars) {
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 1.4 + s.tw);
      ctx.fillStyle = '#ffe9c9';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // Ember moon.
    const mx = 1050, my = 78;
    const glow = ctx.createRadialGradient(mx, my, 8, mx, my, 90);
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.55)');
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 90, my - 90, 180, 180);
    ctx.fillStyle = '#ffe3ae';
    ctx.beginPath(); ctx.arc(mx, my, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(214, 150, 80, 0.5)';
    ctx.beginPath(); ctx.arc(mx - 10, my - 6, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 12, my + 10, 5, 0, Math.PI * 2); ctx.fill();

    // Clouds.
    ctx.fillStyle = 'rgba(46, 24, 62, 0.75)';
    for (const c of this.clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.w / 4, c.y + 8, c.w / 3, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w / 4, c.y + 8, c.w / 3, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant hills.
    ctx.fillStyle = '#241534';
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.quadraticCurveTo(300, 560, 640, 620);
    ctx.quadraticCurveTo(980, 670, W, 600);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();

    // Grass.
    const grass = ctx.createLinearGradient(0, 90, 0, H);
    grass.addColorStop(0, PALETTE.grass);
    grass.addColorStop(1, PALETTE.grassDark);
    ctx.fillStyle = grass;
    ctx.fillRect(0, 90, W, H - 90);

    // Grass tufts.
    ctx.strokeStyle = 'rgba(120, 180, 100, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) {
      const gx = (i * 173) % W, gy = 120 + ((i * 97) % 580);
      const sway = Math.sin(t * 1.2 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx + sway, gy - 9);
      ctx.moveTo(gx + 5, gy); ctx.lineTo(gx + 5 + sway, gy - 12);
      ctx.stroke();
    }

    // The siege road.
    this.drawPath(ctx);

    // Pines along the bottom.
    for (const p of this.pines) {
      const sway = Math.sin(t + p.x * 0.05) * 2;
      ctx.fillStyle = '#16281a';
      ctx.beginPath();
      ctx.moveTo(p.x - p.w / 2 + sway, p.y);
      ctx.lineTo(p.x + sway, p.y - p.h);
      ctx.lineTo(p.x + p.w / 2 + sway, p.y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1d3a22';
      ctx.beginPath();
      ctx.moveTo(p.x - p.w / 3 + sway, p.y - p.h * 0.45);
      ctx.lineTo(p.x + sway, p.y - p.h * 1.15);
      ctx.lineTo(p.x + p.w / 3 + sway, p.y - p.h * 0.45);
      ctx.closePath(); ctx.fill();
    }

    // The keep: stone tower with a burning beacon at the road's end.
    this.drawKeep(ctx, t);

    // Drifting embers.
    for (const e of this.embers) {
      ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(t * 2 + e.ph));
      ctx.fillStyle = Math.sin(e.ph * 3) > 0 ? '#ffb347' : '#ff7a2f';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawPath(ctx) {
    const pts = [...PATH_POINTS, { ...PATH_END }];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Edge (wider, darker).
    ctx.strokeStyle = PALETTE.pathEdge;
    ctx.lineWidth = PATH_WIDTH + 10;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    // Stone surface.
    ctx.strokeStyle = PALETTE.path;
    ctx.lineWidth = PATH_WIDTH;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    // Cobble dashes down the middle.
    ctx.strokeStyle = 'rgba(200, 170, 120, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 26]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawKeep(ctx, t) {
    const kx = 1206, ky = 606;
    // Beacon glow.
    const pulse = 0.5 + 0.25 * Math.sin(t * 2.2);
    const glow = ctx.createRadialGradient(kx, ky - 78, 6, kx, ky - 78, 150);
    glow.addColorStop(0, `rgba(255, 233, 168, ${0.5 * pulse + 0.25})`);
    glow.addColorStop(1, 'rgba(255, 233, 168, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(kx - 150, ky - 228, 300, 300);
    // Tower body.
    ctx.fillStyle = PALETTE.keep;
    ctx.fillRect(kx - 34, ky - 62, 68, 62);
    ctx.fillStyle = '#7a8090';
    ctx.fillRect(kx - 34, ky - 62, 68, 8);
    // Battlements.
    for (let i = 0; i < 4; i++) ctx.fillRect(kx - 34 + i * 18, ky - 76, 12, 14);
    // Roof + beacon flame.
    ctx.fillStyle = PALETTE.keepRoof;
    ctx.beginPath();
    ctx.moveTo(kx - 30, ky - 76); ctx.lineTo(kx, ky - 108); ctx.lineTo(kx + 30, ky - 76);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALETTE.beacon;
    ctx.beginPath();
    ctx.arc(kx, ky - 96, 7 + Math.sin(t * 5) * 1.5, 0, Math.PI * 2); ctx.fill();
    // Door and window.
    ctx.fillStyle = '#2c2135';
    ctx.fillRect(kx - 8, ky - 26, 16, 26);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(kx - 5, ky - 50, 10, 12);
  }
}
