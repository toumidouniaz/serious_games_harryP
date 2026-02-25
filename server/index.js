// ============================================
// Serveur Node.js + Socket.io
// Hogwarts Logic Academy - Multijoueur
// ============================================

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuration CORS
app.use(cors());

// Servir les fichiers statiques du frontend
const STATIC_DIR = path.join(__dirname, '..');
app.use(express.static(STATIC_DIR));

// Route par défaut pour renvoyer index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// Configuration Socket.io avec CORS
const io = new Server(server, {
    cors: {
        origin: "*", // En production, spécifier le domaine exact
        methods: ["GET", "POST"]
    }
});

// ============================================
// GESTION DES SALLES
// ============================================

// Structure: { roomCode: { players: Map, createdAt: Date, gameState: {} } }
const activeRooms = new Map();

// Génération de code de salle unique (6 caractères alphanumériques)
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (activeRooms.has(code)); // Assurer l'unicité
    return code;
}

// Créer une nouvelle salle
function createRoom(hostSocketId, hostUsername) {
    const roomCode = generateRoomCode();
    const room = {
        code: roomCode,
        host: hostSocketId,
        players: new Map(),
        createdAt: new Date(),
        gameState: {
            started: false,
            currentLevel: null,
            playerProgress: new Map()
        }
    };
    
    // Ajouter l'hôte comme premier joueur
    room.players.set(hostSocketId, {
        id: hostSocketId,
        username: hostUsername,
        isHost: true,
        ready: false,
        joinedAt: new Date()
    });
    
    activeRooms.set(roomCode, room);
    console.log(`✅ Salle créée: ${roomCode} par ${hostUsername}`);
    return room;
}

// Rejoindre une salle existante
function joinRoom(roomCode, socketId, username) {
    const room = activeRooms.get(roomCode);
    if (!room) {
        return { success: false, error: 'Salle introuvable' };
    }
    
    if (room.gameState.started) {
        return { success: false, error: 'La partie a déjà commencé' };
    }
    
    if (room.players.size >= 4) { // Limite de 4 joueurs
        return { success: false, error: 'Salle pleine' };
    }
    
    room.players.set(socketId, {
        id: socketId,
        username: username,
        isHost: false,
        ready: false,
        joinedAt: new Date()
    });
    
    console.log(`✅ ${username} a rejoint la salle ${roomCode}`);
    return { success: true, room };
}

// Quitter une salle
function leaveRoom(socketId) {
    for (const [roomCode, room] of activeRooms.entries()) {
        if (room.players.has(socketId)) {
            const player = room.players.get(socketId);
            room.players.delete(socketId);
            
            console.log(`👋 ${player.username} a quitté la salle ${roomCode}`);
            
            // Si la salle est vide, la supprimer
            if (room.players.size === 0) {
                activeRooms.delete(roomCode);
                console.log(`🗑️ Salle ${roomCode} supprimée (vide)`);
            } 
            // Si l'hôte part, assigner un nouvel hôte
            else if (room.host === socketId) {
                const newHost = Array.from(room.players.values())[0];
                newHost.isHost = true;
                room.host = newHost.id;
                console.log(`👑 Nouvel hôte: ${newHost.username}`);
                return { roomCode, newHost: newHost.id, players: Array.from(room.players.values()) };
            }
            
            return { roomCode, players: Array.from(room.players.values()) };
        }
    }
    return null;
}

// ============================================
// ÉVÉNEMENTS SOCKET.IO
// ============================================

io.on('connection', (socket) => {
    console.log(`🔌 Nouvelle connexion: ${socket.id}`);
    
    // Événement: Créer une salle
    socket.on('create-room', (data) => {
        const { username } = data;
        const room = createRoom(socket.id, username || 'Joueur');
        socket.join(room.code);
        
        socket.emit('room-created', {
            roomCode: room.code,
            players: Array.from(room.players.values())
        });
    });
    
    // Événement: Rejoindre une salle
    socket.on('join-room', (data) => {
        const { roomCode, username } = data;
        const result = joinRoom(roomCode.toUpperCase(), socket.id, username || 'Joueur');

        if (!result.success) {
            socket.emit('join-error', { error: result.error });
            return;
        }

        socket.join(roomCode.toUpperCase());

        // Notifier le joueur
        socket.emit('room-joined', {
            roomCode: roomCode.toUpperCase(),
            players: Array.from(result.room.players.values())
        });

        // Notifier tous les autres joueurs de la salle
        socket.to(roomCode.toUpperCase()).emit('player-joined', {
            player: result.room.players.get(socket.id),
            players: Array.from(result.room.players.values())
        });
    });

    // Événement: Changer le statut "prêt"
    socket.on('toggle-ready', (data) => {
        const { roomCode } = data;
        const room = activeRooms.get(roomCode);

        if (room && room.players.has(socket.id)) {
            const player = room.players.get(socket.id);
            player.ready = !player.ready;

            io.to(roomCode).emit('player-ready-changed', {
                playerId: socket.id,
                ready: player.ready,
                players: Array.from(room.players.values())
            });
        }
    });

    // Événement: Démarrer la partie (hôte uniquement)
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        const room = activeRooms.get(roomCode);

        if (room && room.host === socket.id) {
            // Vérifier que tous les joueurs sont prêts
            const allReady = Array.from(room.players.values())
                .filter(p => !p.isHost)
                .every(p => p.ready);

            if (allReady || room.players.size === 1) {
                // Déterminer le niveau de départ demandé par l'hôte
                const TOTAL_LEVELS = 17; // Doit correspondre au nombre de niveaux côté client
                let requested = Number.isFinite(Number(data.requestedStartLevel)) ? parseInt(data.requestedStartLevel, 10) : NaN;
                if (!Number.isFinite(requested)) requested = 1;
                const chosenLevel = Math.min(Math.max(requested, 1), TOTAL_LEVELS);

                room.gameState.started = true;
                room.gameState.currentLevel = chosenLevel;

                io.to(roomCode).emit('game-started', {
                    level: chosenLevel,
                    players: Array.from(room.players.values())
                });

                console.log(`🎮 Partie démarrée dans la salle ${roomCode} au niveau ${chosenLevel}`);
            } else {
                socket.emit('start-error', { error: 'Tous les joueurs doivent être prêts' });
            }
        }
    });

    // Événement: Synchronisation de l'état du jeu
    socket.on('sync-game-state', (data) => {
        const { roomCode, gameState } = data;
        socket.to(roomCode).emit('game-state-updated', gameState);
    });

    // Événement: Niveau complété par un joueur
    socket.on('level-completed', (data) => {
        const { roomCode, levelId, time, teamStats } = data;
        const room = activeRooms.get(roomCode);

        if (room) {
            const player = room.players.get(socket.id);
            io.to(roomCode).emit('player-completed-level', {
                playerId: socket.id,
                username: player.username,
                levelId,
                time,
                teamStats
            });
        }
    });

    // Événement: Message de chat
    socket.on('chat-message', (data) => {
        const { roomCode, message } = data;
        const room = activeRooms.get(roomCode);

        if (room && room.players.has(socket.id)) {
            const player = room.players.get(socket.id);
            io.to(roomCode).emit('chat-message', {
                username: player.username,
                message,
                timestamp: new Date()
            });
        }
    });

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - PORTES
    // ============================================

    socket.on('sync-add-gate', (data) => {
        const { roomCode, gate } = data;
        const room = activeRooms.get(roomCode);
        const player = room ? room.players.get(socket.id) : null;

        // Diffuser à tous les autres joueurs de la salle
        socket.to(roomCode).emit('gate-added', {
            playerId: socket.id,
            username: player ? player.username : 'Joueur',
            gate: gate
        });
    });

    socket.on('sync-move-gate', (data) => {
        const { roomCode, gateId, x, y } = data;
        socket.to(roomCode).emit('gate-moved', {
            playerId: socket.id,
            gateId,
            x,
            y
        });
    });

    socket.on('sync-remove-gate', (data) => {
        const { roomCode, gateId } = data;
        socket.to(roomCode).emit('gate-removed', {
            playerId: socket.id,
            gateId
        });
    });

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - FILS
    // ============================================

    socket.on('sync-add-wire', (data) => {
        const { roomCode, wire } = data;
        const room = activeRooms.get(roomCode);
        const player = room ? room.players.get(socket.id) : null;

        socket.to(roomCode).emit('wire-added', {
            playerId: socket.id,
            username: player ? player.username : 'Joueur',
            wire: wire
        });
    });

    socket.on('sync-remove-wire', (data) => {
        const { roomCode, wireId } = data;
        socket.to(roomCode).emit('wire-removed', {
            playerId: socket.id,
            wireId
        });
    });

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - VALEURS D'ENTRÉE
    // ============================================

    socket.on('sync-input-value', (data) => {
        const { roomCode, inputId, value } = data;
        const room = activeRooms.get(roomCode);
        const player = room ? room.players.get(socket.id) : null;

        // Diffuser à tous les autres joueurs de la salle
        socket.to(roomCode).emit('input-value-changed', {
            playerId: socket.id,
            username: player ? player.username : 'Joueur',
            inputId,
            value
        });
    });

    socket.on('sync-output-values', (data) => {
        const { roomCode, outputs } = data;
        const room = activeRooms.get(roomCode);
        const player = room ? room.players.get(socket.id) : null;

        // Diffuser à tous les autres joueurs de la salle
        socket.to(roomCode).emit('output-values-changed', {
            playerId: socket.id,
            username: player ? player.username : 'Joueur',
            outputs
        });
    });

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - CURSEURS
    // ============================================

    socket.on('sync-cursor', (data) => {
        const { roomCode, x, y } = data;
        const room = activeRooms.get(roomCode);
        if (room) {
            const player = room.players.get(socket.id);
            if (player) {
                // Diffuser la position du curseur aux autres joueurs
                socket.to(roomCode).emit('cursor-moved', {
                    playerId: socket.id,
                    username: player.username,
                    x,
                    y
                });
            }
        }
    });

    // ============================================
    // SYNCHRONISATION TEMPS RÉEL - ÉTAT COMPLET
    // ============================================

    socket.on('sync-full-state', (data) => {
        const { roomCode, state } = data;
        const room = activeRooms.get(roomCode);
        if (room) {
            // Sauvegarder l'état dans la salle
            room.gameState.fullState = state;
            // Diffuser aux autres joueurs
            socket.to(roomCode).emit('full-state-updated', {
                playerId: socket.id,
                state: state
            });
        }
    });

    socket.on('request-full-state', (data) => {
        const { roomCode } = data;
        const room = activeRooms.get(roomCode);
        if (room && room.gameState.fullState) {
            // Envoyer l'état complet au joueur qui le demande
            socket.emit('full-state-received', {
                state: room.gameState.fullState
            });
        }
    });

    // Événement: Déconnexion
    socket.on('disconnect', () => {
        console.log(`🔌 Déconnexion: ${socket.id}`);
        const result = leaveRoom(socket.id);

        if (result) {
            io.to(result.roomCode).emit('player-left', {
                players: result.players,
                newHost: result.newHost
            });
        }
    });

    // Événement: Quitter manuellement une salle
    socket.on('leave-room', (data) => {
        const { roomCode } = data;
        const result = leaveRoom(socket.id);

        if (result) {
            socket.leave(roomCode);
            socket.emit('left-room');

            io.to(result.roomCode).emit('player-left', {
                players: result.players,
                newHost: result.newHost
            });
        }
    });

    // Événement: Obtenir la liste des salles actives
    socket.on('get-active-rooms', () => {
        const rooms = Array.from(activeRooms.values()).map(room => ({
            code: room.code,
            playerCount: room.players.size,
            maxPlayers: 4,
            started: room.gameState.started
        }));

        socket.emit('active-rooms', rooms);
    });
});

// ============================================
// NETTOYAGE AUTOMATIQUE DES SALLES INACTIVES
// ============================================

// Nettoyer les salles vides toutes les 5 minutes
setInterval(() => {
    const now = new Date();
    for (const [roomCode, room] of activeRooms.entries()) {
        // Supprimer les salles vides depuis plus de 5 minutes
        if (room.players.size === 0) {
            const inactiveTime = (now - room.createdAt) / 1000 / 60;
            if (inactiveTime > 5) {
                activeRooms.delete(roomCode);
                console.log(`🗑️ Salle ${roomCode} supprimée (inactive)`);
            }
        }
    }
}, 5 * 60 * 1000);

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🪄 Hogwarts Logic Academy Server 🪄     ║
║                                            ║
║   Serveur Socket.io démarré !              ║
║   Port: ${PORT}                              ║
║   URL: http://localhost:${PORT}              ║
╚════════════════════════════════════════════╝
    `);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non gérée:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promesse rejetée:', error);
});

