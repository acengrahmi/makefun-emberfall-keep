// Deterministic screenshot scenes (?shot=N) and the validation autopilot.
// The autopilot plays the real game with the real rules — it must win.

import { TOWERS, TOWER_ORDER } from './config.js';
import { createEnemy } from './enemies.js';

// A fixed, strong opening build: towers on the plots that cover the most road.
export const AUTO_BUILD = [
  { plot: 1, key: 'ember' },   // (352,212) covers run 1 + run 2
  { plot: 5, key: 'ember' },   // (330,388) covers run 2 + run 3
  { plot: 2, key: 'frost' },   // (560,212)
  { plot: 6, key: 'mortar' },  // (540,388)
  { plot: 0, key: 'ember' },
  { plot: 8, key: 'storm' },   // (952,388) covers the right verticals
  { plot: 3, key: 'ember' },
  { plot: 10, key: 'thorn' },  // (620,556) covers run 3 + run 4
  { plot: 7, key: 'frost' },
  { plot: 4, key: 'mortar' },
  { plot: 11, key: 'storm' },
  { plot: 9, key: 'ember' },
  { plot: 12, key: 'mortar' },
  { plot: 13, key: 'thorn' },
];

// Upgrade priority: the towers that do the most work, in order.
export const AUTO_UPGRADES = [6, 8, 11, 1, 5, 2, 10, 0, 3, 7, 4, 9, 12, 13];

// One autopilot step: build what we can afford, upgrade what we can, start waves.
export function autopilotStep(world) {
  if (world.screen !== 'play') return;
  // Build in order while affordable.
  for (const b of AUTO_BUILD) {
    const plot = world.plots[b.plot];
    if (!plot.tower && world.gold >= TOWERS[b.key].cost) world.buildTower(b.plot, b.key);
  }
  // Upgrades: one per step, cheapest priority first.
  for (const pi of AUTO_UPGRADES) {
    const t = world.plots[pi].tower;
    if (t && t.level < 3) {
      const cost = Math.round(TOWERS[t.key].cost * 0.85 * t.level);
      if (world.gold >= cost + 60) { // keep a reserve for the next build
        world.selectedTower = t;
        if (world.upgradeSelected()) break;
      }
    }
  }
  // Start the next wave as soon as the field is clear.
  if (!world.waveActive && world.wave < 12) world.startWave();
}

// Run the autopilot headlessly at a fixed step until the run ends.
export function runAutopilot(world, maxSeconds = 900) {
  const dt = 1 / 60;
  let steps = 0;
  const maxSteps = maxSeconds * 60;
  while ((world.screen === 'play') && steps < maxSteps) {
    autopilotStep(world);
    world.update(dt);
    steps++;
  }
  return {
    screen: world.screen, score: world.score, wave: world.wave,
    kills: world.kills, bosses: world.bossesSlain, lives: world.lives,
    gold: world.gold, time: world.time, steps,
  };
}

// ---- screenshot scenes (deterministic, seeded) ----

// Scene 1: title screen.
export function sceneTitle(world) {
  world.screen = 'title';
  world.time = 4;
}

// Scene 2: mid-game, wave 8 boss fight with a full tower line.
export function scenePlay(world) {
  world.startRun('brave');
  world.time = 2;
  world.gold = 3000; // staged purse for the scene's mature build
  // A mature build, as if the player has been playing well.
  const build = [
    [1, 'ember', 2], [5, 'ember', 2], [2, 'frost', 2], [6, 'mortar', 2],
    [0, 'ember', 1], [8, 'storm', 2], [3, 'ember', 1], [10, 'thorn', 1],
    [7, 'frost', 1], [4, 'mortar', 1],
  ];
  for (const [pi, key, lvl] of build) {
    world.buildTower(pi, key);
    const t = world.plots[pi].tower;
    while (t.level < lvl) { world.selectedTower = t; world.upgradeSelected(); }
  }
  world.gold = 214; world.score = 19118; world.kills = 187;
  world.wave = 8; world.waveActive = true;
  world.spawnQueue = [];
  const boss = createEnemy('sovereign', 8, world.diff, world.path.total * 0.42);
  boss.hp = Math.round(boss.maxHp * 0.55);
  const pos = world.path.at(boss.dist); boss.x = pos.x; boss.y = pos.y;
  world.enemies.push(boss);
  const kinds = ['stoneback', 'wisp', 'charger', 'shade', 'ashwalker', 'cinderling'];
  const dists = [0.18, 0.26, 0.31, 0.52, 0.6, 0.68, 0.75, 0.82, 0.9, 0.1, 0.35, 0.45];
  dists.forEach((f, i) => {
    const e = createEnemy(kinds[i % kinds.length], 8, world.diff, world.path.total * f);
    const p = world.path.at(e.dist); e.x = p.x; e.y = p.y;
    world.enemies.push(e);
  });
  world.combo = 2.75; world.comboTimer = 2.5;
  world.setBanner('WAVE 8 — THE ASH SOVEREIGN', 2.0);
  // Let the fight breathe for a few frames so bolts are in the air.
  for (let i = 0; i < 40; i++) world.update(1 / 60);
  world.banner = 'WAVE 8 — THE ASH SOVEREIGN'; world.bannerTimer = 2.0;
  // Clear the setup's upgrade callouts so the frame reads clean.
  world.fx.texts = [];
  world.fx.rings = [];
}

// Scene 3: wave-clear intermission — build bar open on an empty plot.
export function sceneBuild(world) {
  world.startRun('brave');
  world.time = 1;
  world.gold = 1000; // staged purse for the scene's build
  world.buildTower(1, 'ember');
  world.buildTower(5, 'frost');
  world.buildTower(2, 'mortar');
  world.gold = 148; world.score = 1386; world.kills = 42;
  world.wave = 2; world.waveActive = false;
  world.selectedPlot = 6;
  world.buildKey = 'storm';
  world.setBanner('WAVE 2 CLEARED  •  +80 gold  •  FLAWLESS +600', 2.5);
  for (let i = 0; i < 30; i++) world.update(1 / 60);
  world.banner = 'WAVE 2 CLEARED  •  +80 gold  •  FLAWLESS +600'; world.bannerTimer = 2.5;
}

// Scene 4: victory screen after a real autopilot win.
export function sceneWin(world) {
  world.startRun('brave');
  const result = runAutopilot(world, 900);
  if (world.screen !== 'won') {
    // Fallback: fabricate nothing — report the failure honestly.
    world.endStats = null;
    throw new Error(`autopilot did not win (screen=${result.screen}, wave=${result.wave}, lives=${result.lives})`);
  }
  world.time += 1;
}
