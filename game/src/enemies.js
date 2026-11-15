// Enemies: spawning, road movement, slows, blinks, surges, boss phases.

import { ENEMIES, waveHpMult, waveSpeedMult } from './config.js';

let enemyId = 0;

export function createEnemy(kind, wave, diff, dist = 0) {
  const def = ENEMIES[kind];
  const hp = Math.round(def.hp * waveHpMult(wave) * diff.hp);
  return {
    id: enemyId++, kind, name: def.name, def,
    hp, maxHp: hp,
    speed: def.speed * waveSpeedMult(wave) * diff.speed,
    baseSpeed: def.speed * waveSpeedMult(wave) * diff.speed,
    dist, x: 0, y: 0,
    slowUntil: 0, slowFactor: 1,
    blinkTimer: def.blink ? 3.5 : 0,
    surged: false,
    phase: 1, summoned: false, summoned2: false,
    dead: false, escaped: false,
    wobble: Math.random() * Math.PI * 2,
    flash: 0,
  };
}

export function buildSpawnQueue(waveDef, wave, diff) {
  const queue = [];
  let t = 0.5;
  for (const g of waveDef.groups) {
    for (let i = 0; i < g.n; i++) {
      queue.push({ kind: g.kind, at: t });
      t += g.gap;
    }
    t += 1.2; // breath between groups
  }
  return queue;
}

export function updateEnemy(e, dt, world) {
  if (e.dead || e.escaped) return;
  e.flash = Math.max(0, e.flash - dt * 5);

  // Frost slow.
  let speed = e.baseSpeed;
  if (world.time < e.slowUntil) speed *= e.slowFactor;

  // Charger surge: halfway down the road it breaks into a sprint.
  if (e.def.surge && !e.surged && e.dist > world.path.total * 0.5) {
    e.surged = true;
    speed *= 2.1;
    world.fx.burst(e.x, e.y, '#ff5d73', 8, 100, 0.4, 2.5);
  }
  if (e.surged) speed = e.baseSpeed * 2.1 * (world.time < e.slowUntil ? e.slowFactor : 1);

  // Shade blink: hops forward along the road every few seconds.
  if (e.def.blink) {
    e.blinkTimer -= dt;
    if (e.blinkTimer <= 0) {
      e.blinkTimer = 4;
      e.dist += 130;
      world.fx.burst(e.x, e.y, '#b388ff', 10, 110, 0.4, 2.5);
    }
  }

  // Boss phases.
  if (e.def.boss) bossPhase(e, world);

  e.dist += speed * dt;
  const pos = world.path.at(e.dist);
  e.x = pos.x; e.y = pos.y;
  e.wobble += dt * 6;
  if (e.dist >= world.path.total) {
    e.escaped = true;
    world.onLeak(e);
  }
}

function bossPhase(e, world) {
  const frac = e.hp / e.maxHp;
  if (e.def.summon && !e.summoned && frac <= 0.5) {
    e.summoned = true;
    summonEscort(e, world, 'cinderling', 4);
    world.fx.ring(e.x, e.y, '#ff7a2f', 90, 0.6);
    world.audio.bossRoar();
  }
  if (e.def.phases === 3) {
    if (!e.summoned2 && frac <= 0.66) {
      e.summoned2 = true;
      e.phase = 2;
      summonEscort(e, world, 'shade', 3);
      world.fx.ring(e.x, e.y, '#ff2f5d', 110, 0.6);
      world.audio.bossRoar();
    }
    if (frac <= 0.33 && e.phase < 3) {
      e.phase = 3;
      e.baseSpeed *= 1.5;
      world.fx.ring(e.x, e.y, '#ff2f5d', 130, 0.8);
      world.fx.text(e.x, e.y - 44, 'THE TYRANT RAGES!', '#ff5d73', 20);
      world.audio.bossRoar();
    }
  } else if (e.def.boss && frac <= 0.5 && e.phase === 1) {
    e.phase = 2;
    e.baseSpeed *= 1.3;
    world.fx.text(e.x, e.y - 40, 'ENRAGED!', '#ff7a2f', 18);
  }
}

function summonEscort(boss, world, kind, n) {
  for (let i = 0; i < n; i++) {
    const m = createEnemy(kind, world.wave, world.diff, Math.max(0, boss.dist - 40 - i * 30));
    const pos = world.path.at(m.dist);
    m.x = pos.x; m.y = pos.y;
    world.enemies.push(m);
  }
}
