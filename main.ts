// Emberfall Keep — make.fun entry program (program/v1, Node 22, stdlib only).
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with the kit's buildDossier.

import { buildDossier } from './vendor/makefun-game.ts';
import {
  cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? '.');
const OUT = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function copyTree(src: string, dst: string): void {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dst, name);
    const st = statSync(from);
    if (st.isDirectory()) copyTree(from, to);
    else if (st.isFile()) cpSync(from, to);
  }
}

function main(): void {
  const gameDir = join(ROOT, 'game');
  const shotsDir = join(ROOT, 'screenshots');
  if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) {
    throw new Error('game/ is missing from the repository');
  }
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error('game/index.html is missing');
  }
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  copyTree(gameDir, join(OUT, 'game'));
  if (existsSync(shotsDir) && statSync(shotsDir).isDirectory()) {
    copyTree(shotsDir, join(OUT, 'screenshots'));
  }
  const dossier = buildDossier(OUT, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(OUT, 'dossier.json'), dossier);
  console.log(`wrote ${OUT} (dossier ${dossier.length} bytes)`);
}

main();
