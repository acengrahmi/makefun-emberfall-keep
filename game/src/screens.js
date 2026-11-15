// Title, pause, victory and defeat screens + UI click routing.

import { W, H, PALETTE, DIFFS, TOWER_ORDER, TOWERS } from './config.js';
import { roundRect, drawBuildBar } from './render.js';

export function drawTitle(ctx, world, bg) {
  bg.draw(ctx, world);
  ctx.fillStyle = 'rgba(16, 10, 28, 0.55)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ember;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('— A TOWER-DEFENSE SIEGE —', W / 2, 92);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('EMBERFALL', W / 2, 178);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('KEEP', W / 2, 258);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'italic 19px Georgia, serif';
  ctx.fillText('The embers fall. The ashen horde marches. Hold the beacon through twelve waves.', W / 2, 300);
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Build towers on the glowing plots. Spend gold, upgrade, and let nothing reach the keep.', W / 2, 328);
  ctx.fillText('Mouse builds and upgrades  •  SPACE starts a wave  •  F speeds time  •  P pauses  •  R restarts', W / 2, 356);

  // Difficulty pills.
  world.diffBtns = [];
  const keys = Object.keys(DIFFS);
  keys.forEach((k, i) => {
    const d = DIFFS[k];
    const x = W / 2 - 330 + i * 224, y = 396, w = 204, h = 64;
    const sel = world.diffKey === k;
    ctx.fillStyle = sel ? '#7a4a1f' : 'rgba(16, 12, 28, 0.9)';
    ctx.strokeStyle = sel ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = sel ? 3 : 1.5;
    roundRect(ctx, x, y, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = sel ? '#ffe9a8' : PALETTE.text;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(d.label, W / 2 - 228 + i * 224, y + 26);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '12px Georgia, serif';
    ctx.fillText(d.desc, W / 2 - 228 + i * 224, y + 48);
    world.diffBtns.push({ x, y, w, h, key: k });
  });

  // Tower roster preview.
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('FIVE TOWERS STAND READY', W / 2, 508);
  TOWER_ORDER.forEach((key, i) => {
    const def = TOWERS[key];
    const x = W / 2 - 300 + i * 150;
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(x, 540, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(def.name, x, 566);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`◆ ${def.cost}`, x, 584);
  });

  // Start prompt.
  const pulse = 0.7 + 0.3 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', W / 2, 648);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(10, 6, 20, 0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText('PAUSED', W / 2, 300);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('The embers wait for no one — but they will wait for you.', W / 2, 344);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('P or CLICK to resume  •  R to restart', W / 2, 400);
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, world) {
  const s = world.endStats;
  const won = s.won;
  ctx.fillStyle = won ? 'rgba(14, 20, 10, 0.93)' : 'rgba(24, 7, 12, 0.93)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffe9a8' : '#ff8a9a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? 'THE BEACON HOLDS!' : 'THE KEEP HAS FALLEN', W / 2, 150);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'italic 19px Georgia, serif';
  ctx.fillText(won
    ? 'Dawn breaks over Emberfall. Twelve waves broken against your towers.'
    : 'The embers gutter out. The horde pours through the gate — but the keep can be rebuilt.', W / 2, 192);

  // Rank + score.
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 88px Georgia, serif';
  ctx.fillText(`RANK ${s.rank}`, W / 2, 300);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(`SCORE  ${s.score.toLocaleString()}`, W / 2, 348);
  if (s.isBest) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('★ NEW BEST SCORE ★', W / 2, 380);
  }

  // Stats grid.
  const rows = [
    [`Waves held`, `${s.wave} / 12`],
    [`Foes slain`, `${s.kills}`],
    [`Bosses slain`, `${s.bosses} / 3`],
    [`Flawless waves`, `${s.flawless}`],
    [`Best combo`, `x${s.bestCombo.toFixed(2)}`],
    [`Gold earned`, `◆ ${s.goldEarned}`],
    [`Gold spent`, `◆ ${s.goldSpent}`],
    [`Time`, fmtTime(s.time)],
  ];
  ctx.font = '17px Georgia, serif';
  rows.forEach((r, i) => {
    const y = 424 + i * 28;
    const col = i % 2;
    const x = col === 0 ? W / 2 - 330 : W / 2 + 30;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(r[0], x, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(r[1], x + 250, y);
  });
  ctx.textAlign = 'center';
  const pulse = 0.7 + 0.3 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', W / 2, 668);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Route a click through the in-play UI. Returns true when handled.
export function handlePlayClick(world, x, y) {
  const inside = (b) => b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  if (inside(world.waveBtn)) { world.startWave(); return true; }
  if (inside(world.speedBtn)) { world.speed = world.speed === 1 ? 2 : 1; return true; }
  if (world.selectedTower) {
    if (inside(world.upgradeBtn)) { world.upgradeSelected(); return true; }
    if (inside(world.sellBtn)) { world.sellSelected(); return true; }
  }
  if (world.selectedPlot >= 0 && world.buildCards) {
    for (const c of world.buildCards) {
      if (inside(c)) { world.buildTower(world.selectedPlot, c.key); world.selectedPlot = -1; world.buildKey = null; return true; }
    }
  }
  return false;
}

export { drawBuildBar };
