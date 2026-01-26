// =============================
// 0) CONFIG
// =============================
const STORAGE_KEY = "hp_logic_progress";

// Exemple de niveaux (Personne 5 fournira mieux)
const LEVELS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: `Niveau ${i + 1}`,
  description: `Objectif du niveau ${i + 1} (à remplacer).`,
  hint: `Indice du niveau ${i + 1} (à remplacer).`,
}));

// =============================
// 1) PROGRESSION (localStorage)
// =============================
function defaultProgress() {
  return {
    unlockedLevel: 1,
    completedLevels: [],
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();

    const parsed = JSON.parse(raw);
    // validation minimale
    const unlocked = Number(parsed.unlockedLevel);
    const completed = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];

    return {
      unlockedLevel: Number.isFinite(unlocked) && unlocked >= 1 ? unlocked : 1,
      completedLevels: completed
        .map(Number)
        .filter((n) => Number.isFinite(n) && n >= 1),
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function resetProgress() {
  saveProgress(defaultProgress());
}

function isUnlocked(levelId, progress) {
  return levelId <= progress.unlockedLevel;
}

function isCompleted(levelId, progress) {
  return progress.completedLevels.includes(levelId);
}

function markVictory(levelId) {
  const p = loadProgress();

  if (!p.completedLevels.includes(levelId)) {
    p.completedLevels.push(levelId);
    p.completedLevels.sort((a,b) => a - b);
  }

  // débloque le suivant seulement si on gagne le "dernier débloqué"
  if (levelId === p.unlockedLevel) {
    p.unlockedLevel = Math.min(levelId + 1, LEVELS.length);
  }

  saveProgress(p);
  return p;
}

// =============================
// 2) ROUTER HASH
// =============================
function parseRoute() {
  const hash = (location.hash || "#levels").replace("#", "");

  // routes:
  // levels
  // play-3
  // win-3
  // lose-3
  const [name, idStr] = hash.split("-");
  const levelId = idStr ? Number(idStr) : null;

  return { name, levelId };
}

window.addEventListener("hashchange", render);
window.addEventListener("load", () => {
  if (!location.hash) location.hash = "#levels";
  render();
});

const app = document.getElementById("app");

// =============================
// 3) RENDERS
// =============================
function render() {
  const route = parseRoute();
  const progress = loadProgress();

  if (route.name === "levels") return renderLevelSelect(progress);

  if (route.name === "play" && route.levelId) return renderPlay(route.levelId, progress);

  if (route.name === "win" && route.levelId) return renderWin(route.levelId, progress);

  if (route.name === "lose" && route.levelId) return renderLose(route.levelId, progress);

  // fallback
  location.hash = "#levels";
}

function renderLevelSelect(progress) {
  app.innerHTML = `
    <section class="panel">
      <h2 class="h2">Sélection des niveaux</h2>
      <p class="muted">Progression sauvegardée automatiquement (localStorage).</p>

      <div class="toolbar">
        <button class="btn danger" id="btnResetProgress">Réinitialiser la progression</button>
      </div>

      <div style="margin-top:14px" class="level-grid" id="levelGrid"></div>
    </section>
  `;

  const grid = document.getElementById("levelGrid");

  LEVELS.forEach((lvl) => {
    const unlocked = isUnlocked(lvl.id, progress);
    const completed = isCompleted(lvl.id, progress);

    const card = document.createElement("div");
    card.className = `level-card ${unlocked ? "" : "locked"}`;
    card.innerHTML = `
      <div class="title">${lvl.title}</div>
      <div class="meta">
        ${unlocked ? "Déverrouillé" : "Verrouillé"} • ${completed ? "✅ Terminé" : "⏳ À faire"}
      </div>
      <div class="toolbar" style="margin-top:10px">
        <button class="btn primary" ${unlocked ? "" : "disabled"} data-play="${lvl.id}">
          Jouer
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  document.getElementById("btnResetProgress").addEventListener("click", () => {
    resetProgress();
    render();
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-play]");
    if (!btn) return;
    const id = Number(btn.dataset.play);
    location.hash = `#play-${id}`;
  });
}

function renderPlay(levelId, progress) {
  // sécurité : pas jouer un niveau verrouillé
  if (!isUnlocked(levelId, progress)) {
    location.hash = "#levels";
    return;
  }

  const lvl = LEVELS.find((x) => x.id === levelId);
  if (!lvl) {
    location.hash = "#levels";
    return;
  }

  app.innerHTML = `
    <section class="panel">
      <div class="row">
        <div class="col">
          <h2 class="h2">${lvl.title}</h2>
          <p class="muted">${lvl.description}</p>
          <div class="overlay">
            <div><b>Indice :</b> ${lvl.hint}</div>
          </div>

          <div class="toolbar">
            <button class="btn" id="btnBack">Retour niveaux</button>
            <button class="btn" id="btnResetLevel">Reset niveau</button>
            <button class="btn primary" id="btnCheck">Vérifier</button>
          </div>

          <!-- Mode dev : utile tant que P2/P3/P4 pas branchés -->
          <div class="toolbar">
            <button class="btn ok" id="btnSimWin">Simuler victoire</button>
            <button class="btn danger" id="btnSimLose">Simuler défaite</button>
          </div>

          <div id="statusArea" style="margin-top:12px"></div>
        </div>

        <div class="col">
          <div class="canvas-placeholder" id="canvasHost">
            Canvas / portes / fils (Personne 2-3)
          </div>
        </div>
      </div>
    </section>
  `;

  // ---- hooks pour intégrer le moteur circuit
  // Personne 2/3/4 peuvent exposer window.CircuitEngine avec:
  // init(levelId, canvasElement)
  // reset(levelId)
  // getStatus(levelId) => { isWin:boolean, isLose?:boolean }
  const engine = window.CircuitEngine || null;
  const canvasHost = document.getElementById("canvasHost");

  if (engine && typeof engine.init === "function") {
    engine.init(levelId, canvasHost);
  }

  document.getElementById("btnBack").addEventListener("click", () => {
    location.hash = "#levels";
  });

  document.getElementById("btnResetLevel").addEventListener("click", () => {
    if (engine && typeof engine.reset === "function") {
      engine.reset(levelId);
    }
    setStatus(""); // nettoie l'affichage
  });

  document.getElementById("btnCheck").addEventListener("click", () => {
    // 1) si moteur branché -> on lit status
    if (engine && typeof engine.getStatus === "function") {
      const s = engine.getStatus(levelId);
      handleStatus(levelId, s);
      return;
    }
    // 2) sinon -> message (tant que les autres pas prêts)
    setStatus("Moteur de circuit non branché. Utilise “Simuler victoire/défaite” pour tester le flow.");
  });

  document.getElementById("btnSimWin").addEventListener("click", () => {
    handleStatus(levelId, { isWin: true });
  });

  document.getElementById("btnSimLose").addEventListener("click", () => {
    handleStatus(levelId, { isWin: false, isLose: true });
  });

  function setStatus(html) {
    document.getElementById("statusArea").innerHTML = html ? `<div class="overlay">${html}</div>` : "";
  }

  function handleStatus(levelId, status) {
    if (status?.isWin) {
      location.hash = `#win-${levelId}`;
      return;
    }
    if (status?.isLose) {
      location.hash = `#lose-${levelId}`;
      return;
    }
    setStatus("Pas encore correct. Continue.");
  }
}

function renderWin(levelId) {
  // sauvegarde progression ici (au moment où on arrive sur win)
  const newProgress = markVictory(levelId);

  const nextId = Math.min(levelId + 1, LEVELS.length);
  const canGoNext = isUnlocked(nextId, newProgress) && nextId !== levelId;

  app.innerHTML = `
    <section class="panel">
      <h2 class="h2">✅ Victoire !</h2>
      <p class="muted">Niveau ${levelId} terminé. Progression sauvegardée.</p>

      <div class="toolbar">
        <button class="btn" id="btnLevels">Menu niveaux</button>
        <button class="btn primary" id="btnNext" ${canGoNext ? "" : "disabled"}>
          Niveau suivant
        </button>
        <button class="btn" id="btnReplay">Rejouer</button>
      </div>
    </section>
  `;

  document.getElementById("btnLevels").addEventListener("click", () => {
    location.hash = "#levels";
  });

  document.getElementById("btnReplay").addEventListener("click", () => {
    location.hash = `#play-${levelId}`;
  });

  document.getElementById("btnNext").addEventListener("click", () => {
    if (!canGoNext) return;
    location.hash = `#play-${nextId}`;
  });
}

function renderLose(levelId, progress) {
  // sécurité : pas jouer un niveau verrouillé
  if (!isUnlocked(levelId, progress)) {
    location.hash = "#levels";
    return;
  }

  app.innerHTML = `
    <section class="panel">
      <h2 class="h2">❌ Défaite</h2>
      <p class="muted">Niveau ${levelId} non validé.</p>

      <div class="toolbar">
        <button class="btn" id="btnLevels">Menu niveaux</button>
        <button class="btn primary" id="btnRetry">Réessayer</button>
      </div>
    </section>
  `;

  document.getElementById("btnLevels").addEventListener("click", () => {
    location.hash = "#levels";
  });

  document.getElementById("btnRetry").addEventListener("click", () => {
    location.hash = `#play-${levelId}`;
  });
}
