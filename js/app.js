// ============================================
// app.js - Main game controller with Achievements
// Person 1's responsibility - Game flow & levels
// ============================================

const APP_STORAGE_KEY = "hp_logic_progress";

// =============================
// ACHIEVEMENTS SYSTEM
// =============================
const ACHIEVEMENTS = [
    { id: 1, title: "🎓 Lumos Learner", description: "Complete Level 1 - The Lumos Charm", condition: lvl => lvl === 1 },
    { id: 2, title: "🗝️ Lock Picker", description: "Complete Level 2 - The Alohomora Spell", condition: lvl => lvl === 2 },
    { id: 3, title: "🔄 Reversal Master", description: "Complete Level 3 - The Reversing Charm", condition: lvl => lvl === 3 },
    { id: 4, title: "🦌 Patronus Caster", description: "Complete Level 4 - The Patronus Challenge", condition: lvl => lvl === 4 },
    { id: 5, title: "✨ XOR Wizard", description: "Complete Level 5 - The Switching Spell", condition: lvl => lvl === 5 },
    { id: 6, title: "👻 Invisibility Expert", description: "Complete Level 6 - The Invisibility Cloak", condition: lvl => lvl === 6 },
    { id: 7, title: "🎩 Sorting Hat Scholar", description: "Complete Level 7 - The Sorting Hat", condition: lvl => lvl === 7 },
    { id: 8, title: "🗺️ Marauder's Mind", description: "Complete Level 8 - The Marauder's Map", condition: lvl => lvl === 8 },
    { id: 9, title: "⏰ Time Turner", description: "Complete Level 9 - The Time-Turner", condition: lvl => lvl === 9 },
    { id: 10, title: "🏆 Chamber Champion", description: "Complete Level 10 - The Chamber of Secrets", condition: lvl => lvl === 10 },
    { id: 11, title: "🔥 Triwizard Victor", description: "Complete Level 11 - The Triwizard Tournament", condition: lvl => lvl === 11 },
    { id: 12, title: "🪞 Mirror Master", description: "Complete Level 12 - The Mirror of Erised", condition: lvl => lvl === 12 },
    { id: 13, title: "⚡ Speed Demon", description: "Complete any level in under 2 minutes", condition: (lvl, time) => time && time < 120 },
    { id: 14, title: "🎯 Perfectionist", description: "Complete 5 levels in a row without reset", condition: lvl => false }, // Special tracking
    { id: 15, title: "🌟 Logic Legend", description: "Complete all 12 levels", condition: lvl => false }, // Special check
];

const ACHIEVEMENTS_STORAGE_KEY = "hp_logic_achievements";

// Achievement Manager
const achievementManager = {
    data: JSON.parse(localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)) || {},
    levelStartTime: null,
    consecutiveCompletes: 0,

    startLevel() {
        this.levelStartTime = Date.now();
    },

    checkEvent(event) {
        if (event.type === "LEVEL_COMPLETE" && Number.isFinite(event.levelId)) {
            const completionTime = this.levelStartTime ? (Date.now() - this.levelStartTime) / 1000 : null;

            // Check standard level achievements
            ACHIEVEMENTS.forEach(ach => {
                if (ach.condition(event.levelId, completionTime) && !this.data[ach.id]) {
                    this.unlock(ach);
                }
            });

            // Check speed achievement
            if (completionTime && completionTime < 120) {
                const speedAch = ACHIEVEMENTS.find(a => a.id === 13);
                if (speedAch && !this.data[13]) {
                    this.unlock(speedAch);
                }
            }

            // Track consecutive completions
            this.consecutiveCompletes++;
            if (this.consecutiveCompletes >= 5) {
                const perfectAch = ACHIEVEMENTS.find(a => a.id === 14);
                if (perfectAch && !this.data[14]) {
                    this.unlock(perfectAch);
                }
            }

            // Check if all levels completed
            const progress = loadProgress();
            if (progress.completedLevels.length >= 12) {
                const legendAch = ACHIEVEMENTS.find(a => a.id === 15);
                if (legendAch && !this.data[15]) {
                    this.unlock(legendAch);
                }
            }
        }
    },

    unlock(achievement) {
        this.data[achievement.id] = {
            unlocked: true,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(this.data));
        this.showPopup(achievement);
    },

    showPopup(ach) {
        const popup = document.createElement('div');
        popup.className = "achievement-popup";
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.5s, top 0.5s;
            animation: achievementSlideIn 0.5s ease forwards;
        `;

        popup.innerHTML = `
            <div style="background: linear-gradient(135deg, var(--accent), #6366f1); padding: 20px 24px; border-radius: 12px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4); text-align: center; min-width: 300px;">
                <div style="font-size: 3em; margin-bottom: 8px;">🎉</div>
                <div style="color: white; font-size: 18px; font-weight: bold; margin-bottom: 4px;">Achievement Unlocked!</div>
                <div style="color: rgba(255,255,255,0.95); font-weight: 600; margin-bottom: 4px;">${ach.title}</div>
                <div style="color: rgba(255,255,255,0.8); font-size: 14px;">${ach.description}</div>
            </div>
        `;

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.style.opacity = 1;
            popup.style.top = "80px";
        }, 50);

        setTimeout(() => {
            popup.style.opacity = 0;
            popup.style.top = "40px";
            setTimeout(() => popup.remove(), 500);
        }, 4000);
    },

    renderPage() {
        const stats = this.getStats();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
        <div class="modal-content" style="max-width: 600px; position: relative;">
            <button id="closeAchievements" style="position: absolute; top: 16px; right: 16px; background: transparent; border: 1px solid var(--border); color: var(--text); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 1;">✕</button>
            
            <h2 class="h2">🏆 Achievements</h2>
            <p class="muted">Unlock achievements by completing challenges and mastering spells!</p>
            
            <div class="overlay" style="margin: 16px 0; text-align: center;">
                <div style="font-size: 2em; margin-bottom: 8px;">${stats.percent}%</div>
                <div><strong>${stats.unlocked}</strong> of <strong>${stats.total}</strong> achievements unlocked</div>
            </div>

            <div style="max-height: 400px; overflow-y: auto; margin: 16px 0;">
                ${ACHIEVEMENTS.map(ach => {
            const unlocked = this.data[ach.id];
            return `
                        <div class="circuit-card" style="opacity: ${unlocked ? '1' : '0.6'};">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="font-size: 2em;">${unlocked ? '✅' : '🔒'}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: ${unlocked ? 'var(--ok)' : 'var(--muted)'};">
                                        ${ach.title}
                                    </div>
                                    <div class="muted" style="font-size: 0.9em;">${ach.description}</div>
                                    ${unlocked ? `<div class="muted" style="font-size: 0.8em; margin-top: 4px;">Unlocked: ${new Date(unlocked.timestamp).toLocaleDateString()}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        </div>
    `;

        document.body.appendChild(overlay);

        // Close button event
        document.getElementById("closeAchievements").onclick = () => overlay.remove();

        // Close on overlay click (outside modal)
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        };

        // Add hover effect for close button
        const closeBtn = document.getElementById("closeAchievements");
        closeBtn.onmouseenter = () => {
            closeBtn.style.borderColor = 'rgba(255, 255, 255, .25)';
            closeBtn.style.background = 'rgba(255, 255, 255, .06)';
        };
        closeBtn.onmouseleave = () => {
            closeBtn.style.borderColor = 'var(--border)';
            closeBtn.style.background = 'transparent';
        };
    },

    getStats() {
        const total = ACHIEVEMENTS.length;
        const unlocked = Object.keys(this.data).filter(key => this.data[key].unlocked).length;
        return {
            total,
            unlocked,
            percent: Math.round((unlocked / total) * 100)
        };
    },

    resetOnLevelReset() {
        this.consecutiveCompletes = 0;
    }
};

// Add CSS for achievement animation
const style = document.createElement('style');
style.textContent = `
@keyframes achievementSlideIn {
    from {
        transform: translateX(-50%) translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);

// =============================
// EXISTING LEVELS DEFINITION
// =============================
const APP_LEVELS = [
    {
        id: 1,
        title: "The Lumos Charm",
        description: "Light up the wand by connecting both magical sources through an AND gate.",
        hint: "🟢 Use an AND gate: Both inputs must be active (1) for the output to be 1. Connect both inputs to the AND gate, then connect the AND gate to the output.",
        availableGates: ['AND'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 2,
        title: "The Alohomora Spell",
        description: "Unlock the door using an OR gate - either key will work!",
        hint: "🟡 Use an OR gate: The output is 1 if AT LEAST ONE input is 1. Connect both inputs to the OR gate, then connect it to the output.",
        availableGates: ['OR'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 0 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 3,
        title: "The Reversing Charm",
        description: "Use a NOT gate to reverse the magical polarity.",
        hint: "🔴 Use a NOT gate: It reverses the input. If input is 1, output is 0. If input is 0, output is 1. Connect the input to the NOT gate, then to the output.",
        availableGates: ['NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 175, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 4,
        title: "The Patronus Challenge",
        description: "Combine AND and NOT gates to create the perfect Patronus.",
        hint: "🟢🔴 Combine gates: First connect both inputs to an AND gate, then connect the AND gate's output to a NOT gate, then to the output. This creates a NAND gate!",
        availableGates: ['AND', 'NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 0 }
    },
    {
        id: 5,
        title: "The Switching Spell",
        description: "Use XOR to create a spell that works with one input, but not both!",
        hint: "🟣 Use an XOR gate: Output is 1 when EXACTLY ONE input is 1 (but not both). Connect both inputs to the XOR gate, then to the output.",
        availableGates: ['XOR'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 0 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 6,
        title: "The Invisibility Cloak",
        description: "Create a circuit that outputs 1 only when exactly ONE input is active.",
        hint: "💡 This is an XOR gate! You can build it with AND, OR, and NOT gates, or use the XOR gate directly. Hint: (A AND NOT B) OR (NOT A AND B)",
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
        hint: "💡 This is also an XOR gate! Output should be 1 when inputs are different. Try: (A AND NOT B) OR (NOT A AND B)",
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
        hint: "💡 This is a majority gate! You need: (A AND B) OR (A AND C) OR (B AND C). Combine multiple AND gates with an OR gate.",
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
        hint: "💡 Advanced: Create an SR (Set-Reset) latch. Use OR gates: Output = (Set) OR (Output AND NOT Reset). This creates memory!",
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
        hint: "🏆 Ultimate Challenge! Sum = A XOR B XOR Cin, Cout = (A AND B) OR (Cin AND (A XOR B)). Build it step by step!",
        availableGates: ['XOR', 'AND', 'OR'],
        initialGates: [
            { id: 'A', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'B', type: 'INPUT', x: 80, y: 200, value: 1 },
            { id: 'Cin', type: 'INPUT', x: 80, y: 300, value: 0 },
            { id: 'Sum', type: 'OUTPUT', x: 700, y: 150 },
            { id: 'Cout', type: 'OUTPUT', x: 700, y: 250 }
        ],
        targetOutputs: { Sum: 0, Cout: 1 }
    },
    {
        id: 11,
        title: "The Triwizard Tournament",
        description: "Create a circuit that outputs 1 when the inputs form a binary number greater than 2.",
        hint: "💡 Binary > 2 means: 11 (3) or higher. Output = bit1 AND bit2. When both bits are 1, the number is 3 or higher!",
        availableGates: ['AND', 'OR', 'NOT'],
        initialGates: [
            { id: 'bit1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'bit2', type: 'INPUT', x: 80, y: 200, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 150 }
        ],
        targetOutputs: { output: 1 }
    },
    {
        id: 12,
        title: "The Mirror of Erised",
        description: "Build a circuit that outputs the opposite of what a simple AND gate would output.",
        hint: "🔴 This is a NAND gate! Connect both inputs to an AND gate, then connect the AND output to a NOT gate, then to the output.",
        availableGates: ['AND', 'NOT'],
        initialGates: [
            { id: 'input1', type: 'INPUT', x: 80, y: 100, value: 1 },
            { id: 'input2', type: 'INPUT', x: 80, y: 250, value: 1 },
            { id: 'output', type: 'OUTPUT', x: 700, y: 175 }
        ],
        targetOutputs: { output: 0 }
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
        const raw = localStorage.getItem(APP_STORAGE_KEY);
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
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(p));
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
        p.unlockedLevel = Math.min(levelId + 1, APP_LEVELS.length);
    }

    saveProgress(p);

    // If user is logged in, also save to database
    if (window.currentUserId && window.DatabaseService) {
        window.DatabaseService.upsertProgress(
            window.currentUserId,
            p.unlockedLevel,
            p.completedLevels
        ).catch(error => {
            console.error('❌ Failed to save progress to database:', error);
            // Don't throw - local progress is still saved
        });
    }

    // Submit score to leaderboard
    if (window.leaderboard) {
        const completionTime = window.levelStartTime ? 
            Math.floor((Date.now() - window.levelStartTime) / 1000) : 0;
        
        // Calculate score based on time (faster = higher score)
        // Base score: 1000 points, minus 1 point per second
        const score = Math.max(100, 1000 - completionTime);
        
        const playerName = window.currentUserId ? 
            (localStorage.getItem('playerEmail') || 'Joueur') : 
            localStorage.getItem('playerName') || 'Joueur';
        
        window.leaderboard.submitScore(playerName, levelId, score, completionTime);
        console.log(`📊 Score soumis au classement: ${playerName} - Niveau ${levelId} - ${score} points en ${completionTime}s`);
    }

    // Trigger achievement check
    achievementManager.checkEvent({ type: "LEVEL_COMPLETE", levelId: levelId });

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

window.addEventListener("hashchange", () => {
    console.log('🔄 Hash changed to:', location.hash);
    render();
});

window.addEventListener("load", () => {
    if (!location.hash) location.hash = "#levels";
    render();

    // Ajouter un écouteur sur le bouton multijoueur pour afficher directement le lobby
    const navMultiplayer = document.getElementById('navMultiplayer');
    if (navMultiplayer) {
        navMultiplayer.addEventListener('click', (e) => {
            e.preventDefault(); // Empêcher le comportement par défaut
            console.log('🎮 Clic sur Multijoueur détecté');
            console.log('   - Hash actuel:', location.hash);
            console.log('   - multiplayerUI disponible?', !!window.multiplayerUI);
            console.log('   - renderLobby disponible?', typeof window.multiplayerUI?.renderLobby);

            // Afficher directement le lobby sans passer par le hash
            if (window.multiplayerUI && typeof window.multiplayerUI.renderLobby === 'function') {
                console.log('✅ Affichage direct du lobby');
                window.multiplayerUI.renderLobby();
                // Mettre à jour le hash après pour la cohérence
                history.replaceState(null, '', '#multiplayer');
            } else {
                console.error('❌ multiplayerUI non disponible au moment du clic');
                alert('Le système multijoueur n\'est pas encore chargé. Veuillez recharger la page (Ctrl+F5).');
            }
        });
    }
});

// =============================
// RENDERS
// =============================
function render() {
    console.log('📍 render() appelé, hash actuel:', location.hash);
    const route = parseRoute();
    console.log('📍 Route parsée:', route);
    const progress = loadProgress();

    if (route.name === "levels") {
        console.log('📍 Rendu de la sélection de niveaux');
        return renderLevelSelect(progress);
    }
    if (route.name === "play" && route.levelId) return renderPlay(route.levelId, progress);
    if (route.name === "win" && route.levelId) return renderWin(route.levelId, progress);
    if (route.name === "lose" && route.levelId) return renderLose(route.levelId, progress);
    if (route.name === "achievements") return achievementManager.renderPage();
    if (route.name === "leaderboard") return renderLeaderboard();
    if (route.name === "multiplayer") {
        console.log('🎮 Route multiplayer détectée');
        console.log('   - window.multiplayerUI:', window.multiplayerUI);
        console.log('   - renderLobby:', window.multiplayerUI?.renderLobby);

        if (window.multiplayerUI && typeof window.multiplayerUI.renderLobby === 'function') {
            console.log('✅ Rendu du lobby multijoueur');
            return window.multiplayerUI.renderLobby();
        } else {
            console.error('❌ multiplayerUI non disponible');
            const app = document.getElementById('app');
            app.innerHTML = `
                <section class="section">
                    <h2>❌ Erreur</h2>
                    <p>Le système multijoueur n'est pas chargé correctement.</p>
                    <p>Veuillez recharger la page (Ctrl+F5).</p>
                    <button class="btn" onclick="location.reload(true)">Recharger</button>
                </section>
            `;
            return;
        }
    }

    console.log('⚠️ Route non reconnue:', route.name, '- Redirection vers #levels');
    location.hash = "#levels";
}

function renderLevelSelect(progress) {
    const achStats = achievementManager.getStats();

    app.innerHTML = `
    <section class="panel">
      <h2 class="h2">🪄 Hogwarts Logic Academy</h2>
      <p class="muted">Master the ancient art of magical circuit crafting</p>

      <div class="toolbar">
        <button class="btn" id="btnTutorial">🎓 Tutorial</button>
        <button class="btn" id="btnGatesGuide">🔮 Gates Guide</button>
        <button class="btn" id="btnMyCircuits">📚 My Circuits</button>
        <button class="btn" id="btnAchievements">🏆 Achievements (${achStats.unlocked}/${achStats.total})</button>
        <button class="btn primary" id="btnLeaderboard">📊 Leaderboard</button>
        <button class="btn danger" id="btnResetProgress">Reset Progress</button>
      </div>

      <div style="margin-top:14px" class="level-grid" id="levelGrid"></div>
    </section>
  `;

    const grid = document.getElementById("levelGrid");

    APP_LEVELS.forEach((lvl) => {
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

    document.getElementById("btnTutorial").addEventListener("click", () => {
        if (window.tutorialSystem) {
            window.tutorialSystem.start(true); // Force replay even if completed
        }
    });

    document.getElementById("btnGatesGuide").addEventListener("click", () => {
        if (window.gatesGuide) {
            window.gatesGuide.open();
        }
    });

    document.getElementById("btnMyCircuits").addEventListener("click", () => {
        window.circuitStorageUI.showCircuitLibrary();
    });

    document.getElementById("btnAchievements").addEventListener("click", () => {
        achievementManager.renderPage();
    });

    document.getElementById("btnLeaderboard").addEventListener("click", () => {
        if (window.leaderboardUI) {
            window.leaderboardUI.open();
        }
    });

    document.getElementById("btnResetProgress").addEventListener("click", () => {
        if (confirm("Reset all progress? This will not reset achievements.")) {
            resetProgress();
            render();
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

    const lvl = APP_LEVELS.find((x) => x.id === levelId);
    if (!lvl) {
        location.hash = "#levels";
        return;
    }

    // Start timing for achievements and multiplayer
    achievementManager.startLevel();
    window.levelStartTime = Date.now(); // Pour le chronomètre multijoueur
    window.currentLevel = lvl; // Stocker le niveau actuel pour le multijoueur

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
            <button class="btn" id="btnSaveCircuit">💾 Save Circuit</button>
            <button class="btn" id="btnLoadCircuit">📂 My Circuits</button>
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
    const gatePalette = document.getElementById('gatePalette');
    level.availableGates.forEach((gateType, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = `+ ${gateType}`;
        btn.onclick = () => {
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
        achievementManager.resetOnLevelReset();
        location.reload();
    });

    document.getElementById("btnCheck").addEventListener("click", () => {
        checkSolution(level);
    });

    document.getElementById("btnSaveCircuit").addEventListener("click", () => {
        window.circuitStorageUI.showSaveDialog();
    });

    document.getElementById("btnLoadCircuit").addEventListener("click", () => {
        window.circuitStorageUI.showCircuitLibrary();
    });

    // Listen for wire changes
    wireCanvas.addEventListener('wireCreated', updateCircuitDisplay);
    wireCanvas.addEventListener('wireRemoved', updateCircuitDisplay);

    // Synchronisation des curseurs en mode multijoueur
    if (window.multiplayerSync && window.multiplayerSync.isMultiplayerMode) {
        canvasHost.addEventListener('mousemove', (e) => {
            const rect = canvasHost.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            window.multiplayerSync.syncCursorPosition(x, y);
        });
    }

    updateCircuitDisplay();
}

function toggleInput(inputId) {
    const gate = window.gateSystem.getGate(inputId);
    if (!gate) return;

    gate.value = gate.value === 1 ? 0 : 1;
    window.circuitCalculator.setGateValue(inputId, gate.value);

    // Synchroniser la valeur d'entrée avec les autres joueurs en mode multijoueur
    if (window.multiplayerSync && window.multiplayerSync.isMultiplayerMode && window.multiplayerClient) {
        window.multiplayerClient.syncInputValue(inputId, gate.value);
    }

    const btn = document.getElementById(`input_${inputId}`);
    if (btn) {
        btn.textContent = `${inputId}: ${gate.value === 1 ? 'ON' : 'OFF'}`;
        btn.className = gate.value === 1 ? 'btn ok' : 'btn';
    }

    updateCircuitDisplay();
}

function updateCircuitDisplay() {
    const result = window.circuitCalculator.calculateAll();

    // Track OUTPUT values for synchronization in multiplayer
    const outputChanges = {};

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
            
            // Track OUTPUT gate value changes for multiplayer sync
            if (gate.type === 'OUTPUT') {
                outputChanges[gate.id] = value;
            }
        }
    });
    
    // Sync OUTPUT values to other players in multiplayer mode
    if (window.multiplayerSync && window.multiplayerSync.isMultiplayerMode && Object.keys(outputChanges).length > 0) {
        if (window.multiplayerClient) {
            window.multiplayerClient.syncOutputValues(outputChanges);
        }
    }
}

function checkSolution(level) {
    const result = window.circuitCalculator.calculateAll();

    for (const [outputId, targetValue] of Object.entries(level.targetOutputs)) {
        const actualValue = result.outputs.get(outputId);
        if (actualValue !== targetValue) {
            setStatus("❌ The magic fizzled out! Check your connections and try again.");
            return false;
        }
    }

    const outputId = Object.keys(level.targetOutputs)[0] || 'output';
    const connectionsToOutput = window.circuitCalculator.connections.filter(
        conn => conn.to === outputId
    );

    if (connectionsToOutput.length === 0) {
        setStatus("❌ No spell connected to the wand! You need to connect a gate to the output.");
        return false;
    }

    const placedGates = window.gateSystem.placedGates || [];
    const logicGateCount = placedGates.filter(gate =>
        !['INPUT', 'OUTPUT'].includes(gate.type)
    ).length;

    if (logicGateCount === 0) {
        setStatus("❌ You need to place at least one spell gate! Use the available spells below.");
        return false;
    }

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

// Vérifier si on est en mode multijoueur
    if (window.multiplayerSync && window.multiplayerSync.isMultiplayerMode) {
        // Calculer le temps écoulé
        const completionTime = window.levelStartTime ?
            Math.floor((Date.now() - window.levelStartTime) / 1000) : 0;

        // Mode multijoueur - afficher l'écran de victoire collaborative
        // Compter seulement les portes logiques (pas INPUT/OUTPUT)
        const logicGatesCount = placedGates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT').length;

        const teamStats = {
            totalTime: completionTime,
            gatesPlaced: logicGatesCount,
            wiresConnected: window.wireSystem ? window.wireSystem.wires.length : 0,
            players: window.multiplayerSync.getPlayerContributions()
        };

        // Sauvegarder la progression IMMÉDIATEMENT avant d'afficher l'écran de victoire
        markVictory(level.id);

        // Notifier les autres joueurs APRÈS avoir sauvegardé la progression
        if (window.multiplayerClient) {
            window.multiplayerClient.levelCompleted(level.id, completionTime, teamStats);
        }

        // Afficher l'écran de victoire après un court délai pour synchroniser
        setTimeout(() => {
            if (window.multiplayerUI) {
                window.multiplayerUI.showCollaborativeVictory(level, teamStats);
            }
        }, 500);
    } else {
        // Mode solo - afficher le popup normal
        showVictoryPopup(level.id);
    }

    return true;
}

function setStatus(html, isError = true) {
    const statusArea = document.getElementById("statusArea");
    if (statusArea) {
        const className = isError ? "error" : "success";
        statusArea.innerHTML = html ? `<div class="overlay ${className}">${html}</div>` : "";
    }
}

function showVictoryPopup(levelId) {
    const newProgress = markVictory(levelId);
    const nextId = Math.min(levelId + 1, APP_LEVELS.length);
    const canGoNext = isUnlocked(nextId, newProgress) && nextId !== levelId;

    const popup = document.createElement('div');
    popup.id = 'victoryPopup';
    popup.className = 'modal-overlay';
    popup.innerHTML = `
        <div class="modal-content victory-popup">
            <div style="text-align: center;">
                <div style="font-size: 4em; margin-bottom: 16px;">✨</div>
                <h2 class="h2">Spell Successfully Cast!</h2>
                <p class="muted">Level ${levelId} completed. Your magical prowess grows!</p>
            </div>

            <div class="overlay success" style="margin: 20px 0;">
                <p>🎉 <strong>Congratulations!</strong> Your circuit works perfectly!</p>
                <p style="margin-top: 8px;">Now that you know it's correct, you might want to save it for later reference.</p>
            </div>

            <div class="toolbar">
                <button class="btn" id="btnCloseVictory">Continue Practicing</button>
                <button class="btn" id="btnSaveSuccess">💾 Save Circuit</button>
                ${canGoNext ? `<button class="btn primary" id="btnNextFromPopup">Next Challenge →</button>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById('btnCloseVictory').onclick = () => {
        popup.remove();
        if (canGoNext) {
            showNextLevelButton(nextId);
        }
    };

    document.getElementById('btnSaveSuccess').onclick = () => {
        popup.remove();
        if (window.circuitStorageUI) {
            window.circuitStorageUI.showSaveDialog();
        }
        if (canGoNext) {
            showNextLevelButton(nextId);
        }
    };

    if (canGoNext) {
        document.getElementById('btnNextFromPopup').onclick = () => {
            popup.remove();
            location.hash = `#play-${nextId}`;
        };
    }
}

function showNextLevelButton(nextLevelId) {
    if (document.getElementById('btnNextLevel')) return;

    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    const nextBtn = document.createElement('button');
    nextBtn.id = 'btnNextLevel';
    nextBtn.className = 'btn primary';
    nextBtn.innerHTML = '🎯 Next Challenge →';
    nextBtn.onclick = () => {
        location.hash = `#play-${nextLevelId}`;
    };

    const checkBtn = document.getElementById('btnCheck');
    if (checkBtn) {
        toolbar.insertBefore(nextBtn, checkBtn);
    } else {
        toolbar.appendChild(nextBtn);
    }
}

function renderWin(levelId) {
    const newProgress = markVictory(levelId);
    const nextId = Math.min(levelId + 1, APP_LEVELS.length);
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
        <p style="font-size: 20px; margin-bottom: 20px;">Open the leaderboard with the 🏆 button at the top right</p>
        <button class="btn primary" id="btnOpenLeaderboard">Open Leaderboard</button>
        <button class="btn" id="btnBackToLevels">← Back to Levels</button>
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