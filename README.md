# Emberfall Keep

A tower-defense siege for make.fun's **best-game-01** bounty ($1,000).

The embers fall. An ashen horde marches a winding stone road toward the
beacon-keep. Build five kinds of towers on the glowing plots, spend the gold
your kills earn, upgrade your towers, and hold the keep through **12 waves**
— including three bosses: the Cinder Herald, the Ash Sovereign, and the
Emberfall Tyrant.

## Play

- **Mouse** — click a glowing plot to build, click a tower to upgrade or sell.
- **1–5** — pick a tower while a plot is selected.
- **SPACE** — start the next wave. **F** — toggle 2x speed. **P** — pause.
  **R** — restart. **U** — upgrade the selected tower.

Three difficulties (Gentle / Brave / Heroic), a gold economy with a wave-clear
bonus and hoard interest, kill-streak combos, flawless-wave bonuses, and a
rank (S–D) at the end of every run. All art is drawn in code and all sound is
synthesized live with WebAudio — the game runs fully offline from static files.

## Develop

```sh
node serve.ts            # play at http://localhost:8080
node main.ts             # write out/ (set MAKEFUN_OUTPUT_DIR to override)
```

Screenshots are deterministic scenes rendered from the game's own code
(`?shot=1..4`); `game/src/shots.js` also ships an autopilot that plays the
real game and wins it.

MIT licensed — see LICENSE.
