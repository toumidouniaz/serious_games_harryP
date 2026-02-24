// ============================================
// Client Socket.io - Multijoueur
// Hogwarts Logic Academy
// ============================================

class MultiplayerClient {
    constructor(serverUrl) {
        // Choix de l'URL serveur:
        // - En dev (localhost): http://localhost:3001
        // - En prod: même origine que le frontend (window.location.origin)
        if (!serverUrl) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            this.serverUrl = isLocal ? 'http://localhost:3001' : window.location.origin;
        } else {
            this.serverUrl = serverUrl;
        }
        this.socket = null;
        this.currentRoom = null;
        this.username = null;
        this.isConnected = false;
        this.eventHandlers = new Map();
    }

    // ============================================
    // CONNEXION
    // ============================================

    connect(username) {
        return new Promise((resolve, reject) => {
            this.username = username || 'Joueur';
            
            // Charger Socket.io depuis CDN si pas déjà chargé
            if (typeof io === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
                script.onload = () => {
                    this._initializeSocket(resolve, reject);
                };
                script.onerror = () => reject(new Error('Impossible de charger Socket.io'));
                document.head.appendChild(script);
            } else {
                this._initializeSocket(resolve, reject);
            }
        });
    }

    _initializeSocket(resolve, reject) {
        try {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 10
            });

            this.socket.on('connect', () => {
                console.log('✅ Connecté au serveur multijoueur');
                this.isConnected = true;
                this._setupEventListeners();

                // Auto-rejoin si on connaît encore la room et l'username
                if (this.currentRoom && this.username) {
                    console.log('↩️ Tentative de réintégration de la salle après reconnexion:', this.currentRoom);
                    // Écoute une seule fois la réponse pour éviter conflits
                    this.socket.once('room-joined', (data) => {
                        this.currentRoom = data.roomCode;
                        console.log(`✅ Salle réintégrée: ${data.roomCode}`);
                        this._trigger('room-rejoined', data);
                    });
                    this.socket.once('join-error', (data) => {
                        console.warn('⚠️ Réintégration échouée:', data.error);
                        this.currentRoom = null;
                    });
                    this.socket.emit('join-room', { roomCode: this.currentRoom, username: this.username });
                }

                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Erreur de connexion:', error);
                this.isConnected = false;
                if (reject) reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 Déconnecté du serveur:', reason);
                this.isConnected = false;
                this._trigger('disconnected');
                
                // Si déconnecté involontairement, essayer de se reconnecter
                if (reason === 'io server disconnect') {
                    console.log('⚠️ Serveur a fermé la connexion, tentative de reconnexion...');
                    setTimeout(() => {
                        if (this.socket && !this.socket.connected) {
                            this.socket.connect();
                        }
                    }, 2000);
                }
            });

            this.socket.on('reconnect_attempt', () => {
                console.log('🔄 Tentative de reconnexion...');
            });

            this.socket.on('reconnect', () => {
                console.log('✅ Reconnecté au serveur');
            });

            this.socket.on('reconnect_failed', () => {
                console.error('❌ Échec de la reconnexion');
            });
        } catch (error) {
            reject(error);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentRoom = null;
        }
    }

    // ============================================
    // GESTION DES SALLES
    // ============================================

    createRoom() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Non connecté au serveur'));
                return;
            }

            this.socket.once('room-created', (data) => {
                this.currentRoom = data.roomCode;
                console.log(`🎮 Salle créée: ${data.roomCode}`);
                resolve(data);
            });

            this.socket.emit('create-room', { username: this.username });
        });
    }

    joinRoom(roomCode) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Non connecté au serveur'));
                return;
            }

            this.socket.once('room-joined', (data) => {
                this.currentRoom = data.roomCode;
                console.log(`✅ Salle rejointe: ${data.roomCode}`);
                resolve(data);
            });

            this.socket.once('join-error', (data) => {
                console.error(`❌ Erreur: ${data.error}`);
                reject(new Error(data.error));
            });

            this.socket.emit('join-room', { roomCode, username: this.username });
        });
    }

    leaveRoom() {
        if (this.currentRoom && this.socket) {
            this.socket.emit('leave-room', { roomCode: this.currentRoom });
            this.currentRoom = null;
        }
    }

    toggleReady() {
        if (this.currentRoom && this.socket) {
            this.socket.emit('toggle-ready', { roomCode: this.currentRoom });
        }
    }

    startGame(requestedStartLevel) {
        if (this.currentRoom && this.socket) {
            this.socket.emit('start-game', { roomCode: this.currentRoom, requestedStartLevel });
        }
    }

    getActiveRooms() {
        return new Promise((resolve) => {
            if (!this.isConnected) {
                resolve([]);
                return;
            }

            this.socket.once('active-rooms', (rooms) => {
                resolve(rooms);
            });

            this.socket.emit('get-active-rooms');
        });
    }

    // ============================================
    // ÉVÉNEMENTS DE JEU
    // ============================================

    syncGameState(gameState) {
        if (this.currentRoom && this.socket) {
            this.socket.emit('sync-game-state', {
                roomCode: this.currentRoom,
                gameState
            });
        }
    }

    levelCompleted(levelId, time, teamStats) {
        if (this.currentRoom && this.socket) {
            this.socket.emit('level-completed', {
                roomCode: this.currentRoom,
                levelId,
                time,
                teamStats
            });
        }
    }

    sendChatMessage(message) {
        if (this.currentRoom && this.socket) {
            this.socket.emit('chat-message', {
                roomCode: this.currentRoom,
                message
            });
        }
    }

    // ============================================
    // GESTION DES ÉVÉNEMENTS
    // ============================================

    _setupEventListeners() {
        // Joueur a rejoint
        this.socket.on('player-joined', (data) => {
            console.log('👤 Nouveau joueur:', data.player.username);
            this._trigger('player-joined', data);
        });

        // Joueur a quitté
        this.socket.on('player-left', (data) => {
            console.log('👋 Joueur parti');
            this._trigger('player-left', data);
        });

        // Statut "prêt" changé
        this.socket.on('player-ready-changed', (data) => {
            this._trigger('player-ready-changed', data);
        });

        // Partie démarrée
        this.socket.on('game-started', (data) => {
            console.log('🎮 Partie démarrée !');
            this._trigger('game-started', data);
        });

        // État du jeu mis à jour
        this.socket.on('game-state-updated', (gameState) => {
            this._trigger('game-state-updated', gameState);
        });

        // Joueur a complété un niveau
        this.socket.on('player-completed-level', (data) => {
            console.log(`✅ ${data.username} a complété le niveau ${data.levelId}`);
            this._trigger('player-completed-level', data);

            // Marquer la progression immédiatement pour TOUS les joueurs
            if (typeof window.markVictory === 'function' && Number.isFinite(data.levelId)) {
                try {
                    window.markVictory(data.levelId);
                } catch (e) {
                    console.warn('⚠️ markVictory a échoué côté client sur player-completed-level:', e);
                }
            }

            // Afficher l'écran de victoire pour tous les joueurs
            if (window.multiplayerUI && window.currentLevel) {
                // Utiliser les statistiques reçues ou les calculer localement
                const teamStats = data.teamStats || {
                    totalTime: data.time || 0,
                    gatesPlaced: window.gateSystem ? window.gateSystem.placedGates.length : 0,
                    wiresConnected: window.wireSystem ? window.wireSystem.wires.length : 0,
                    players: window.multiplayerSync ? window.multiplayerSync.getPlayerContributions() : []
                };

                // Afficher après un court délai pour synchroniser
                setTimeout(() => {
                    window.multiplayerUI.showCollaborativeVictory(window.currentLevel, teamStats);
                }, 500);
            }
        });

        // Message de chat
        this.socket.on('chat-message', (data) => {
            this._trigger('chat-message', data);
        });

        // Erreur de démarrage
        this.socket.on('start-error', (data) => {
            this._trigger('start-error', data);
        });

        // Salle quittée
        this.socket.on('left-room', () => {
            this.currentRoom = null;
            this._trigger('left-room');
        });

        // ============================================
        // ÉVÉNEMENTS DE SYNCHRONISATION DES PORTES
        // ============================================

        // Porte ajoutée
        this.socket.on('gate-added', (data) => {
            console.log('📥 Porte ajoutée par', data.username);
            this._trigger('gate-added', data);
        });

        // Porte supprimée
        this.socket.on('gate-removed', (data) => {
            console.log('📥 Porte supprimée par', data.username);
            this._trigger('gate-removed', data);
        });

        // Porte déplacée
        this.socket.on('gate-moved', (data) => {
            console.log('📥 Porte déplacée par', data.username);
            this._trigger('gate-moved', data);
        });

        // Connexion ajoutée
        this.socket.on('connection-added', (data) => {
            console.log('📥 Connexion ajoutée par', data.username);
            this._trigger('connection-added', data);
        });

        // Connexion supprimée
        this.socket.on('connection-removed', (data) => {
            console.log('📥 Connexion supprimée par', data.username);
            this._trigger('connection-removed', data);
        });

        // ============================================
        // ÉVÉNEMENTS DE SYNCHRONISATION DES FILS
        // ============================================

        // Fil ajouté
        this.socket.on('wire-added', (data) => {
            console.log('📥 Fil ajouté par', data.playerId);
            this._trigger('wire-added', data);
        });

        // Fil supprimé
        this.socket.on('wire-removed', (data) => {
            console.log('📥 Fil supprimé par', data.playerId);
            this._trigger('wire-removed', data);
        });

        // Valeur d'entrée changée
        this.socket.on('input-value-changed', (data) => {
            console.log('📥 Valeur d\'entrée changée:', data.inputId, data.value);
            this._trigger('input-value-changed', data);
        });

        // Valeurs de sortie changées
        this.socket.on('output-values-changed', (data) => {
            console.log('📥 Valeurs de sortie changées:', data.outputs);
            this._trigger('output-values-changed', data);
        });
    }

    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    off(eventName, handler) {
        if (this.eventHandlers.has(eventName)) {
            const handlers = this.eventHandlers.get(eventName);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    _trigger(eventName, data) {
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Erreur dans le handler ${eventName}:`, error);
                }
            });
        }
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    isInRoom() {
        return this.currentRoom !== null;
    }

    getRoomCode() {
        return this.currentRoom;
    }

    getUsername() {
        return this.username;
    }

    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - PORTES
    // ============================================

    syncAddGate(gateData) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-add-gate', {
            roomCode: this.currentRoom,
            gate: gateData
        });
    }

    syncMoveGate(gateId, x, y) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-move-gate', {
            roomCode: this.currentRoom,
            gateId,
            x,
            y
        });
    }

    syncRemoveGate(gateId) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-remove-gate', {
            roomCode: this.currentRoom,
            gateId
        });
    }

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - FILS
    // ============================================

    syncAddWire(wireData) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-add-wire', {
            roomCode: this.currentRoom,
            wire: wireData
        });
    }

    syncRemoveWire(wireId) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-remove-wire', {
            roomCode: this.currentRoom,
            wireId
        });
    }

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - VALEURS D'ENTRÉE
    // ============================================

    syncInputValue(inputId, value) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-input-value', {
            roomCode: this.currentRoom,
            inputId,
            value
        });
    }

    syncOutputValues(outputs) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-output-values', {
            roomCode: this.currentRoom,
            outputs
        });
    }

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - CURSEURS
    // ============================================

    syncCursorPosition(x, y) {
        if (!this.isConnected || !this.currentRoom) return;
        // Throttle pour éviter trop d'événements
        if (!this._lastCursorUpdate || Date.now() - this._lastCursorUpdate > 50) {
            this.socket.emit('sync-cursor', {
                roomCode: this.currentRoom,
                x,
                y
            });
            this._lastCursorUpdate = Date.now();
        }
    }

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - ÉTAT COMPLET
    // ============================================

    syncFullGameState(gameState) {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('sync-full-state', {
            roomCode: this.currentRoom,
            state: gameState
        });
    }

    requestFullGameState() {
        if (!this.isConnected || !this.currentRoom) return;
        this.socket.emit('request-full-state', {
            roomCode: this.currentRoom
        });
    }
}

// Instance globale
window.multiplayerClient = new MultiplayerClient();

