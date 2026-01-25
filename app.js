// ============================================
// app.js - Main game controller
// Person 1's responsibility - Game flow & levels
// ============================================

const STORAGE_KEY = "hp_logic_progress";

// Level definitions - Person 5 will expand these
const LEVELS = [
    {
        id: 1,
        title: "The Lumos Charm",
        description: "Light up the wand by connecting both magical sources through an AND gate.",
        hint: "Both inputs must be active (like casting Lumos with both hands) for the spell to work!",
        availableGates: ['AND'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 } // ← Fixed position
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 2,
        title: "The Alohomora Spell",
        description: "Unlock the door using an OR gate - either key will work!",
        hint: "In the wizarding world, sometimes you only need ONE key to open a door.",
        availableGates: ['OR'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 0 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 } // ← Fixed
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 3,
        title: "The Reversing Charm",
        description: "Use a NOT gate to reverse the magical polarity.",
        hint: "What's true becomes false, what's false becomes true - like a magical mirror!",
        availableGates: ['NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 175, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 } // ← Fixed
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 4,
        title: "The Patronus Challenge",
        description: "Combine AND and NOT gates to create the perfect Patronus.",
        hint: "First combine the energies, then reverse the result!",
        availableGates: ['AND', 'NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 } // ← Fixed
        ],
        targetOutputs: { output: 0 }
    },
    {
        id: 5,
        title: "The Switching Spell",
        description: "Use XOR to create a spell that works with one input, but not both!",
        hint: "XOR is like a see-saw - it only works when one side is down, not both!",
        availableGates: ['XOR'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 } // ← Fixed
        ],
        targetOutputs: { output: 1 }
    },
    // Add these new levels after level 5
    {
        id: 6,
        title: "The Invisibility Cloak",
        description: "Create a circuit that outputs 1 only when exactly ONE input is active.",
        hint: "You'll need both AND and NOT gates for this trick!",
        availableGates: ['AND', 'NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 7,
        title: "The Sorting Hat",
        description: "Build a circuit that determines if a wizard is in House Gryffindor (A=1, B=0) or Slytherin (A=0, B=1).",
        hint: "You'll need OR gates and some clever thinking!",
        availableGates: ['OR', 'AND', 'NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 8,
        title: "The Marauder's Map",
        description: "Create a circuit that lights up when at least TWO out of THREE inputs are active.",
        hint: "Think about combinations! You might need multiple gates.",
        availableGates: ['AND', 'OR'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 75, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 175, value: 1 },
            { id: 'input3', type: 'INPUT', x: 80, y: 275, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 9,
        title: "The Time-Turner",
        description: "Build a memory circuit that remembers if input A was ever active.",
        hint: "You'll need to create a basic latch using NOR gates.",
        availableGates: ['OR', 'NOT', 'AND'],
        initialGates: [
            { id: 'set', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'reset', type: 'INPUT', x: 80, y: 250, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 10,
        title: "The Chamber of Secrets",
        description: "Create a full adder circuit that adds two binary numbers with a carry.",
        hint: "This is the ultimate challenge! Use XOR for sum and AND for carry.",
        availableGates: ['XOR', 'AND', 'OR'],
        initialGates: [
            { id: 'A', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'B', type: 'INPUT', x: 80, y: 200, value: 1 },
            { id: 'Cin', type: 'INPUT', x: 80, y: 300, value: 0 },
            { id: 'Sum', type: 'OUTPUT', x: 700, y: 150 },
            { id: 'Cout', type: 'OUTPUT', x: 700, y: 250 }
        ],
        targetOutputs: { Sum: 0, Cout: 1 } // 1 + 1 + 0 = 10 (binary)
    },
    {
        id: 11,
        title: "The Triwizard Tournament",
        description: "Create a circuit that outputs 1 when the inputs form a binary number greater than 2.",
        hint: "You need to compare binary values! Think about bit patterns.",
        availableGates: ['AND', 'OR', 'NOT'],
        initialGates: [
            { id: 'bit1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'bit2', type: 'INPUT', x: 80, y: 200, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 150 }
        ],
        targetOutputs: { output: 1 } // Binary 11 = 3 > 2
    },
    {
        id: 12,
        title: "The Mirror of Erised",
        description: "Build a circuit that outputs the opposite of what a simple AND gate would output.",
        hint: "Combine an AND gate with a NOT gate in a clever way.",
        availableGates: ['AND', 'NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 0 } // NAND gate: NOT(1 AND 1) = 0
    }
];

// =============================
// PROGRESSION (localStorage)
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
        p.completedLevels.sort((a, b) => a - b);
    }

    if (levelId === p.unlockedLevel) {
        p.unlockedLevel = Math.min(levelId + 1, LEVELS.length);
    }

    saveProgress(p);
    return p;
}

// =============================
// ROUTER HASH
// =============================
function parseRoute() {
    const hash = (location.hash || "#levels").replace("#", "");
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
// RENDERS
// =============================
function render() {
    const route = parseRoute();
    const progress = loadProgress();

    if (route.name === "levels") return renderLevelSelect(progress);
    if (route.name === "play" && route.levelId) return renderPlay(route.levelId, progress);
    if (route.name === "win" && route.levelId) return renderWin(route.levelId, progress);
    if (route.name === "lose" && route.levelId) return renderLose(route.levelId, progress);
    if (route.name === "leaderboard") return renderLeaderboard();

    location.hash = "#levels";
}

function renderLevelSelect(progress) {
    app.innerHTML = `
    <section class="panel">
      <h2 class="h2">🪄 Hogwarts Logic Academy</h2>
      <p class="muted">Master the ancient art of magical circuit crafting</p>

      <div class="toolbar">
        <button class="btn danger" id="btnResetProgress">Reset Progress</button>
        <button class="btn primary" id="btnLeaderboard">🏆</button>
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
        ${unlocked ? "Unlocked" : "🔒 Locked"} • ${completed ? "✅ Complete" : "⏳ Incomplete"}
      </div>
      <div class="toolbar" style="margin-top:10px">
        <button class="btn primary" ${unlocked ? "" : "disabled"} data-play="${lvl.id}">
          Play
        </button>
      </div>
    `;
        grid.appendChild(card);
    });

    document.getElementById("btnResetProgress").addEventListener("click", () => {
        if (confirm("Reset all progress?")) {
            resetProgress();
            render();
        }
    });

    document.getElementById("btnLeaderboard").addEventListener("click", () => {
        if (window.leaderboardUI) {
            window.leaderboardUI.open();
        }
    });

    grid.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-play]");
        if (!btn) return;
        const id = Number(btn.dataset.play);
        location.hash = `#play-${id}`;
    });
}

function renderPlay(levelId, progress) {
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
      <!-- Top Section: Instructions and Controls -->
      <div style="margin-bottom: 16px;">
        <h2 class="h2">${lvl.title}</h2>
        <p class="muted">${lvl.description}</p>
        <div class="overlay">
          <div><b>💡 Hint:</b> ${lvl.hint}</div>
        </div>

        <div class="toolbar">
          <button class="btn" id="btnBack">← Back</button>
          <button class="btn" id="btnResetLevel">🔄 Reset</button>
          <button class="btn primary" id="btnCheck">✨ Cast Spell</button>
        </div>

        <div class="row" style="margin-top: 12px;">
          <!-- Available Gates -->
          <div class="col">
            <div class="overlay">
              <h3 style="margin:0 0 10px 0">🔮 Available Spells</h3>
              <div id="gatePalette" class="toolbar"></div>
            </div>
          </div>

          <!-- Input Controls -->
          <div class="col">
            <div class="overlay">
              <h3 style="margin:0 0 10px 0">⚡ Magical Inputs</h3>
              <div id="inputControls"></div>
            </div>
          </div>
        </div>

        <div id="statusArea" style="margin-top:12px"></div>
      </div>

      <!-- Bottom Section: Full-width Canvas -->
      <div class="canvas-container" id="canvasHost" style="position:relative; height: 600px;">
        <!-- Wire canvas -->
        <canvas id="wireCanvas" class="wire-canvas"></canvas>
        <!-- Gates will be added here -->
      </div>
    </section>
  `;

    // Initialize the game engine
    initializeGameEngine(lvl);
}

function initializeGameEngine(level) {
    const canvasHost = document.getElementById("canvasHost");
    const wireCanvas = document.getElementById("wireCanvas");

    // Set canvas size
    const rect = canvasHost.getBoundingClientRect();
    wireCanvas.width = canvasHost.offsetWidth;
    wireCanvas.height = 420;
    wireCanvas.style.width = rect.width + 'px';
    wireCanvas.style.height = '420px';

    // Initialize systems
    window.circuitCalculator = new CircuitCalculator();
    window.gateSystem = new GateSystem(canvasHost);
    window.wireSystem = new WireSystem(wireCanvas);
    window.wireRenderer = new WireRenderer(wireCanvas);

    // Connect wire system to renderer
    window.wireSystem.onRender = (wires, currentWire) => {
        window.wireRenderer.drawAllWires(wires, currentWire);
    };

    // Start wire animation
    window.wireRenderer.startAnimation();

    // Add initial gates
    level.initialGates.forEach(gateData => {
        const gate = window.gateSystem.addGate(gateData.type, gateData.x, gateData.y, gateData.id);
        if (gateData.value !== undefined) {
            gate.value = gateData.value;
            window.circuitCalculator.setGateValue(gateData.id, gateData.value);
        }
    });

    // Setup gate palette
    // Setup gate palette with better positioning
    const gatePalette = document.getElementById('gatePalette');
    level.availableGates.forEach((gateType, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = `+ ${gateType}`;
        btn.onclick = () => {
            // Calculate position with spacing
            const spacing = 100;
            const startX = 300;
            const startY = 200;

            const x = startX + (index % 3) * spacing;
            const y = startY + Math.floor(index / 3) * spacing;

            window.gateSystem.addGate(gateType, x, y);
            updateCircuitDisplay();
        };
        gatePalette.appendChild(btn);
    });

    // Setup input controls
    const inputControls = document.getElementById('inputControls');
    level.initialGates.filter(g => g.type === 'INPUT').forEach(inputGate => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.id = `input_${inputGate.id}`;
        btn.textContent = `${inputGate.id}: ${inputGate.value === 1 ? 'ON' : 'OFF'}`;
        btn.onclick = () => toggleInput(inputGate.id);
        inputControls.appendChild(btn);
    });

    // Event listeners
    document.getElementById("btnBack").addEventListener("click", () => {
        location.hash = "#levels";
    });

    document.getElementById("btnResetLevel").addEventListener("click", () => {
        location.reload();
    });

    document.getElementById("btnCheck").addEventListener("click", () => {
        checkSolution(level);
    });

    // Listen for wire changes
    wireCanvas.addEventListener('wireCreated', updateCircuitDisplay);
    wireCanvas.addEventListener('wireRemoved', updateCircuitDisplay);

    updateCircuitDisplay();
}

function toggleInput(inputId) {
    const gate = window.gateSystem.getGate(inputId);
    if (!gate) return;

    gate.value = gate.value === 1 ? 0 : 1;
    window.circuitCalculator.setGateValue(inputId, gate.value);

    const btn = document.getElementById(`input_${inputId}`);
    if (btn) {
        btn.textContent = `${inputId}: ${gate.value === 1 ? 'ON' : 'OFF'}`;
        btn.className = gate.value === 1 ? 'btn ok' : 'btn';
    }

    updateCircuitDisplay();
}

function updateCircuitDisplay() {
    const result = window.circuitCalculator.calculateAll();

    // Update gate displays with their values
    window.gateSystem.placedGates.forEach(gate => {
        const value = result.allGates.get(gate.id);
        const valueDisplay = gate.element.querySelector('.gate-value');

        if (valueDisplay) {
            valueDisplay.remove();
        }

        if (value !== undefined) {
            const badge = document.createElement('div');
            badge.className = 'gate-value';
            badge.textContent = value;
            badge.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${value === 1 ? '#22c55e' : '#6b7280'};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      `;
            gate.element.appendChild(badge);
        }
    });
}

function checkSolution(level) {
    const result = window.circuitCalculator.calculateAll();

    // Check 1: Output has correct value
    for (const [outputId, targetValue] of Object.entries(level.targetOutputs)) {
        const actualValue = result.outputs.get(outputId);
        if (actualValue !== targetValue) {
            setStatus("❌ The magic fizzled out! Check your connections and try again.");
            return false;
        }
    }

    // Check 2: At least one gate is connected to the output
    const outputId = 'output'; // Assuming all levels have an output gate with id 'output'
    const connectionsToOutput = window.circuitCalculator.connections.filter(
        conn => conn.to === outputId
    );

    if (connectionsToOutput.length === 0) {
        setStatus("❌ No spell connected to the wand! You need to connect a gate to the output.");
        return false;
    }

    // Check 3: At least one logic gate is placed (not just INPUT gates)
    const placedGates = window.gateSystem.placedGates || [];
    const logicGateCount = placedGates.filter(gate =>
        !['INPUT', 'OUTPUT'].includes(gate.type)
    ).length;

    if (logicGateCount === 0) {
        setStatus("❌ You need to place at least one spell gate! Use the available spells below.");
        return false;
    }

    // Check 4: All gates must be properly connected (no floating gates)
    const allGates = Array.from(window.circuitCalculator.gates.keys());
    const connectedGates = new Set();

    window.circuitCalculator.connections.forEach(conn => {
        connectedGates.add(conn.from);
        connectedGates.add(conn.to);
    });

    const logicGates = allGates.filter(id => {
        const gate = window.circuitCalculator.gates.get(id);
        return gate && !['INPUT', 'OUTPUT'].includes(gate.type);
    });

    const unconnectedLogicGates = logicGates.filter(id => !connectedGates.has(id));

    if (unconnectedLogicGates.length > 0) {
        setStatus("❌ Some spells are not connected! Make sure all gates are properly linked.");
        return false;
    }

    // All checks passed!
    location.hash = `#win-${level.id}`;
    return true;
}

function setStatus(html, isError = true) {
    const statusArea = document.getElementById("statusArea");
    if (statusArea) {
        const className = isError ? "error" : "success";
        statusArea.innerHTML = html ? `<div class="overlay ${className}">${html}</div>` : "";
    }
}

function renderWin(levelId) {
    const newProgress = markVictory(levelId);
    const nextId = Math.min(levelId + 1, LEVELS.length);
    const canGoNext = isUnlocked(nextId, newProgress) && nextId !== levelId;

    app.innerHTML = `
    <section class="panel">
      <h2 class="h2">✨ Spell Successfully Cast!</h2>
      <p class="muted">Level ${levelId} completed. Your magical prowess grows!</p>

      <div class="toolbar">
        <button class="btn" id="btnLevels">← Level Menu</button>
        <button class="btn primary" id="btnNext" ${canGoNext ? "" : "disabled"}>
          Next Challenge →
        </button>
        <button class="btn" id="btnReplay">🔄 Replay</button>
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
    if (!isUnlocked(levelId, progress)) {
        location.hash = "#levels";
        return;
    }

    app.innerHTML = `
    <section class="panel">
      <h2 class="h2">⚡ Spell Backfired</h2>
      <p class="muted">Level ${levelId} incomplete. Try again, young wizard!</p>

      <div class="toolbar">
        <button class="btn" id="btnLevels">← Level Menu</button>
        <button class="btn primary" id="btnRetry">🔄 Try Again</button>
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

function renderLeaderboard() {
    app.innerHTML = `
    <section class="panel">
      <div style="text-align: center; padding: 40px;">
        <p style="font-size: 20px; margin-bottom: 20px;">Ouvre le classement avec le bouton 🏆 en haut à droite</p>
        <button class="btn primary" id="btnOpenLeaderboard">Ouvrir Classement</button>
        <button class="btn" id="btnBackToLevels">← Retour aux Niveaux</button>
      </div>
    </section>
  `;

    document.getElementById("btnOpenLeaderboard").addEventListener("click", () => {
        if (window.leaderboardUI) {
            window.leaderboardUI.open();
        }
    });

    document.getElementById("btnBackToLevels").addEventListener("click", () => {
        location.hash = "#levels";
    });
}