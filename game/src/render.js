// All drawing of the live game: plots, towers, enemies, projectiles, HUD.

import { W, H, PALETTE, TOWERS, TOWER_ORDER, UPGRADE_COST_MULT, MAX_LEVEL } from './config.js';
import { towerStats, upgradeCost, sellValue } from './towers.js';

export function drawGame(ctx, world, bg) {
  ctx.save();
  if (world.fx.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * world.fx.shake, (Math.random() - 0.5) * world.fx.shake);
  }
  bg.draw(ctx, world);

  // Build plots.
  for (let i = 0; i < world.plots.length; i++) {
    const p = world.plots[i];
    drawPlot(ctx, world, p, i);
  }

  // Enemies (sorted so lower-road foes draw on top).
  const sorted = [...world.enemies].sort((a, b) => a.y - b.y);
  for (const e of sorted) drawEnemy(ctx, e, world.time);

  // Towers.
  for (const p of world.plots) if (p.tower) drawTower(ctx, world, p.tower);

  // Projectiles.
  for (const pr of world.projectiles) {
    ctx.fillStyle = pr.color;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.key === 'mortar' ? 6 : 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(pr.x - 1, pr.y - 1, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Chain lightning.
  for (const l of world.lightning) {
    ctx.globalAlpha = Math.max(0, l.life / l.maxLife);
    ctx.strokeStyle = '#e9d9ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const mx = (l.x1 + l.x2) / 2 + (Math.random() - 0.5) * 18;
    const my = (l.y1 + l.y2) / 2 + (Math.random() - 0.5) * 18;
    ctx.moveTo(l.x1, l.y1); ctx.lineTo(mx, my); ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  world.fx.draw(ctx);
  ctx.restore();

  // Beacon flash when a leak happens.
  if (world.fx.flash > 0) {
    ctx.fillStyle = `rgba(255, 60, 80, ${world.fx.flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawHud(ctx, world);
  if (world.banner && world.bannerTimer > 0) drawBanner(ctx, world);
}

function drawPlot(ctx, world, plot, idx) {
  const selected = world.selectedPlot === idx;
  ctx.fillStyle = selected ? '#4a3a6a' : '#3a3348';
  ctx.strokeStyle = selected ? '#ffd76a' : '#6b5a8f';
  ctx.lineWidth = selected ? 3 : 2;
  ctx.beginPath(); ctx.arc(plot.x, plot.y, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (!plot.tower) {
    ctx.fillStyle = 'rgba(255, 215, 106, 0.5)';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', plot.x, plot.y + 1);
    ctx.textBaseline = 'alphabetic';
  } else if (selected) {
    const stats = towerStats(plot.tower.key, plot.tower.level);
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.55)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(plot.x, plot.y, stats.range, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Hover hint on an empty plot.
  if (!plot.tower && world.hoverPlot === idx) {
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(plot.x, plot.y, 30, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawTower(ctx, world, t) {
  const stats = towerStats(t.key, t.level);
  const base = stats.color;
  ctx.save();
  ctx.translate(t.x, t.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 12, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Stone base.
  ctx.fillStyle = '#4a4f5e';
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5d6274';
  ctx.beginPath(); ctx.arc(0, -2, 14, 0, Math.PI * 2); ctx.fill();

  if (t.key === 'ember') {
    ctx.rotate(t.angle);
    ctx.fillStyle = base;
    ctx.fillRect(0, -4, 20, 8);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(20, 0, 4 + t.flash * 2, 0, Math.PI * 2); ctx.fill();
  } else if (t.key === 'frost') {
    ctx.fillStyle = base;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t.spin * 0.4;
      ctx.moveTo(0, -14);
      ctx.lineTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a + 0.5) * 13, Math.sin(a + 0.5) * 13);
      ctx.lineTo(Math.cos(a + 1) * 5, Math.sin(a + 1) * 5);
    }
    ctx.fill();
    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (t.key === 'mortar') {
    ctx.rotate(t.angle);
    ctx.fillStyle = '#3a2f28';
    ctx.fillRect(-6, -6, 22, 12);
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.arc(14, 0, 6 + t.flash * 2, 0, Math.PI * 2); ctx.fill();
  } else if (t.key === 'storm') {
    ctx.rotate(t.spin);
    ctx.strokeStyle = base;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 6 + i * 4, i * 2.1, i * 2.1 + 4.2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 4 + t.flash * 2, 0, Math.PI * 2); ctx.fill();
  } else if (t.key === 'thorn') {
    ctx.fillStyle = base;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t.spin * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a + 0.4) * 16, Math.sin(a + 0.4) * 16);
      ctx.lineTo(Math.cos(a + 0.8) * 6, Math.sin(a + 0.8) * 6);
      ctx.fill();
    }
    ctx.fillStyle = '#2c4a2e';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Level pips.
  ctx.fillStyle = '#ffd76a';
  for (let i = 0; i < t.level; i++) {
    ctx.beginPath(); ctx.arc(t.x - 8 + i * 8, t.y - 26, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // Muzzle flash.
  if (t.flash > 0.4) {
    ctx.globalAlpha = t.flash;
    ctx.fillStyle = '#fff2c9';
    ctx.beginPath(); ctx.arc(t.x, t.y - 14, 8 * t.flash, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawEnemy(ctx, e, time) {
  const bob = Math.sin(e.wobble) * 2;
  const def = e.def;
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, e.def.radius * 0.7, e.def.radius * 0.9, e.def.radius * 0.35, 0, 0, Math.PI * 2); ctx.fill();

  if (e.kind === 'cinderling') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(-3, -2, 2, 0, Math.PI * 2); ctx.arc(4, -2, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'ashwalker') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3348';
    ctx.fillRect(-8, -14, 16, 6);
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath(); ctx.arc(-4, -1, 2, 0, Math.PI * 2); ctx.arc(5, -1, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'stoneback') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5d6274';
    ctx.beginPath(); ctx.arc(0, -4, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(-4, -6, 2, 0, Math.PI * 2); ctx.arc(5, -6, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'wisp') {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, -6, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 233, 168, 0.5)';
    ctx.beginPath(); ctx.arc(0, -6, 14 + Math.sin(time * 6) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a3348';
    ctx.beginPath(); ctx.arc(-3, -8, 1.5, 0, Math.PI * 2); ctx.arc(4, -8, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'charger') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(4, -2, 2, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'shade') {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e9d9ff';
    ctx.beginPath(); ctx.arc(-4, -3, 2.5, 0, Math.PI * 2); ctx.arc(5, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 2, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  } else {
    // Bosses: big horned ember-fiend with a crown of flame.
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, e.def.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1035';
    ctx.beginPath(); ctx.arc(-e.def.radius * 0.55, -4, 5, 0, Math.PI * 2); ctx.arc(e.def.radius * 0.55, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(-e.def.radius * 0.55, -4, 2.5, 0, Math.PI * 2); ctx.arc(e.def.radius * 0.55, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    // Horns.
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.moveTo(-e.def.radius * 0.7, -e.def.radius * 0.6);
    ctx.lineTo(-e.def.radius * 0.95, -e.def.radius * 1.25);
    ctx.lineTo(-e.def.radius * 0.35, -e.def.radius * 0.85);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.def.radius * 0.7, -e.def.radius * 0.6);
    ctx.lineTo(e.def.radius * 0.95, -e.def.radius * 1.25);
    ctx.lineTo(e.def.radius * 0.35, -e.def.radius * 0.85);
    ctx.closePath(); ctx.fill();
  }

  // Hit flash.
  if (e.flash > 0.4) {
    ctx.globalAlpha = e.flash * 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, e.def.radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Slow tint.
  if (e.slowUntil > 0 && time < e.slowUntil) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#7fd4ff';
    ctx.beginPath(); ctx.arc(0, 0, e.def.radius + 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // HP bar.
  if (e.hp < e.maxHp) {
    const w = e.def.boss ? 56 : 30;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - w / 2, e.y - e.def.radius - 12, w, 5);
    ctx.fillStyle = e.def.boss ? '#ff5d73' : '#9be15d';
    ctx.fillRect(e.x - w / 2, e.y - e.def.radius - 12, w * Math.max(0, e.hp / e.maxHp), 5);
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(16, 12, 28, 0.85)';
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, 44, W, 2);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`◆ ${world.gold}`, 16, 30);
  ctx.fillStyle = PALETTE.heart;
  ctx.fillText(`♥ ${world.lives}/${world.maxLives}`, 150, 30);
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`WAVE ${Math.max(1, world.wave)}/12`, 300, 30);
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`SCORE ${world.score.toLocaleString()}`, 470, 30);
  if (world.combo > 1) {
    ctx.fillStyle = '#ff9a3c';
    ctx.fillText(`COMBO x${world.combo.toFixed(2)}`, 680, 30);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`${world.diff.label}  •  ${world.kills} slain`, W - 16, 29);

  // Boss bar.
  const boss = world.enemies.find((e) => e.def.boss);
  if (boss) {
    const bw = 420;
    const bx = (W - bw) / 2, by = 56;
    ctx.fillStyle = 'rgba(16, 12, 28, 0.85)';
    ctx.fillRect(bx - 10, by - 8, bw + 20, 34);
    ctx.strokeStyle = '#ff5d73';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 10, by - 8, bw + 20, 34);
    ctx.fillStyle = '#3a1520';
    ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = '#ff5d73';
    ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 10);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd9de';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(`${boss.name.toUpperCase()}${boss.def.phases ? `  —  PHASE ${boss.phase}/3` : ''}`, W / 2, by + 24);
    ctx.textAlign = 'left';
  }

  // Wave button.
  if (!world.waveActive && world.screen === 'play' && world.wave < 12) {
    const bx = W - 210, by = 60, bw = 194, bh = 40;
    ctx.fillStyle = '#7a4a1f';
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`▶  START WAVE ${world.wave + 1}`, bx + bw / 2, by + 26);
    ctx.textAlign = 'left';
    world.waveBtn = { x: bx, y: by, w: bw, h: bh };
  } else {
    world.waveBtn = null;
  }
  // Speed + pause buttons.
  ctx.fillStyle = 'rgba(16, 12, 28, 0.85)';
  ctx.strokeStyle = PALETTE.panelEdge;
  roundRect(ctx, W - 96, 108, 80, 30, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${world.speed}x SPEED`, W - 56, 128);
  ctx.textAlign = 'left';
  world.speedBtn = { x: W - 96, y: 108, w: 80, h: 30 };
}

function drawBanner(ctx, world) {
  const a = Math.min(1, world.bannerTimer);
  ctx.globalAlpha = a;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  const w = ctx.measureText(world.banner).width + 60;
  ctx.fillRect((W - w) / 2, 96, w, 52);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(world.banner, W / 2, 132);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBuildBar(ctx, world) {
  // Bottom bar: tower cards when a plot is selected, or hints otherwise.
  const y = H - 96;
  ctx.fillStyle = 'rgba(16, 12, 28, 0.9)';
  ctx.fillRect(0, y, W, 96);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, y, W, 2);

  if (world.selectedTower) {
    drawTowerPanel(ctx, world, y);
    return;
  }
  if (world.selectedPlot >= 0) {
    drawBuildCards(ctx, world, y);
    return;
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Click a glowing plot to build  •  Click a tower to upgrade or sell  •  SPACE starts the next wave  •  F toggles speed  •  P pauses', W / 2, y + 34);
  ctx.fillText('Hotkeys 1–5 pick a tower while a plot is selected. Survive all 12 waves — the Tyrant waits at the end.', W / 2, y + 62);
  ctx.textAlign = 'left';
}

function drawBuildCards(ctx, world, y) {
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('BUILD ON THIS PLOT  —  pick a tower (keys 1–5):', 20, y + 24);
  world.buildCards = [];
  TOWER_ORDER.forEach((key, i) => {
    const def = TOWERS[key];
    const x = 20 + i * 246, w = 234, h = 56;
    const afford = world.gold >= def.cost;
    ctx.fillStyle = afford ? 'rgba(58, 44, 84, 0.9)' : 'rgba(40, 30, 50, 0.6)';
    ctx.strokeStyle = world.buildKey === key ? '#ffd76a' : PALETTE.panelEdge;
    ctx.lineWidth = world.buildKey === key ? 3 : 1.5;
    roundRect(ctx, x, y + 32, w, h, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(x + 22, y + 60, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = afford ? PALETTE.text : '#7a6f5f';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`${i + 1}  ${def.name}`, x + 40, y + 52);
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = afford ? PALETTE.gold : '#7a6f5f';
    let line = `◆ ${def.cost}   ·   ${def.desc}`;
    while (line.length > 4 && ctx.measureText(line).width > w - 52) line = line.slice(0, -2);
    if (line.length < `◆ ${def.cost}   ·   ${def.desc}`.length) line = line.trimEnd() + '…';
    ctx.fillText(line, x + 40, y + 72);
    world.buildCards.push({ x, y: y + 32, w, h, key });
  });
}

function drawTowerPanel(ctx, world, y) {
  const t = world.selectedTower;
  const stats = towerStats(t.key, t.level);
  const def = TOWERS[t.key];
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(`${def.name}  —  Level ${t.level}${t.level >= MAX_LEVEL ? ' (MAX)' : ''}`, 20, y + 26);
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = PALETTE.textDim;
  const dps = stats.aura ? `${stats.damage}/s aura` : `${stats.damage} dmg × ${stats.rate}/s`;
  ctx.fillText(`${dps}  ·  range ${Math.round(stats.range)}  ·  ${t.kills} slain  ·  invested ◆ ${t.invested}`, 20, y + 50);
  ctx.fillText(def.desc, 20, y + 74);

  world.upgradeBtn = null;
  world.sellBtn = null;
  // Upgrade button.
  const ux = 640, uw = 250, uh = 46;
  if (t.level < MAX_LEVEL) {
    const cost = upgradeCost(t.key, t.level);
    const afford = world.gold >= cost;
    ctx.fillStyle = afford ? '#7a4a1f' : '#3a3348';
    ctx.strokeStyle = afford ? PALETTE.gold : '#5a4f6a';
    ctx.lineWidth = 2;
    roundRect(ctx, ux, y + 26, uw, uh, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = afford ? '#ffe9a8' : '#8a7f6f';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⬆  UPGRADE  ◆ ${cost}`, ux + uw / 2, y + 54);
    world.upgradeBtn = { x: ux, y: y + 26, w: uw, h: uh };
  } else {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ FULLY UPGRADED ★', ux + uw / 2, y + 54);
  }
  // Sell button.
  const sx = 910, sw = 180;
  ctx.fillStyle = '#4a2a2a';
  ctx.strokeStyle = '#c98a8a';
  ctx.lineWidth = 2;
  roundRect(ctx, sx, y + 26, sw, uh, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd9de';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SELL  ◆ ${sellValue(t)}`, sx + sw / 2, y + 54);
  world.sellBtn = { x: sx, y: y + 26, w: sw, h: uh };
  ctx.textAlign = 'left';
}
