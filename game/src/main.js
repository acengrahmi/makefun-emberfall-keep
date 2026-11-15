// Boot + fixed-step loop. ?shot=N renders a deterministic screenshot scene.

import { W, H } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { Background } from './background.js';
import { drawGame, drawBuildBar } from './render.js';
import { drawTitle, drawPaused, drawEnd, handlePlayClick } from './screens.js';
import { sceneTitle, scenePlay, sceneBuild, sceneWin } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const world = new World(7);
const input = new Input(canvas);
const bg = new Background(7);

// Expose for headless tests and the screenshot driver.
window.__game = { world, bg, input };

const params = new URLSearchParams(location.search);
const shotParam = params.get('shot');
let shotMode = false;

function render() {
  ctx.clearRect(0, 0, W, H);
  if (world.screen === 'title') {
    drawTitle(ctx, world, bg);
  } else {
    drawGame(ctx, world, bg);
    if (world.screen === 'play') drawBuildBar(ctx, world);
    else if (world.screen === 'paused') drawPaused(ctx, world);
    else drawEnd(ctx, world);
  }
}

function handleClick(x, y) {
  if (world.screen === 'title') {
    // Difficulty pill?
    if (world.diffBtns) {
      for (const b of world.diffBtns) {
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          world.reset(b.key);
          world.audio.ensure(); world.audio.click();
          return;
        }
      }
    }
    world.startRun(world.diffKey);
    return;
  }
  if (world.screen === 'paused') { world.screen = 'play'; return; }
  if (world.screen === 'won' || world.screen === 'lost') {
    world.startRun(world.diffKey);
    return;
  }
  if (handlePlayClick(world, x, y)) return;
  world.clickAt(x, y);
}

function handleKey(key) {
  if (key === 'enter' && world.screen === 'title') { world.startRun(world.diffKey); return; }
  if (world.screen === 'title') return;
  if (key === 'p') {
    if (world.screen === 'play') world.screen = 'paused';
    else if (world.screen === 'paused') world.screen = 'play';
    return;
  }
  if (key === 'r' && (world.screen === 'won' || world.screen === 'lost' || world.screen === 'play' || world.screen === 'paused')) {
    world.startRun(world.diffKey);
    return;
  }
  if (key === ' ') {
    if (world.screen === 'play') world.startWave();
    return;
  }
  if (key === 'f' && world.screen === 'play') {
    world.speed = world.speed === 1 ? 2 : 1;
    return;
  }
  if (key === 'escape') { world.selectedPlot = -1; world.selectedTower = null; world.buildKey = null; return; }
  if (world.screen === 'play' && world.selectedPlot >= 0) {
    const idx = ['1', '2', '3', '4', '5'].indexOf(key);
    if (idx >= 0) {
      const keys = ['ember', 'frost', 'mortar', 'storm', 'thorn'];
      world.buildKey = keys[idx];
      if (world.buildTower(world.selectedPlot, keys[idx])) { world.selectedPlot = -1; world.buildKey = null; }
    }
  }
  if (key === 'u' && world.selectedTower) world.upgradeSelected();
}

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  bg.update(dt);
  if (!shotMode) {
    // Input.
    if (input.clicked) handleClick(input.clicked.x, input.clicked.y);
    for (const k of Object.keys(input.pressed)) handleKey(k);
    // Hover plot tracking for the build hint.
    world.hoverPlot = -1;
    for (let i = 0; i < world.plots.length; i++) {
      const p = world.plots[i];
      if (!p.tower && Math.hypot(input.mouseX - p.x, input.mouseY - p.y) < 34) world.hoverPlot = i;
    }
    input.endFrame();
    acc += dt;
    while (acc >= STEP) { world.update(STEP); acc -= STEP; }
  }
  render();
  requestAnimationFrame(frame);
}

if (shotParam) {
  shotMode = true;
  const n = parseInt(shotParam, 10);
  const scenes = { 1: sceneTitle, 2: scenePlay, 3: sceneBuild, 4: sceneWin };
  const scene = scenes[n];
  if (!scene) throw new Error(`unknown shot ${shotParam}`);
  scene(world);
  bg.update(0.5);
  render();
  document.title = `shot-${n}`;
} else {
  requestAnimationFrame(frame);
}
