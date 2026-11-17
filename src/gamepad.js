/* ================= Game controllers (Xbox, PlayStation, Switch Pro, any "standard" pad) =================
   Browsers hide controllers until a button is pressed, then report them through the Gamepad API.
   We poll every frame. Nothing needs switching on: the keyboard and the controller work side by side,
   and the on-screen button hints follow whichever one was used last.

   Fight:  stick / d-pad move · A punch · B kick · X special (= punch+kick) · Y, RB or RT Megaform
           LB or LT also does a special · Start (Menu) pauses
   Menus:  stick / d-pad choose · A select · B back · Start select */
const PAD = (() => {
  // Edge on Xbox: ask for raw controller input instead of the browsing cursor (ignored elsewhere)
  try { navigator.gamepadInputEmulation = "gamepad"; } catch (_) {}
  const B = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  const DIRS = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
  const HOLD = { punch: "PadPunch", kick: "PadKick", special: "PadSpecial", ult: "PadUlt" };
  let prev = {}, dirPrev = {}, repeatAt = {}, active = false, index = -1;
  const S = { connected: false, active: false, name: "" };

  const btn = (gp, i) => { const b = gp.buttons[i]; return !!b && (b.pressed || b.value > 0.5); };
  const send = (code) => { // a full key press, for menus, the intro movie and pausing
    const key = { Enter: "Enter", Escape: "Escape", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight" }[code] || code;
    dispatchEvent(new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true }));
    dispatchEvent(new KeyboardEvent("keyup", { code, key, bubbles: true, cancelable: true }));
  };
  function setUsing(on) {
    if (active === on) return; active = S.active = on;
    document.body.classList.toggle("pad", on);
    if (typeof refreshHints === "function") refreshHints();
  }
  addEventListener("gamepadconnected", (e) => { S.connected = true; S.name = e.gamepad.id; if (typeof HUD !== "undefined" && HUD.toast) try { HUD.toast(0, "CONTROLLER CONNECTED"); } catch (_) {} });
  addEventListener("gamepaddisconnected", () => { S.connected = !!pick(); for (const k of Object.values(DIRS).concat(Object.values(HOLD))) KEYS.delete(k); });
  // keyboard or mouse use hands the hints back to the keyboard
  addEventListener("keydown", (e) => { if (e.isTrusted) setUsing(false); }, true);
  addEventListener("pointerdown", (e) => { if (e.isTrusted && e.pointerType === "mouse") setUsing(false); }, true);

  function pick() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    if (index >= 0 && list[index] && list[index].connected) return list[index];
    for (const gp of list) if (gp && gp.connected && gp.buttons.some((b) => b.pressed)) { index = gp.index; return gp; }
    for (const gp of list) if (gp && gp.connected) return gp;
    return null;
  }
  function poll() {
    const gp = pick(); if (!gp) return;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, dz = 0.45;
    const dir = { up: btn(gp, B.UP) || ay < -dz, down: btn(gp, B.DOWN) || ay > dz, left: btn(gp, B.LEFT) || ax < -dz, right: btn(gp, B.RIGHT) || ax > dz };
    const now = {}; for (const k in B) now[k] = btn(gp, B[k]);
    const anyNow = Object.values(now).some(Boolean) || Object.values(dir).some(Boolean);
    if (anyNow) setUsing(true);
    if (!active) { prev = now; dirPrev = dir; return; }
    const edge = (k) => now[k] && !prev[k];
    const mode = typeof APP !== "undefined" ? APP.mode : "movie";
    const fighting = mode === "fight";

    // held directions drive the fighter
    for (const k in DIRS) { if (dir[k]) KEYS.add(DIRS[k]); else if (dirPrev[k]) KEYS.delete(DIRS[k]); }
    // held buttons for the fighter (read by PlayerCtrl)
    const hold = { punch: now.A, kick: now.B, special: now.X || now.LB || now.LT, ult: now.Y || now.RB || now.RT };
    for (const k in HOLD) { if (hold[k] && fighting) KEYS.add(HOLD[k]); else KEYS.delete(HOLD[k]); }

    if (fighting) { if (edge("START") || edge("VIEW")) send("Escape"); }
    else {
      // menus: one press per tap, auto-repeat when a direction is held
      const t = performance.now();
      for (const k in DIRS) {
        if (dir[k] && !dirPrev[k]) { send(DIRS[k]); repeatAt[k] = t + 380; }
        else if (dir[k] && t >= repeatAt[k]) { send(DIRS[k]); repeatAt[k] = t + 140; }
      }
      if (edge("A") || edge("START")) send("Enter");
      else if (edge("B") || edge("VIEW")) send("Escape");
      else if (mode === "intro" || mode === "movie") { if (edge("X") || edge("Y")) send("Enter"); }
    }
    prev = now; dirPrev = dir;
  }
  (function loop() { try { poll(); } catch (_) {} requestAnimationFrame(loop); })();
  // a short buzz when you land or take a hit (pads that support it)
  S.rumble = (strong, ms = 120) => { if (!active || strong <= 0) return; const gp = pick(); const v = gp && gp.vibrationActuator; if (!v || !v.playEffect) return;
    try { v.playEffect("dual-rumble", { duration: ms, strongMagnitude: Math.min(1, strong), weakMagnitude: Math.min(1, strong * 0.7) }).catch(() => {}); } catch (_) {} };
  return S;
})();
