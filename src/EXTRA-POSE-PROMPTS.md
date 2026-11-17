# New pose sheets — prompts for ChatGPT image generation

Two new 16-pose sheets per Ranger. The game uses them automatically for any Ranger that has them, and keeps today's
poses for any Ranger that doesn't, so you can add them one at a time.

| Sheet | File name | What it fixes |
|---|---|---|
| **Fight poses** (do these first) | `<id>-extra.png` | Removes the blaster from the getting-hit, dizzy, knockdown and KO poses; adds real blocking, crouching, throwing, power-up, victory and defeat poses |
| **Motion** | `<id>-motion.png` | In-between frames: breathing idle, a 4-step guarded walk, a 3-part jump, jab, wind-up, uppercut, roundhouse, sweep and flying kick |

## How to make one

1. Open ChatGPT and start a new chat (a fresh chat for each sheet keeps it from mixing Rangers up).
2. Attach that Ranger's reference sheet, `<id>-sheet.png`. It is in the GitHub repo under `src/art/` (open the file, then use the download button).
3. Paste the prompt for that Ranger and sheet, exactly as written below, and send it.
4. Check the result: 4 × 4 grid, every pose facing right, white background, no blaster. If the grid is wrong, reply: *Redo it: exactly 4 columns by 4 rows of equal cells, white background, same poses.*
5. Download it and rename it, for example `atp-extra.png` or `atp-motion.png`. Send it to Claude, who checks it, cuts it out and adds it to the game.

**Start with one** (ATP Ranger's fight-poses sheet) and send it before doing the rest, so any prompt problems get fixed once instead of 14 times.

Pose 1 of every sheet is the normal stance. The game uses it to size the Ranger, so it does not matter how big ChatGPT draws the picture.

## ATP Ranger

### Fight poses → save as `atp-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the ATP Ranger (green suit with yellow side stripes, three yellow-orange circles on the chest, green gloves and boots, green helmet with a swept-back fin and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `atp-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the ATP Ranger (green suit with yellow side stripes, three yellow-orange circles on the chest, green gloves and boots, green helmet with a swept-back fin and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Ribosome Ranger

### Fight poses → save as `ribosome-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Ribosome Ranger (red suit, gold shoulder pads, white chest plate with a blue-and-orange round emblem, white gloves and white boots with gold bands, red helmet with a black visor and gold trim). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `ribosome-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Ribosome Ranger (red suit, gold shoulder pads, white chest plate with a blue-and-orange round emblem, white gloves and white boots with gold bands, red helmet with a black visor and gold trim). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Rough ER Ranger

### Fight poses → save as `rougher-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Rough ER Ranger (orange suit with silver-white chest and shoulder armor, white gloves and boots, orange helmet with a tall silver crescent crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `rougher-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Rough ER Ranger (orange suit with silver-white chest and shoulder armor, white gloves and boots, orange helmet with a tall silver crescent crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Golgi Ranger

### Fight poses → save as `golgi-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Golgi Ranger (yellow suit, gold-tan shoulder armor, round teal-and-red 'C' emblem on the chest, a small holster pouch on the belt, tan boots, yellow helmet with a teal visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `golgi-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Golgi Ranger (yellow suit, gold-tan shoulder armor, round teal-and-red 'C' emblem on the chest, a small holster pouch on the belt, tan boots, yellow helmet with a teal visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Cytoplasm Ranger

### Fight poses → save as `cytoplasm-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Cytoplasm Ranger (royal blue suit with white piping lines, white belt with a triangle buckle, blue gloves and boots, blue helmet with a silver face plate, black visor slits and a single spike on top). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `cytoplasm-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Cytoplasm Ranger (royal blue suit with white piping lines, white belt with a triangle buckle, blue gloves and boots, blue helmet with a silver face plate, black visor slits and a single spike on top). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Cell Membrane Ranger

### Fight poses → save as `membrane-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Cell Membrane Ranger (pink suit, black shoulder pads and a black V collar, white gloves, white boots with black cuffs, pink helmet with a gold crown-like crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `membrane-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Cell Membrane Ranger (pink suit, black shoulder pads and a black V collar, white gloves, white boots with black cuffs, pink helmet with a gold crown-like crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Mitochondria Ranger

### Fight poses → save as `mito-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Mitochondria Ranger (white suit with black side stripes, gold shoulder plates, orange oval emblem on a black chest panel, black gloves and boots, red helmet with a silver crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `mito-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Mitochondria Ranger (white suit with black side stripes, gold shoulder plates, orange oval emblem on a black chest panel, black gloves and boots, red helmet with a silver crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Nucleus Ranger

### Fight poses → save as `nucleus-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Nucleus Ranger (purple suit with gold stripes, gold shoulder pads, round gold emblem on the chest, gold gloves, white boots with gold bands, purple helmet with a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `nucleus-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Nucleus Ranger (purple suit with gold stripes, gold shoulder pads, round gold emblem on the chest, gold gloves, white boots with gold bands, purple helmet with a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Smooth ER Ranger

### Fight poses → save as `smoother-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Smooth ER Ranger (teal suit, silver shoulder pads, purple chevron pattern on the chest, orange-and-silver wrist bands, teal helmet with a purple visor and a small ball antenna on top). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `smoother-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Smooth ER Ranger (teal suit, silver shoulder pads, purple chevron pattern on the chest, orange-and-silver wrist bands, teal helmet with a purple visor and a small ball antenna on top). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Lysosome Ranger

### Fight poses → save as `lysosome-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Lysosome Ranger (maroon armor plates over a black bodysuit with white stripes, maroon gloves and boots, drop-shaped emblem on the chest, maroon helmet with a swept-back horn and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `lysosome-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Lysosome Ranger (maroon armor plates over a black bodysuit with white stripes, maroon gloves and boots, drop-shaped emblem on the chest, maroon helmet with a swept-back horn and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## DNA Ranger

### Fight poses → save as `dna-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the DNA Ranger (gold armored torso with a blue double-helix emblem, silver shoulder pads, black baggy pants with blue tassels, black gloves and boots, gold helmet with a white plume and black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `dna-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the DNA Ranger (gold armored torso with a blue double-helix emblem, silver shoulder pads, black baggy pants with blue tassels, black gloves and boots, gold helmet with a white plume and black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## RNA Ranger

### Fight poses → save as `rna-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the RNA Ranger (dark purple suit, gold shoulder pads, gold helix 'S' emblem on the chest, white gloves, white boots with gold trim, red-and-gold helmet with a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `rna-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the RNA Ranger (dark purple suit, gold shoulder pads, gold helix 'S' emblem on the chest, white gloves, white boots with gold trim, red-and-gold helmet with a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## Mitosis Ranger

### Fight poses → save as `mitosis-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Mitosis Ranger (silver-white suit with pink and green trim, pink shoulder armor, round pink-and-green split emblem on the chest, silver helmet with pink and teal accents and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `mitosis-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the Mitosis Ranger (silver-white suit with pink and green trim, pink shoulder armor, round pink-and-green split emblem on the chest, silver helmet with pink and teal accents and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```

## CRISPR Ranger

### Fight poses → save as `crispr-extra.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the CRISPR Ranger (iridescent purple-and-teal suit, silver vest, green round emblems on the chest and belt, teal gloves and boots with gold bands, teal helmet with a gold crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Hit in the face: head and shoulders snapped back, arms flung out, recoiling backward to the left.
3. Hit in the stomach: doubled over forward, one arm across the stomach.
4. Standing block: forearms crossed in front of the helmet, feet braced.
5. Crouch: deep squat, fists up in a guard.
6. Crouching block: deep squat, forearms crossed in front of the face.
7. Launched: airborne, knocked backward, body arched, arms and legs flung forward.
8. Knocked down: lying flat on the back on the ground, head toward the left, body horizontal.
9. Getting up: one knee and one hand on the ground, pushing up.
10. Dizzy: wobbling, one hand holding the helmet, knees buckling.
11. Energy push: lunging forward, both arms straight out in front, palms open and facing forward (no energy effect drawn).
12. Power-up: wide stance, fists clenched at the hips, chest out, head tilted up, charging.
13. Throw wind-up: like a baseball pitcher, throwing arm cocked far back behind the head, front knee raised.
14. Throw release: stepping forward, throwing arm whipped straight out in front, hand open.
15. Victory: standing tall, one fist punched straight up into the air, other fist on the hip.
16. Defeated: kneeling on one knee, head hanging down, arms limp.
```

### Motion → save as `crispr-motion.png`

```
Use the attached sprite sheet as the exact character reference and draw a NEW sprite sheet of the same character: the CRISPR Ranger (iridescent purple-and-teal suit, silver vest, green round emblems on the chest and belt, teal gloves and boots with gold bands, teal helmet with a gold crest and a black visor). Keep the character identical to the reference: same suit, helmet, colors, proportions, dark outline and polished 16-bit arcade pixel-art shading.

LAYOUT (very important): one square image, exactly 4 columns x 4 rows = 16 equal cells, one full-body pose per cell, centered with empty space around it, nothing crossing into a neighboring cell. Every pose faces RIGHT. The character is the same size in every cell, and the feet (or the lowest part of the body) sit at the same height in every cell.

BACKGROUND: plain, flat, pure white (#FFFFFF) everywhere, including every gap between the arms, legs and body. No checkerboard, no gradient, no floor, no shadow, no glow, no speed lines, no text, no numbers.

EMPTY HANDS: no gun, blaster, sword or any held object in any pose.

The 16 poses, in reading order (left to right, top to bottom):
1. Neutral fighting stance, exactly the same as the first pose of the reference sheet.
2. Same stance, breathing in: chest and shoulders very slightly raised (a subtle change only).
3. Same stance, breathing out: shoulders very slightly lowered, knees a little more bent (a subtle change only).
4. Fighting walk forward, step 1: guard up, front foot reaching forward.
5. Fighting walk, step 2: guard up, feet passing each other, weight centered.
6. Fighting walk, step 3: guard up, back foot stepping forward.
7. Fighting walk, step 4: guard up, feet passing again, weight shifting forward.
8. Jump take-off: knees deeply bent, arms swung down and back, about to leap.
9. Jump rising: airborne, body stretched upward, arms up, legs trailing below.
10. Jump falling: airborne, legs reaching down to land, arms out for balance.
11. Quick jab: front arm half-extended in a fast straight punch, back fist guarding the chin.
12. Punch wind-up: torso twisted back, rear fist pulled back by the ear.
13. Uppercut: rising onto the toes, fist driven straight up above the head.
14. High roundhouse kick: leg swinging at head height, body leaning back.
15. Low sweep: crouched low, one leg sweeping straight out along the ground.
16. Flying kick: airborne, one leg extended diagonally down-forward, other leg tucked.
```
