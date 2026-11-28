/* ================= Story mode controller ("Hijacked") =================
   Runs the chapters in story.js: title cards, illustrated panels with dialogue, check-in questions, the two
   story battles, the Battle 2 megaform question and the slowed, narrated megaform, then the report card.
   Progress is saved on the device (localStorage) after every step, so a class can pick up where it left off.
   Score = questions answered right on the FIRST try (one check-in and one megaform question per chapter). */
const SM_KEY = "or3story";
const SPK = { NUCLEUS: "nucleus", RNA: "rna", RIBOSOME: "ribosome", "ROUGH ER": "rougher", GOLGI: "golgi", MEMBRANE: "membrane", CYTOPLASM: "cytoplasm", MITO: "mito",
  ATP: "atp", SMOOTHER: "smoother", DNA: "dna", MITOSIS: "mitosis", CRISPR: "crispr", LYSOSOME: "lysosome", PHAGE: "phage" };
const SPK_NAME = { SMOOTHER: "SMOOTH ER", MITO: "MITOCHONDRIA", PHAGE: "THE PHAGE" };
const STORY_IMG = {};
function storyArt() { for (const [k, src] of Object.entries(typeof STORY_DATA === "undefined" ? {} : STORY_DATA)) { const im = new Image(); im.src = src; STORY_IMG[k] = im; } }
const smEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const smName = (id) => (id === "phage" ? "The Phage" : (BYID[id] ? BYID[id].name.replace(" Ranger", "") : id));

const SM = {
  S: null, active: false, wait: null, busy: false, keyNav: null, gen: 0,
  load() { try { this.S = JSON.parse(localStorage.getItem(SM_KEY) || "null"); } catch (_) { this.S = null; } },
  store() { try { localStorage.setItem(SM_KEY, JSON.stringify(this.S)); } catch (_) {} },
  fresh(name, period) { this.S = { name, period, ch: 0, stage: "open", answers: [], losses: {}, done: false, started: new Date().toISOString() }; this.store(); },
  el(id) { return document.getElementById(id); },
  show(pane) { const root = this.el("story"); root.hidden = !pane; document.body.classList.toggle("smui", !!pane); this.el("smQuit").hidden = !pane || ["smName", "smMap", "smEnd", "smNext"].includes(pane) || APP.mode === "storyq"; root.querySelectorAll(".sp").forEach((p) => (p.hidden = p.id !== pane)); },

  /* ---------- entry from the main menu ---------- */
  enter() {
    this.load(); this.active = true; APP.endGame(); APP.story = true; APP.mode = "story"; APP.screens(null); HUD.show(false); SHOW.setVisible(false); INTRO.show(false);
    $id("sideMode").textContent = "STORY MODE"; $id("cards").innerHTML = "";
    if (!this.S || !this.S.name) return this.nameScreen();
    this.map();
  },
  leave() { this.active = false; APP.story = false; this.show(null); this.wait = null; APP.toTitle(); },
  nameScreen() {
    this.show("smName"); const n = this.el("smNameIn"), p = this.el("smPerIn"); n.value = ""; p.value = ""; setTimeout(() => n.focus(), 50);
    this.el("smNameGo").onclick = () => { const nm = n.value.trim(), pr = p.value.trim(); if (!nm) { n.focus(); n.classList.add("bad"); return; } AUDIO.sfx("confirm"); this.fresh(nm.slice(0, 40), pr.slice(0, 20)); this.map(); };
    this.el("smNameBack").onclick = () => this.leave();
  },
  /* ---------- chapter map ---------- */
  map() {
    APP.mode = "story"; this.show("smMap"); const S = this.S;
    this.el("smWho").innerHTML = `${smEsc(S.name)}${S.period ? " · " + smEsc(S.period) : ""} <span>SCORE ${this.score().right} / ${this.score().total}</span>`;
    this.el("smChaps").innerHTML = STORY.map((ch, i) => { const st = S.done || i < S.ch ? "done" : i === S.ch ? "now" : "lock";
      const pl = ch.player === "choose" ? "nucleus" : ch.player;
      return `<div class="smc ${st}" style="--c:${BYID[pl] ? BYID[pl].hex : "#fff"}"><i style="background-image:url(${PORTRAITS[pl]})"></i><b>${ch.finale ? "FINALE" : "CH " + (i + 1)}</b><span>${smEsc(ch.title)}</span>${st === "done" ? "<em>✔</em>" : ""}</div>`; }).join("");
    const go = this.el("smGo"); go.textContent = S.done ? "REPLAY (STARTS A NEW REPORT CARD)" : S.ch === 0 && S.stage === "open" ? "BEGIN THE STORY" : "CONTINUE: " + (STORY[S.ch].finale ? "FINALE" : "CHAPTER " + (S.ch + 1));
    go.onclick = () => { AUDIO.sfx("confirm"); if (S.done) { S.ch = 0; S.stage = "open"; S.done = false; S.answers = []; S.losses = {}; S.started = new Date().toISOString(); this.store(); } this.run(); };
    this.el("smCard").onclick = () => { AUDIO.sfx("confirm"); this.reportCard(); };
    this.el("smBack").onclick = () => this.leave(); this.el("smQuit").onclick = (e) => { e.stopPropagation(); if (this.abort && APP.mode === "story") { AUDIO.sfx("confirm"); this.abort(); } };
    this.el("smReset").onclick = () => { const b = this.el("smReset"); if (b.dataset.sure) { localStorage.removeItem(SM_KEY); this.S = null; b.dataset.sure = ""; b.textContent = "NEW STUDENT"; return this.nameScreen(); } b.dataset.sure = "1"; b.textContent = "TAP AGAIN TO ERASE THIS PROGRESS"; };
    this.el("smReset").textContent = "NEW STUDENT"; this.el("smReset").dataset.sure = "";
    this.menuKeys(["smGo", "smCard", "smReset", "smBack"]);
    this.music();
  },
  menuKeys(ids) { this.keyNav = { ids, i: 0 }; this.markNav(); },
  markNav() { if (!this.keyNav) return; this.keyNav.ids.forEach((id, k) => this.el(id).classList.toggle("sel", k === this.keyNav.i)); },

  /* ---------- the chapter runner ---------- */
  async run() {
    if (this.busy) return; this.busy = true;
    this.abortP = new Promise((_, rej) => (this.abort = () => { this.abort = null; this.wait = null; this.gen++; rej("quit"); })); this.abortP.catch(() => {});
    const A = (p) => Promise.race([p, this.abortP]);
    try {
      while (!this.S.done) {
        const S = this.S, ch = STORY[S.ch], n = S.ch + 1;
        if (S.stage === "open") {
          if (ch.actTitle) await A(this.card(ch.actTitle.split(" · ")[0], ch.actTitle.split(" · ")[1] || "", "act"));
          await A(this.card(ch.finale ? "FINALE" : "CHAPTER " + n, ch.title, "chap"));
          for (const p of ch.open) await A(this.panel(p, ch));
          await A(this.ask(ch.check, "check", ch));
          S.stage = "b1"; this.store();
        }
        if (ch.player === "choose" && !S.pick) { S.pick = await A(this.choose()); this.store(); }
        if (S.stage === "b1") { await A(this.battle(ch, 1)); S.stage = "mid"; this.store(); }
        if (S.stage === "mid") { await A(this.panel(ch.mid, ch)); S.stage = "b2"; this.store(); }
        if (S.stage === "b2") { await A(this.battle(ch, 2)); S.stage = "end"; this.store(); }
        if (S.stage === "end") {
          await A(this.panel(ch.end, ch));
          if (S.ch >= STORY.length - 1) { S.done = true; S.finished = new Date().toISOString(); this.store(); break; }
          S.ch++; S.stage = "open"; delete S.pick; this.store();
          if (!(await A(this.between()))) { this.busy = false; this.abort = null; return this.map(); }
        }
      }
      this.busy = false; this.abort = null; await this.finale();
    } catch (e) { this.busy = false; this.abort = null; if (e !== "quit") console.error(e); if (APP.storyFight) this.quitFight(); this.map(); }
  },
  // after each chapter: keep going or save and stop
  between() { return new Promise((res) => { APP.mode = "story"; this.show("smNext"); const c = STORY[this.S.ch];
    this.el("smNextT").textContent = "CHAPTER COMPLETE"; this.el("smNextP").textContent = `Progress saved. Up next: ${c.finale ? "the finale" : "Chapter " + (this.S.ch + 1) + ", " + c.title}.`;
    this.el("smNextGo").onclick = () => { AUDIO.sfx("confirm"); res(true); }; this.el("smNextStop").onclick = () => { AUDIO.sfx("confirm"); res(false); };
    this.menuKeys(["smNextGo", "smNextStop"]); }); },

  music() { if (!AUDIO.music || AUDIO.music.kind !== "menu") APP.setMusic("menu"); },
  /* a full-screen title card */
  card(top, title, kind) { return new Promise((res) => { APP.mode = "story"; this.music(); this.show("smTitle"); const el = this.el("smTitle"); el.className = "sp " + kind;
    this.el("smTitleTop").textContent = top; this.el("smTitleMain").textContent = title; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in"); AUDIO.sfx(kind === "act" ? "boom" : "confirm");
    this.keyNav = null; const t0 = performance.now(); this.wait = () => { if (performance.now() - t0 > 700) { this.wait = null; res(); } }; }); },

  /* one illustrated panel: the art (left or right half of a 2-panel picture), then each line typed out */
  async panel(p, ch) {
    const G = this.gen, dead = () => new Promise(() => {});
    APP.mode = "story"; this.music(); this.show("smScene"); this.keyNav = null;
    const art = this.el("smArt"), im = STORY_IMG[p.img];
    art.style.backgroundImage = im ? `url(${im.src})` : "none"; this.el("smBg").style.backgroundImage = im ? `url(${im.src})` : "none"; art.style.backgroundPosition = p.side ? "right center" : "left center"; art.classList.toggle("none", !im);
    art.classList.remove("kb0", "kb1"); void art.offsetWidth; art.classList.add(p.side ? "kb1" : "kb0");
    this.el("smArtMissing").hidden = !!im;
    const cap = this.el("smCap"); cap.hidden = !p.cap; cap.textContent = p.cap || "";
    const lines = p.lines || [];
    if (!lines.length) { this.el("smLine").hidden = true; await this.tap(); return; }
    for (const [who, text] of lines) {
      const id = SPK[who], col = BYID[id] ? BYID[id].hex : "#fff", box = this.el("smLine");
      box.hidden = false; box.style.setProperty("--c", col); this.el("smPort").style.backgroundImage = PORTRAITS[id] ? `url(${PORTRAITS[id]})` : "none";
      this.el("smWhoN").textContent = SPK_NAME[who] || who; const tx = this.el("smText"); tx.textContent = "";
      await this.type(tx, text); if (G !== this.gen) return dead(); await this.tap(); if (G !== this.gen) return dead();
    }
  },
  // types text out; a press finishes it at once
  type(el, text) { return new Promise((res) => { let i = 0, skip = false; const G = this.gen; this.wait = () => { skip = true; };
    const step = () => { if (G !== this.gen) return; if (skip) i = text.length; else i += 1; el.textContent = text.slice(0, i); if (i >= text.length) { this.wait = null; res(); return; } setTimeout(step, 22); }; step(); }); },
  tap() { return new Promise((res) => { this.el("smMore").hidden = false; const t0 = performance.now(); this.wait = () => { if (performance.now() - t0 < 250) return; this.wait = null; this.el("smMore").hidden = true; res(); }; }); },

  /* ---------- questions (the Cell Rescue bio-scan style) ---------- */
  ask(q, kind, ch, opts = {}) { return new Promise((res) => {
    APP.mode = opts.inFight ? "storyq" : "story"; this.show("smQ"); this.keyNav = null; this.wait = null;
    const order = q.c.map((_, i) => i); if (!q.c.every((c) => /^[A-D](\s—|$)/.test(c))) for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    this.el("smQTag").textContent = kind === "check" ? "CHECK-IN" : "MEGAFORM LOCK · ANSWER TO FIRE " + ch.mega.name.toUpperCase();
    this.el("smQWho").textContent = smName(ch.player === "choose" ? this.S.pick || "nucleus" : ch.player).toUpperCase();
    drawDiagram(this.el("smQFig"), q.d, q.o || {}); this.el("smQText").textContent = q.q;
    const list = this.el("smQAns"), fb = this.el("smQFb"); list.innerHTML = ""; fb.hidden = true; fb.className = "fb";
    const rec = { ch: this.S.ch, kind, q: q.q, tries: 0, first: null, right: false, time: new Date().toISOString() }; let solved = false;
    const answer = (b, orig) => {
      if (solved || b.disabled) return; if (rec.first === null) rec.first = q.c[orig];
      const ok = orig === q.a; fb.hidden = false; fb.innerHTML = "";
      if (!ok) { rec.tries++; b.disabled = true; b.classList.add("bad"); AUDIO.sfx("block");
        if (kind === "mega") { // wrong megaform answer: explain, the fight goes on, a different question comes next time
          solved = true; [...list.children].forEach((x) => (x.disabled = true)); fb.className = "fb miss";
          fb.innerHTML = `<p><b>Not quite.</b> ${smEsc(q.why)}</p><p class="small">The megaform fizzles. ${smEsc(smName(ch.foe))} recovers some health. Wear them down again for a new question.</p>`;
          const nx = document.createElement("button"); nx.className = "mbtn go"; nx.textContent = "BACK TO THE FIGHT"; nx.onclick = () => { this.record(rec, opts); res(false); }; fb.appendChild(nx); nx.focus(); return; }
        fb.className = "fb miss"; fb.innerHTML = "<p><b>Not quite.</b> Look at the diagram again and try another answer.</p>"; return; }
      solved = true; rec.solved = true; b.classList.add("good"); [...list.children].forEach((x) => (x.disabled = true)); rec.right = rec.tries === 0; AUDIO.sfx("confirm");
      fb.className = "fb hit"; fb.innerHTML = `<p><b>${rec.tries ? "That's it." : "Correct!"}</b> ${smEsc(q.why)}</p>`;
      const nx = document.createElement("button"); nx.className = "mbtn go"; nx.textContent = kind === "mega" ? "FIRE THE MEGAFORM!" : "CONTINUE"; nx.onclick = () => { this.record(rec, opts); res(true); }; fb.appendChild(nx); nx.focus();
    };
    order.forEach((orig, n) => { const b = document.createElement("button"); b.className = "ans"; b.innerHTML = `<span class="k">${n + 1}</span><span>${smEsc(q.c[orig])}</span>`; b.onclick = () => answer(b, orig); list.appendChild(b); });
    this.qAnswer = (n) => { const b = list.children[n]; if (b) b.click(); };
  }); },
  // the first attempt at each question slot is what's scored; later megaform questions in the same fight are logged as retries
  record(rec, opts) { if (opts.retry || this.S.answers.some((x) => !x.retry && x.ch === rec.ch && x.kind === rec.kind)) rec.retry = true; this.S.answers.push(rec); this.store(); },
  score() { const a = this.S ? this.S.answers.filter((x) => !x.retry) : []; return { right: a.filter((x) => x.right).length, total: STORY.length * 2, asked: a.length }; },

  /* ---------- story battles ---------- */
  async battle(ch, n) {
    const S = this.S, key = ch.id + n;
    for (;;) {
      await this.prefight(ch, n);
      const won = await this.fight(ch, n);
      if (won === "quit") throw "quit";
      if (won) return;
      S.losses[key] = (S.losses[key] || 0) + 1; this.store();
      const G = this.gen; await this.card("DEFEATED", "Try again. " + smName(ch.foe) + " is a little weaker now.", "lose"); if (G !== this.gen) return new Promise(() => {});
    }
  },
  prefight(ch, n) { return new Promise((res) => { APP.mode = "story"; this.show("smPre"); const me = this.me(ch), fo = ch.foe;
    this.el("smPreN").textContent = "BATTLE " + n + (n === 2 ? " · MEGAFORM ROUND" : "");
    this.el("smPreP").textContent = (n === 1 ? ch.b1 : ch.b2).intro;
    this.el("smPreRule").textContent = n === 1 ? "Win with punches, kicks and specials. Megaforms are locked this round." : `Break ${smName(fo)}'s first health bar, then answer a question about ${smName(me)} to fire ${ch.mega.name}.`;
    this.el("smPreL").style.cssText = `--c:${BYID[me].hex};background-image:url(${PORTRAITS[me]})`; this.el("smPreR").style.cssText = `--c:${BYID[fo].hex};background-image:url(${PORTRAITS[fo]})`;
    this.el("smPreR").classList.toggle("inf", fo !== "phage");
    this.el("smPreGo").onclick = () => { AUDIO.sfx("confirm"); res(); }; this.menuKeys(["smPreGo"]); }); },
  me(ch) { return ch.player === "choose" ? this.S.pick : ch.player; },
  fight(ch, n) { return new Promise((res) => {
    this.show(null); this.keyNav = null; const S = this.S, losses = S.losses[ch.id + n] || 0, me = this.me(ch);
    APP.picks = [me, ch.foe]; APP.tower = null; APP.gameMode = "story"; APP.diff = 1;
    APP.storyFight = { ch, n, res, losses, asked: 0, pending: false, cine: false };
    APP.startFight(ch.stage);
    const g = APP.game, [a, b] = g.f, D = Math.pow(0.85, losses); // every loss: the foe hits softer and fights a bit slower
    g.noUlt = true; g.story = true; g.dmgMul = [n === 1 ? 1.05 : 1.15, (ch.foe === "phage" ? 1.05 : 0.9) * D];
    if (b.ctrl && b.ctrl.level != null) b.ctrl.level = Math.max(0.2, (n === 1 ? 0.5 : 0.45) + (ch.foe === "phage" ? 0.1 : 0) + Math.min(0.15, S.ch * 0.012) - 0.08 * losses);
    if (ch.foe !== "phage") b.infected = true;
    if (n === 2) { b.hp = 60; b.dispHp = b.ghostHp = 60; g.onBarBreak = (def) => { if (def === b) this.megaAsk(); }; g.noKO = (def) => def === b && !APP.storyFight.cine; }
    $id("sideMode").textContent = `STORY · ${ch.finale ? "FINALE" : "CH " + (S.ch + 1)} · BATTLE ${n}`;
  }); },
  // called by the app each frame of a story fight
  tick(g) { const F = APP.storyFight; if (!F) return; g.timer = 99; g.f[0].meter = g.f[1].meter = 0;
    const b = g.f[1]; if (F.n === 2 && F.asked > 0 && !F.pending && !F.cine && g.phase === "fight" && b.bars === 1 && b.hp <= 45 && !["cine", "intro", "ko"].includes(b.state)) this.megaAsk(); },
  async megaAsk() {
    const F = APP.storyFight, g = APP.game; if (!F || F.pending || F.cine) return; F.pending = true;
    const ch = F.ch, q = ch.quiz[F.asked % ch.quiz.length], retry = F.asked > 0; F.asked++;
    await new Promise((r) => setTimeout(r, 450)); // let the bar-break land first
    const ok = await this.ask(q, "mega", ch, { inFight: true, retry });
    this.show(null); APP.mode = "fight"; F.pending = false;
    const [a, b] = g.f;
    if (!ok) { b.hp = Math.min(BAR_HP, b.hp + 30); b.dispHp = b.hp; HUD.update(g); return; }
    // the megaform ends the match: it fires from wherever they are, slowed, with narration
    F.cine = true; b.bars = 1; b.hp = 1; b.dispHp = 1; a.set("idle"); b.set("idle"); a.vx = b.vx = 0; a.y = b.y = 0; a.grounded = b.grounded = true;
    g.startCine(a, b); this.narrate(g, ch);
  },
  narrate(g, ch) {
    const c = g.cine; if (!c) return; const steps = ch.mega.steps, box = this.el("smNarr"), dur = c.D ? c.D.dur : 4.6;
    const step0 = c.step.bind(c); let k = -1, hold = false, t = 0, total = dur || 6;
    const show = (i) => { box.hidden = false; this.el("smNarrN").textContent = ch.mega.name.toUpperCase() + `  ${i + 1}/${steps.length}`; this.el("smNarrT").textContent = steps[i]; this.el("smNarrMore").hidden = false; hold = true; AUDIO.sfx("select"); };
    this.narrNext = () => { if (hold) { hold = false; this.el("smNarrMore").hidden = true; } };
    c.step = (dt) => { if (hold) return false; const pt = t; t += dt * 0.5; for (let i = 0; i < steps.length; i++) { const at = total * (0.12 + 0.3 * i); if (pt < at && t >= at && i > k) { k = i; show(i); } }
      const done = step0(dt * 0.5); if (done) { box.hidden = true; this.narrNext = null; } return done; };
  },
  // the app hands every finished story fight here instead of the normal results screen
  fightOver(won) { const F = APP.storyFight; if (!F) return; APP.storyFight = null; APP.mode = "story"; HUD.show(false); this.el("smNarr").hidden = true; this.narrNext = null;
    setTimeout(() => { APP.endGame(); F.res(won); }, 300); },
  quitFight() { const F = APP.storyFight; if (!F) return; APP.storyFight = null; APP.mode = "story"; HUD.show(false); this.el("smNarr").hidden = true; APP.endGame(); F.res("quit"); },

  /* ---------- the finale's Ranger pick ---------- */
  choose() { return new Promise((res) => { APP.mode = "story"; this.show("smPick"); this.keyNav = null;
    const g = this.el("smPickGrid"); g.innerHTML = ROSTER.map((r) => `<button class="pk" data-id="${r.id}" style="--c:${r.hex};background-image:url(${PORTRAITS[r.id]})"><b>${smEsc(r.name.replace(" Ranger", ""))}</b></button>`).join("");
    g.onclick = (e) => { const b = e.target.closest(".pk"); if (!b) return; AUDIO.sfx("confirm"); res(b.dataset.id); }; }); },

  /* ---------- the end ---------- */
  async finale() { APP.mode = "story"; this.show("smEnd"); const s = this.score();
    this.el("smEndScore").textContent = `${s.right} / ${s.total}`; this.el("smEndPct").textContent = Math.round((100 * s.right) / s.total) + "% right on the first try";
    this.el("smEndCard").onclick = () => this.reportCard(); this.el("smEndMap").onclick = () => this.map(); this.menuKeys(["smEndCard", "smEndMap"]); APP.setMusic("menu"); },

  /* ---------- report card: a one-page printable PDF, drawn on a canvas ---------- */
  reportCard() {
    const S = this.S, s = this.score(), W = 1700, H = 2200, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#3a1d6e"; g.fillRect(0, 0, W, 230); g.fillStyle = "#ffd21f"; g.fillRect(0, 230, W, 10);
    g.fillStyle = "#fff"; g.font = "bold 68px Arial"; g.fillText("ORGANELLE RANGERS", 80, 110); g.font = "bold 40px Arial"; g.fillStyle = "#ffd21f"; g.fillText("STORY MODE REPORT CARD: “HIJACKED”", 80, 180);
    g.fillStyle = "#1d1a24"; g.font = "bold 46px Arial"; g.fillText(S.name, 80, 330); g.font = "34px Arial"; g.fillStyle = "#555";
    g.fillText(`${S.period ? "Class period: " + S.period + "    " : ""}Printed ${new Date().toLocaleString()}`, 80, 385);
    const chDone = S.done ? STORY.length : S.ch; g.fillText(`Chapters completed: ${chDone} of ${STORY.length}${S.done ? "  (story finished!)" : ""}`, 80, 435);
    g.fillStyle = "#f3f0f8"; g.fillRect(1180, 280, 440, 180); g.fillStyle = "#3a1d6e"; g.font = "bold 90px Arial"; g.textAlign = "center"; g.fillText(`${s.right}/${s.total}`, 1400, 390);
    g.font = "bold 26px Arial"; g.fillText("RIGHT ON THE FIRST TRY", 1400, 435); g.textAlign = "left";
    g.font = "24px Arial"; g.fillStyle = "#555"; g.fillText("Each chapter has a check-in question and a megaform question. Only first tries count toward the score; later tries are shown for practice.", 80, 500);
    // table
    const cols = [80, 210, 380, 1290, 1480], rowH = 46; let y = 560;
    g.fillStyle = "#3a1d6e"; g.fillRect(70, y - 36, W - 140, 50); g.fillStyle = "#fff"; g.font = "bold 24px Arial";
    ["CH", "TYPE", "QUESTION", "FIRST TRY", "TRIES"].forEach((h, i) => g.fillText(h, cols[i], y)); y += rowH;
    const rows = S.answers.filter((x) => !x.retry); g.font = "22px Arial";
    rows.forEach((r, i) => { if (y > H - 120) return; if (i % 2) { g.fillStyle = "#f6f4fa"; g.fillRect(70, y - 32, W - 140, rowH); }
      g.fillStyle = "#1d1a24"; g.fillText(STORY[r.ch] && STORY[r.ch].finale ? "F" : String(r.ch + 1), cols[0], y); g.fillText(r.kind === "check" ? "Check-in" : "Megaform", cols[1], y);
      let q = r.q; while (g.measureText(q).width > 880) q = q.slice(0, -4) + "…"; g.fillText(q, cols[2], y);
      g.fillStyle = r.right ? "#127a3c" : "#b3261e"; g.font = "bold 22px Arial"; g.fillText(r.right ? "✔ Correct" : "✘ Missed", cols[3], y); g.font = "22px Arial"; g.fillStyle = "#1d1a24"; g.fillText(String(r.tries + (r.solved ? 1 : 0)), cols[4], y); y += rowH; });
    if (!rows.length) { g.fillStyle = "#777"; g.fillText("No questions answered yet.", cols[2], y); }
    const retries = S.answers.filter((x) => x.retry); if (retries.length && y < H - 140) { g.fillStyle = "#555"; g.font = "22px Arial"; g.fillText(`Extra megaform questions after a miss: ${retries.filter((x) => x.right).length} of ${retries.length} answered right.`, 80, y + 20); }
    g.fillStyle = "#999"; g.font = "20px Arial"; g.fillText("Organelle Rangers · Johnston Bio Arcade", 80, H - 50);
    const jpg = atob(c.toDataURL("image/jpeg", 0.9).split(",")[1]); const blob = smPdf(jpg, W, H);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Organelle-Rangers-Report-${S.name.replace(/[^\w-]+/g, "_")}.pdf`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },

  /* ---------- input ---------- */
  key(e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.code === "Enter") this.el("smNameGo").click(); return; }
    const c = e.code, ok = c === "Enter" || c === "Space" || c === "KeyZ", back = c === "Escape";
    if (back && this.abort && APP.mode === "story" && this.el("smMap").hidden && this.el("smNext").hidden) { AUDIO.sfx("confirm"); this.abort(); e.preventDefault(); return; }
    if (/^Digit[1-4]$/.test(c) && !this.el("smQ").hidden) { this.qAnswer && this.qAnswer(+c.slice(5) - 1); e.preventDefault(); return; }
    if (!this.el("smQ").hidden) { const go = this.el("smQFb").querySelector("button"); if (ok && go && !e.repeat) { go.click(); e.preventDefault(); return; }
      const list = [...this.el("smQAns").children].filter((b) => !b.disabled); if ((c === "ArrowDown" || c === "ArrowUp") && list.length) { const cur = list.indexOf(document.activeElement); list[(cur + (c === "ArrowDown" ? 1 : list.length - 1)) % list.length].focus(); e.preventDefault(); }
      else if (ok && list.includes(document.activeElement) && !e.repeat) { document.activeElement.click(); e.preventDefault(); } return; }
    if (this.wait && ok && !e.repeat) { this.wait(); e.preventDefault(); return; }
    if (this.keyNav) { const N = this.keyNav;
      if (c === "ArrowDown" || c === "ArrowRight") { N.i = (N.i + 1) % N.ids.length; this.markNav(); AUDIO.sfx("move"); e.preventDefault(); }
      else if (c === "ArrowUp" || c === "ArrowLeft") { N.i = (N.i + N.ids.length - 1) % N.ids.length; this.markNav(); AUDIO.sfx("move"); e.preventDefault(); }
      else if (ok && !e.repeat) { this.el(N.ids[N.i]).click(); e.preventDefault(); }
      else if (back && !this.el("smMap").hidden) this.leave(); }
  },
  click(e) { if (e.target.closest("button,input,.ans")) return; if (this.wait) this.wait(); },
};

/* a minimal one-page PDF holding a JPEG (Letter size), so the report card prints anywhere without a library */
function smPdf(jpg, w, h) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0; const add = (s) => { const b = typeof s === "string" ? enc.encode(s) : s; parts.push(b); len += b.length; };
  const bin = new Uint8Array(jpg.length); for (let i = 0; i < jpg.length; i++) bin[i] = jpg.charCodeAt(i);
  const PW = 612, PH = 792, content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
  add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const obj = (n, body) => { offs[n] = len; add(`${n} 0 obj\n`); body(); add("\nendobj\n"); };
  obj(1, () => add("<< /Type /Catalog /Pages 2 0 R >>")); obj(2, () => add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  obj(3, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => { add(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bin.length} >>\nstream\n`); add(bin); add("\nendstream"); });
  obj(5, () => add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  const xref = len; add(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => String(offs[n]).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}
