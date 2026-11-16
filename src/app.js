/* ================= App: screens, HUD, side column, main loop ================= */
const SET = Object.assign({ sound: true, pixel: false, scan: false, cpu: 1 }, (() => { try { return JSON.parse(localStorage.getItem("orRangers3.settings")) || {}; } catch (_) { return {}; } })());
const saveSet = () => { try { localStorage.setItem("orRangers3.settings", JSON.stringify(SET)); } catch (_) {} };
const DIFFS = [{ name: "EASY", ai: 0.04, you: 1.7, cpu: 0.35 }, { name: "MEDIUM", ai: 0.42, you: 1.15, cpu: 0.8 }, { name: "HARD", ai: 0.82, you: 1, cpu: 1 }];
const TOWER_LEN = 6;

/* ---------- HUD ---------- */
const HUD = {
  show(on) { $id("hud").hidden = !on; },
  setup(game) {
    this.fighters = game.f.map((f, i) => {
      const hp = $id("hp" + i);
      const meter = $id("mt" + i);
      for (const el of [$id("pb" + i), meter, $id("combo" + i), $id("toast" + i)]) {
        el.style.setProperty("--c", f.info.hex);
      }
      $id("nm" + i).textContent = f.info.name.toUpperCase();
      $id("port" + i).style.backgroundImage = `url(${PORTRAITS[f.id]})`;
      return {
        hp,
        fill: hp.querySelector(".fill"),
        ghost: hp.querySelector(".gh"),
        pips: $id("pips" + i).children,
        meter,
        meterFill: meter.querySelector(".mbar i"),
        meterLabel: meter.querySelector(".lbl"),
      };
    });
    this.timer = $id("timer");
    this.lastSecond = null;
  },
  update(game) {
    game.f.forEach((f, i) => {
      const view = this.fighters[i];
      f.dispHp = f.hp;
      f.ghostHp = Math.max(f.hp, f.ghostHp - 0.5);
      if (view.lastHp !== f.hp) {
        view.fill.style.width = `${f.hp / BAR_HP * 100}%`;
        view.lastHp = f.hp;
      }
      if (view.lastGhost !== f.ghostHp) {
        view.ghost.style.width = `${f.ghostHp / BAR_HP * 100}%`;
        view.lastGhost = f.ghostHp;
      }
      if (view.lastBars !== f.bars) {
        view.hp.classList.toggle("lastbar", f.bars === 1);
        for (let k = 0; k < view.pips.length; k++) view.pips[k].classList.toggle("off", k >= f.bars);
        view.lastBars = f.bars;
      }
      if (view.lastMeter !== f.meter) {
        view.meterFill.style.width = `${f.meter}%`;
        view.lastMeter = f.meter;
      }
      const full = f.meter >= 100;
      if (view.full !== full) {
        view.meter.classList.toggle("full", full);
        view.meterLabel.textContent = full ? `MEGAFORM READY · ${i === 0 ? "T" : "P"}` : "MEGAFORM";
        view.full = full;
      }
    });
    const second = Math.ceil(game.timer);
    if (second !== this.lastSecond) {
      this.timer.textContent = second;
      this.lastSecond = second;
    }
  },
  barBreak(slot) { const hp = $id("hp" + slot); hp.animate([{ filter: "brightness(4)" }, { filter: "none" }], 500); this.toast(slot, "HEALTH BAR BROKEN!"); },
  combo(slot, n) { const el = $id("combo" + slot); el.innerHTML = `${n} HITS<small>COMBO</small>`; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), 1100); },
  toast(slot, msg) { const el = $id("toast" + slot); el.textContent = msg; el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), 1300); },
  announce(text, cls) { const a = $id("announce"); a.innerHTML = `<div class="${cls || ""}">${text}</div>`; },
  pop(fighter, text, color) {
    const el = document.createElement("div"); el.className = "popt"; el.style.setProperty("--c", color); el.textContent = text;
    el.style.left = (VIEW.sx(fighter.x) / VIEW_W) * 100 + "%"; el.style.top = (VIEW.sy(fighter.y + 2.3) / VIEW_H) * 100 + "%"; $id("pops").appendChild(el); setTimeout(() => el.remove(), 950);
  },
  science(f, moveName) {
    const m = MOVES[f.id]; if (!m) return; let bio = null, name = moveName;
    const sp = m.specials.find((s) => s.name === moveName); if (sp) bio = sp.bio; else if (m.ult && moveName === m.ult.name) bio = m.ult.bio;
    if (!bio) return; $id("sciN").textContent = name; $id("sciN").style.color = f.info.hex; $id("sciP").textContent = bio;
    const s = $id("sci"); s.classList.remove("flash"); void s.offsetWidth; s.classList.add("flash");
    document.querySelectorAll(`.sp[data-mv]`).forEach((e) => e.classList.toggle("used", e.dataset.mv === f.slot + ":" + moveName));
  },
};

/* ---------- side column ---------- */
const KEYLBL = [{ left: "A", right: "D", up: "W", down: "S", punch: "F", kick: "G", special: "H", block: "R", ult: "T" }, { left: "←", right: "→", up: "↑", down: "↓", punch: "K", kick: "L", special: ";", block: "O", ult: "P" }];
function sideCards(entries) {
  $id("cards").innerHTML = entries.map(({ id, slot, cpu }) => {
    const info = BYID[id], m = MOVES[id]; const dk = { "": "", fwd: "<kbd>→</kbd>", down: "<kbd>↓</kbd>", back: "<kbd>←</kbd>" };
    return `<div class="pcard" style="--c:${info.hex}"><h3>${info.name}</h3><div class="who">${cpu ? (info.boss ? "FINAL BOSS" : "OPPONENT") : "YOU"} · ${info.style.toUpperCase()}</div>
    <div class="mv">${cpu ? "" : `
      <span class="k"><kbd>←</kbd><kbd>→</kbd></span><span>Move · <kbd>↑</kbd> jump · <kbd>↓</kbd> crouch</span>
      <span class="k"><kbd>Z</kbd></span><span>Punch · with <kbd>↓</kbd>: uppercut</span>
      <span class="k"><kbd>X</kbd></span><span>Kick · with <kbd>↓</kbd>: sweep</span>
      <span class="k"><kbd>←</kbd></span><span>Hold away from the enemy to block</span><hr>`}
      ${m.specials.map((s) => `<span class="k">${cpu ? "" : dk[s.dir] + "<kbd>Z</kbd>+<kbd>X</kbd>"}</span><span class="sp" data-mv="${slot}:${s.name}">${s.name}</span><span class="sub">${s.desc}</span>`).join("")}
      <span class="k">${cpu ? "" : "<kbd>SPACE</kbd>"}</span><span class="sp ult" data-mv="${slot}:${m.ult.name}">${m.ult.name}</span><span class="sub">${cpu ? "Megaform ultimate." : "Megaform. Fill the meter, then press SPACE up close."}</span>
    </div></div>`; }).join("");
  if (TOUCH) { const c = $id("cards"); c.innerHTML = c.innerHTML.replaceAll("<kbd>Z</kbd>+<kbd>X</kbd>", "<kbd>SP</kbd>").replaceAll("<kbd>Z</kbd>", "<kbd>A</kbd>").replaceAll("<kbd>X</kbd>", "<kbd>B</kbd>").replaceAll("<kbd>SPACE</kbd>", "<kbd>MEGA</kbd>").replaceAll("press SPACE", "press MEGA"); }
}

/* ---------- app state machine ---------- */
const APP = {
  mode: "title", game: null, sel: 0, cursor: [0, 1], locked: [false, false],
  async init() {
    $id("loading").hidden = false; this.view = VIEW; VIEW.init($id("screen")); FX2D.init($id("screen")); loadStages();
    await loadSprites((n, N) => { $id("loading").textContent = `SUITING UP ${n} / ${N}`; });
    makePortraits(); for (const id of Object.keys(MEGA_ART)) megaArt(id);
    this.applySettings(); $id("loading").hidden = true;
    $id("logoPips").innerHTML = ROSTER.map((r) => `<i style="--c:${r.hex}"></i>`).join("");
    initPad(); $id("screen").addEventListener("pointerdown", () => { if (this.mode === "intro") this.toPress(); });
    $id("pauseBtn").addEventListener("click", (e) => { e.currentTarget.blur(); if (this.mode === "fight") this.pause(true); });
    $id("movesBack").addEventListener("click", () => { $id("movesOv").hidden = true; });
    if (TOUCH) { document.querySelector("#press .blinker").textContent = "TAP TO START"; $id("skipHint").textContent = "TAP TO SKIP"; }
    this.buildGrid(); this.bindMenus(); this.afterLoad();
    let last = performance.now(), acc = 0;
    const loop = (now) => { const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now; this.frame(dt); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    const unlock = () => { AUDIO.init(); AUDIO.on = SET.sound; if (AUDIO.ctx && AUDIO.ctx.state === "suspended") AUDIO.ctx.resume(); if (!AUDIO.music && SET.sound) AUDIO.startMusic(this.mode === "fight" ? "fight" : "menu"); };
    addEventListener("keydown", unlock); addEventListener("pointerdown", unlock);
    addEventListener("keydown", (e) => this.key(e));
  },
  applySettings() { $id("screen").classList.toggle("pixel", SET.pixel); $id("scan").classList.toggle("on", SET.scan); AUDIO.on = SET.sound; if (!SET.sound) AUDIO.stopMusic();
    $id("sSound").textContent = SET.sound ? "ON" : "OFF"; $id("sPixel").textContent = SET.pixel ? "ON" : "OFF"; $id("sScan").textContent = SET.scan ? "ON" : "OFF"; },
  screens(name) { ["title", "settings", "sel", "diff", "press", "pause", "results"].forEach((s) => ($id(s).hidden = s !== name)); },
  setMusic(kind) { AUDIO.stopMusic(); if (SET.sound && AUDIO.ctx) AUDIO.startMusic(kind); },
  /* the intro is a pre-rendered movie (see body.html); the rangers finish loading while it plays */
  afterLoad() { if (MOVIE.state === "done") return this.afterMovie(); this.mode = "movie"; this.screens(null); HUD.show(false); SHOW.setVisible(false); INTRO.show(false); MOVIE.onEnd = () => this.afterMovie(); },
  afterMovie() { this.endGame(); HUD.show(false); SHOW.setVisible(false); INTRO.show(true); $id("cards").innerHTML = ""; $id("sideMode").textContent = ""; this.toPress(); this.setMusic("menu"); },
  toMovie() { this.endGame(); this.mode = "movie"; this.screens(null); HUD.show(false); AUDIO.stopMusic(); INTRO.show(false); SHOW.setVisible(false); MOVIE.replay(() => this.afterMovie()); },
  toIntro() { this.endGame(); this.mode = "intro"; this.screens(null); HUD.show(false); SHOW.setVisible(false); INTRO.show(true); INTRO.start(); $id("cards").innerHTML = ""; $id("sideMode").textContent = ""; this.setMusic("menu"); },
  toPress() { this.mode = "press"; this.screens("press"); INTRO.toLogo(); const l = $id("press").querySelector(".logo2"); l.classList.remove("in"); void l.offsetWidth; l.classList.add("in"); AUDIO.sfx("boom"); },
  toTitle() { const fromFight = !!this.game; this.endGame(); this.mode = "title"; this.screens("title"); HUD.show(false); SHOW.setVisible(false); INTRO.show(true); if (INTRO.phase !== "logo") INTRO.toLogo(); this.menuSel("mainList", 0); $id("sideMode").textContent = ""; $id("cards").innerHTML = ""; if (fromFight || !AUDIO.music) this.setMusic("menu"); },
  menuSel(list, i) { const btns = [...$id(list).querySelectorAll(".mbtn")]; this.sel = (i + btns.length) % btns.length; btns.forEach((b, k) => b.classList.toggle("sel", k === this.sel)); this.menuList = list; },
  bindMenus() {
    $id("mainList").addEventListener("click", (e) => { const b = e.target.closest(".mbtn"); if (b) this.mainGo(b.dataset.go); });
    $id("setList").addEventListener("click", (e) => { const b = e.target.closest(".mbtn"); if (b) this.setGo(b.dataset.set); });
    $id("pauseList").addEventListener("click", (e) => { const b = e.target.closest(".mbtn"); if (b) this.pauseGo(b.dataset.p); });
    $id("resList").addEventListener("click", (e) => { const b = e.target.closest(".mbtn"); if (b) this.resGo(b.dataset.r); });
    $id("diffList").addEventListener("click", (e) => { const b = e.target.closest(".mbtn"); if (b) this.diffGo(+b.dataset.d); });
    $id("press").addEventListener("click", () => this.mode === "press" && (AUDIO.sfx("confirm"), this.toTitle()));
  },
  mainGo(go) { AUDIO.sfx("confirm"); if (go === "settings") { this.mode = "settings"; this.screens("settings"); this.menuSel("setList", 0); return; } if (go === "intro") return this.toMovie(); this.gameMode = go; this.toSelect(); },
  diffGo(d) { AUDIO.sfx("confirm"); this.diff = d; const me = this.picks[0]; const pool = ROSTER.filter((x) => x.ready && x.id !== me).map((x) => x.id).sort(() => Math.random() - 0.5).slice(0, TOWER_LEN); this.tower = { list: [...pool, "phage"], i: 0 }; this.picks[1] = this.tower.list[0]; this.startFight(towerStage(0)); },
  setGo(k) { AUDIO.sfx("select"); if (k === "back") return this.toTitle(); SET[k] = !SET[k]; saveSet(); this.applySettings(); if (k === "sound" && SET.sound) { AUDIO.init(); this.setMusic("menu"); } },
  /* ---------- select ---------- */
  buildGrid() { $id("grid").innerHTML = ROSTER.map((r, i) => `<div class="tile ${r.ready ? "" : "lock"}" data-i="${i}" style="--c:${r.hex};background-image:url(${PORTRAITS[r.id]})">${r.ready ? "" : '<div class="soon">SOON</div>'}</div>`).join("");
    $id("grid").addEventListener("click", (e) => { const t = e.target.closest(".tile"); if (!t || this.locked[0]) return; const i = +t.dataset.i; if (this.cursor[0] !== i) { this.cursor[0] = i; AUDIO.sfx("move"); this.drawSel(); } else this.lockPick(0); }); },
  toSelect() { SHOW.parts.clear(); SHOW.t = 0; this.endGame(); this.mode = "select"; this.screens("sel"); HUD.show(false); INTRO.show(false); SHOW.setVisible(true); this.locked = [false, false]; this.cursor = [0, 1];
    $id("sideMode").textContent = this.gameMode === "training" ? "TRAINING" : "SINGLE PLAYER"; this.drawSel(); },
  drawSel() {
    document.querySelectorAll(".tile").forEach((t, i) => { t.querySelectorAll(".cur").forEach((c) => c.remove()); if (this.cursor[0] === i) t.insertAdjacentHTML("beforeend", '<div class="cur p1"><b>YOU</b></div>'); });
    const a = ROSTER[this.cursor[0]]; SHOW.picks = [a.id, null];
    const el = $id("selN0"); el.style.setProperty("--c", a.hex); el.innerHTML = `${a.name.toUpperCase()}<small>${a.color.toUpperCase()} · ${a.style.toUpperCase()}${this.locked[0] ? " · READY" : ""}</small>`;
    const er = $id("selN1"); er.style.setProperty("--c", a.hex); er.innerHTML = `<small>MEGAFORM</small>${MOVES[a.id].ult.name.toUpperCase()}`;
    $id("selHint").textContent = TOUCH ? "TAP A RANGER TO VIEW · TAP AGAIN TO LOCK IN" : "CLICK OR ARROWS TO VIEW · CLICK AGAIN, ENTER OR Z TO LOCK IN · ESC: BACK";
    sideCards([{ id: a.id, slot: 0 }]);
  },
  lockPick(p) {
    const r = ROSTER[this.cursor[0]]; this.locked[0] = true; AUDIO.sfx("confirm"); SHOW.lockFx(r.id); AUDIO.sfx("boom"); this.drawSel();
    setTimeout(() => { if (this.mode !== "select") return; this.picks = [r.id, null];
      if (this.gameMode === "training") { const o = ROSTER.filter((x) => x.id !== r.id); this.picks[1] = o[(Math.random() * o.length) | 0].id; this.tower = null; this.startFight("training"); }
      else { this.mode = "diff"; this.screens("diff"); this.menuSel("diffList", 1); } }, 600);
  },
  buildStages() { $id("stages").innerHTML = STAGE_LIST.map((s, i) => `<button class="stg ${s.ready ? "" : "lock"}" data-i="${i}" style="--c:${s.col}">${s.ready ? "" : '<span class="soon">SOON</span>'}<b>${s.name}</b><small>${s.sub}</small></button>`).join("");
    $id("stages").addEventListener("click", (e) => { const b = e.target.closest(".stg"); if (!b) return; this.stageI = +b.dataset.i; this.drawStages(); this.pickStage(); }); },
  toStages() { this.mode = "stages"; this.screens("stagesel"); this.stageI = 0; this.drawStages(); },
  drawStages() { document.querySelectorAll(".stg").forEach((b, i) => b.classList.toggle("sel", i === this.stageI)); },
  pickStage() { const s = STAGE_LIST[this.stageI]; if (!s.ready) { AUDIO.sfx("block"); return; } AUDIO.sfx("confirm"); this.startFight(s.id); },
  /* ---------- fight ---------- */
  startFight(stage) {
    this.endGame(); SHOW.setVisible(false); this.screens(null); this.mode = "fight"; this.lastStage = stage;
    INTRO.show(false); SHOW.parts.clear(); const tr = this.gameMode === "training", D = DIFFS[this.diff ?? 1], boss = this.picks[1] === "phage", floor = this.tower ? this.tower.i : 0;
    const c1 = new PlayerCtrl(), c2 = tr ? (this.dummy = new DummyCtrl()) : new AICtrl(Math.min(0.95, D.ai + floor * (this.diff ? 0.02 : 0) + (boss && this.diff ? 0.08 : 0)));
    this.game = new Game(this.view, { p1: this.picks[0], p2: this.picks[1], c1, c2, stage });
    this.game.dmgMul = tr ? [1, 1] : [D.you * (boss ? 0.85 : 1), D.cpu * (boss ? 1.2 : 1)];
    if (tr) { this.game.training = true; this.game.timer = 99; }
    HUD.setup(this.game); HUD.show(true); $id("announce").innerHTML = "";
    sideCards([{ id: this.picks[0], slot: 0 }]);
    $id("sideMode").textContent = tr ? "TRAINING" : `TOWER ${floor + 1}/${this.tower.list.length} · ${D.name}`; this.acc = 0; this.setMusic("fight");
  },
  endGame() { if (this.game) { this.game.dispose(); this.game = null; } $id("announce").innerHTML = ""; $id("pops").innerHTML = ""; this.view && (this.view.impact = 0); },
  pause(on) { if (this.mode !== "fight" && this.mode !== "paused") return; $id("movesOv").hidden = true; this.mode = on ? "paused" : "fight"; this.screens(on ? "pause" : null); $id("dumMode").textContent = this.dummy ? this.dummy.mode.toUpperCase() : "—"; $id("pauseList").querySelector('[data-p="dummy"]').hidden = this.gameMode !== "training"; if (on) this.menuSel("pauseList", 0); },
  pauseGo(p) { AUDIO.sfx("confirm"); if (p === "resume") return this.pause(false); if (p === "moves") { $id("movesIn").innerHTML = $id("cards").innerHTML; $id("movesOv").hidden = false; return; } if (p === "dummy") { const m = ["stand", "block", "crouch"]; this.dummy.mode = m[(m.indexOf(this.dummy.mode) + 1) % 3]; $id("dumMode").textContent = this.dummy.mode.toUpperCase(); return; } if (p === "select") return this.toSelect(); this.toTitle(); },
  showResults() {
    const g = this.game, w = g.f[g.result.winner], won = g.result.winner === 0, T = this.tower;
    this.mode = "results"; this.screens("results"); $id("resT").style.color = w.info.hex; let btns = "";
    if (!T) { $id("resT").textContent = won ? "VICTORY!" : "DEFEAT"; $id("resP").textContent = `${w.info.name} wins. ${MOVES[w.id].fact}`; btns = `<button class="mbtn" data-r="again">REMATCH</button>`; $id("towerRow").innerHTML = ""; }
    else {
      const last = T.i === T.list.length - 1; const done = won ? T.i + 1 : T.i;
      $id("towerRow").innerHTML = T.list.map((id, i) => `<i class="${i < done ? "beat" : i === done ? "next" : ""}${id === "phage" ? " boss" : ""}" style="--c:${BYID[id].hex};background-image:url(${PORTRAITS[id]})"></i>`).join("");
      if (won && last) { $id("resT").textContent = "THE CELL IS SAFE!"; $id("resT").style.color = "#ffd21f"; $id("resP").textContent = `${g.f[0].info.name} cleared the tower on ${DIFFS[this.diff].name} and stopped the Phage before it could inject its DNA. ${MOVES.phage.fact}`; btns = `<button class="mbtn" data-r="select">PLAY AGAIN</button>`; }
      else if (won) { const nx = BYID[T.list[T.i + 1]]; $id("resT").textContent = "VICTORY!"; $id("resP").textContent = (nx.boss ? "Final boss: " : "Next opponent: ") + nx.name + ". " + MOVES[nx.id].fact; btns = `<button class="mbtn" data-r="next">${nx.boss ? "FACE THE PHAGE" : "NEXT FIGHT"}</button>`; }
      else { $id("resT").textContent = "DEFEAT"; $id("resP").textContent = `${w.info.name} wins. ${MOVES[w.id].fact}`; btns = `<button class="mbtn" data-r="again">TRY AGAIN</button>`; }
    }
    $id("resList").innerHTML = btns + `<button class="mbtn" data-r="select">CHARACTER SELECT</button><button class="mbtn" data-r="menu">MAIN MENU</button>`; this.menuSel("resList", 0);
  },
  resGo(r) { AUDIO.sfx("confirm"); if (r === "next") { this.tower.i++; this.picks[1] = this.tower.list[this.tower.i]; return this.startFight(towerStage(this.tower.i, this.picks[1])); } if (r === "again") return this.startFight(this.lastStage); if (r === "select") return this.toSelect(); this.toTitle(); },
  /* ---------- keyboard navigation for menus ---------- */
  key(e) {
    const c = e.code; const up = c === "ArrowUp", dn = c === "ArrowDown", lf = c === "ArrowLeft", rt = c === "ArrowRight";
    const ok = c === "Enter" || c === "KeyZ" || c === "Space", back = c === "Escape" || c === "Backspace";
    if (this.mode === "movie") return;
    if (this.mode === "intro") { if (!e.repeat) this.toPress(); e.preventDefault(); return; }
    if (this.mode === "press") { if (ok && !e.repeat) { AUDIO.sfx("confirm"); this.toTitle(); } e.preventDefault(); return; }
    if (this.mode === "fight") { if (c === "Escape" || c === "KeyP" || (c === "Enter" && this.game && this.game.phase !== "intro")) { if (!e.repeat) this.pause(true); } else if (this.game && this.game.phase === "intro" && (c === "Enter")) this.game.skipIntro = true; return; }
    if (this.mode === "paused" && !$id("movesOv").hidden) { if (back || ok) $id("movesOv").hidden = true; return; }
    if (this.mode === "paused" && (back || c === "KeyP")) return this.pause(false);
    if (["title", "settings", "paused", "results", "diff"].includes(this.mode)) {
      if (up || dn) { this.menuSel(this.menuList, this.sel + (dn ? 1 : -1)); AUDIO.sfx("move"); e.preventDefault(); }
      else if (ok && !e.repeat) { const b = $id(this.menuList).querySelectorAll(".mbtn")[this.sel]; if (b) b.click(); e.preventDefault(); }
      else if (back && this.mode === "settings") this.toTitle(); else if (back && this.mode === "diff") this.toSelect(); else if (back && this.mode === "title") this.toPress();
      return;
    }
    if (this.mode === "select") {
      if (back) return this.toTitle();
      if ((lf || rt || up || dn) && !this.locked[0]) { let i = this.cursor[0]; const col = i % 7, row = Math.floor(i / 7); if (lf) i = row * 7 + ((col + 6) % 7); if (rt) i = row * 7 + ((col + 1) % 7); if (up || dn) i = ((row + 1) % 2) * 7 + col; this.cursor[0] = i; AUDIO.sfx("move"); this.drawSel(); e.preventDefault(); }
      if (ok && !e.repeat && !this.locked[0]) this.lockPick(0);
    }
  },
  debugStep(n, dt = DT) { const g = this.game; for (let i = 0; i < n; i++) { if (g.phase === "over") break; g.step(); g.render(DT); } HUD.update(g); this.view.impact = Math.max(0, this.view.impact - (n - 1) * DT); this.drawFight(dt); if (g.phase === "over" && this.mode === "fight") this.showResults(); },
  drawFight(dt) { VIEW.begin(dt); this.game.draw(dt); VIEW.end(dt); },
  frame(dt) {
    if (window.__hold || this.mode === "movie") return;
    if (this.mode === "fight" && this.game) {
      const g = this.game; this.acc += dt * g.slow; let n = 0; while (this.acc >= DT && n < 5) { g.step(); this.acc -= DT; n++; }
      if (TOUCH) { const mb = document.querySelector(".ab.mega"); const rd = g.f[0].meter >= 100; if (mb._r !== rd) { mb._r = rd; mb.classList.toggle("ready", rd); } }
      if (g.training) { g.timer = 99; g.f[0].meter = 100; g.f.forEach((f) => { if (f.slot === 1 && f.bars === 1 && f.hp < 30 && ["idle", "down", "getup"].includes(f.state)) { f.bars = 2; f.hp = BAR_HP; } }); }
      g.render(dt, Math.min(1, this.acc / DT)); HUD.update(g); this.drawFight(dt);
      if (g.phase === "over") this.showResults();
      return;
    }
    if (this.mode === "paused" || this.mode === "results") { if (this.game) { this.game.render(0, Math.min(1, this.acc / DT)); this.drawFight(0); } return; }
    if (["intro", "press", "title", "settings"].includes(this.mode)) { INTRO.update(dt); if (this.mode === "intro" && INTRO.phase === "logo") this.toPress(); } else SHOW.update(dt, "select");
  },
};

/* tower fights move through the Cell Rescue districts; the Phage waits in the archive */
const TOWER_STAGES = ["environment", "membranes", "archive"];
function towerStage(i, opp) { return opp === "phage" ? "archive" : TOWER_STAGES[i % TOWER_STAGES.length]; }
