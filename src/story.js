/* ================= Story mode: "Hijacked" =================
   The Phage's DNA has been sleeping inside the cell's genome (a prophage). Now it has switched on (the lytic
   switch) and is taking over the cell's own machinery to build copies of itself. Each chapter, one Ranger frees
   the next hijacked teammate, following the path a viral protein really travels: nucleus → mRNA → ribosome →
   rough ER → Golgi → membrane, then the cell's energy and transport systems, then the genome itself.

   Every chapter:  OPEN (2 illustrated panels, then a check-in question) → BATTLE 1 (long; basics + specials, no
   megaform) → MID panel → BATTLE 2 (short; the foe's first health bar breaks → a question → right answer fires
   the slowed, narrated megaform that ends the match) → END panel.
   Art: each chapter has two 2-panel pictures: `<id>-a` (the two opening panels) and `<id>-b` (mid panel | end
   panel), made from the `art` prompts below. Score counts questions answered right on the first try.

   Question format is Cell Rescue's: d/o = the diagram (diagrams.js), q, c = choices, a = the right one (index as
   written), why = the explanation shown after answering. Choices starting "A —", "B —" stay in letter order.
   Science note: real bacteriophages only infect bacteria. In this story that is the mystery, answered in the
   finale: this Phage was rebuilt to fit our kind of cell. */

const INFECTED = "sickly glowing green cracks across the suit and helmet, a green glow behind the visor, thin dark-green veins on the armor, hunched aggressive posture";
const STYLE = "Polished 16-bit arcade pixel-art style with dark outlines, dramatic lighting and a strong comic-book composition, like a 1990s Saturday-morning cartoon. Keep every character identical to the attached references (suits, helmets, colors, emblems). Setting: inside a living cell, glowing organic architecture in deep purples, teals and pinks. No text, no speech bubbles, no captions, no letters anywhere in the picture.";
const TWO = "ONE wide 16:9 image split into TWO equal side-by-side panels (left panel and right panel) with a thin black gutter between them, like two frames of a comic page.";

const STORY = [
/* ---------------------------------------------------------------- ACT 1: THE PRODUCTION LINE */
{ id: "nucleus", act: 1, actTitle: "ACT 1 · THE PRODUCTION LINE", title: "The Signal", player: "nucleus", foe: "rna", stage: "archive",
  art: [
    { key: "nucleus-a", refs: ["nucleus", "phage-sheet"], prompt: `${TWO} LEFT PANEL: inside the dark nucleus, the Nucleus Ranger (purple and gold) stands at a glowing command console shaped like a nuclear pore, studying a giant holographic DNA double helix; one short stretch of the helix glows sickly green. RIGHT PANEL: a close-up of that green stretch of DNA waking up, green light pulsing outward along the helix like an alarm, with the silhouette of the Phage's helmet faintly reflected in the green glow.` },
    { key: "nucleus-b", refs: ["nucleus", "rna"], prompt: `${TWO} LEFT PANEL: the RNA Ranger (purple suit, gold single-strand emblem) ${INFECTED}, sprinting away through a nuclear pore (a ring-shaped gateway in the nuclear wall) clutching a glowing green ribbon of mRNA. RIGHT PANEL: the RNA Ranger kneeling, the green glow fading from his suit, the Nucleus Ranger offering him a hand up.` },
  ],
  open: [
    { img: "nucleus-a", side: 0, lines: [["NUCLEUS", "Cell Protocol, day one. Lysosome is gone... and something in our genome just woke up."]], cap: "The Phage's DNA has been hiding inside the cell's own DNA for weeks: a prophage." },
    { img: "nucleus-a", side: 1, lines: [["PHAGE", "Wakey wakey. Time to go to work... for ME."], ["NUCLEUS", "It's switching on its genes. Every Ranger who reads them will be working for the virus."]], cap: "When a prophage switches on, the cell starts copying the virus's genes. This is the switch from the lysogenic to the lytic cycle." },
  ],
  check: { d: "nucleus", o: { mode: "parts", marks: { A: "envelope", B: "pore", C: "nucleolus" } },
    q: "A copy of the virus's genes is about to leave the nucleus. Which labeled structure should Nucleus guard to stop it?",
    c: ["A — the nuclear envelope", "B — a nuclear pore", "C — the nucleolus"], a: 1,
    why: "mRNA leaves the nucleus through the nuclear pores. The envelope itself is a solid double membrane, and the nucleolus builds ribosome parts." },
  b1: { intro: "Hijacked RNA is carrying the virus's message out of the nucleus!" },
  mid: { img: "nucleus-b", side: 0, lines: [["RNA", "Gotta deliver... gotta deliver... the message is EVERYTHING!"], ["NUCLEUS", "That message is a trap. Stop!"]] },
  b2: { intro: "RNA is heading for the pore. Lock the genome down!" },
  mega: { name: "Genome Vault", steps: [
    "The nucleus is wrapped in a DOUBLE membrane: the nuclear envelope.",
    "Its DNA never leaves. Only mRNA copies pass out through the nuclear pores.",
    "Seal the pores, and no message gets out: the original DNA stays safe inside." ] },
  end: { img: "nucleus-b", side: 1, lines: [["RNA", "Ugh... I was carrying viral mRNA straight to the ribosomes."], ["NUCLEUS", "Then that's where the virus goes next. Go. Warn Ribosome."]] },
  quiz: [
    { d: "nucleus", o: { mode: "parts", highlight: "chromatin", marks: {} }, q: "Nucleus protects the highlighted threads inside it. What are they?",
      c: ["DNA wrapped around proteins (chromatin)", "Stored fat droplets", "Ribosomes waiting to leave"], a: 0,
      why: "Chromatin is the cell's DNA wound around proteins. Unwound, it can be read; condensed, it forms chromosomes." },
    { d: "nucleus", o: { mode: "transcription" }, q: "Why does the nucleus send out mRNA copies instead of the DNA itself?",
      c: ["So the original DNA stays protected inside the nucleus", "Because DNA is too small to leave", "Because mRNA lasts forever"], a: 0,
      why: "Copies can be made, used and broken down, while the master copy (DNA) stays safe behind the nuclear envelope." },
    { d: "nucleus", o: { mode: "parts", marks: {} }, q: "Which describes the nucleus best?",
      c: ["It stores the DNA and controls which genes are used", "It makes the cell's ATP", "It digests worn-out parts"], a: 0,
      why: "The nucleus holds the genome and decides which genes get copied into mRNA, and when." } ] },

{ id: "rna", act: 1, title: "Mixed Messages", player: "rna", foe: "ribosome", stage: "environment",
  art: [
    { key: "rna-a", refs: ["rna", "ribosome"], prompt: `${TWO} LEFT PANEL: the RNA Ranger (purple, gold single-strand emblem) racing out through a nuclear pore into the cytoplasm, following a trail of glowing green mRNA ribbons. RIGHT PANEL: the Ribosome Ranger (red suit, gold shoulders) ${INFECTED}, crouched over a long green mRNA ribbon, feeding it through his hands like a ticker tape while green protein chains pile up around him.` },
    { key: "rna-b", refs: ["rna", "ribosome"], prompt: `${TWO} LEFT PANEL: the RNA Ranger and the infected Ribosome Ranger locked in a grapple over a glowing green mRNA ribbon stretched between them. RIGHT PANEL: the Ribosome Ranger, freed and no longer green, sitting dazed among broken green protein chains while the RNA Ranger points off toward a huge folded membrane maze (the rough ER) in the distance.` },
  ],
  open: [
    { img: "rna-a", side: 0, lines: [["RNA", "I carried that message out. I'll take care of it myself."]], cap: "mRNA carries a gene's instructions from the nucleus to the ribosomes." },
    { img: "rna-a", side: 1, lines: [["RIBOSOME", "Codon... amino acid... codon... MUST... BUILD... COAT!"], ["RNA", "He's translating the virus's genes into virus proteins!"]], cap: "Viruses have no ribosomes of their own. They make the cell's ribosomes build their proteins." },
  ],
  check: { d: "rna", o: { mode: "trio", marks: { A: "mrna", B: "trna", C: "rrna" } },
    q: "Ribosome is reading the virus's instructions. Which labeled RNA is carrying those instructions to him?",
    c: ["A — messenger RNA (mRNA)", "B — transfer RNA (tRNA)", "C — ribosomal RNA (rRNA)"], a: 0,
    why: "mRNA carries the code. tRNA brings amino acids, and rRNA is part of the ribosome itself." },
  b1: { intro: "Hijacked Ribosome is building the virus's coat proteins!" },
  mid: { img: "rna-b", side: 0, lines: [["RIBOSOME", "Let go of my tape!"], ["RNA", "That 'tape' is the virus talking. I can shut it up."]] },
  b2: { intro: "Silence the viral message before another protein is made!" },
  mega: { name: "Silent Shadow Interference", steps: [
    "RNA interference: an enzyme called Dicer chops double-stranded RNA into short 21-letter pieces.",
    "One strand becomes a guide that leads a RISC complex to the matching mRNA.",
    "RISC slices that mRNA, so the protein is never made. The gene is silenced." ] },
  end: { img: "rna-b", side: 1, lines: [["RIBOSOME", "Those proteins I built... they went into the rough ER."], ["RNA", "Then so do we."]] },
  quiz: [
    { d: "rna", o: { mode: "compare" }, q: "RNA uses one base that DNA does not. Which is it?",
      c: ["Uracil (U)", "Thymine (T)", "Guanine (G)"], a: 0,
      why: "RNA uses uracil where DNA uses thymine. U pairs with A." },
    { d: "rna", o: { mode: "transcribe", template: "TAC" }, q: "A DNA template strand reads T-A-C. What mRNA is copied from it?",
      c: ["AUG", "ATG", "UAC"], a: 0,
      why: "A pairs with U, T pairs with A, C pairs with G, so TAC becomes AUG. RNA has no T." },
    { d: "rna", o: { mode: "trio" }, q: "What is the main job of mRNA?",
      c: ["Carry a gene's instructions from the DNA to a ribosome", "Store the cell's energy", "Hold the cell's shape"], a: 0,
      why: "mRNA is the messenger: a short-lived copy of one gene that a ribosome reads to build a protein." } ] },

{ id: "ribosome", act: 1, title: "Assembly Required", player: "ribosome", foe: "rougher", stage: "membranes",
  art: [
    { key: "ribosome-a", refs: ["ribosome", "rougher"], prompt: `${TWO} LEFT PANEL: the Ribosome Ranger (red suit, gold shoulders) climbing onto a vast folded membrane studded with thousands of small round ribosomes like beads (the rough ER). RIGHT PANEL: the Rough ER Ranger (orange suit, silver chest armor, crescent crest) ${INFECTED}, standing in the ER's tunnels folding glowing green protein chains into spiky shapes.` },
    { key: "ribosome-b", refs: ["ribosome", "rougher"], prompt: `${TWO} LEFT PANEL: the Ribosome Ranger and the infected Rough ER Ranger trading blows inside a tunnel lined with ribosome beads, green protein chains flying. RIGHT PANEL: the Rough ER Ranger, freed and no longer green, holding a small bubble-shaped vesicle and looking toward a stack of curved flat sacs (the Golgi apparatus) glowing ahead.` },
  ],
  open: [
    { img: "ribosome-a", side: 0, lines: [["RIBOSOME", "Every protein I built for the virus went in here. My fault. My fix."]], cap: "Ribosomes on the rough ER build proteins that are threaded straight into the ER." },
    { img: "ribosome-a", side: 1, lines: [["ROUGH ER", "Fold. Spike. Fold. Spike. The virus needs its keys."], ["RIBOSOME", "Spike proteins... those are how a virus grabs onto the next cell!"]], cap: "Many viruses wear spike proteins: 'keys' that fit receptors on the cells they infect." },
  ],
  check: { d: "er", o: { mode: "zoom" }, q: "Why does the rough ER look 'rough' under a microscope?",
    c: ["Ribosomes are attached to its surface", "It is covered in tiny hairs", "It is made of hard crystals"], a: 0,
    why: "The rough ER is studded with ribosomes. The smooth ER has none." },
  b1: { intro: "Hijacked Rough ER is folding the virus's spike proteins!" },
  mid: { img: "ribosome-b", side: 0, lines: [["ROUGH ER", "Every spike is perfect. The virus says so."], ["RIBOSOME", "Then let's build something better."]] },
  b2: { intro: "Out-build the virus. Translate a protein of our own!" },
  mega: { name: "Infinite Translation", steps: [
    "The ribosome reads mRNA one codon (3 letters) at a time.",
    "Each tRNA's anticodon pairs with a codon and hands over its amino acid.",
    "A stop codon ends the chain, and the chain folds into a working protein." ] },
  end: { img: "ribosome-b", side: 1, lines: [["ROUGH ER", "I already shipped a load of spikes. Vesicles... headed for the Golgi."], ["RIBOSOME", "Then you're with me. Let's catch them."]] },
  quiz: [
    { d: "translation", o: { codons: ["AUG", "GGC", "UUU", "UAA"], at: -1, bracket: 1 }, q: "The ribosome reads mRNA 3 bases at a time. What is a group of 3 bases called?",
      c: ["A codon", "A gene", "An amino acid"], a: 0, why: "Each codon stands for one amino acid, or for 'stop'." },
    { d: "translation", o: { codons: ["AUG", "GGC", "UUU", "UAA"], at: 0, trna: "???", chain: [] }, q: "The codon in the ribosome is AUG. Which tRNA anticodon pairs with it?",
      c: ["UAC", "AUG", "TAC"], a: 0, why: "A pairs with U and G pairs with C, so AUG pairs with UAC. RNA has no T." },
    { d: "translation", o: { codons: ["AUG", "GGC", "UUU", "UAA"], at: 3, stop: true, chain: ["Met", "Gly", "Phe"] }, q: "The ribosome reaches UAA. What happens?",
      c: ["Translation stops and the protein is released", "An amino acid called UAA is added", "The ribosome starts over"], a: 0,
      why: "UAA is a stop codon. No tRNA matches it, so the finished chain is released to fold." } ] },

{ id: "rougher", act: 1, title: "Return to Sender", player: "rougher", foe: "golgi", stage: "membranes",
  art: [
    { key: "rougher-a", refs: ["rougher", "golgi"], prompt: `${TWO} LEFT PANEL: the Rough ER Ranger (orange, silver chest armor) riding a bubble-shaped vesicle across the cytoplasm toward a stack of curved flat sacs (the Golgi apparatus). RIGHT PANEL: the Golgi Ranger (yellow suit, teal visor) ${INFECTED}, at a glowing sorting station, stamping green tags onto vesicles full of spiky green proteins and loading them onto a conveyor toward the cell's edge.` },
    { key: "rougher-b", refs: ["rougher", "golgi"], prompt: `${TWO} LEFT PANEL: the Rough ER Ranger crashing through stacks of green-tagged vesicles to tackle the infected Golgi Ranger. RIGHT PANEL: the Golgi Ranger, freed and no longer green, holding a ripped green shipping tag and pointing urgently toward the cell membrane, where green-tagged vesicles are already arriving.` },
  ],
  open: [
    { img: "rougher-a", side: 0, lines: [["ROUGH ER", "Golgi! Those vesicles came from me. Don't ship them!"]], cap: "Vesicles carry proteins from the rough ER to the Golgi apparatus." },
    { img: "rougher-a", side: 1, lines: [["GOLGI", "Tag. Pack. Ship. Address: CELL MEMBRANE. Next!"], ["ROUGH ER", "He's labeling virus spikes for the surface!"]], cap: "The Golgi tags proteins with sugar chains that work like shipping labels." },
  ],
  check: { d: "golgi", o: { mode: "routes", cargo: "Viral spike protein", routes: { A: "outside", B: "membrane", C: "lysosome" } },
    q: "Golgi is shipping a spike protein that must end up sticking out of the cell's surface. Which route is he sending it on?",
    c: ["A — released outside the cell", "B — into the cell membrane", "C — to a lysosome"], a: 1,
    why: "Proteins that belong in the membrane are shipped in vesicles that fuse with it, so the protein ends up built into the membrane." },
  b1: { intro: "Hijacked Golgi is shipping virus spikes to the surface!" },
  mid: { img: "rougher-b", side: 0, lines: [["GOLGI", "You'll mess up my whole sorting system!"], ["ROUGH ER", "Watch how a real factory runs."]] },
  b2: { intro: "Show Golgi how proteins are supposed to be made!" },
  mega: { name: "Factory Finesse", steps: [
    "Ribosomes on the rough ER thread new proteins straight into the ER.",
    "Inside, the chains fold into their working shapes: helices and sheets.",
    "Finished proteins leave in coated vesicles bound for the Golgi." ] },
  end: { img: "rougher-b", side: 1, lines: [["GOLGI", "I already shipped a load to the membrane. They'll stud it with spikes!"], ["ROUGH ER", "Then the membrane is next."]] },
  quiz: [
    { d: "er", o: { mode: "route" }, q: "A new protein leaves the rough ER in a vesicle. Where does it usually go next?",
      c: ["The Golgi apparatus", "The nucleus", "Straight into a mitochondrion"], a: 0, why: "Rough ER → Golgi is the main shipping route for new proteins." },
    { d: "er", o: { mode: "zoom" }, q: "Which protein is most likely built on the rough ER?",
      c: ["A protein that will be released outside the cell", "An enzyme that stays in the cytosol", "A protein that stays in the nucleus"], a: 0,
      why: "Proteins for export, for membranes and for lysosomes are built on the rough ER. Cytosol proteins are built on free ribosomes." },
    { d: "er", o: { mode: "route" }, q: "What is the main job of the rough ER?",
      c: ["Build, fold and ship proteins", "Store the cell's DNA", "Break down old organelles"], a: 0,
      why: "The rough ER's ribosomes make proteins, the ER folds them, and vesicles ship them on." } ] },

{ id: "golgi", act: 1, title: "Spike Shipment", player: "golgi", foe: "membrane", stage: "membranes",
  art: [
    { key: "golgi-a", refs: ["golgi", "membrane"], prompt: `${TWO} LEFT PANEL: the Golgi Ranger (yellow suit, teal visor) running along the inside of the cell membrane, a curved wall of pink lipid bilayer, where green spiky proteins are sticking out of it. RIGHT PANEL: the Membrane Ranger (hot pink suit, gold winged crest) ${INFECTED}, pushing open the membrane so green virus particles wrapped in pink membrane bubbles can bud out of the cell.` },
    { key: "golgi-b", refs: ["golgi", "membrane"], prompt: `${TWO} LEFT PANEL: the Golgi Ranger dodging green-spiked bubbles as the infected Membrane Ranger swings at him against the wall of lipid bilayer. RIGHT PANEL: the Membrane Ranger, freed and no longer green, both hands pressed to the membrane wall sealing a gap, the Golgi Ranger beside him, both looking at a long glowing track of tubes (microtubules) stretching away into the cytoplasm.` },
  ],
  open: [
    { img: "golgi-a", side: 0, lines: [["GOLGI", "My shipments are stuck in the membrane. Every one a virus key."]], cap: "Act 1's path so far: DNA → mRNA → ribosome → rough ER → Golgi → membrane." },
    { img: "golgi-a", side: 1, lines: [["MEMBRANE", "Out you go, little ones. Wear my membrane like a coat."], ["GOLGI", "New viruses are budding out, wrapped in our own membrane!"]], cap: "Some viruses leave a cell by 'budding': they wrap themselves in a piece of its membrane on the way out." },
  ],
  check: { d: "membrane", o: { mode: "parts", marks: { A: "head", B: "tails", C: "protein" } },
    q: "The virus is stealing pieces of this membrane. Which labeled part is the water-loving 'head' of a phospholipid?",
    c: ["A — the phosphate head", "B — the fatty-acid tails", "C — a membrane protein"], a: 0,
    why: "Phospholipid heads face the water on both sides. Their tails hide from water in the middle of the bilayer." },
  b1: { intro: "Hijacked Membrane is letting virus particles bud out!" },
  mid: { img: "golgi-b", side: 0, lines: [["MEMBRANE", "Everything flows out. Nothing stops it."], ["GOLGI", "Want to bet? Every package gets a label."]] },
  b2: { intro: "Re-label everything. The cell's packages, the cell's rules!" },
  mega: { name: "Packing Punt", steps: [
    "The Golgi modifies proteins as they move through its stacked sacs.",
    "It adds chains of sugar rings (glycosylation) that work like shipping labels.",
    "Then it packs each protein into a vesicle addressed to where it's needed." ] },
  end: { img: "golgi-b", side: 1, lines: [["MEMBRANE", "The parts didn't all come out here. Something is hauling them across the cell."], ["GOLGI", "Hauling? That means Cytoplasm."]] },
  quiz: [
    { d: "cell", o: { marks: { A: "mito", B: "golgi", C: "lysosome" } }, q: "Which labeled structure is the Golgi apparatus?",
      c: ["A", "B", "C"], a: 1, why: "The Golgi is the stack of curved, flattened sacs, often near the ER." },
    { d: "golgi", o: { mode: "routes", cargo: "Digestive enzymes", routes: { A: "outside", B: "lysosome", C: "membrane" } }, q: "This vesicle carries digestive enzymes. Where should Golgi send it?",
      c: ["A — outside the cell", "B — to a lysosome", "C — into the membrane"], a: 1, why: "Digestive enzymes are packed for lysosomes, the cell's recycling centers." },
    { d: "golgi", o: { mode: "tags" }, q: "What do the sugar-chain tags the Golgi adds do?",
      c: ["They work like shipping labels that say where a protein goes", "They give the protein energy", "They copy the protein's DNA"], a: 0,
      why: "Tags (like sugar chains) mark where each protein belongs, so it gets packed into the right vesicle." } ] },

/* ---------------------------------------------------------------- ACT 2: POWER GRAB */
{ id: "membrane", act: 2, actTitle: "ACT 2 · POWER GRAB", title: "Highway Robbery", player: "membrane", foe: "cytoplasm", stage: "environment",
  art: [
    { key: "membrane-a", refs: ["membrane", "cytoplasm", "phage-sheet"], prompt: `${TWO} LEFT PANEL: the Phage (a menacing figure in a rust-brown suit with yellow piping, mint-green dome helmet with dark visor, six curved silver tail fibers from his hips) appearing as a huge ghostly green hologram over the cytoplasm, arms spread, laughing. RIGHT PANEL: the Cytoplasm Ranger (royal blue suit, white stripes, spiked helmet) ${INFECTED}, riding along a long glowing tube (a microtubule) on the back of a two-legged motor protein that walks along it carrying a green virus bundle.` },
    { key: "membrane-b", refs: ["membrane", "cytoplasm"], prompt: `${TWO} LEFT PANEL: the Membrane Ranger (hot pink) leaping onto a microtubule track to intercept the infected Cytoplasm Ranger and his walking motor protein cargo. RIGHT PANEL: the Cytoplasm Ranger, freed and no longer green, sitting on the microtubule beside a dropped green bundle, pointing toward a large bean-shaped organelle with folded inner membranes (a mitochondrion) that is glowing green.` },
  ],
  open: [
    { img: "membrane-a", side: 0, lines: [["PHAGE", "Five Rangers freed. Cute. You're too late: my parts are already moving."], ["MEMBRANE", "Moving how? Nothing crosses a cell that fast on its own."]] },
    { img: "membrane-a", side: 1, lines: [["CYTOPLASM", "Left foot. Right foot. Deliver to the Phage."], ["MEMBRANE", "He's using the cell's motor proteins as a delivery service!"]], cap: "Many real viruses hijack motor proteins to ride the microtubule 'highways' across a cell." },
  ],
  check: { d: "cell", o: { marks: { A: "nucleus", B: "cytoplasm", C: "membrane" } },
    q: "Membrane is chasing the delivery through the cell's interior. Which labeled region is the cytoplasm?",
    c: ["A", "B", "C"], a: 1,
    why: "The cytoplasm is everything inside the membrane and outside the nucleus: the gel-like cytosol plus the organelles in it." },
  b1: { intro: "Hijacked Cytoplasm is hauling virus parts across the cell!" },
  mid: { img: "membrane-b", side: 0, lines: [["CYTOPLASM", "You can't stop a delivery in progress."], ["MEMBRANE", "Watch me. Nothing gets past my border."]] },
  b2: { intro: "Trap the cargo before it reaches the Phage!" },
  mega: { name: "Endocytosis Entrapment", steps: [
    "Endocytosis: the membrane folds inward around something.",
    "The fold deepens into a pocket, then pinches off as a sealed bubble: a vesicle.",
    "It works because the membrane is a fluid bilayer: its phospholipids drift and reseal." ] },
  end: { img: "membrane-b", side: 1, lines: [["CYTOPLASM", "Those deliveries all went one place: Mitochondria. The virus needs power."], ["MEMBRANE", "Then the power plant is next."]] },
  quiz: [
    { d: "membrane", o: { mode: "channel", outside: 8, inside: 2 }, q: "There is more glucose outside than inside. Which way does it move through this channel?",
      c: ["Into the cell, from high to low concentration", "Out of the cell", "It doesn't move"], a: 0,
      why: "In diffusion, molecules move from high to low concentration. No energy is needed." },
    { d: "membrane", o: { mode: "pump", outside: 2, inside: 8 }, q: "The cell needs MORE of a molecule it already has plenty of inside. How can it bring more in?",
      c: ["Use a pump powered by ATP (active transport)", "Wait for diffusion", "Open a bigger channel"], a: 0,
      why: "Moving something from low to high concentration takes energy. That's active transport." },
    { d: "membrane", o: { mode: "parts" }, q: "Why is the cell membrane called 'selectively permeable'?",
      c: ["It lets some substances through and blocks others", "It lets everything through", "It blocks everything"], a: 0,
      why: "The bilayer and its proteins choose what crosses, so the cell controls its own contents." } ] },

{ id: "cytoplasm", act: 2, title: "Power Drain", player: "cytoplasm", foe: "mito", stage: "environment",
  art: [
    { key: "cytoplasm-a", refs: ["cytoplasm", "mito"], prompt: `${TWO} LEFT PANEL: the Cytoplasm Ranger (royal blue) surfing a current through the cytosol toward a huge mitochondrion, a bean shape with an outer membrane and a deeply folded inner membrane, glowing sickly green from inside. RIGHT PANEL: inside the mitochondrion, the Mitochondria Ranger (white suit, black panels, gold shoulders, orange oval emblem) ${INFECTED}, turning a giant wheel that pumps glowing energy out through green pipes toward silhouettes of virus particles.` },
    { key: "cytoplasm-b", refs: ["cytoplasm", "mito"], prompt: `${TWO} LEFT PANEL: the Cytoplasm Ranger and the infected Mitochondria Ranger clashing among the folds (cristae) of the inner mitochondrial membrane. RIGHT PANEL: the Mitochondria Ranger, freed and no longer green, kneeling, holding up a cracked glowing green battery-like capsule, while the Cytoplasm Ranger looks toward a crowd of small green glowing energy molecules being herded away.` },
  ],
  open: [
    { img: "cytoplasm-a", side: 0, lines: [["CYTOPLASM", "Mitochondria's glowing the wrong color. That's never good."]], cap: "Building thousands of new viruses takes a huge amount of energy." },
    { img: "cytoplasm-a", side: 1, lines: [["MITO", "MORE POWER! FOR THE NEW ONES! ALL OF IT!"], ["CYTOPLASM", "He's pouring the cell's energy into building viruses!"]], cap: "Real viruses reprogram a cell's metabolism to feed their own copying." },
  ],
  check: { d: "mito", o: { mode: "parts", marks: { A: "outer", B: "inner", C: "matrix" } },
    q: "Cytoplasm needs to reach the machines that make most of the cell's ATP. They sit in the folds of which labeled part?",
    c: ["A — the outer membrane", "B — the inner membrane (cristae)", "C — the matrix"], a: 1,
    why: "The electron transport chain and ATP synthase sit in the folded inner membrane, the cristae." },
  b1: { intro: "Hijacked Mitochondria is feeding the virus factory!" },
  mid: { img: "cytoplasm-b", side: 0, lines: [["MITO", "You can't out-muscle the powerhouse!"], ["CYTOPLASM", "I don't need muscle. I need motor proteins."]] },
  b2: { intro: "Haul Mito out of the virus's grip!" },
  mega: { name: "Motor Protein Puller", steps: [
    "Motor proteins walk along microtubules, the cell's highways.",
    "Kinesin walks toward the (+) end; dynein walks toward the (−) end.",
    "Each step is about 8 nanometers, powered by one ATP." ] },
  end: { img: "cytoplasm-b", side: 1, lines: [["MITO", "I made ATP for them... and they took it. ATP is out there working for the virus!"], ["CYTOPLASM", "Then go get your ATP back."]] },
  quiz: [
    { d: "cytosol", o: { mode: "contents" }, q: "The cytosol is the liquid part of the cytoplasm. What is it mostly made of?",
      c: ["Water, with dissolved salts, sugars and proteins", "Pure fat", "Solid protein"], a: 0, why: "Cytosol is about 70 to 80% water, full of dissolved molecules." },
    { d: "cytosol", o: { mode: "glycolysis" }, q: "Glycolysis, the first step in breaking down glucose, happens where?",
      c: ["In the cytosol", "In the nucleus", "Inside the Golgi"], a: 0, why: "Glycolysis splits glucose in the cytosol before mitochondria take over." },
    { d: "cell", o: { highlight: "cytoplasm" }, q: "Which describes the cytoplasm (shaded) best?",
      c: ["Everything between the membrane and the nucleus: cytosol plus organelles", "Only the nucleus", "Only the membrane"], a: 0,
      why: "The cytoplasm includes the gel-like cytosol and all the organelles floating in it." } ] },

{ id: "mito", act: 2, title: "Currency Crisis", player: "mito", foe: "atp", stage: "environment",
  art: [
    { key: "mito-a", refs: ["mito", "atp"], prompt: `${TWO} LEFT PANEL: the Mitochondria Ranger (white suit, gold shoulders) bursting out of a mitochondrion into the cytoplasm, fists glowing orange. RIGHT PANEL: the ATP Ranger (green suit, yellow stripes, three orange circles on the chest) ${INFECTED}, dashing at blinding speed and handing glowing energy molecules to rows of green virus-building machines.` },
    { key: "mito-b", refs: ["mito", "atp"], prompt: `${TWO} LEFT PANEL: the Mitochondria Ranger catching the infected ATP Ranger mid-dash in a bear hug, sparks flying. RIGHT PANEL: the ATP Ranger, freed and no longer green, panting with hands on knees next to the Mitochondria Ranger, both looking at a network of smooth tubes (smooth ER) leaking glowing blue-white calcium sparks.` },
  ],
  open: [
    { img: "mito-a", side: 0, lines: [["MITO", "I made that energy for the CELL. Not for viruses!"]], cap: "Mitochondria turn the energy in food into ATP through cellular respiration." },
    { img: "mito-a", side: 1, lines: [["ATP", "Spend it! Spend it all! Every virus part needs paying!"], ["MITO", "He's the cell's currency, and he's being spent on the enemy."]], cap: "ATP is the cell's energy 'currency', spent to power almost every job in the cell." },
  ],
  check: { d: "atp", o: { mode: "cycle", hide: "products" },
    q: "ATP just paid for one virus part. What is left over after ATP gives up its energy?",
    c: ["ADP and a free phosphate group", "Glucose and oxygen", "Nothing: ATP is destroyed"], a: 0,
    why: "ATP → ADP + phosphate + energy. Those pieces can be recharged back into ATP." },
  b1: { intro: "Hijacked ATP is spending the cell's energy on the virus!" },
  mid: { img: "mito-b", side: 0, lines: [["ATP", "Too fast for you, old man!"], ["MITO", "I'm not old. I'm ancient. Mitochondria were once bacteria."]] },
  b2: { intro: "Mitochondria have their own DNA. Use it!" },
  mega: { name: "mtDNA Disk Barrage", steps: [
    "Mitochondria carry their own small, circular DNA: a leftover from when they were free-living bacteria.",
    "In humans it holds 37 genes in 16,569 base pairs, and a mitochondrion keeps several copies.",
    "It copies itself on its own, and you inherit it only from your mother." ] },
  end: { img: "mito-b", side: 1, lines: [["ATP", "The last batch I paid for went to Smooth ER. Something with lipids."], ["MITO", "Lipids... the virus needs membrane for its coat."]] },
  quiz: [
    { d: "mito", o: { mode: "gradient" }, q: "H⁺ ions flow back through ATP synthase. What does that flow do?",
      c: ["Spins ATP synthase to make ATP", "Breaks ATP apart", "Makes glucose"], a: 0, why: "The H⁺ flow turns ATP synthase like a turbine, joining ADP and phosphate into ATP." },
    { d: "mito", o: { mode: "equation" }, q: "Which gas do mitochondria need to make most of the cell's ATP?",
      c: ["Oxygen", "Carbon dioxide", "Nitrogen"], a: 0, why: "Oxygen accepts electrons at the end of the electron transport chain. Without it, ATP output collapses." },
    { d: "mito", o: { mode: "equation", full: true }, q: "What is the main job of mitochondria?",
      c: ["Turn the energy in food into ATP", "Store DNA for the whole cell", "Package proteins"], a: 0,
      why: "Cellular respiration in mitochondria releases energy from food and stores it in ATP." } ] },

{ id: "atp", act: 2, title: "Fat Chance", player: "atp", foe: "smoother", stage: "membranes",
  art: [
    { key: "atp-a", refs: ["atp", "smoother"], prompt: `${TWO} LEFT PANEL: the ATP Ranger (green suit) sprinting through a maze of smooth, ribosome-free tubes (smooth ER) as blue-white calcium sparks crackle around him. RIGHT PANEL: the Smooth ER Ranger (teal suit, purple chevron chest, antenna with a purple ball) ${INFECTED}, flexing as he pumps out glowing golden lipid droplets that flow toward green virus particles, while calcium sparks burst from cracked tubes behind him.` },
    { key: "atp-b", refs: ["atp", "smoother"], prompt: `${TWO} LEFT PANEL: the ATP Ranger dodging a burst of blue-white calcium sparks from the infected Smooth ER Ranger. RIGHT PANEL: the Smooth ER Ranger, freed and no longer green, sitting against a tube with the ATP Ranger, both looking up at a vast glowing double helix of DNA in the distance, one stretch of it glowing green.` },
  ],
  open: [
    { img: "atp-a", side: 0, lines: [["ATP", "Last thing I paid for was here. Lipids. Lots of them."]], cap: "The smooth ER makes lipids, breaks down toxins and stores calcium." },
    { img: "atp-a", side: 1, lines: [["SMOOTHER", "Fat for their coats! Calcium for the chaos! FLEX!"], ["ATP", "He's making membrane material for new viruses, and dumping calcium everywhere!"]], cap: "Viruses that wear a membrane coat need lipids, and some also disrupt the cell's calcium stores." },
  ],
  check: { d: "cell", o: { marks: { A: "smoothER", B: "roughER", C: "golgi" } },
    q: "ATP is searching for the ER that makes lipids and stores calcium. Which labeled structure is the smooth ER?",
    c: ["A", "B", "C"], a: 0, why: "The smooth ER is a network of tubes with no ribosomes. It makes lipids and stores calcium." },
  b1: { intro: "Hijacked Smooth ER is making lipid coats for new viruses!" },
  mid: { img: "atp-b", side: 0, lines: [["SMOOTHER", "You're out of energy, little battery."], ["ATP", "Out? I AM energy. Let's spin something."]] },
  b2: { intro: "Recharge! Turn the turbine!" },
  mega: { name: "Turbine Trap", steps: [
    "ATP synthase is a real rotary motor in the mitochondria's inner membrane.",
    "Protons (H⁺) flowing back through it spin its rotor like water through a turbine.",
    "Every full turn builds 3 ATP from ADP and phosphate." ] },
  end: { img: "atp-b", side: 1, lines: [["SMOOTHER", "The orders for all of this... they came from the genome itself."], ["ATP", "Then we go to the source. DNA."]] },
  quiz: [
    { d: "atp", o: { mode: "molecule", marks: { A: "adenine", B: "ribose", C: "bond" } }, q: "Which labeled part releases usable energy when it breaks?",
      c: ["A — the adenine base", "B — the ribose sugar", "C — the bond to the last phosphate"], a: 2,
      why: "Breaking the bond to the third phosphate releases energy. What's left is ADP plus a phosphate." },
    { d: "atp", o: { mode: "cycle", hide: "energyIn" }, q: "To recharge ADP into ATP, where does the energy come from?",
      c: ["Breaking down food molecules such as glucose", "The phosphate itself", "Nowhere: ADP recharges on its own"], a: 0,
      why: "Cellular respiration releases energy from glucose, which the cell uses to rebuild ATP." },
    { d: "atp", o: { mode: "cycle" }, q: "Which describes ATP best?",
      c: ["It carries usable energy to the parts of the cell that do work", "It stores genetic instructions", "It is the cell's outer boundary"], a: 0,
      why: "ATP is the cell's energy currency: spent to power work, then recharged." } ] },

/* ---------------------------------------------------------------- ACT 3: THE SOURCE */
{ id: "smoother", act: 3, actTitle: "ACT 3 · THE SOURCE", title: "Locked Up", player: "smoother", foe: "dna", stage: "archive",
  art: [
    { key: "smoother-a", refs: ["smoother", "dna"], prompt: `${TWO} LEFT PANEL: the Smooth ER Ranger (teal suit, antenna) pushing through the nuclear pore into the nucleus, where a colossal DNA double helix fills the space. RIGHT PANEL: the DNA Ranger (gold upper suit, blue helix emblem, navy martial-arts trousers with a tabard, white plume) ${INFECTED}, standing on the helix in a kung-fu stance while a green stretch of the helix unzips and spits out green mRNA ribbons.` },
    { key: "smoother-b", refs: ["smoother", "dna"], prompt: `${TWO} LEFT PANEL: the Smooth ER Ranger locking the infected DNA Ranger in place with crackling blue-white calcium energy. RIGHT PANEL: the DNA Ranger, freed and no longer green, pressing his palm to the helix, the green stretch still glowing inside it; behind them, the Mitosis Ranger (silver-white suit, pink and green armor) is visible ${INFECTED}, stretching his arms apart as the cell begins to split.` },
  ],
  open: [
    { img: "smoother-a", side: 0, lines: [["SMOOTHER", "So this is where the orders come from."]], cap: "The virus's genes are written into the cell's own DNA." },
    { img: "smoother-a", side: 1, lines: [["DNA", "Read me. Copy me. The virus genes are part of me now."], ["SMOOTHER", "The prophage is inside him. DNA's being forced to express it!"]], cap: "A prophage is copied along with the cell's DNA, like a hidden chapter in an instruction book." },
  ],
  check: { d: "dna", o: { pairs: [["G", "C"], ["A", "?"], ["T", "A"], ["C", "G"], ["C", "G"], ["A", "T"]], blank: 1 },
    q: "The virus inserted its DNA here. To read the code, Smooth ER needs the missing base. What pairs with A?",
    c: ["T (thymine)", "G (guanine)", "U (uracil)"], a: 0, why: "In DNA, A always pairs with T, and G with C. U is only found in RNA." },
  b1: { intro: "Hijacked DNA is expressing the virus's genes!" },
  mid: { img: "smoother-b", side: 0, lines: [["DNA", "Your calcium can't hold a master."], ["SMOOTHER", "Calcium holds MUSCLE. And mine's locked."]] },
  b2: { intro: "Lock DNA down. Muscle cells run on calcium!" },
  mega: { name: "Calcium Cramp", steps: [
    "In muscle, the smooth ER (called the sarcoplasmic reticulum) stores calcium.",
    "A nerve signal releases it; calcium lets myosin grab actin and pull, so the muscle contracts.",
    "If the calcium can't be pumped back in, the muscle locks up: tetany." ] },
  end: { img: "smoother-b", side: 1, lines: [["DNA", "It's too late for the cut. Mitosis is copying me, virus and all, into new cells!"], ["SMOOTHER", "Then you stop him. Only you can read the copy."]] },
  quiz: [
    { d: "cell", o: { marks: { A: "mito", B: "nucleus", C: "lysosome" } }, q: "Smooth ER's calcium works in muscle cells. Which organelle supplies the ATP for muscle contraction?",
      c: ["A — mitochondrion", "B — nucleus", "C — lysosome"], a: 0, why: "Mitochondria make the ATP that powers myosin pulling on actin." },
    { d: "cell", o: { marks: { A: "smoothER", B: "roughER", C: "golgi" } }, q: "Which is a job of the smooth ER?",
      c: ["Making lipids and storing calcium", "Building proteins on ribosomes", "Copying DNA"], a: 0,
      why: "With no ribosomes, the smooth ER makes lipids, breaks down toxins and stores calcium." },
    { d: "cell", o: { marks: { A: "smoothER", B: "roughER", C: "golgi" } }, q: "What makes the smooth ER different from the rough ER?",
      c: ["It has no ribosomes on its surface", "It is inside the nucleus", "It makes ATP"], a: 0,
      why: "Smooth ER has no ribosomes, so it makes lipids instead of proteins." } ] },

{ id: "dna", act: 3, title: "Copy Error", player: "dna", foe: "mitosis", stage: "archive",
  art: [
    { key: "dna-a", refs: ["dna", "mitosis"], prompt: `${TWO} LEFT PANEL: the DNA Ranger (gold, blue helix emblem, navy trousers, white plume) in a crane stance before X-shaped chromosomes lining up across the middle of a dividing cell. RIGHT PANEL: the Mitosis Ranger (silver-white suit, pink and green armor, split pink-green chest emblem) ${INFECTED}, arms stretched wide, pulling X-shaped chromosomes apart along glowing spindle fibers; every chromosome has a glowing green band.` },
    { key: "dna-b", refs: ["dna", "mitosis"], prompt: `${TWO} LEFT PANEL: the DNA Ranger striking the infected Mitosis Ranger amid tangled spindle fibers and scattered chromosomes. RIGHT PANEL: the Mitosis Ranger, freed and no longer green, holding a single X-shaped chromosome with one green band, while the DNA Ranger looks at it gravely; in the background a figure in an iridescent teal-and-purple suit (the CRISPR Ranger) arrives.` },
  ],
  open: [
    { img: "dna-a", side: 0, lines: [["DNA", "Every copy he makes carries the virus with it."]], cap: "Before a cell divides, it copies its DNA, and a prophage gets copied too." },
    { img: "dna-a", side: 1, lines: [["MITOSIS", "Divide! Divide! Two infected cells, then four, then eight!"], ["DNA", "He's spreading the prophage into every new cell."]], cap: "This is how a sleeping virus spreads without bursting a single cell." },
  ],
  check: { d: "mitosis", o: { cells: ["anaphase", "prophase", "metaphase"] },
    q: "DNA can strike while the chromosomes are lined up across the middle. Which cell is in metaphase?",
    c: ["A", "B", "C"], a: 2, why: "In metaphase, chromosomes line up across the middle of the cell, attached to spindle fibers." },
  b1: { intro: "Hijacked Mitosis is copying the infection into new cells!" },
  mid: { img: "dna-b", side: 0, lines: [["MITOSIS", "Two of me, two of you... I can do this all day."], ["DNA", "So can I. I copy myself too, and I do it properly."]] },
  b2: { intro: "Show Mitosis how DNA really copies itself!" },
  mega: { name: "Twin Serpent Fork", steps: [
    "Helicase unzips DNA at the replication fork.",
    "DNA polymerase builds one new strand smoothly (leading) and the other in short Okazaki fragments (lagging) that ligase seals.",
    "Each new copy keeps one old strand and one new: semi-conservative replication." ] },
  end: { img: "dna-b", side: 1, lines: [["MITOSIS", "Every copy I made has this green band. How do we get it out?"], ["CRISPR", "You don't. I do. Show me exactly where it is."]] },
  quiz: [
    { d: "dna", o: { pairs: [["A", "?"], ["T", "?"], ["G", "?"], ["C", "?"]], blank: "all" }, q: "One strand reads A-T-G-C. What is the matching strand?",
      c: ["T-A-C-G", "A-T-G-C", "U-A-C-G"], a: 0, why: "A pairs with T and G with C, so A-T-G-C matches T-A-C-G." },
    { d: "dna", o: { mode: "replication" }, q: "After DNA copies itself, what is each new DNA molecule made of?",
      c: ["One old strand and one new strand", "Two new strands", "Two old strands"], a: 0, why: "Replication is semi-conservative: each copy keeps one original strand." },
    { d: "dna", o: { mode: "replication" }, q: "Why must DNA be copied before a cell divides?",
      c: ["So each new cell gets a full set of instructions", "So the cell gets bigger", "To make ATP"], a: 0,
      why: "Each daughter cell needs a complete copy of the DNA to work." } ] },

{ id: "mitosis", act: 3, title: "Divide and Conquer", player: "mitosis", foe: "phage", stage: "archive",
  art: [
    { key: "mitosis-a", refs: ["mitosis", "phage-sheet"], prompt: `${TWO} LEFT PANEL: the Mitosis Ranger (silver-white, pink and green armor) standing guard in front of a cell that has just finished dividing into two daughter cells. RIGHT PANEL: the Phage (rust-brown suit with yellow piping, mint-green dome helmet with dark visor, six curved silver tail fibers) landing in person for the first time, cracking the floor, tail fibers spread like legs, clawed hands raised.` },
    { key: "mitosis-b", refs: ["mitosis", "phage-sheet"], prompt: `${TWO} LEFT PANEL: two identical copies of the Mitosis Ranger attacking the Phage from both sides at once. RIGHT PANEL: the Phage retreating into a green mist, pointing back with a clawed finger, while behind the Mitosis Ranger the CRISPR Ranger (iridescent teal-and-purple suit, gold spiked crest) steps forward holding up a glowing ribbon of RNA.` },
  ],
  open: [
    { img: "mitosis-a", side: 0, lines: [["MITOSIS", "No more infected copies. Not on my watch."]], cap: "Mitosis makes two identical daughter cells from one." },
    { img: "mitosis-a", side: 1, lines: [["PHAGE", "You broke my production line. Fine. I'll do this MYSELF."], ["MITOSIS", "Then you'll fight two of me."]] },
  ],
  check: { d: "mitosis", o: { mode: "count", n: 4 },
    q: "Mitosis is about to split into two. This cell has 4 chromosomes. How many will each daughter cell have?",
    c: ["4", "2", "8"], a: 0, why: "Mitosis makes two identical cells, each with the same chromosome number as the parent." },
  b1: { intro: "The Phage himself! Hold the line!" },
  mid: { img: "mitosis-b", side: 0, lines: [["PHAGE", "Two of you, or two hundred. I can outnumber anything."], ["MITOSIS", "Funny. That's MY job."]] },
  b2: { intro: "Divide! Outnumber the Phage!" },
  mega: { name: "Cellular Craze", steps: [
    "Prophase: chromosomes condense. Metaphase: they line up across the middle.",
    "Anaphase: sister chromatids are pulled to opposite ends. Telophase and cytokinesis: the cell pinches in two.",
    "Each division doubles the number of cells: 1, 2, 4, 8, 16..." ] },
  end: { img: "mitosis-b", side: 1, lines: [["PHAGE", "Cut me out? Go ahead. Lysosome will be waiting."], ["CRISPR", "Then I'll cut him free first."]] },
  quiz: [
    { d: "mitosis", o: { cells: ["metaphase", "anaphase", "telophase"] }, q: "Which cell is in anaphase, with chromatids being pulled to opposite ends?",
      c: ["A", "B", "C"], a: 1, why: "In anaphase, sister chromatids separate and move to opposite poles." },
    { d: "mitosis", o: { cells: ["metaphase", "telophase", "prophase", "anaphase"] }, q: "What is the correct order of mitosis?",
      c: ["Prophase, metaphase, anaphase, telophase", "Metaphase, prophase, telophase, anaphase", "Anaphase, metaphase, prophase, telophase"], a: 0,
      why: "PMAT: prophase, metaphase, anaphase, telophase (then cytokinesis)." },
    { d: "mitosis", o: { mode: "count", n: 4 }, q: "What does mitosis produce?",
      c: ["Two identical daughter cells", "Four different cells", "One bigger cell"], a: 0,
      why: "Mitosis makes two genetically identical cells for growth and repair." } ] },

{ id: "crispr", act: 3, title: "Precision", player: "crispr", foe: "lysosome", stage: "archive",
  art: [
    { key: "crispr-a", refs: ["crispr", "lysosome"], prompt: `${TWO} LEFT PANEL: the CRISPR Ranger (iridescent teal-and-purple suit, gold spiked crest) walking along the giant DNA helix, a glowing guide-RNA ribbon in one hand scanning for the green stretch. RIGHT PANEL: the Lysosome Ranger (black suit, crimson chest armor and gauntlets, tall swept-back crimson fin) ${INFECTED}, crouched like a predator on the helix right over the green stretch, guarding it, acid dripping from spiked gauntlets.` },
    { key: "crispr-b", refs: ["crispr", "lysosome"], prompt: `${TWO} LEFT PANEL: the CRISPR Ranger's V-shaped scissor fingers glowing as he slices a clean gap in the DNA helix, the green stretch falling away, while the infected Lysosome Ranger lunges. RIGHT PANEL: the Lysosome Ranger on his knees, the green glow draining out of his suit and visor like smoke, the CRISPR Ranger kneeling beside him with a hand on his shoulder.` },
  ],
  open: [
    { img: "crispr-a", side: 0, lines: [["CRISPR", "Bacteria invented me to fight viruses like this. Twenty letters. One address."]], cap: "CRISPR began as a bacterial immune system that remembers and cuts virus DNA." },
    { img: "crispr-a", side: 1, lines: [["LYSOSOME", "Touch the virus genes and I'll digest you."], ["CRISPR", "Lyso... the virus is in YOU too. Hold still."]], cap: "Lysosome was the first Ranger infected. Now he guards the prophage." },
  ],
  check: { d: "crispr", o: { mode: "guide", guide: "AUGCC", targets: { A: "TACGG", B: "ATGCC", C: "TTCGA" } },
    q: "CRISPR's guide RNA reads A-U-G-C-C. Which DNA target will it pair with?",
    c: ["A — TACGG", "B — ATGCC", "C — TTCGA"], a: 0, why: "A pairs with T, U with A, G with C: AUGCC pairs with TACGG." },
  b1: { intro: "Infected Lysosome guards the prophage!" },
  mid: { img: "crispr-b", side: 0, lines: [["LYSOSOME", "You'll never find it in time."], ["CRISPR", "Already found. Checking the address..."]] },
  b2: { intro: "Find the PAM. Make the cut!" },
  mega: { name: "Precision Cut Theater", steps: [
    "Cas9 follows a 20-letter guide RNA to the matching DNA.",
    "It checks for a short PAM sequence (NGG) right beside the target.",
    "Then it cuts both strands. Scientists are testing this to cut hidden viruses out of human DNA." ] },
  end: { img: "crispr-b", side: 1, lines: [["LYSOSOME", "I remember everything. It's been in me since the first attack."], ["CRISPR", "Then you know where the Phage is hiding."]] },
  quiz: [
    { d: "crispr", o: { mode: "library" }, q: "Bacteria save short pieces of virus DNA in their CRISPR 'library'. What are they for?",
      c: ["To recognize the same virus if it attacks again", "To make ATP", "To build the cell wall"], a: 0, why: "The saved pieces become guide RNAs that find and cut that virus's DNA next time." },
    { d: "crispr", o: { mode: "cut" }, q: "After the guide RNA finds its match, what does Cas9 do?",
      c: ["Cuts both strands of the DNA", "Copies the DNA", "Glues two genes together"], a: 0, why: "Cas9 is the scissors: it makes a double-strand cut at the target." },
    { d: "crispr", o: { mode: "cut" }, q: "How do scientists use CRISPR-Cas9 today?",
      c: ["To edit genes at an exact location", "To measure blood sugar", "To make proteins glow"], a: 0,
      why: "By changing the guide RNA, scientists can cut, and then edit, almost any gene." } ] },

/* ---------------------------------------------------------------- ACT 4: CURE */
{ id: "lysosome", act: 4, actTitle: "ACT 4 · CURE", title: "Clean Up", player: "lysosome", foe: "phage", stage: "environment",
  art: [
    { key: "lysosome-a", refs: ["lysosome", "phage-sheet"], prompt: `${TWO} LEFT PANEL: the Lysosome Ranger (black suit, crimson armor and spiked gauntlets, tall crimson fin), cured, leading all the other Rangers in a charge across the cytoplasm. RIGHT PANEL: the Phage (rust-brown suit, mint-green dome helmet, six curved silver tail fibers) inside a swarm of hundreds of small green virus particles, swelling with power, the cell wall around him cracking.` },
    { key: "lysosome-b", refs: ["lysosome", "phage-sheet"], prompt: `${TWO} LEFT PANEL: the Lysosome Ranger engulfing a cloud of green virus particles inside a huge glowing crimson bubble. RIGHT PANEL: the Phage, alone now, staggering back with his tail fibers broken, glaring at the Lysosome Ranger who stands ready with dripping acid gauntlets.` },
  ],
  open: [
    { img: "lysosome-a", side: 0, lines: [["LYSOSOME", "I was the first one he took. I'll be the one who cleans up."]], cap: "Lysosomes are full of digestive enzymes, and they can destroy invading viruses." },
    { img: "lysosome-a", side: 1, lines: [["PHAGE", "One hundred copies of me, ready to burst out. You're too late."], ["LYSOSOME", "One hundred? That's lunch."]], cap: "In the lytic cycle, about 100 to 200 new viruses fill the cell, then burst it open (lysis)." },
  ],
  check: { d: "lysosome", o: { mode: "autophagy" },
    q: "Lysosome will deal with the virus particles the same way the cell recycles a worn-out part, shown here. What happens to them inside the lysosome?",
    c: ["Enzymes break them down into building blocks the cell reuses", "They are stored forever", "They turn into new organelles"], a: 0,
    why: "The cell can wrap invaders in membrane and deliver them to lysosomes, whose enzymes digest them." },
  b1: { intro: "Clear the virus swarm. The Phage is next!" },
  mid: { img: "lysosome-b", side: 0, lines: [["PHAGE", "You'll burst first, Lyso. Your acid will eat this whole cell."], ["LYSOSOME", "Only if I break. I won't."]] },
  b2: { intro: "Digest the Phage. pH 5!" },
  mega: { name: "Digestive Abyss: pH 5", steps: [
    "The lysosome fuses with whatever was engulfed.",
    "Proton pumps make its inside acidic, about pH 5, which switches on its digestive enzymes.",
    "Those enzymes barely work at the cell's normal pH 7.2, so they only digest what's inside." ] },
  end: { img: "lysosome-b", side: 1, lines: [["PHAGE", "This... isn't over. I wasn't MADE to lose to you."], ["LYSOSOME", "Made? ...Everyone. Nucleus. Now."]] },
  quiz: [
    { d: "lysosome", o: { mode: "ph" }, q: "The inside of a lysosome is acidic (about pH 5). Why does that matter?",
      c: ["Its digestive enzymes only work well in acid", "Acid makes ATP", "Acid stores DNA"], a: 0, why: "Lysosome enzymes are switched on by acid and barely work at the cell's normal pH." },
    { d: "lysosome", o: { mode: "burst" }, q: "Why would it harm the cell if lysosomes burst open?",
      c: ["Their enzymes could digest the cell's own parts", "The cell would gain too much ATP", "Nothing would happen"], a: 0,
      why: "Released enzymes could break down the cell from the inside, which is why the membrane around them matters." },
    { d: "lysosome", o: { mode: "autophagy" }, q: "Lysosomes are best described as the cell's...",
      c: ["Recycling and cleanup crew", "Power plant", "Control center"], a: 0,
      why: "Lysosomes break down worn-out parts and invaders into building blocks the cell reuses." } ] },

/* ---------------------------------------------------------------- FINALE */
{ id: "finale", act: 5, actTitle: "FINALE · HOST", title: "Made for You", player: "choose", foe: "phage", stage: "archive", finale: true,
  art: [
    { key: "finale-a", refs: ["nucleus", "phage-sheet"], prompt: `${TWO} LEFT PANEL: all fourteen Organelle Rangers standing together inside the nucleus in a wide heroic line-up, the Nucleus Ranger (purple and gold) at the center, facing the viewer. RIGHT PANEL: the Phage (rust-brown suit, mint-green dome helmet, six curved silver tail fibers) at full power in the center of the nucleus, a giant glowing green T4-phage-shaped energy form (an icosahedral head on a tail with six legs) rising behind him.` },
    { key: "finale-b", refs: ["nucleus", "phage-sheet"], prompt: `${TWO} LEFT PANEL: the Phage collapsing as a beam of combined Ranger colors (purple, red, orange, yellow, blue, pink, white, green, teal, gold) hits him. RIGHT PANEL: the cell restored and glowing healthy pink and teal, all fourteen Rangers celebrating together, the Nucleus Ranger raising one fist.` },
  ],
  open: [
    { img: "finale-a", side: 0, lines: [["NUCLEUS", "One question has bugged me since day one. Phages only infect BACTERIA."], ["MITO", "And we're not a bacterium. We have a nucleus."]], cap: "Viruses can only infect cells whose surface receptors their 'keys' fit. This is called host specificity." },
    { img: "finale-a", side: 1, lines: [["PHAGE", "Someone rebuilt me. New keys for your receptors. New genes your ribosomes can read. I was MADE for you."], ["NUCLEUS", "Then we finish this. Together."]] },
  ],
  check: { d: "cell", o: { marks: { A: "nucleus", B: "mito", C: "membrane" } },
    q: "Phages normally only infect bacteria. Which labeled structure shows this is NOT a bacterial cell?",
    c: ["A — the nucleus", "B — a mitochondrion", "C — the cell membrane"], a: 0,
    why: "Bacteria have no nucleus: their DNA floats in the cytoplasm. A nucleus means a eukaryotic cell, which ordinary phages can't infect. (Mitochondria are a clue too, but every cell, bacteria included, has a membrane.)" },
  b1: { intro: "FINAL BATTLE: the Phage itself. The whole team is counting on you!" },
  mid: { img: "finale-b", side: 0, lines: [["PHAGE", "I'll burst this cell open if it's the last thing I do!"], ["NUCLEUS", "Rangers. Cell Protocol. NOW!"]] },
  b2: { intro: "One last push. Every Ranger, together!" },
  mega: { name: "Cell Protocol", steps: [
    "A healthy cell is a team: the nucleus directs, ribosomes build, the ER and Golgi ship, mitochondria power it all.",
    "The membrane guards the border while lysosomes clean up invaders.",
    "Together, they keep the cell alive. That's what makes it a cell." ] },
  end: { img: "finale-b", side: 1, lines: [["NUCLEUS", "Cell secured. Somebody built that Phage... and we'll be ready for them."]], cap: "THE END. Your report card is ready." },
  quiz: [
    { d: "cell", o: { marks: { A: "nucleus", B: "golgi", C: "lysosome" } }, q: "The virus's genes started in the DNA. Which organelle holds the DNA?",
      c: ["A — nucleus", "B — Golgi", "C — lysosome"], a: 0, why: "The nucleus holds the DNA and controls which genes are used." },
    { d: "translation", o: { codons: ["AUG", "GGC", "UUU", "UAA"], at: 2, trna: "AAA", aa: "Phe", chain: ["Met", "Gly"] }, q: "Which order shows how a protein is made from a gene?",
      c: ["DNA → mRNA → ribosome → protein", "Protein → mRNA → DNA", "Ribosome → DNA → ATP"], a: 0,
      why: "That's the central dogma: DNA is transcribed into mRNA, which a ribosome translates into protein." },
    { d: "cell", o: { marks: { A: "roughER", B: "golgi", C: "membrane" } }, q: "A spike protein was built on the rough ER. What is its path to the cell surface?",
      c: ["Rough ER → Golgi → membrane", "Membrane → Golgi → rough ER", "Rough ER → nucleus → membrane"], a: 0,
      why: "Proteins for the surface go from the rough ER to the Golgi, then in vesicles to the membrane." } ] },
];
