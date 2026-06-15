// -----------------------------
// Config ruoli (nomi + descrizioni)
// -----------------------------
const ROLE_INFO = {
  "Sabotatore": { desc: "Sei un Sabotatore. Di notte scegliete insieme un bersaglio.", badge: "Team notte" },
  "Custode": { desc: "Sei un Custode. Di giorno discuti e vota chi sospetti.", badge: "Team giorno" },
  "Sentinella": { desc: "Ogni notte puoi controllare l’allineamento di 1 persona.", badge: "Speciale" },
  "Tecnico": { desc: "1 volta a partita puoi bloccare la notte: nessuna eliminazione.", badge: "Speciale" },
  "Portavoce": { desc: "Se vieni eliminato, lasci un ultimo messaggio (max 10 parole).", badge: "Speciale" },
  "Disturbatore": { desc: "Neutrale: vinci se sopravvivi fino alla fine o se vieni votato entro il Giorno 2.", badge: "Neutrale" }
};

// -----------------------------
// Helpers
// -----------------------------
function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sabotageCount(n) {
  return (n <= 10) ? 2 : 3;
}

function specialsFor(n, chaosEnabled) {
  const s = [];
  if (n >= 5) s.push("Sentinella");
  if (n >= 7) s.push("Tecnico");
  if (n >= 9) s.push("Portavoce");
  if (chaosEnabled && n >= 13) s.push("Disturbatore");
  return s;
}

function buildRoles(n, chaosEnabled) {
  const roles = [];
  const sab = sabotageCount(n);
  for (let i = 0; i < sab; i++) roles.push("Sabotatore");
  roles.push(...specialsFor(n, chaosEnabled));
  while (roles.length < n) roles.push("Custode");
  fisherYatesShuffle(roles);
  return roles;
}

function compositionText(n, chaosEnabled) {
  const sab = sabotageCount(n);
  const speciali = specialsFor(n, chaosEnabled);
  const custodi = n - sab - speciali.length;
  return `Giocatori: ${n}
- Sabotatori: ${sab}
- Custodi: ${custodi}
- Speciali: ${speciali.length ? speciali.join(", ") : "nessuno"}`;
}

function flashScreen() {
  const el = document.getElementById("flash");
  el.classList.add("on");
  setTimeout(() => el.classList.remove("on"), 140);
}

// -----------------------------
// State
// -----------------------------
let state = {
  n: 5,
  chaos: false,
  roles: [],
  current: 0,
  revealed: false
};

// -----------------------------
// DOM refs
// -----------------------------
const screenSetup = document.getElementById("screen-setup");
const screenAssign = document.getElementById("screen-assign");
const screenDone  = document.getElementById("screen-done");
const screenGame  = document.getElementById("screen-game");

const selPlayers = document.getElementById("players");
const chkChaos = document.getElementById("chaos");

const btnGenerate = document.getElementById("btn-generate");
const btnAbout = document.getElementById("btn-about");

const previewBox = document.getElementById("preview");
const previewText = document.getElementById("preview-text");

const assignTitle = document.getElementById("assign-title");
const assignArea = document.getElementById("assign-area");
const btnNext = document.getElementById("btn-next");
const btnRestart = document.getElementById("btn-restart");

const summary = document.getElementById("summary");
const btnNew = document.getElementById("btn-new");
const btnBack = document.getElementById("btn-back");

const btnStartGame = document.getElementById("btn-start-game");
const btnAudioEnable = document.getElementById("btn-audio-enable");
const chkTtsEnabled = document.getElementById("tts-enabled");
const chkSfxEnabled = document.getElementById("sfx-enabled");
const chkStormEnabled = document.getElementById("storm-enabled");
const phaseBox = document.getElementById("phase-box");
const phaseTitle = document.getElementById("phase-title");
const phaseSub = document.getElementById("phase-sub");
const btnPhaseStart = document.getElementById("btn-phase-start");
const btnPhaseNext = document.getElementById("btn-phase-next");
const btnPhaseRepeat = document.getElementById("btn-phase-repeat");
const btnExitGame = document.getElementById("btn-exit-game");
const sfxNight = document.getElementById("sfx-night");
const sfxDay = document.getElementById("sfx-day");
const sfxVote = document.getElementById("sfx-vote");

// -----------------------------
// Init select
// -----------------------------
for (let i = 5; i <= 15; i++) {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = String(i);
  selPlayers.appendChild(opt);
}
selPlayers.value = "5";

// -----------------------------
// Screen utils
// -----------------------------
function showScreen(which) {
  screenSetup.style.display = (which === "setup") ? "" : "none";
  screenAssign.style.display = (which === "assign") ? "" : "none";
  screenDone.style.display  = (which === "done")  ? "" : "none";
  screenGame.style.display  = (which === "game")  ? "" : "none";
}

// -----------------------------
// Assegnazione ruoli UI
// -----------------------------
function renderAssign() {
  const i = state.current;
  assignTitle.textContent = `Giocatore ${i + 1}`;
  btnNext.disabled = !state.revealed;

  assignArea.innerHTML = "";

  if (!state.revealed) {
    const cover = document.createElement("div");
    cover.className = "cover";
    cover.setAttribute("role", "button");
    cover.setAttribute("aria-label", "Tocca per vedere il tuo ruolo");
    cover.innerHTML = `
      <div>
        <div class="big">Tocca per vedere il tuo ruolo</div>
        <div class="hint">Assicurati che nessuno stia guardando 👀</div>
      </div>
    `;
    cover.addEventListener("click", () => {
      state.revealed = true;
      renderAssign();
    });
    assignArea.appendChild(cover);
  } else {
    const role = state.roles[i];
    const info = ROLE_INFO[role] || { desc: "", badge: "" };

    const slug = role.toLowerCase();

    const box = document.createElement("div");
    box.className = "roleBox";
    box.dataset.role = slug;
    box.innerHTML = `
      <img class="roleArt" src="img/${slug}.svg" alt="${role}"
           onerror="this.style.display='none'" />
      <div>
        <p class="roleName">${role}</p>
        <div class="badge">${info.badge}</div>
      </div>
      <p class="roleDesc">${info.desc}</p>
      <p class="small">Quando hai finito, passa il dispositivo.</p>
    `;
    assignArea.appendChild(box);
  }
}

function startAssignment() {
  state.n = parseInt(selPlayers.value, 10);
  state.chaos = chkChaos.checked;

  state.roles = buildRoles(state.n, state.chaos);
  state.current = 0;
  state.revealed = false;

  renderAssign();
  showScreen("assign");
}

function goNextPlayer() {
  if (!state.revealed) return;

  flashScreen();
  state.revealed = false;
  state.current++;

  if (state.current >= state.n) {
    const lines = state.roles.map((r, idx) => `Giocatore ${idx + 1}: ${r}`);
    summary.textContent = lines.join("\n");
    showScreen("done");
  } else {
    renderAssign();
  }
}

// -----------------------------
// Narratore (giorno/notte/voto)
// -----------------------------
let audioUnlocked = false;

const PHASES = [
  {
    key: "night",
    title: "Notte",
    sub: "Passa il dispositivo in centro e fate silenzio.",
    speak: `Scende la notte. Tutti chiudono gli occhi.
Sabotatori, scegliete il vostro bersaglio.
Sentinella, scegli una persona da controllare.
Tecnico, se vuoi, puoi bloccare la notte.`,
    sfx: "night"
  },
  {
    key: "day",
    title: "Giorno",
    sub: "Discussione libera (consiglio 3–6 minuti).",
    speak: `Arriva il giorno. Il gruppo si riunisce.
Parlate, confrontatevi e cercate le contraddizioni.
Quando siete pronti, passeremo alla votazione.`,
    sfx: "day"
  },
  {
    key: "vote",
    title: "Votazione",
    sub: "Conta fino a 3 e tutti indicano un nome.",
    speak: `È il momento della votazione.
Al tre, ognuno indica la persona che vuole eliminare.
Uno... due... tre!`,
    sfx: "vote"
  }
];

let gameState = {
  phaseIndex: -1,
  lastSpoken: ""
};

function stopAllAudio() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  [sfxNight, sfxDay, sfxVote].forEach(a => {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (_) {}
  });
}

function playSfx(which) {
  if (!chkSfxEnabled.checked) return;
  const map = { night: sfxNight, day: sfxDay, vote: sfxVote };
  const a = map[which];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}

function pickItalianVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => (v.lang || "").toLowerCase().startsWith("it"))
      || voices.find(v => (v.lang || "").toLowerCase().startsWith("en"))
      || voices[0]
      || null;
}

function speak(text) {
  if (!chkTtsEnabled.checked) return;
  if (!("speechSynthesis" in window)) return;

  stopAllAudio();

  const u = new SpeechSynthesisUtterance(text);
  const voice = pickItalianVoice();
  if (voice) u.voice = voice;

  u.lang = (voice && voice.lang) ? voice.lang : "it-IT";
  u.rate = 1.0;
  u.pitch = 1.0;
  u.volume = 1.0;

  // Abbassa il temporale durante la narrazione, poi lo ripristina.
  u.onstart = () => stormDuck(true);
  u.onend = () => stormDuck(false);
  u.onerror = () => stormDuck(false);

  gameState.lastSpoken = text;
  window.speechSynthesis.speak(u);
}

function renderPhase() {
  if (gameState.phaseIndex < 0) {
    phaseTitle.textContent = "—";
    phaseSub.textContent = "Premi “Inizia”.";
    phaseBox.dataset.phase = "";
    return;
  }
  const p = PHASES[gameState.phaseIndex];
  phaseTitle.textContent = p.title;
  phaseSub.textContent = p.sub;
  phaseBox.dataset.phase = p.key;
}

function goToNextPhase() {
  gameState.phaseIndex = (gameState.phaseIndex + 1) % PHASES.length;
  const p = PHASES[gameState.phaseIndex];
  renderPhase();
  updateStormForPhase(p);
  playSfx(p.sfx);
  speak(p.speak);
}

function repeatPhaseAudio() {
  if (gameState.phaseIndex < 0) return;
  const p = PHASES[gameState.phaseIndex];
  playSfx(p.sfx);
  speak(p.speak);
}

// -----------------------------
// Sottofondo temporale (Web Audio, procedurale)
// Letto continuo di pioggia/vento/mare + tuoni casuali.
// Cambia "umore" tra notte (intenso) e giorno (calmo).
// -----------------------------
const STORM_FULL = 0.9; // livello del master a regime

// Preset per fase: pioggia, vento, cadenza e intensità dei tuoni.
const STORM_MOODS = {
  night: { rain: 0.55, rainHP: 800,  rainLP: 7800, wind: 0.34, windLP: 360, thMin: 5,  thMax: 14, thGain: 0.95, thLP: 360 },
  day:   { rain: 0.24, rainHP: 1500, rainLP: 6400, wind: 0.16, windLP: 300, thMin: 14, thMax: 30, thGain: 0.45, thLP: 820 }
};

// Mappa la fase di gioco sull'umore del temporale.
function phaseMood(key) {
  return (key === "night") ? "night" : "day"; // il voto avviene di giorno
}

let storm = null;

function makeNoise(ctx, seconds, type) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  if (type === "brown") {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  } else {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function buildStorm() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();

  // master -> compressore (evita il clipping coi tuoni) -> uscita
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);

  // Pioggia: rumore bianco filtrato.
  const rainSrc = ctx.createBufferSource();
  rainSrc.buffer = makeNoise(ctx, 2, "white");
  rainSrc.loop = true;
  const rainHP = ctx.createBiquadFilter(); rainHP.type = "highpass"; rainHP.frequency.value = 1000;
  const rainLP = ctx.createBiquadFilter(); rainLP.type = "lowpass";  rainLP.frequency.value = 7000;
  const rainGain = ctx.createGain(); rainGain.gain.value = 0.3;
  rainSrc.connect(rainHP); rainHP.connect(rainLP); rainLP.connect(rainGain); rainGain.connect(master);

  // Vento/mare/rombo: rumore bruno passa-basso.
  const windSrc = ctx.createBufferSource();
  windSrc.buffer = makeNoise(ctx, 4, "brown");
  windSrc.loop = true;
  const windLP = ctx.createBiquadFilter(); windLP.type = "lowpass"; windLP.frequency.value = 340;
  const windGain = ctx.createGain(); windGain.gain.value = 0.2;
  windSrc.connect(windLP); windLP.connect(windGain); windGain.connect(master);

  // Raffiche: LFO lento che modula il guadagno del vento.
  const gust = ctx.createOscillator(); gust.type = "sine"; gust.frequency.value = 0.08;
  const gustDepth = ctx.createGain(); gustDepth.gain.value = 0.08;
  gust.connect(gustDepth); gustDepth.connect(windGain.gain);

  rainSrc.start(); windSrc.start(); gust.start();

  return {
    ctx, master,
    rainHP, rainLP, rainGain,
    windLP, windGain,
    mood: "night", running: false, thunderTimer: null
  };
}

function stormActive() {
  return !!chkStormEnabled && chkStormEnabled.checked;
}

// Un singolo tuono: raffica di rumore passa-basso con coda di rombo.
function stormThunder(gainPeak, lp) {
  if (!storm) return;
  const ctx = storm.ctx;
  const now = ctx.currentTime;
  const dur = 1.6 + Math.random() * 1.9;

  const src = ctx.createBufferSource();
  src.buffer = makeNoise(ctx, Math.ceil(dur) + 1, "white");

  const lpf = ctx.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.setValueAtTime(lp * 1.8, now);
  lpf.frequency.exponentialRampToValueAtTime(Math.max(70, lp * 0.4), now + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gainPeak, now + 0.05); // schiocco
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);    // rombo che svanisce

  src.connect(lpf); lpf.connect(g); g.connect(storm.master);
  src.start(now);
  src.stop(now + dur + 0.1);
}

function stormSchedule() {
  if (!storm || !storm.running) return;
  const m = STORM_MOODS[storm.mood] || STORM_MOODS.night;
  const wait = (m.thMin + Math.random() * (m.thMax - m.thMin)) * 1000;
  storm.thunderTimer = setTimeout(() => {
    if (storm && storm.running && stormActive()) {
      stormThunder(m.thGain * (0.7 + Math.random() * 0.5), m.thLP);
    }
    stormSchedule();
  }, wait);
}

function applyStormMood(mood, ramp) {
  if (!storm) return;
  storm.mood = mood;
  const m = STORM_MOODS[mood] || STORM_MOODS.night;
  const ctx = storm.ctx;
  const now = ctx.currentTime;
  const r = (typeof ramp === "number") ? ramp : 2.5;
  const set = (param, val) => {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(val, now + r);
  };
  set(storm.rainGain.gain, m.rain);
  set(storm.rainHP.frequency, m.rainHP);
  set(storm.rainLP.frequency, m.rainLP);
  set(storm.windGain.gain, m.wind);
  set(storm.windLP.frequency, m.windLP);
  if (storm.running) {
    if (storm.thunderTimer) { clearTimeout(storm.thunderTimer); storm.thunderTimer = null; }
    stormSchedule();
  }
}

function startStorm() {
  if (!stormActive()) return;
  if (!storm) storm = buildStorm();
  if (!storm) return;
  if (storm.ctx.state === "suspended") storm.ctx.resume();

  const mood = (gameState.phaseIndex >= 0)
    ? phaseMood(PHASES[gameState.phaseIndex].key)
    : "night";

  storm.running = true;
  applyStormMood(mood, 0.8);

  const now = storm.ctx.currentTime;
  storm.master.gain.cancelScheduledValues(now);
  storm.master.gain.setValueAtTime(Math.max(0.0001, storm.master.gain.value), now);
  storm.master.gain.linearRampToValueAtTime(STORM_FULL, now + 2.0);

  if (!storm.thunderTimer) stormSchedule();
}

function stopStorm(fade) {
  if (!storm) return;
  const now = storm.ctx.currentTime;
  const f = (typeof fade === "number") ? fade : 1.2;
  storm.master.gain.cancelScheduledValues(now);
  storm.master.gain.setValueAtTime(Math.max(0.0001, storm.master.gain.value), now);
  storm.master.gain.linearRampToValueAtTime(0.0001, now + f);
  storm.running = false;
  if (storm.thunderTimer) { clearTimeout(storm.thunderTimer); storm.thunderTimer = null; }
}

// Abbassa il temporale mentre parla il narratore (ducking).
function stormDuck(on) {
  if (!storm || !storm.running) return;
  const now = storm.ctx.currentTime;
  const target = on ? 0.35 : STORM_FULL;
  storm.master.gain.cancelScheduledValues(now);
  storm.master.gain.setValueAtTime(Math.max(0.0001, storm.master.gain.value), now);
  storm.master.gain.linearRampToValueAtTime(target, now + 0.35);
}

// Aggiorna il temporale a ogni cambio di fase.
function updateStormForPhase(p) {
  if (!storm || !storm.running) return;
  applyStormMood(phaseMood(p.key));
  if (p.key === "vote") {
    // stoccata sulla votazione
    stormThunder(1.0, 320);
  }
}

// -----------------------------
// Events
// -----------------------------
btnGenerate.addEventListener("click", startAssignment);

btnAbout.addEventListener("click", () => {
  const n = parseInt(selPlayers.value, 10);
  const chaosEnabled = chkChaos.checked;
  previewText.textContent = compositionText(n, chaosEnabled);
  previewBox.style.display = (previewBox.style.display === "none") ? "" : "none";
});

selPlayers.addEventListener("change", () => {
  if (previewBox.style.display !== "none") {
    previewText.textContent = compositionText(parseInt(selPlayers.value, 10), chkChaos.checked);
  }
});

chkChaos.addEventListener("change", () => {
  if (previewBox.style.display !== "none") {
    previewText.textContent = compositionText(parseInt(selPlayers.value, 10), chkChaos.checked);
  }
});

btnNext.addEventListener("click", goNextPlayer);

btnRestart.addEventListener("click", () => {
  state.current = 0;
  state.revealed = false;
  renderAssign();
});

btnNew.addEventListener("click", () => {
  selPlayers.value = String(state.n);
  chkChaos.checked = state.chaos;
  startAssignment();
});

btnBack.addEventListener("click", () => showScreen("setup"));

// Tasti: spazio/enter
document.addEventListener("keydown", (e) => {
  if (screenAssign.style.display !== "none") {
    if (!state.revealed && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      state.revealed = true;
      renderAssign();
    } else if (state.revealed && (e.key === "Enter")) {
      e.preventDefault();
      goNextPlayer();
    }
  }
});

// Entra nel narratore
btnStartGame.addEventListener("click", () => {
  stopAllAudio();
  gameState.phaseIndex = -1;
  renderPhase();
  showScreen("game");
});

// Abilita audio (necessario su mobile)
btnAudioEnable.addEventListener("click", () => {
  audioUnlocked = true;
  startStorm();
  speak("Audio abilitato. Possiamo iniziare.");
  playSfx("day");
});

// Toggle sottofondo temporale
chkStormEnabled.addEventListener("change", () => {
  if (chkStormEnabled.checked) {
    if (audioUnlocked) startStorm();
  } else {
    stopStorm();
  }
});

// Controlli fase
btnPhaseStart.addEventListener("click", () => {
  gameState.phaseIndex = -1;
  goToNextPhase();
});

btnPhaseNext.addEventListener("click", () => goToNextPhase());
btnPhaseRepeat.addEventListener("click", () => repeatPhaseAudio());

btnExitGame.addEventListener("click", () => {
  stopAllAudio();
  stopStorm();
  showScreen("done");
});

// iOS/Safari: le voci possono arrivare dopo un po'.
// Rinfresca lista voci quando disponibili.
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => { /* trigger per caricare voci */ };
}

// Start
showScreen("setup");
