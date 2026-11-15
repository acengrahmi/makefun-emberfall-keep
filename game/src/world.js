// The simulation: game state, waves, economy, combat, scoring, autopilot.
// Pure logic (no DOM, no canvas) so headless tests can drive it directly.

import {
  W, H, DIFFS, WAVES, TOTAL_WAVES, START_GOLD, WAVE_CLEAR_BONUS, HOARD_RATE,
  HOARD_CAP, COMBO_WINDOW, COMBO_MAX, FLAWLESS_BONUS, TOWERS, BOSS_SLOW_FACTOR,
  ENEMIES,
} from './config.js';
import { Path, makePlots, plotAt } from './path.js';
import { createTower, towerStats, upgradeCost, sellValue, updateTower } from './towers.js';
import { createEnemy, buildSpawnQueue, updateEnemy } from './enemies.js';
import { Fx } from './fx.js';
import { AudioSys } from './audio.js';

export const SCREENS = ['title', 'play', 'paused', 'won', 'lost'];

export class World {
  constructor(seed = 7) {
    this.seed = seed;
    this.path = new Path();
    this.plots = makePlots();
    this.fx = new Fx();
    this.audio = new AudioSys();
    this.lightning = [];
    this.projectiles = [];
    this.enemies = [];
    this.reset('brave');
  }

  reset(diffKey) {
    this.diffKey = diffKey;
    this.diff = DIFFS[diffKey];
    this.screen = 'title';
    this.time = 0;
    this.gold = START_GOLD;
    this.lives = this.diff.lives;
    this.maxLives = this.diff.lives;
    this.score = 0;
    this.wave = 0; // waves started so far (0 = none yet)
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.kills = 0;
    this.bossesSlain = 0;
    this.leaks = 0;
    this.goldEarned = 0;
    this.goldSpent = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboKills = 0;
    this.bestCombo = 1;
    this.flawlessWaves = 0;
    this.waveLeaks = 0;
    this.speed = 1;
    this.selectedPlot = -1;
    this.selectedTower = null;
    this.buildKey = null; // tower key chosen in the build bar
    this.banner = null;
    this.bannerTimer = 0;
    this.endStats = null;
    this.bestScore = 0;
    this.enemies = [];
    this.projectiles = [];
    this.lightning = [];
    this.fx = new Fx();
    for (const p of this.plots) p.tower = null;
  }

  startRun(diffKey) {
    this.reset(diffKey);
    this.screen = 'play';
    this.audio.ensure();
  }

  // ---- economy ----
  canAfford(cost) { return this.gold >= cost; }

  buildTower(plotIdx, key) {
    const plot = this.plots[plotIdx];
    if (!plot || plot.tower) return false;
    const cost = TOWERS[key].cost;
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.goldSpent += cost;
    plot.tower = createTower(key, plot.x, plot.y);
    this.fx.ring(plot.x, plot.y, TOWERS[key].color, 60, 0.5);
    this.fx.burst(plot.x, plot.y - 10, TOWERS[key].color, 14, 120, 0.5, 3);
    this.audio.build();
    return true;
  }

  upgradeSelected() {
    const t = this.selectedTower;
    if (!t || t.level >= 3) return false;
    const cost = upgradeCost(t.key, t.level);
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.goldSpent += cost;
    t.level += 1;
    t.invested += cost;
    this.fx.ring(t.x, t.y, '#ffd76a', 70, 0.5);
    this.fx.text(t.x, t.y - 34, `LEVEL ${t.level}!`, '#ffd76a', 16);
    this.audio.upgrade();
    return true;
  }

  sellSelected() {
    const t = this.selectedTower;
    if (!t) return false;
    const value = sellValue(t);
    this.gold += value;
    for (const p of this.plots) if (p.tower === t) p.tower = null;
    this.fx.text(t.x, t.y - 30, `+${value} gold`, '#ffd76a', 15);
    this.selectedTower = null;
    this.audio.coin();
    return true;
  }

  // ---- waves ----
  startWave() {
    if (this.waveActive || this.wave >= TOTAL_WAVES || this.screen !== 'play') return false;
    this.wave += 1;
    this.waveActive = true;
    this.spawnQueue = buildSpawnQueue(WAVES[this.wave - 1], this.wave, this.diff);
    this.spawnTimer = 0;
    this.waveLeaks = 0;
    this.setBanner(`WAVE ${this.wave} — ${this.waveName()}`, 2.2);
    const boss = WAVES[this.wave - 1].groups.some((g) => ENEMIES[g.kind].boss);
    if (boss) this.audio.bossRoar();
    return true;
  }

  waveName() {
    const names = {
      1: 'The First Embers', 2: 'Ash on the Wind', 3: 'Walkers in the Dark',
      4: 'The Cinder Herald', 5: 'Wisps of the Night', 6: 'Stone and Smoke',
      7: 'The Charging Horde', 8: 'The Ash Sovereign', 9: 'Shades Among Us',
      10: 'The Long Night', 11: 'Emberfall Rising', 12: 'The Tyrant Wakes',
    };
    return names[this.wave] || '';
  }

  setBanner(text, dur) { this.banner = text; this.bannerTimer = dur; }

  onLeak(e) {
    this.lives -= e.def.lives;
    this.leaks += 1;
    this.waveLeaks += 1;
    this.combo = 1; this.comboTimer = 0; this.comboKills = 0;
    this.fx.addShake(6);
    this.fx.addFlash(0.25);
    this.fx.text(1150, 560, `-${e.def.lives} ♥`, '#ff5d73', 20);
    this.audio.leak();
    if (this.lives <= 0) { this.lives = 0; this.endRun(false); }
  }

  damageEnemy(e, dmg, tower) {
    if (e.dead || e.escaped) return;
    const armor = e.def.armor || 0;
    const dealt = Math.max(1, Math.round(dmg - armor));
    e.hp -= dealt;
    e.flash = 1;
    if (e.hp <= 0) this.killEnemy(e, tower);
  }

  killEnemy(e, tower) {
    if (e.dead) return;
    e.dead = true;
    this.kills += 1;
    if (tower) tower.kills += 1;
    const goldGain = Math.round(e.def.reward * this.diff.gold);
    this.gold += goldGain;
    this.goldEarned += goldGain;
    // Combo: kills inside the window raise the multiplier.
    this.comboTimer = COMBO_WINDOW;
    this.comboKills += 1;
    this.combo = Math.min(COMBO_MAX, 1 + Math.floor(this.comboKills / 4) * 0.25);
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.score += Math.round(e.def.score * this.combo * this.diff.score);
    this.fx.burst(e.x, e.y, e.def.color, e.def.boss ? 40 : 10, e.def.boss ? 220 : 120, 0.55, 3);
    this.fx.text(e.x, e.y - 18, `+${goldGain}`, '#ffd76a', 13);
    if (e.def.boss) {
      this.bossesSlain += 1;
      this.fx.ring(e.x, e.y, '#ffd76a', 130, 0.8);
      this.fx.addShake(10);
      this.fx.text(e.x, e.y - 50, `${e.name.toUpperCase()} FALLEN!`, '#ffd76a', 20);
      this.audio.waveClear();
    } else if (this.kills % 25 === 0) {
      this.audio.coin();
    }
  }

  endWave() {
    this.waveActive = false;
    const bonus = WAVE_CLEAR_BONUS(this.wave);
    const hoard = Math.min(HOARD_CAP, Math.floor(this.gold * HOARD_RATE));
    let flawless = 0;
    if (this.waveLeaks === 0) {
      flawless = FLAWLESS_BONUS(this.wave);
      this.flawlessWaves += 1;
      this.score += Math.round(flawless * this.diff.score);
    }
    this.gold += bonus + hoard;
    this.goldEarned += bonus + hoard;
    this.score += Math.round(bonus * this.diff.score);
    this.fx.text(640, 300, `WAVE CLEAR  +${bonus} gold${hoard ? `  (+${hoard} hoard)` : ''}${flawless ? `  FLAWLESS +${flawless}` : ''}`, '#ffd76a', 19);
    this.audio.waveClear();
    if (this.wave >= TOTAL_WAVES) this.endRun(true);
  }

  endRun(won) {
    this.screen = won ? 'won' : 'lost';
    this.waveActive = false;
    // Clear transient overlays so the end screen reads clean.
    this.banner = null; this.bannerTimer = 0;
    this.fx.texts = []; this.fx.rings = []; this.projectiles = []; this.lightning = [];
    const raw = this.score;
    const rank = raw >= 60000 ? 'S' : raw >= 40000 ? 'A' : raw >= 25000 ? 'B' : raw >= 12000 ? 'C' : 'D';
    this.bestScore = Math.max(this.bestScore, raw);
    this.endStats = {
      won, score: raw, rank, wave: this.wave, kills: this.kills,
      bosses: this.bossesSlain, flawless: this.flawlessWaves,
      goldEarned: this.goldEarned, goldSpent: this.goldSpent,
      bestCombo: this.bestCombo, leaks: this.leaks,
      time: this.time, isBest: raw >= this.bestScore && raw > 0,
    };
    if (won) this.audio.victory(); else this.audio.defeat();
  }

  // ---- per-frame update ----
  update(rawDt) {
    const dt = Math.min(0.05, rawDt) * this.speed;
    this.fx.update(Math.min(0.05, rawDt));
    if (this.bannerTimer > 0) this.bannerTimer -= rawDt;
    if (this.screen !== 'play') { this.audio.musicTick(this.time); return; }
    this.time += dt;

    // Combo decay.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) { this.combo = 1; this.comboKills = 0; }
    }

    // Spawning.
    if (this.waveActive && this.spawnQueue.length) {
      this.spawnTimer += dt;
      while (this.spawnQueue.length && this.spawnTimer >= this.spawnQueue[0].at) {
        const s = this.spawnQueue.shift();
        const e = createEnemy(s.kind, this.wave, this.diff, 0);
        const pos = this.path.at(0);
        e.x = pos.x; e.y = pos.y;
        this.enemies.push(e);
      }
    }

    // Towers fire.
    for (const p of this.plots) {
      if (p.tower) updateTower(p.tower, dt, this.enemies, this);
    }

    // Projectiles home in.
    for (const pr of this.projectiles) {
      if (pr.target && (pr.target.dead || pr.target.escaped)) pr.target = null;
      if (!pr.target) { pr.dead = true; continue; }
      const dx = pr.target.x - pr.x, dy = pr.target.y - pr.y;
      const d = Math.hypot(dx, dy);
      const step = pr.speed * dt;
      if (d <= step + 6) {
        this.hitProjectile(pr);
        pr.dead = true;
      } else {
        pr.x += (dx / d) * step;
        pr.y += (dy / d) * step;
        if (pr.arc) pr.y -= Math.sin(Math.min(1, step / Math.max(1, d)) * Math.PI) * 2;
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    // Enemies march.
    for (const e of this.enemies) updateEnemy(e, dt, this);
    this.enemies = this.enemies.filter((e) => !e.dead && !e.escaped);

    // Lightning bolts fade.
    for (const l of this.lightning) l.life -= dt;
    this.lightning = this.lightning.filter((l) => l.life > 0);

    // Wave clear: queue empty, no enemies left.
    if (this.waveActive && !this.spawnQueue.length && !this.enemies.length) this.endWave();

    this.audio.musicTick(this.time);
  }

  hitProjectile(pr) {
    const t = pr.target;
    if (!t || t.dead || t.escaped) return;
    if (pr.splash) {
      this.fx.ring(t.x, t.y, pr.color, pr.splash, 0.4);
      this.fx.burst(t.x, t.y, pr.color, 14, 160, 0.5, 3);
      this.fx.addShake(2);
      const victims = [...this.enemies];
      for (const e of victims) {
        if (e.dead || e.escaped) continue;
        if (Math.hypot(e.x - t.x, e.y - t.y) <= pr.splash) this.damageEnemy(e, pr.damage, pr.tower);
      }
      this.audio.boom();
    } else {
      this.damageEnemy(t, pr.damage, pr.tower);
      this.fx.burst(t.x, t.y, pr.color, 5, 90, 0.3, 2);
      if (pr.slow && t.def) {
        const factor = t.def.boss ? 1 - (1 - pr.slow) * BOSS_SLOW_FACTOR : pr.slow;
        t.slowUntil = this.time + pr.slowTime;
        t.slowFactor = factor;
        this.fx.burst(t.x, t.y, '#7fd4ff', 4, 60, 0.4, 2);
      }
    }
  }

  // ---- input handling (called by main.js) ----
  clickAt(x, y) {
    if (this.screen === 'title') return 'title';
    if (this.screen === 'won' || this.screen === 'lost') return 'end';
    if (this.screen === 'paused') return 'paused';
    // Plot click: select plot or tower.
    const pi = plotAt(x, y, this.plots);
    if (pi >= 0) {
      const plot = this.plots[pi];
      this.selectedPlot = pi;
      this.selectedTower = plot.tower;
      this.buildKey = null;
      return 'plot';
    }
    this.selectedPlot = -1;
    this.selectedTower = null;
    this.buildKey = null;
    return 'none';
  }

  // Autopilot hook: the shots module drives this for validation.
  autoState() {
    return {
      screen: this.screen, wave: this.wave, gold: this.gold, lives: this.lives,
      score: this.score, waveActive: this.waveActive,
      towers: this.plots.filter((p) => p.tower).length,
      enemies: this.enemies.length, queue: this.spawnQueue.length,
    };
  }
}
