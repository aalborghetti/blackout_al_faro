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

    const box = document.createElement("div");
    box.className = "roleBox";
    box.innerHTML = `
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

  gameState.lastSpoken = text;
  window.speechSynthesis.speak(u);
}

function renderPhase() {
  if (gameState.phaseIndex < 0) {
    phaseTitle.textContent = "—";
    phaseSub.textContent = "Premi “Inizia”.";
    return;
  }
  const p = PHASES[gameState.phaseIndex];
  phaseTitle.textContent = p.title;
  phaseSub.textContent = p.sub;
}

function goToNextPhase() {
  gameState.phaseIndex = (gameState.phaseIndex + 1) % PHASES.length;
  const p = PHASES[gameState.phaseIndex];
  renderPhase();
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
  speak("Audio abilitato. Possiamo iniziare.");
  playSfx("day");
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
  showScreen("done");
});

// iOS/Safari: le voci possono arrivare dopo un po'.
// Rinfresca lista voci quando disponibili.
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => { /* trigger per caricare voci */ };
}

// Start
showScreen("setup");
