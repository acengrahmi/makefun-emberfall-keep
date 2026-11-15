// Towers: build, target, fire, upgrade, sell. Pure logic — no canvas here.

import {
  TOWERS, UPGRADE_COST_MULT, UPGRADE_DMG_MULT, UPGRADE_RANGE_MULT,
  MAX_LEVEL, SELL_REFUND,
} from './config.js';

export function towerStats(key, level) {
  const def = TOWERS[key];
  const dmg = def.damage * Math.pow(UPGRADE_DMG_MULT, level - 1);
  const range = def.range * Math.pow(UPGRADE_RANGE_MULT, level - 1);
  return { ...def, damage: dmg, range, level };
}

export function upgradeCost(key, level) {
  // Cost to go from `level` to `level + 1`.
  return Math.round(TOWERS[key].cost * UPGRADE_COST_MULT * level);
}

export function createTower(key, x, y) {
  return {
    key, x, y, level: 1, cooldown: 0, angle: -Math.PI / 2,
    invested: TOWERS[key].cost, kills: 0, flash: 0, spin: 0,
  };
}

export function sellValue(tower) {
  return Math.floor(tower.invested * SELL_REFUND);
}

// Pick the enemy furthest along the road within range.
export function pickTarget(tower, enemies, stats) {
  let best = null;
  let bestD = -1;
  for (const e of enemies) {
    if (e.dead || e.escaped) continue;
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d <= stats.range && e.dist > bestD) { best = e; bestD = e.dist; }
  }
  return best;
}

export function updateTower(tower, dt, enemies, world) {
  const stats = towerStats(tower.key, tower.level);
  tower.cooldown -= dt;
  tower.flash = Math.max(0, tower.flash - dt * 6);
  tower.spin += dt * (tower.key === 'storm' ? 2.2 : 0.6);

  if (stats.aura) {
    // Thorn Bramble: a wounding aura, ticking once a second.
    if (tower.cooldown <= 0) {
      tower.cooldown = 1 / stats.rate;
      let hitAny = false;
      for (const e of enemies) {
        if (e.dead || e.escaped) continue;
        if (Math.hypot(e.x - tower.x, e.y - tower.y) <= stats.range) {
          world.damageEnemy(e, stats.damage, tower);
          hitAny = true;
        }
      }
      if (hitAny) { tower.flash = 1; world.fx.ring(tower.x, tower.y, stats.color, stats.range, 0.4); world.audio.thorn(); }
    }
    return;
  }

  const target = pickTarget(tower, enemies, stats);
  if (!target) return;
  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  if (tower.cooldown > 0) return;
  tower.cooldown = 1 / stats.rate;
  tower.flash = 1;

  if (stats.chain) {
    // Storm Coil: instant chain lightning, no projectile.
    let from = { x: tower.x, y: tower.y };
    let current = target;
    const hit = new Set();
    for (let i = 0; i < stats.chain && current; i++) {
      hit.add(current);
      world.damageEnemy(current, stats.damage, tower);
      world.fx.burst(current.x, current.y, stats.color, 6, 90, 0.35, 2.5);
      world.lightning.push({ x1: from.x, y1: from.y, x2: current.x, y2: current.y, life: 0.18, maxLife: 0.18 });
      from = { x: current.x, y: current.y };
      let next = null; let nextD = Infinity;
      for (const e of enemies) {
        if (e.dead || e.escaped || hit.has(e)) continue;
        const d = Math.hypot(e.x - from.x, e.y - from.y);
        if (d < 150 && d < nextD) { next = e; nextD = d; }
      }
      current = next;
    }
    world.audio.zap();
    return;
  }

  // Bolt / shell / frost shard: a homing projectile.
  world.projectiles.push({
    x: tower.x, y: tower.y - 14, target,
    speed: stats.key === 'mortar' ? 320 : 520,
    damage: stats.damage, splash: stats.splash || 0,
    slow: stats.slow || 0, slowTime: stats.slowTime || 0,
    color: stats.color, key: stats.key, tower,
    arc: stats.key === 'mortar',
  });
  if (stats.key === 'mortar') world.audio.boom();
  else if (stats.key === 'frost') world.audio.frost();
  else world.audio.shoot();
}
