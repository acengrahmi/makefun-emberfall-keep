// Particles, floating text, shockwaves and screen shake — the game's juice.

export class Fx {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
  }

  burst(x, y, color, n, speed = 120, life = 0.6, size = 3) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        life: life * (0.6 + Math.random() * 0.7), maxLife: life,
        size: size * (0.6 + Math.random() * 0.8), color,
        gravity: 160, drag: 0.94,
      });
    }
  }

  embers(x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 24, vy: -28 - Math.random() * 40,
        life: 1.2 + Math.random(), maxLife: 1.6, size: 1.5 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#ffb347' : '#ff7a2f', gravity: -30, drag: 0.99,
      });
    }
  }

  ring(x, y, color, maxR = 70, life = 0.45) {
    this.rings.push({ x, y, color, r: 6, maxR, life, maxLife: life });
  }

  text(x, y, str, color = '#ffd76a', size = 15) {
    this.texts.push({ x, y, str, color, size, life: 1.1, maxLife: 1.1 });
  }

  addShake(amount) { this.shake = Math.min(14, this.shake + amount); }
  addFlash(amount) { this.flash = Math.min(0.5, this.flash + amount); }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.drag; p.vy *= p.drag;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 34 * dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const r of this.rings) { r.life -= dt; r.r += (r.maxR - r.r) * dt * 9; }
    this.rings = this.rings.filter((r) => r.life > 0);
    this.shake = Math.max(0, this.shake - dt * 26);
    this.flash = Math.max(0, this.flash - dt * 1.4);
  }

  draw(ctx) {
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.8;
      ctx.strokeStyle = r.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 1.6);
      ctx.font = `bold ${t.size}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1b1035';
      ctx.fillText(t.str, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
