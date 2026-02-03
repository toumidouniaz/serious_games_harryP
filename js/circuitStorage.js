// ============================================
// circuitStorage.js - UPDATED WITH DATABASE SUPPORT
// ============================================

class CircuitStorage {
    constructor() {
        this.STORAGE_KEY = "hp_saved_circuits";
        this.currentCircuitId = null;
    }

    // =============================
    // SERIALIZATION
    // =============================

    serializeCircuit(name, description = "") {
        const circuit = {
            id: this.currentCircuitId || Date.now(),
            name: name,
            description: description,
            timestamp: new Date().toISOString(),
            gates: this.serializeGates(),
            wires: this.serializeWires(),
            version: "1.0"
        };
        return circuit;
    }

    serializeGates() {
        if (!window.gateSystem) return [];
        return window.gateSystem.placedGates.map(gate => ({
            id: gate.id,
            type: gate.type,
            x: gate.x,
            y: gate.y,
            value: gate.value
        }));
    }

    serializeWires() {
        if (!window.wireSystem) return [];
        return window.wireSystem.wires.map(wire => ({
            id: wire.id,
            from: {
                gateId: wire.from.gateId,
                type: wire.from.type,
                index: wire.from.index
            },
            to: {
                gateId: wire.to.gateId,
                type: wire.to.type,
                index: wire.to.index
            }
        }));
    }

    // =============================
    // STORAGE (DB if logged in, localStorage if not)
    // =============================

    async saveCircuit(name, description = "", levelId = null) {
        try {
            const circuit = this.serializeCircuit(name, description);
            const userId = window.currentUserId;

            // If user is logged in and DatabaseService exists, save to DB
            if (userId && window.DatabaseService) {
                try {
                    const result = await window.DatabaseService.saveCircuit(userId, {
                        levelId: levelId,
                        name: circuit.name,
                        circuitJson: {
                            gates: circuit.gates,
                            wires: circuit.wires,
                            version: circuit.version
                        }
                    });

                    this.currentCircuitId = result.id;
                    return { success: true, circuit: result, source: 'database' };
                } catch (dbError) {
                    console.warn("⚠️ DB save failed, falling back to localStorage:", dbError);
                    // Fall through to localStorage
                }
            }

            // Fallback to localStorage
            const saved = this.getAllCircuitsLocal();
            const existingIndex = saved.findIndex(c => c.id === circuit.id);

            if (existingIndex >= 0) {
                saved[existingIndex] = circuit;
            } else {
                saved.push(circuit);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
            this.currentCircuitId = circuit.id;
            return { success: true, circuit, source: 'localStorage' };

        } catch (error) {
            console.error("Save failed:", error);
            return { success: false, error: error.message };
        }
    }

    // Get all circuits from localStorage
    getAllCircuitsLocal() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    // Get all circuits (DB + localStorage)
    async getAllCircuits() {
        const userId = window.currentUserId;
        let circuits = [];

        // Try to get from database first
        if (userId && window.DatabaseService) {
            try {
                const dbCircuits = await window.DatabaseService.getAllCircuits(userId);
                circuits = dbCircuits.map(c => ({
                    id: c.id,
                    name: c.name,
                    description: c.description || '',
                    timestamp: c.created_at,
                    gates: c.circuit_json.gates || [],
                    wires: c.circuit_json.wires || [],
                    version: c.circuit_json.version || '1.0',
                    source: 'database'
                }));
            } catch (error) {
                console.warn("⚠️ Failed to load from DB:", error);
            }
        }

        // Also get localStorage circuits
        const localCircuits = this.getAllCircuitsLocal().map(c => ({
            ...c,
            source: 'localStorage'
        }));

        // Combine both sources
        return [...circuits, ...localCircuits];
    }

    async getCircuit(circuitId) {
        const circuits = await this.getAllCircuits();
        return circuits.find(c => c.id === circuitId);
    }

    async deleteCircuit(circuitId) {
        try {
            const circuit = await this.getCircuit(circuitId);

            if (circuit?.source === 'database' && window.DatabaseService) {
                // Delete from database
                await window.DatabaseService.deleteCircuit(circuitId);
            } else {
                // Delete from localStorage
                let circuits = this.getAllCircuitsLocal();
                circuits = circuits.filter(c => c.id !== circuitId);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(circuits));
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // =============================
    // DESERIALIZATION & LOADING
    // =============================

    async loadCircuit(circuitId) {
        try {
            const circuit = await this.getCircuit(circuitId);
            if (!circuit) {
                return { success: false, error: "Circuit not found" };
            }

            this.clearCurrentCircuit();

            // Restore gates first
            circuit.gates.forEach(gateData => {
                const gate = window.gateSystem.addGate(
                    gateData.type,
                    gateData.x,
                    gateData.y,
                    gateData.id
                );
                if (gateData.value !== undefined) {
                    gate.value = gateData.value;
                    window.circuitCalculator.setGateValue(gateData.id, gateData.value);
                }
            });

            // Small delay to ensure gates are rendered
            setTimeout(() => {
                circuit.wires.forEach(wireData => {
                    window.circuitCalculator.addConnection(
                        wireData.from.gateId,
                        wireData.to.gateId
                    );

                    const fromPort = this.findPort(wireData.from);
                    const toPort = this.findPort(wireData.to);

                    if (fromPort && toPort) {
                        window.wireSystem.wires.push({
                            id: wireData.id,
                            from: fromPort,
                            to: toPort
                        });
                    }
                });

                window.wireSystem.render();
            }, 100);

            this.currentCircuitId = circuitId;
            return { success: true, circuit };
        } catch (error) {
            console.error("Load failed:", error);
            return { success: false, error: error.message };
        }
    }

    clearCurrentCircuit() {
        if (window.gateSystem) window.gateSystem.clearAll();
        if (window.wireSystem) window.wireSystem.clearAll();
        if (window.circuitCalculator) window.circuitCalculator.reset();
        this.currentCircuitId = null;
    }

    findPort(portData) {
        const ports = window.gateSystem.getAllPorts();
        return ports.find(p =>
            p.gateId === portData.gateId &&
            p.type === portData.type &&
            p.index === portData.index
        );
    }

    // =============================
    // UTILITY METHODS
    // =============================

    async exportCircuitAsJSON(circuitId) {
        const circuit = await this.getCircuit(circuitId);
        if (!circuit) return null;

        const dataStr = JSON.stringify(circuit, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${circuit.name.replace(/\s+/g, '_')}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    async importCircuitFromJSON(jsonString) {
        try {
            const circuit = JSON.parse(jsonString);
            if (!circuit.gates || !circuit.wires) {
                throw new Error("Invalid circuit format");
            }

            circuit.id = Date.now();
            circuit.timestamp = new Date().toISOString();

            // Save using the regular save method (will choose DB or localStorage)
            return await this.saveCircuit(circuit.name, circuit.description);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCircuitStats(circuitId) {
        const circuit = await this.getCircuit(circuitId);
        if (!circuit) return null;

        const gateTypes = {};
        circuit.gates.forEach(gate => {
            gateTypes[gate.type] = (gateTypes[gate.type] || 0) + 1;
        });

        return {
            totalGates: circuit.gates.length,
            totalWires: circuit.wires.length,
            gateTypes: gateTypes,
            created: new Date(circuit.timestamp).toLocaleString(),
            source: circuit.source || 'unknown'
        };
    }
}

// ============================================
// UI COMPONENTS (UPDATED)
// ============================================

class CircuitStorageUI {
    constructor(storageInstance) {
        this.storage = storageInstance;
    }

    showSaveDialog() {
        const existingDialog = document.getElementById('saveCircuitDialog');
        if (existingDialog) existingDialog.remove();

        const dialog = document.createElement('div');
        dialog.id = 'saveCircuitDialog';
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3 class="h2">💾 Save Circuit</h3>
                <div style="margin: 16px 0;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text);">
                        Circuit Name <span style="color: var(--danger);">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="circuitName" 
                        class="input-field" 
                        placeholder="My Amazing Circuit"
                        maxlength="50"
                    />
                </div>
                <div style="margin: 16px 0;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text);">
                        Description (optional)
                    </label>
                    <textarea 
                        id="circuitDescription" 
                        class="input-field" 
                        placeholder="What does this circuit do?"
                        rows="3"
                        maxlength="200"
                    ></textarea>
                </div>
                <div id="saveStatus" style="margin: 12px 0;"></div>
                <div class="toolbar">
                    <button class="btn" id="btnCancelSave">Cancel</button>
                    <button class="btn primary" id="btnConfirmSave">💾 Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById('btnCancelSave').onclick = () => dialog.remove();
        document.getElementById('btnConfirmSave').onclick = () => this.handleSave(dialog);
        document.getElementById('circuitName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSave(dialog);
        });

        document.getElementById('circuitName').focus();
    }

    async handleSave(dialog) {
        const name = document.getElementById('circuitName').value.trim();
        const description = document.getElementById('circuitDescription').value.trim();
        const statusDiv = document.getElementById('saveStatus');

        if (!name) {
            statusDiv.innerHTML = '<div class="overlay error">Please enter a circuit name</div>';
            return;
        }

        const result = await this.storage.saveCircuit(name, description);

        if (result.success) {
            const source = result.source === 'database' ? 'cloud ☁️' : 'locally 💾';
            statusDiv.innerHTML = `<div class="overlay success">✅ Circuit saved ${source}!</div>`;
            setTimeout(() => dialog.remove(), 1500);
        } else {
            statusDiv.innerHTML = `<div class="overlay error">❌ Save failed: ${result.error}</div>`;
        }
    }

    async showCircuitLibrary() {
        const existingLibrary = document.getElementById('circuitLibrary');
        if (existingLibrary) existingLibrary.remove();

        const circuits = await this.storage.getAllCircuits();

        const library = document.createElement('div');
        library.id = 'circuitLibrary';
        library.className = 'modal-overlay';

        const saveMode = window.currentUserId ? 'Cloud + Local' : 'Local Only';

        library.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <h3 class="h2">📚 My Circuit Library</h3>
                <p class="muted">${circuits.length} saved circuit${circuits.length !== 1 ? 's' : ''} (${saveMode})</p>
                
                <div id="circuitList" style="margin-top: 16px; max-height: 500px; overflow-y: auto;">
                    ${circuits.length === 0 ? this.renderEmptyState() : circuits.map(c => this.renderCircuitCard(c)).join('')}
                </div>

                <div class="toolbar" style="margin-top: 16px;">
                    <button class="btn" id="btnCloseLibrary">Close</button>
                    <button class="btn" id="btnImportCircuit">📂 Import JSON</button>
                </div>
            </div>
        `;

        document.body.appendChild(library);

        document.getElementById('btnCloseLibrary').onclick = () => library.remove();
        document.getElementById('btnImportCircuit').onclick = () => this.handleImport();

        circuits.forEach(circuit => {
            const loadBtn = document.getElementById(`load_${circuit.id}`);
            const deleteBtn = document.getElementById(`delete_${circuit.id}`);
            const exportBtn = document.getElementById(`export_${circuit.id}`);
            const statsBtn = document.getElementById(`stats_${circuit.id}`);

            if (loadBtn) loadBtn.onclick = () => this.handleLoad(circuit.id, library);
            if (deleteBtn) deleteBtn.onclick = () => this.handleDelete(circuit.id, library);
            if (exportBtn) exportBtn.onclick = () => this.storage.exportCircuitAsJSON(circuit.id);
            if (statsBtn) statsBtn.onclick = () => this.showCircuitStats(circuit.id);
        });
    }

    renderEmptyState() {
        return `
            <div class="overlay" style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 16px;">🔮</div>
                <h3>No saved circuits yet</h3>
                <p class="muted">Build a circuit and click "Save Circuit" to save it here!</p>
            </div>
        `;
    }

    renderCircuitCard(circuit) {
        const date = new Date(circuit.timestamp).toLocaleDateString();
        const time = new Date(circuit.timestamp).toLocaleTimeString();
        const sourceIcon = circuit.source === 'database' ? '☁️' : '💾';

        return `
            <div class="circuit-card">
                <div class="circuit-card-header">
                    <div>
                        <h4 style="margin: 0; color: var(--accent);">${this.escapeHtml(circuit.name)} ${sourceIcon}</h4>
                        <p class="muted" style="margin: 4px 0 0 0; font-size: 0.85em;">
                            ${date} at ${time}
                        </p>
                    </div>
                    <div class="circuit-stats-badge">
                        <span>🔧 ${circuit.gates.length}</span>
                        <span>⚡ ${circuit.wires.length}</span>
                    </div>
                </div>
                ${circuit.description ? `<p class="muted" style="margin: 8px 0;">${this.escapeHtml(circuit.description)}</p>` : ''}
                <div class="toolbar" style="margin-top: 12px;">
                    <button class="btn primary" id="load_${circuit.id}">📂 Load</button>
                    <button class="btn" id="stats_${circuit.id}">📊 Stats</button>
                    <button class="btn" id="export_${circuit.id}">💾 Export</button>
                    <button class="btn danger" id="delete_${circuit.id}">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    async handleLoad(circuitId, library) {
        const result = await this.storage.loadCircuit(circuitId);
        if (result.success) {
            library.remove();
            this.showNotification(`✅ Circuit "${result.circuit.name}" loaded!`, 'success');
        } else {
            this.showNotification(`❌ Failed to load: ${result.error}`, 'error');
        }
    }

    async handleDelete(circuitId, library) {
        const circuit = await this.storage.getCircuit(circuitId);
        if (!confirm(`Are you sure you want to delete "${circuit.name}"?`)) return;

        const result = await this.storage.deleteCircuit(circuitId);
        if (result.success) {
            library.remove();
            this.showCircuitLibrary();
            this.showNotification('🗑️ Circuit deleted', 'success');
        } else {
            this.showNotification(`❌ Delete failed: ${result.error}`, 'error');
        }
    }

    handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const result = await this.storage.importCircuitFromJSON(event.target.result);
                if (result.success) {
                    this.showNotification(`✅ Circuit imported!`, 'success');
                    document.getElementById('circuitLibrary')?.remove();
                    this.showCircuitLibrary();
                } else {
                    this.showNotification(`❌ Import failed: ${result.error}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async showCircuitStats(circuitId) {
        const stats = await this.storage.getCircuitStats(circuitId);
        const circuit = await this.storage.getCircuit(circuitId);
        if (!stats) return;

        const statsDialog = document.createElement('div');
        statsDialog.className = 'modal-overlay';
        statsDialog.innerHTML = `
            <div class="modal-content">
                <h3 class="h2">📊 Circuit Statistics</h3>
                <h4 style="color: var(--accent); margin: 8px 0;">${this.escapeHtml(circuit.name)}</h4>
                
                <div class="overlay" style="margin: 16px 0;">
                    <p><strong>Total Gates:</strong> ${stats.totalGates}</p>
                    <p><strong>Total Wires:</strong> ${stats.totalWires}</p>
                    <p><strong>Created:</strong> ${stats.created}</p>
                    <p><strong>Storage:</strong> ${stats.source === 'database' ? 'Cloud ☁️' : 'Local 💾'}</p>
                    
                    <h4 style="margin-top: 16px;">Gate Breakdown:</h4>
                    ${Object.entries(stats.gateTypes).map(([type, count]) =>
            `<p>• ${type}: ${count}</p>`
        ).join('')}
                </div>

                <div class="toolbar">
                    <button class="btn primary" id="btnCloseStats">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(statsDialog);
        document.getElementById('btnCloseStats').onclick = () => statsDialog.remove();
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'var(--ok)' : 'var(--danger)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================
// INITIALIZE GLOBAL INSTANCE
// ============================================

window.circuitStorage = new CircuitStorage();
window.circuitStorageUI = new CircuitStorageUI(window.circuitStorage);