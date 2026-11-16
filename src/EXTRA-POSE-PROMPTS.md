# Extra fighting poses — prompts for ChatGPT image generation

Organelle Rangers 3 uses the Cell Rescue sprite sheets (16 poses each). A fighting game also wants blocking,
crouching, knockdowns, special-move and victory poses. Until a Ranger has an extra sheet, the game builds those
moments from the 16 poses (tilting the hurt pose for knockdowns, the tuck for crouching, an energy shield for
blocking). Each extra sheet you add replaces those stand-ins for that Ranger.

## How to make one

1. In ChatGPT (image generation), attach that Ranger's **`<id>-sheet.png`** from `src/art/` (for example `mito-sheet.png`).
   It is the character and style reference, so the suit, helmet and colors stay identical.
2. Paste the prompt below and replace `[RANGER]` with the Ranger's name (for example *Mitochondria Ranger*).
3. Check: 4 columns × 4 rows, every pose facing **right**, same size as the reference, nothing touching a neighboring cell.
4. Save it as **`<id>-extra.png`** (for example `mito-extra.png`) and send it to Claude. It goes in `src/art/`,
   then `python3 tools/prep_sprites.py art sprites` and `python3 build.py` rebuild the game.

## Prompt

> Create a production sprite sheet of EXTRA fighting-game poses for [RANGER], the exact character in the attached reference sheet. Match the reference exactly: same suit, helmet, colors, proportions, polished 16-bit arcade pixel-art style, crisp shading, dark outlines, and the same character scale. Transparent background. EXACTLY 4 columns by 4 rows: SIXTEEN equal cells, one full-body pose per cell, generous empty margins, no overlap, every pose facing RIGHT, feet (or the lowest point of the body) on the same baseline in every cell. No text, no labels, no floor, no shadows, no effects outside the body. In reading order (left to right, top to bottom):
> 1. standing block: forearms crossed in front of the helmet, braced
> 2. crouch: low squat, guard up
> 3. crouching block: low squat, forearms crossed
> 4. low sweep kick: crouched, one leg sweeping straight out along the ground
> 5. rising uppercut: fist driving straight up overhead, body stretching upward
> 6. flying jump kick: airborne, one leg extended diagonally down-forward, other leg tucked
> 7. knocked down: lying flat on the back on the ground, head to the left
> 8. getting up: one knee and one hand on the ground, pushing up
> 9. special attack: both palms thrust forward, launching energy
> 10. power-up: fists clenched at the sides, crouched slightly, charging energy
> 11. victory pose: one fist raised high in triumph
> 12. victory pose: heroic sentai pose, arms crossed at an angle
> 13. dizzy: wobbling, hand on helmet, knees buckling
> 14. launched: knocked backward through the air, arms and legs flung forward
> 15. throw: lunging forward, both arms reaching out to grab
> 16. defeated: kneeling on one knee, head down, about to collapse

## Pose numbers the game uses

| # | Pose | Replaces |
|---|---|---|
| 1 | block | idle pose + energy shield |
| 2 | crouch | tuck pose |
| 3 | crouch block | tuck pose + shield |
| 4 | sweep | tilted side kick |
| 5 | uppercut | tilted punch |
| 6 | jump kick | tilted side kick |
| 7 | knocked down | hurt pose turned on its side |
| 8 | getting up | tuck pose |
| 9 | special attack | blaster aim pose |
| 10 | power-up | blaster aim pose + glow (Megaform summon) |
| 11–12 | victory | blaster pose |
| 13 | dizzy | hurt pose |
| 14 | launched | tilted hurt pose |
| 15 | throw | punch pose |
| 16 | defeated | hurt pose |
