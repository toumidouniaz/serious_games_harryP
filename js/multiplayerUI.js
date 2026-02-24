// ============================================
// Interface Utilisateur Multijoueur
// Hogwarts Logic Academy
// ============================================

class MultiplayerUI {
    constructor() {
        this.currentPlayers = [];
        this.isHost = false;
        this.eventsSetup = false; // Flag pour éviter de configurer les événements plusieurs fois
    }

    // ============================================
    // ÉCRAN DE LOBBY MULTIJOUEUR
    // ============================================

    renderLobby() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <section class="section">
                <h2>🎮 Mode Multijoueur</h2>
                <p class="subtitle">Jouez avec vos amis et défiez-vous sur les circuits logiques !</p>

                <div class="multiplayer-container">
                    <div class="multiplayer-card">
                        <h3>🆕 Créer une salle</h3>
                        <p>Créez une nouvelle salle et invitez vos amis</p>
                        <input 
                            type="text" 
                            id="hostUsername" 
                            placeholder="Votre nom" 
                            maxlength="20"
                            class="input-field"
                        />
                        <button id="btnCreateRoom" class="btn btn-primary">
                            Créer une salle
                        </button>
                    </div>

                    <div class="multiplayer-card">
                        <h3>🚪 Rejoindre une salle</h3>
                        <p>Entrez le code de la salle pour rejoindre</p>
                        <input 
                            type="text" 
                            id="joinUsername" 
                            placeholder="Votre nom" 
                            maxlength="20"
                            class="input-field"
                        />
                        <input 
                            type="text" 
                            id="roomCodeInput" 
                            placeholder="Code de salle (ex: ABC123)" 
                            maxlength="6"
                            class="input-field"
                            style="text-transform: uppercase;"
                        />
                        <button id="btnJoinRoom" class="btn btn-primary">
                            Rejoindre
                        </button>
                    </div>
                </div>

                <div id="connectionStatus" class="status-message"></div>

                <div style="margin-top: 30px;">
                    <button id="btnBackToMenu" class="btn btn-secondary">
                        ← Retour au menu
                    </button>
                </div>
            </section>
        `;

        this._setupLobbyEvents();

        // Si déjà dans une salle et connecté, tenter d'afficher directement la salle d'attente
        try {
            const client = window.multiplayerClient;
            if (client && client.isSocketConnected() && client.isInRoom()) {
                // Récupérer les salles actives pour vérifier l'existence
                client.getActiveRooms().then((rooms) => {
                    const code = client.getRoomCode();
                    const found = rooms.find(r => r.code === code && !r.started);
                    if (found) {
                        // On ne connaît pas forcément la liste des joueurs localement; demander au serveur via rejoin implicite
                        const username = client.getUsername() || 'Joueur';
                        client.joinRoom(code).then((data) => {
                            this.renderWaitingRoom(data.roomCode, data.players, data.players.some(p => p.isHost && p.id === client.socket.id));
                            this.setupMultiplayerEvents();
                        }).catch(() => {
                            // Si échec, rester sur le lobby
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('⚠️ Auto-rendu de la salle d\'attente ignoré:', e);
        }
    }

    _setupLobbyEvents() {
        document.getElementById('btnCreateRoom').addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('btnJoinRoom').addEventListener('click', () => {
            this.joinRoom();
        });

        document.getElementById('btnBackToMenu').addEventListener('click', () => {
            location.hash = '#levels';
        });

        // Permettre de rejoindre avec Enter
        document.getElementById('roomCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
    }

    // ============================================
    // ÉCRAN DE SALLE D'ATTENTE
    // ============================================

    renderWaitingRoom(roomCode, players, isHost) {
        this.currentPlayers = players;
        this.isHost = isHost;

        const app = document.getElementById('app');
        app.innerHTML = `
            <section class="section">
                <h2>🎮 Salle: ${roomCode}</h2>
                <p class="subtitle">Partagez ce code avec vos amis !</p>

                <div class="room-code-display">
                    <div class="room-code">${roomCode}</div>
                    <button id="btnCopyCode" class="btn btn-secondary">
                        📋 Copier
                    </button>
                </div>

                <div class="players-section">
                    <h3>👥 Joueurs (${players.length}/4)</h3>
                    <div id="playersList" class="players-list">
                        ${this._renderPlayersList(players)}
                    </div>
                </div>

                ${isHost ? `
                    <div class="host-controls">
                        <div style="display:flex; gap:12px; align-items:center; flex-wrap: wrap; margin-bottom:10px;">
                            <label for="hostLevelSelect" class="muted">Niveau de départ:</label>
                            <select id="hostLevelSelect" class="input-field" style="max-width: 160px;"></select>
                        </div>
                        <button id="btnStartGame" class="btn btn-primary btn-large">
                            🎮 Démarrer la partie
                        </button>
                        <p class="hint">Tous les joueurs doivent être prêts</p>
                    </div>
                ` : `
                    <div class="player-controls">
                        <button id="btnToggleReady" class="btn btn-primary btn-large">
                            ✋ Je suis prêt !
                        </button>
                    </div>
                `}

                <div class="chat-section">
                    <h3>💬 Chat</h3>
                    <div id="chatMessages" class="chat-messages"></div>
                    <div class="chat-input-container">
                        <input 
                            type="text" 
                            id="chatInput" 
                            placeholder="Tapez un message..." 
                            maxlength="200"
                            class="input-field"
                        />
                        <button id="btnSendMessage" class="btn btn-secondary">
                            Envoyer
                        </button>
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <button id="btnLeaveRoom" class="btn btn-danger">
                        ← Quitter la salle
                    </button>
                </div>
            </section>
        `;

        this._setupWaitingRoomEvents();

        // Remplir le sélecteur de niveaux pour l'hôte
        if (isHost) {
            try {
                const select = document.getElementById('hostLevelSelect');
                if (select) {
                    // Récupérer la progression
                    let progress;
                    if (typeof window.loadProgress === 'function') {
                        progress = window.loadProgress();
                    } else {
                        // Fallback minimal en lisant localStorage directement
                        const raw = localStorage.getItem('hp_logic_progress');
                        const parsed = raw ? JSON.parse(raw) : { unlockedLevel: 1 };
                        const u = Number(parsed.unlockedLevel);
                        progress = { unlockedLevel: Number.isFinite(u) && u >= 1 ? u : 1 };
                    }
                    const unlocked = Math.max(1, Math.min(progress.unlockedLevel || 1, 12));

                    // Peupler les options 1..unlocked
                    select.innerHTML = '';
                    for (let i = 1; i <= unlocked; i++) {
                        const opt = document.createElement('option');
                        opt.value = String(i);
                        opt.textContent = `Niveau ${i}`;
                        select.appendChild(opt);
                    }
                    // Par défaut: niveau le plus élevé débloqué
                    select.value = String(unlocked);
                }
            } catch (e) {
                console.warn('⚠️ Échec du remplissage du sélecteur de niveaux hôte:', e);
            }
        }
    }

    _renderPlayersList(players) {
        return players.map(player => `
            <div class="player-item ${player.ready ? 'ready' : ''}">
                <span class="player-name">
                    ${player.isHost ? '👑 ' : ''}${player.username}
                </span>
                <span class="player-status">
                    ${player.isHost ? 'Hôte' : (player.ready ? '✅ Prêt' : '⏳ En attente')}
                </span>
            </div>
        `).join('');
    }

    _setupWaitingRoomEvents() {
        // Copier le code de salle
        const btnCopy = document.getElementById('btnCopyCode');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                const roomCode = window.multiplayerClient.getRoomCode();
                navigator.clipboard.writeText(roomCode).then(() => {
                    this.showStatus('✅ Code copié !', 'success');
                });
            });
        }

        // Démarrer la partie (hôte)
        const btnStart = document.getElementById('btnStartGame');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                let requestedLevel;
                const select = document.getElementById('hostLevelSelect');
                if (select) {
                    const v = parseInt(select.value, 10);
                    if (Number.isFinite(v)) requestedLevel = v;
                } else if (typeof window.loadProgress === 'function') {
                    const p = window.loadProgress();
                    requestedLevel = Math.max(1, Math.min(p.unlockedLevel || 1, 12));
                } else {
                    requestedLevel = 1;
                }
                window.multiplayerClient.startGame(requestedLevel);
            });
        }

        // Toggle prêt (joueur)
        const btnReady = document.getElementById('btnToggleReady');
        if (btnReady) {
            btnReady.addEventListener('click', () => {
                window.multiplayerClient.toggleReady();
            });
        }

        // Quitter la salle
        document.getElementById('btnLeaveRoom').addEventListener('click', () => {
            window.multiplayerClient.leaveRoom();
            location.hash = '#multiplayer';
        });

        // Chat
        const chatInput = document.getElementById('chatInput');
        const btnSend = document.getElementById('btnSendMessage');

        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                window.multiplayerClient.sendChatMessage(message);
                chatInput.value = '';
            }
        };

        btnSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // ============================================
    // ACTIONS
    // ============================================

    async createRoom() {
        const username = document.getElementById('hostUsername').value.trim();
        if (!username) {
            this.showStatus('❌ Veuillez entrer votre nom', 'error');
            return;
        }

        try {
            this.showStatus('🔄 Connexion au serveur...', 'info');
            await window.multiplayerClient.connect(username);

            this.showStatus('🔄 Création de la salle...', 'info');
            const data = await window.multiplayerClient.createRoom();

            this.renderWaitingRoom(data.roomCode, data.players, true);
            this.setupMultiplayerEvents();
        } catch (error) {
            this.showStatus(`❌ Erreur: ${error.message}`, 'error');
        }
    }

    async joinRoom() {
        const username = document.getElementById('joinUsername').value.trim();
        const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();

        if (!username) {
            this.showStatus('❌ Veuillez entrer votre nom', 'error');
            return;
        }

        if (!roomCode || roomCode.length !== 6) {
            this.showStatus('❌ Code de salle invalide', 'error');
            return;
        }

        try {
            this.showStatus('🔄 Connexion au serveur...', 'info');
            await window.multiplayerClient.connect(username);

            this.showStatus('🔄 Connexion à la salle...', 'info');
            const data = await window.multiplayerClient.joinRoom(roomCode);

            this.renderWaitingRoom(data.roomCode, data.players, false);
            this.setupMultiplayerEvents();
        } catch (error) {
            this.showStatus(`❌ ${error.message}`, 'error');
        }
    }

    // ============================================
    // ÉVÉNEMENTS MULTIJOUEUR
    // ============================================

    setupMultiplayerEvents() {
        // Éviter de configurer les événements plusieurs fois
        if (this.eventsSetup) {
            console.log('⚠️ Événements multijoueur déjà configurés, skip');
            return;
        }

        console.log('✅ Configuration des événements multijoueur');
        this.eventsSetup = true;

        // Joueur rejoint
        window.multiplayerClient.on('player-joined', (data) => {
            this.updatePlayersList(data.players);
            this.addChatMessage('Système', `${data.player.username} a rejoint la salle`, true);
        });

        // Joueur quitte
        window.multiplayerClient.on('player-left', (data) => {
            this.updatePlayersList(data.players);
            if (data.newHost) {
                this.isHost = (window.multiplayerClient.socket.id === data.newHost);
                this.renderWaitingRoom(
                    window.multiplayerClient.getRoomCode(),
                    data.players,
                    this.isHost
                );
            }
        });

        // Statut prêt changé
        window.multiplayerClient.on('player-ready-changed', (data) => {
            this.updatePlayersList(data.players);
        });

        // Partie démarrée
        window.multiplayerClient.on('game-started', (data) => {
            this.addChatMessage('Système', '🎮 La partie commence !', true);

            // Activer la synchronisation multijoueur
            if (window.multiplayerSync) {
                window.multiplayerSync.enableMultiplayer(this.isHost);
            }

            setTimeout(() => {
                location.hash = `#play-${data.level}`;
            }, 1000);
        });

        // Message de chat
        window.multiplayerClient.on('chat-message', (data) => {
            this.addChatMessage(data.username, data.message, false);
        });

        // Erreur de démarrage
        window.multiplayerClient.on('start-error', (data) => {
            this.showStatus(`❌ ${data.error}`, 'error');
        });

        // Joueur a complété un niveau
        window.multiplayerClient.on('player-completed-level', (data) => {
            this.addChatMessage('Système',
                `✅ ${data.username} a complété le niveau ${data.levelId} en ${data.time}s !`,
                true
            );
        });
    }

    // ============================================
    // MISE À JOUR DE L'UI
    // ============================================

    updatePlayersList(players) {
        this.currentPlayers = players;
        const playersList = document.getElementById('playersList');
        if (playersList) {
            playersList.innerHTML = this._renderPlayersList(players);
        }
    }

    addChatMessage(username, message, isSystem = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isSystem ? 'system' : ''}`;
        messageDiv.innerHTML = `
            <span class="chat-username">${username}:</span>
            <span class="chat-text">${this._escapeHtml(message)}</span>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('connectionStatus');
        if (status) {
            status.textContent = message;
            status.className = `status-message ${type}`;
            status.style.display = 'block';
        }
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // ÉCRAN DE VICTOIRE COLLABORATIVE
    // ============================================

    showCollaborativeVictory(levelData, teamStats) {
        const app = document.getElementById('app');

        const stats = teamStats || {
            totalTime: 0,
            gatesPlaced: 0,
            wiresConnected: 0,
            players: []
        };

        app.innerHTML = `
            <section class="section victory-screen">
                <div class="victory-container">
                    <h1 class="victory-title">🎉 Victoire d'Équipe ! 🎉</h1>
                    <h2 class="victory-subtitle">${levelData.title}</h2>

                    <div class="victory-message">
                        <p>✨ Félicitations ! Votre équipe a réussi le défi ! ✨</p>
                    </div>

                    <div class="team-stats-container">
                        <h3>📊 Statistiques d'Équipe</h3>

                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">⏱️</div>
                                <div class="stat-value">${this._formatTime(stats.totalTime)}</div>
                                <div class="stat-label">Temps total</div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">⚡</div>
                                <div class="stat-value">${stats.gatesPlaced}</div>
                                <div class="stat-label">Portes placées</div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">🔗</div>
                                <div class="stat-value">${stats.wiresConnected}</div>
                                <div class="stat-label">Fils connectés</div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">👥</div>
                                <div class="stat-value">${stats.players.length}</div>
                                <div class="stat-label">Joueurs</div>
                            </div>
                        </div>

                        <div class="players-contribution">
                            <h4>🌟 Contributions des joueurs</h4>
                            <div class="contribution-list">
                                ${stats.players.map(player => `
                                    <div class="contribution-item">
                                        <span class="player-name">${this._escapeHtml(player.username)}</span>
                                        <span class="player-contribution">
                                            ${player.gatesPlaced || 0} portes, ${player.wiresConnected || 0} fils
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="victory-actions">
                        <button id="btnNextLevel" class="btn btn-primary">
                            Niveau suivant →
                        </button>
                        <button id="btnBackToLobby" class="btn btn-secondary">
                            Retour au lobby
                        </button>
                        <button id="btnBackToMenu" class="btn btn-secondary">
                            Menu principal
                        </button>
                    </div>
                </div>
            </section>
        `;

        // Ajouter les styles CSS pour l'écran de victoire
        this._addVictoryStyles();

        // Événements
        document.getElementById('btnNextLevel')?.addEventListener('click', () => {
            // Marquer le niveau comme complété avant de naviguer
            if (window.markVictory) {
                window.markVictory(levelData.id);
            }
            
            const nextLevel = levelData.id + 1;
            if (nextLevel <= 12) {
                location.hash = `#play-${nextLevel}`;
            } else {
                location.hash = '#levels';
            }
        });

        document.getElementById('btnBackToLobby')?.addEventListener('click', () => {
            // Marquer le niveau comme complété avant de naviguer
            if (window.markVictory) {
                window.markVictory(levelData.id);
            }
            location.hash = '#multiplayer';
        });

        document.getElementById('btnBackToMenu')?.addEventListener('click', () => {
            // Marquer le niveau comme complété avant de naviguer
            if (window.markVictory) {
                window.markVictory(levelData.id);
            }
            if (window.multiplayerClient) {
                window.multiplayerClient.leaveRoom();
            }
            location.hash = '#levels';
        });
    }

    _formatTime(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    _addVictoryStyles() {
        if (document.getElementById('victory-styles')) return;

        const style = document.createElement('style');
        style.id = 'victory-styles';
        style.textContent = `
            .victory-screen {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .victory-container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 800px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: victoryPop 0.5s ease-out;
            }

            @keyframes victoryPop {
                0% { transform: scale(0.8); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }

            .victory-title {
                font-size: 3em;
                text-align: center;
                color: #667eea;
                margin-bottom: 10px;
                animation: bounce 1s infinite;
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            .victory-subtitle {
                text-align: center;
                color: #764ba2;
                margin-bottom: 20px;
            }

            .victory-message {
                text-align: center;
                font-size: 1.2em;
                color: #555;
                margin-bottom: 30px;
            }

            .team-stats-container {
                background: #f8f9fa;
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
            }

            .team-stats-container h3 {
                text-align: center;
                color: #667eea;
                margin-bottom: 20px;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .stat-icon {
                font-size: 2.5em;
                margin-bottom: 10px;
            }

            .stat-value {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 5px;
            }

            .stat-label {
                color: #888;
                font-size: 0.9em;
            }

            .players-contribution h4 {
                color: #764ba2;
                margin-bottom: 15px;
            }

            .contribution-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .contribution-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }

            .player-name {
                font-weight: bold;
                color: #667eea;
            }

            .player-contribution {
                color: #888;
                font-size: 0.9em;
            }

            .victory-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .victory-actions .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1em;
            }

            .victory-actions .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
            }

            .victory-actions .btn:active {
                transform: translateY(0);
            }

            .victory-actions .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .victory-actions .btn-secondary {
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
        `;
        document.head.appendChild(style);
    }
}

// Instance globale
window.multiplayerUI = new MultiplayerUI();

