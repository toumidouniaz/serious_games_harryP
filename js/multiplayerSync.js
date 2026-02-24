// ============================================
// Gestionnaire de synchronisation multijoueur
// Hogwarts Logic Academy
// ============================================

class MultiplayerSync {
    constructor() {
        this.isMultiplayerMode = false;
        this.isHost = false;
        this.remoteCursors = new Map(); // Map<playerId, {x, y, username}>
        this.syncEnabled = true;
        this.conflictResolution = 'host-priority'; // 'host-priority' ou 'timestamp'
        this.playerContributions = new Map(); // Map<playerId, {username, gatesPlaced, wiresConnected}>
        this.myPlayerId = null;
    }

    // ============================================
    // ACTIVATION/DÉSACTIVATION
    // ============================================

    enableMultiplayer(isHost = false) {
        this.isMultiplayerMode = true;
        this.isHost = isHost;
        this.syncEnabled = true;
        this.playerContributions.clear();

        // Initialiser ma contribution
        if (window.multiplayerClient && window.multiplayerClient.socket) {
            this.myPlayerId = window.multiplayerClient.socket.id;
            this.playerContributions.set(this.myPlayerId, {
                username: window.multiplayerClient.username || 'Moi',
                gatesPlaced: 0,
                wiresConnected: 0
            });
        }

        this.setupEventListeners();
        console.log(`🎮 Mode multijoueur activé (${isHost ? 'Hôte' : 'Invité'})`);
        console.log(`   - isMultiplayerMode: ${this.isMultiplayerMode}`);
        console.log(`   - syncEnabled: ${this.syncEnabled}`);
        console.log(`   - isHost: ${this.isHost}`);
    }

    disableMultiplayer() {
        this.isMultiplayerMode = false;
        this.remoteCursors.clear();
        console.log('🎮 Mode multijoueur désactivé');
    }

    // ============================================
    // CONFIGURATION DES ÉCOUTEURS
    // ============================================

    setupEventListeners() {
        if (!window.multiplayerClient) return;

        const client = window.multiplayerClient;

        // Écouter les événements de synchronisation des portes
        client.on('gate-added', (data) => this.handleRemoteGateAdded(data));
        client.on('gate-moved', (data) => this.handleRemoteGateMoved(data));
        client.on('gate-removed', (data) => this.handleRemoteGateRemoved(data));

        // Écouter les événements de synchronisation des fils
        client.on('wire-added', (data) => this.handleRemoteWireAdded(data));
        client.on('wire-removed', (data) => this.handleRemoteWireRemoved(data));

        // Écouter les événements de curseurs
        client.on('cursor-moved', (data) => this.handleRemoteCursorMoved(data));

        // Écouter les événements de valeurs d'entrée
        client.on('input-value-changed', (data) => this.handleRemoteInputValueChanged(data));

        // Écouter les événements de valeurs de sortie
        client.on('output-values-changed', (data) => this.handleRemoteOutputValuesChanged(data));

        // Écouter les événements d'état complet
        client.on('full-state-updated', (data) => this.handleFullStateUpdated(data));
        client.on('full-state-received', (data) => this.handleFullStateReceived(data));
    }

    // ============================================
    // SYNCHRONISATION DES PORTES - ENVOI
    // ============================================

    syncAddGate(gate) {
        if (!this.isMultiplayerMode || !this.syncEnabled) return;

        // Incrémenter ma contribution SEULEMENT pour les portes logiques (pas INPUT/OUTPUT)
        if (this.myPlayerId && this.playerContributions.has(this.myPlayerId)) {
            if (gate.type !== 'INPUT' && gate.type !== 'OUTPUT') {
                const myStats = this.playerContributions.get(this.myPlayerId);
                myStats.gatesPlaced++;
                console.log(`✅ Ma contribution incrémentée: ${myStats.gatesPlaced} portes`);
            }
        }

        window.multiplayerClient.syncAddGate({
            id: gate.id,
            type: gate.type,
            x: gate.x,
            y: gate.y,
            value: gate.value
        });
    }

    syncMoveGate(gateId, x, y) {
        if (!this.isMultiplayerMode || !this.syncEnabled) return;
        window.multiplayerClient.syncMoveGate(gateId, x, y);
    }

    syncRemoveGate(gateId) {
        if (!this.isMultiplayerMode || !this.syncEnabled) return;
        window.multiplayerClient.syncRemoveGate(gateId);
    }

    // ============================================
    // SYNCHRONISATION DES PORTES - RÉCEPTION
    // ============================================

    handleRemoteGateAdded(data) {
        const { playerId, gate, username } = data;
        console.log(`📥 Porte ajoutée par ${playerId}:`, gate);

        // Tracker la contribution du joueur SEULEMENT pour les portes logiques
        if (gate.type !== 'INPUT' && gate.type !== 'OUTPUT') {
            if (!this.playerContributions.has(playerId)) {
                this.playerContributions.set(playerId, {
                    username: username || 'Joueur',
                    gatesPlaced: 0,
                    wiresConnected: 0
                });
            }
            const playerStats = this.playerContributions.get(playerId);
            playerStats.gatesPlaced++;
            console.log(`✅ Contribution de ${username} incrémentée: ${playerStats.gatesPlaced} portes`);
        }

        // Désactiver temporairement la synchronisation pour éviter une boucle
        this.syncEnabled = false;

        // Ajouter la porte localement (addGate checks for duplicates)
        if (window.gateSystem) {
            const addedGate = window.gateSystem.addGate(gate.type, gate.x, gate.y, gate.id);
            console.log(`✅ Gate added/verified:`, addedGate.id);
        }

        this.syncEnabled = true;
    }

    handleRemoteGateMoved(data) {
        const { playerId, gateId, x, y } = data;
        console.log(`📥 Porte déplacée par ${playerId}:`, gateId, x, y);

        // Désactiver temporairement la synchronisation
        this.syncEnabled = false;

        // Déplacer la porte localement
        if (window.gateSystem) {
            const gate = window.gateSystem.placedGates.find(g => g.id === gateId);
            if (gate) {
                gate.x = x;
                gate.y = y;
                if (gate.element) {
                    gate.element.style.left = `${x}px`;
                    gate.element.style.top = `${y}px`;
                }
                console.log(`✅ Gate ${gateId} moved to (${x}, ${y})`);
                
                // Mettre à jour les positions des fils associés
                if (window.wireSystem) {
                    window.wireSystem.updateGatePosition(gateId);
                    console.log(`✅ Wires updated for gate ${gateId}`);
                }
            }
        }

        this.syncEnabled = true;
    }

    handleRemoteGateRemoved(data) {
        const { playerId, gateId } = data;
        console.log(`📥 Porte supprimée par ${playerId}:`, gateId);

        // Désactiver temporairement la synchronisation
        this.syncEnabled = false;

        // Supprimer la porte localement
        if (window.gateSystem) {
            window.gateSystem.removeGate(gateId);
        }

        this.syncEnabled = true;
    }

    // ============================================
    // SYNCHRONISATION DES FILS - ENVOI
    // ============================================

    syncAddWire(wire) {
        if (!this.isMultiplayerMode || !this.syncEnabled) return;

        // Incrémenter ma contribution
        if (this.myPlayerId && this.playerContributions.has(this.myPlayerId)) {
            const myStats = this.playerContributions.get(this.myPlayerId);
            myStats.wiresConnected++;
            console.log(`✅ Ma contribution incrémentée: ${myStats.wiresConnected} fils`);
        }

        window.multiplayerClient.syncAddWire({
            id: wire.id,
            from: wire.from,
            to: wire.to
        });
    }

    syncRemoveWire(wireId) {
        if (!this.isMultiplayerMode || !this.syncEnabled) return;
        window.multiplayerClient.syncRemoveWire(wireId);
    }

    // ============================================
    // SYNCHRONISATION DES FILS - RÉCEPTION
    // ============================================

    handleRemoteWireAdded(data) {
        const { playerId, wire, username } = data;
        console.log(`📥 Fil ajouté par ${playerId}:`, wire);

        // Tracker la contribution du joueur
        if (!this.playerContributions.has(playerId)) {
            this.playerContributions.set(playerId, {
                username: username || 'Joueur',
                gatesPlaced: 0,
                wiresConnected: 0
            });
        }
        const playerStats = this.playerContributions.get(playerId);
        playerStats.wiresConnected++;
        console.log(`✅ Contribution de ${username} incrémentée: ${playerStats.wiresConnected} fils`);

        this.syncEnabled = false;

        if (window.wireSystem && window.gateSystem) {
            // Get fresh port data to ensure coordinates are correct
            const allPorts = window.gateSystem.getAllPorts();
            
            // Find the matching ports
            const fromPort = allPorts.find(p => 
                p.gateId === wire.from.gateId &&
                p.type === wire.from.type &&
                p.index === wire.from.index
            );
            const toPort = allPorts.find(p => 
                p.gateId === wire.to.gateId &&
                p.type === wire.to.type &&
                p.index === wire.to.index
            );
            
            if (fromPort && toPort) {
                console.log(`✅ Adding wire with fresh port data`);
                window.wireSystem.addWire(fromPort, toPort, wire.id);
                // Update circuit display after adding wire
                if (window.updateCircuitDisplay) {
                    window.updateCircuitDisplay();
                }
            } else {
                console.warn(`⚠️ Could not find matching ports for wire`, wire);
            }
        }

        this.syncEnabled = true;
    }

    handleRemoteWireRemoved(data) {
        const { playerId, wireId } = data;
        console.log(`📥 Fil supprimé par ${playerId}:`, wireId);

        this.syncEnabled = false;

        if (window.wireSystem) {
            window.wireSystem.removeWire(wireId);
        }

        this.syncEnabled = true;
    }

    // ============================================
    // SYNCHRONISATION DES VALEURS D'ENTRÉE
    // ============================================

    handleRemoteInputValueChanged(data) {
        const { playerId, inputId, value, username } = data;
        console.log(`📥 Valeur d'entrée changée par ${username}:`, inputId, value);

        this.syncEnabled = false;

        // Mettre à jour la valeur dans le système de portes
        if (window.gateSystem) {
            const gate = window.gateSystem.getGate(inputId);
            if (gate && gate.type === 'INPUT') {
                gate.value = value;
                console.log(`✅ Input ${inputId} updated to ${value}`);
                
                // Mettre à jour l'interface utilisateur
                const btn = document.getElementById(`input_${inputId}`);
                if (btn) {
                    btn.textContent = `${inputId}: ${value === 1 ? 'ON' : 'OFF'}`;
                    btn.className = value === 1 ? 'btn ok' : 'btn';
                }
                
                // Mettre à jour le calculateur
                if (window.circuitCalculator) {
                    window.circuitCalculator.setGateValue(inputId, value);
                }
            }
        }

        this.syncEnabled = true;

        // Mettre à jour l'affichage du circuit
        if (window.updateCircuitDisplay) {
            window.updateCircuitDisplay();
        }
    }

    handleRemoteOutputValuesChanged(data) {
        const { playerId, outputs, username } = data;
        console.log(`📥 Valeurs de sortie changées par ${username}:`, outputs);

        this.syncEnabled = false;

        // Mettre à jour les valeurs de sortie dans le système de portes
        if (window.gateSystem) {
            for (const [outputId, value] of Object.entries(outputs)) {
                const gate = window.gateSystem.getGate(outputId);
                if (gate && gate.type === 'OUTPUT') {
                    gate.value = value;
                    console.log(`✅ Output ${outputId} updated to ${value}`);
                }
            }
        }

        this.syncEnabled = true;

        // Forcer la mise à jour de l'affichage
        if (window.updateCircuitDisplay) {
            window.updateCircuitDisplay();
        }
    }

    // ============================================
    // SYNCHRONISATION DES CURSEURS
    // ============================================

    syncCursorPosition(x, y) {
        if (!this.isMultiplayerMode) return;
        window.multiplayerClient.syncCursorPosition(x, y);
    }

    handleRemoteCursorMoved(data) {
        const { playerId, username, x, y } = data;

        // Mettre à jour la position du curseur distant
        this.remoteCursors.set(playerId, { x, y, username });

        // Redessiner les curseurs distants
        this.renderRemoteCursors();
    }

    renderRemoteCursors() {
        // Supprimer les anciens curseurs
        document.querySelectorAll('.remote-cursor').forEach(el => el.remove());

        // Dessiner les nouveaux curseurs
        for (const [playerId, cursor] of this.remoteCursors.entries()) {
            const cursorEl = document.createElement('div');
            cursorEl.className = 'remote-cursor';
            cursorEl.style.cssText = `
                position: absolute;
                left: ${cursor.x}px;
                top: ${cursor.y}px;
                width: 20px;
                height: 20px;
                pointer-events: none;
                z-index: 10000;
                transform: translate(-50%, -50%);
            `;
            cursorEl.innerHTML = `
                <div style="
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 15px solid #ff6b6b;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                "></div>
                <div style="
                    position: absolute;
                    top: 20px;
                    left: 10px;
                    background: #ff6b6b;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">${cursor.username}</div>
            `;
            document.body.appendChild(cursorEl);
        }
    }

    // ============================================
    // SYNCHRONISATION DE L'ÉTAT COMPLET
    // ============================================

    syncFullGameState() {
        if (!this.isMultiplayerMode) return;

        const state = this.captureGameState();
        window.multiplayerClient.syncFullGameState(state);
    }

    requestFullGameState() {
        if (!this.isMultiplayerMode) return;
        window.multiplayerClient.requestFullGameState();
    }

    captureGameState() {
        const state = {
            gates: [],
            wires: [],
            timestamp: Date.now()
        };

        // Capturer les portes
        if (window.gateSystem) {
            state.gates = window.gateSystem.placedGates.map(gate => ({
                id: gate.id,
                type: gate.type,
                x: gate.x,
                y: gate.y,
                value: gate.value
            }));
        }

        // Capturer les fils
        if (window.wireSystem) {
            state.wires = window.wireSystem.wires.map(wire => ({
                id: wire.id,
                from: wire.from,
                to: wire.to
            }));
        }

        return state;
    }

    handleFullStateUpdated(data) {
        const { playerId, state } = data;
        console.log(`📥 État complet mis à jour par ${playerId}`);
        this.applyGameState(state);
    }

    handleFullStateReceived(data) {
        const { state } = data;
        console.log(`📥 État complet reçu`);
        this.applyGameState(state);
    }

    applyGameState(state) {
        this.syncEnabled = false;

        // Effacer l'état actuel
        if (window.gateSystem) {
            window.gateSystem.placedGates = [];
            document.querySelectorAll('.placed-gate').forEach(el => el.remove());
        }

        if (window.wireSystem) {
            window.wireSystem.wires = [];
        }

        // Appliquer les portes
        if (state.gates && window.gateSystem) {
            state.gates.forEach(gate => {
                window.gateSystem.addGate(gate.type, gate.x, gate.y, gate.id);
                if (gate.value !== null && gate.value !== undefined) {
                    const addedGate = window.gateSystem.placedGates.find(g => g.id === gate.id);
                    if (addedGate) {
                        addedGate.value = gate.value;
                    }
                }
            });
        }

        // Appliquer les fils
        if (state.wires && window.wireSystem) {
            state.wires.forEach(wire => {
                window.wireSystem.addWire(wire.from, wire.to, wire.id);
            });
        }

        this.syncEnabled = true;

        // Redessiner
        if (window.wireSystem && window.wireSystem.redrawWires) {
            window.wireSystem.redrawWires();
        }
    }

    // ============================================
    // STATISTIQUES DES JOUEURS
    // ============================================

    getPlayerContributions() {
        const contributions = [];
        console.log('📊 Récupération des contributions:', this.playerContributions);
        for (const [playerId, stats] of this.playerContributions.entries()) {
            contributions.push({
                playerId,
                username: stats.username,
                gatesPlaced: stats.gatesPlaced,
                wiresConnected: stats.wiresConnected
            });
        }
        console.log('📊 Contributions retournées:', contributions);
        return contributions;
    }

    // ============================================
    // GESTION DES CONFLITS
    // ============================================

    resolveConflict(localAction, remoteAction) {
        if (this.conflictResolution === 'host-priority') {
            // L'hôte a toujours la priorité
            return this.isHost ? localAction : remoteAction;
        } else if (this.conflictResolution === 'timestamp') {
            // L'action la plus récente gagne
            return localAction.timestamp > remoteAction.timestamp ? localAction : remoteAction;
        }
        return localAction;
    }
}

// Instance globale
window.multiplayerSync = new MultiplayerSync();

