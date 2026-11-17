# Organelle Rangers 3

A cell-biology arcade fighting game: all 14 Organelle Rangers plus the Phage boss, rebuilt as a 2D sprite
fighter with the pixel art from **Cell Rescue**. It is a separate game from Organelle Rangers (the 3D version),
which stays untouched.

**Play:** open `index.html` (one self-contained file), or the GitHub Pages link once Pages is turned on
(Settings → Pages → Branch: `main`, folder `/ (root)` → Save).

## What's in it

- **Single player tower:** pick a Ranger and difficulty (Easy / Medium / Hard), beat 6 Rangers, then the Phage.
- **Training:** full Megaform meter, and the dummy can stand, block or crouch (pause menu).
- **Every special move and Megaform from Organelle Rangers**, with the same frame data, damage and science text.
  Megaforms summon the real structure (ATP, ribosome, rough ER, Golgi, mitochondrion, T4 phage…) drawn as pixel art.
- **Controls:** arrows move / jump / crouch · Z punch · X kick · Z+X special (with ←, →, ↓ for the others) ·
  hold away from the opponent to block · Space for the Megaform · Esc pauses. Phones and tablets get touch buttons.

## Developer guide

Sources are in `src/`. `python3 src/build.py` writes `index.html` (`python3 src/build.py local` writes `test.html` without the install-as-app bits).

| File | What it does |
|---|---|
| `data.js` | Roster, move names, descriptions and science text |
| `core2d.js` | Canvas view, camera, sprite drawing, particles, projectile drawings |
| `pose.js` | Turns each fighting state into a sprite frame (and uses extra-pose sheets when present) |
| `fight.js` | Fight engine: movement, hits, blocking, meter, health bars, CPU opponent |
| `kits.js`, `kits2.js` | Every Ranger's special moves |
| `megas2d.js` | Megaform cinematics and their pixel-art structures |
| `title2d.js` | Title parade, character-select showcase, portraits |
| `app.js` | Menus, tower, training, pause, results, HUD |
| `diagrams.js`, `molecules.js` | Shared with Cell Rescue: organelle drawings and molecule icons |
| `art/` | Source sprite sheets and portraits (from Cell Rescue) |
| `sprites/` | Built fighter atlases (`python3 tools/prep_sprites.py art sprites`) |
| `stages/` | Cell Rescue district paintings used as arenas |
| `EXTRA-POSE-PROMPTS.md` | ChatGPT prompt for one extra sheet of fighting poses per Ranger |

**Checks:** `node src/tools/playtest-cpu.js` runs a CPU-vs-CPU fight for every fighter and reports errors and
drawing time; `node src/tools/playtest-moves.js atp mito …` fires every special and Megaform and saves screenshots.
Both need Playwright and a fresh `test.html`.
