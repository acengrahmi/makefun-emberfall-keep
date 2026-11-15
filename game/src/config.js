// Emberfall Keep — tuning, palette, towers, enemies, waves.
// Every number lives here so the whole game can be retuned from one file.

export const W = 1280;
export const H = 720;

export const PALETTE = {
  skyTop: '#1b1035',
  skyMid: '#3d1c4e',
  skyLow: '#7a2e3d',
  ember: '#ffb347',
  emberDeep: '#ff7a2f',
  gold: '#ffd76a',
  goldDim: '#c9a13b',
  path: '#5a4632',
  pathEdge: '#8a6f4d',
  grass: '#2c4a2e',
  grassDark: '#1e3320',
  stone: '#6b6f7a',
  stoneDark: '#434753',
  keep: '#8d93a5',
  keepRoof: '#c65a3c',
  beacon: '#ffe9a8',
  heart: '#ff5d73',
  heartDim: '#8f2f42',
  frost: '#7fd4ff',
  storm: '#c9a7ff',
  thorn: '#9be15d',
  panel: 'rgba(16, 12, 28, 0.92)',
  panelEdge: '#6b5a8f',
  text: '#f4ead8',
  textDim: '#b8a98f',
};

export const DIFFS = {
  gentle: { label: 'GENTLE', hp: 0.8, speed: 0.9, gold: 1.0, lives: 25, score: 0.8, desc: 'Relaxed night — learn the keep' },
  brave: { label: 'BRAVE', hp: 1.0, speed: 1.0, gold: 1.0, lives: 20, score: 1.0, desc: 'The intended siege' },
  heroic: { label: 'HEROIC', hp: 1.3, speed: 1.12, gold: 0.9, lives: 15, score: 1.5, desc: 'The ember storm at full fury' },
};

// The siege road: a serpentine stone path from the west gate to the keep.
export const PATH_POINTS = [
  { x: -20, y: 118 }, { x: 824, y: 118 },
  { x: 824, y: 298 }, { x: 196, y: 298 },
  { x: 196, y: 468 }, { x: 824, y: 468 },
  { x: 824, y: 606 }, { x: 1152, y: 606 },
];
export const PATH_END = { x: 1212, y: 606 };
export const PATH_WIDTH = 46;

// Build plots: stone circles the player may build on. Chosen to cover
// bends and long straights so every tower has a job.
export const PLOTS = [
  { x: 150, y: 212 }, { x: 352, y: 212 }, { x: 560, y: 212 }, { x: 756, y: 212 },
  { x: 118, y: 388 }, { x: 330, y: 388 }, { x: 540, y: 388 }, { x: 742, y: 388 }, { x: 952, y: 388 },
  { x: 330, y: 556 }, { x: 620, y: 556 }, { x: 952, y: 556 },
  { x: 1052, y: 210 }, { x: 1052, y: 520 },
];

// Towers: key, name, cost, range, damage, rate (shots/sec), color, blurb.
export const TOWERS = {
  ember: {
    key: 'ember', name: 'Ember Spout', cost: 50, range: 128, damage: 11, rate: 2.1,
    color: '#ff9a3c', desc: 'Cheap, rapid bolts of living flame.',
  },
  frost: {
    key: 'frost', name: 'Frost Spire', cost: 75, range: 116, damage: 5, rate: 1.1,
    color: '#7fd4ff', slow: 0.45, slowTime: 1.6, desc: 'Chills foes, slowing them 45%.',
  },
  mortar: {
    key: 'mortar', name: 'Mortar', cost: 120, range: 178, damage: 30, rate: 0.55,
    color: '#ffb347', splash: 64, desc: 'Lobbed shells burst over a wide area.',
  },
  storm: {
    key: 'storm', name: 'Storm Coil', cost: 160, range: 146, damage: 15, rate: 0.85,
    color: '#c9a7ff', chain: 3, desc: 'Lightning leaps between three foes.',
  },
  thorn: {
    key: 'thorn', name: 'Thorn Bramble', cost: 100, range: 104, damage: 13, rate: 1.0,
    color: '#9be15d', aura: true, desc: 'A thorny aura that wounds all nearby.',
  },
};
export const TOWER_ORDER = ['ember', 'frost', 'mortar', 'storm', 'thorn'];
export const UPGRADE_COST_MULT = 0.85; // per level, of base cost
export const UPGRADE_DMG_MULT = 1.8;
export const UPGRADE_RANGE_MULT = 1.12;
export const MAX_LEVEL = 3;
export const SELL_REFUND = 0.7;

// Enemies: hp and speed are base values at wave 1; waves scale them.
export const ENEMIES = {
  cinderling: { name: 'Cinderling', hp: 22, speed: 58, reward: 4, lives: 1, radius: 11, color: '#ff8a4c', score: 30 },
  ashwalker: { name: 'Ashwalker', hp: 52, speed: 38, reward: 6, lives: 1, radius: 14, color: '#c9b8a3', score: 45 },
  stoneback: { name: 'Stoneback', hp: 150, speed: 24, reward: 11, lives: 2, radius: 17, color: '#8d93a5', armor: 2, score: 75 },
  wisp: { name: 'Wisp', hp: 34, speed: 74, reward: 8, lives: 1, radius: 10, color: '#ffe9a8', score: 60 },
  charger: { name: 'Charger', hp: 68, speed: 42, reward: 9, lives: 1, radius: 13, color: '#ff5d73', surge: true, score: 66 },
  shade: { name: 'Shade', hp: 82, speed: 46, reward: 13, lives: 1, radius: 13, color: '#b388ff', blink: true, score: 90 },
  herald: { name: 'Cinder Herald', hp: 700, speed: 26, reward: 120, lives: 3, radius: 26, color: '#ff5d2f', boss: true, score: 1200 },
  sovereign: { name: 'Ash Sovereign', hp: 1800, speed: 24, reward: 260, lives: 5, radius: 30, color: '#d8c9ff', boss: true, summon: true, score: 2700 },
  tyrant: { name: 'Emberfall Tyrant', hp: 3600, speed: 22, reward: 500, lives: 6, radius: 34, color: '#ff2f5d', boss: true, summon: true, phases: 3, score: 6000 },
};

// Waves: groups spawn in order; gap is seconds between spawns in a group.
export const WAVES = [
  { groups: [{ kind: 'cinderling', n: 8, gap: 0.9 }] },
  { groups: [{ kind: 'cinderling', n: 10, gap: 0.7 }, { kind: 'ashwalker', n: 4, gap: 1.1 }] },
  { groups: [{ kind: 'ashwalker', n: 10, gap: 0.8 }, { kind: 'cinderling', n: 8, gap: 0.5 }] },
  { groups: [{ kind: 'ashwalker', n: 8, gap: 0.7 }, { kind: 'herald', n: 1, gap: 1 }, { kind: 'cinderling', n: 6, gap: 0.6 }] },
  { groups: [{ kind: 'wisp', n: 10, gap: 0.55 }, { kind: 'ashwalker', n: 8, gap: 0.8 }] },
  { groups: [{ kind: 'stoneback', n: 5, gap: 1.4 }, { kind: 'cinderling', n: 12, gap: 0.45 }, { kind: 'wisp', n: 6, gap: 0.6 }] },
  { groups: [{ kind: 'charger', n: 10, gap: 0.7 }, { kind: 'ashwalker', n: 10, gap: 0.6 }, { kind: 'stoneback', n: 3, gap: 1.2 }] },
  { groups: [{ kind: 'stoneback', n: 5, gap: 1.2 }, { kind: 'sovereign', n: 1, gap: 1 }, { kind: 'wisp', n: 10, gap: 0.5 }] },
  { groups: [{ kind: 'shade', n: 8, gap: 0.8 }, { kind: 'charger', n: 8, gap: 0.6 }, { kind: 'stoneback', n: 4, gap: 1.1 }] },
  { groups: [{ kind: 'shade', n: 10, gap: 0.65 }, { kind: 'wisp', n: 12, gap: 0.45 }, { kind: 'stoneback', n: 6, gap: 1.0 }] },
  { groups: [{ kind: 'charger', n: 12, gap: 0.55 }, { kind: 'shade', n: 10, gap: 0.6 }, { kind: 'stoneback', n: 6, gap: 0.9 }, { kind: 'wisp', n: 8, gap: 0.5 }] },
  { groups: [{ kind: 'tyrant', n: 1, gap: 1 }, { kind: 'shade', n: 8, gap: 0.7 }, { kind: 'charger', n: 10, gap: 0.55 }, { kind: 'stoneback', n: 6, gap: 0.9 }] },
];
export const TOTAL_WAVES = WAVES.length;

// Wave scaling: hp grows ~13%/wave, speed ~2%/wave.
export function waveHpMult(wave) { return 1 + 0.13 * (wave - 1); }
export function waveSpeedMult(wave) { return 1 + 0.02 * (wave - 1); }

export const START_GOLD = 160;
export const WAVE_CLEAR_BONUS = (wave) => 50 + 15 * wave;
export const HOARD_RATE = 0.05; // interest on gold held at wave clear
export const HOARD_CAP = 30;
export const COMBO_WINDOW = 3.0; // seconds to keep a kill streak alive
export const COMBO_MAX = 4.0;
export const FLAWLESS_BONUS = (wave) => 300 * wave;
export const BOSS_SLOW_ON_HIT = 0.0; // bosses ignore frost slow
export const BOSS_SLOW_FACTOR = 0.35; // frost works at 35% on bosses
