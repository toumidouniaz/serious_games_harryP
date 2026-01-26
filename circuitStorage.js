class CircuitStorage {
    constructor() {
        this.STORAGE_KEY = "hp_saved_circuits";
        this.currentCircuitId = null; // Track if we're editing an existing circuit
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
            version: "1.0" // For future compatibility
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
    // STORAGE (localStorage for now)
    // =============================

    saveCircuit(name, description = "") {
        try {
            const circuit = this.serializeCircuit(name, description);
            const saved = this.getAllCircuits();

            // Check if updating existing circuit
            const existingIndex = saved.findIndex(c => c.id === circuit.id);
            if (existingIndex >= 0) {
                saved[existingIndex] = circuit;
            } else {
                saved.push(circuit);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
            this.currentCircuitId = circuit.id;
            return { success: true, circuit };
        } catch (error) {
            console.error("Save failed:", error);
            return { success: false, error: error.message };
        }
    }

    getAllCircuits() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    getCircuit(circuitId) {
        const circuits = this.getAllCircuits();
        return circuits.find(c => c.id === circuitId);
    }

    deleteCircuit(circuitId) {
        try {
            let circuits = this.getAllCircuits();
            circuits = circuits.filter(c => c.id !== circuitId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(circuits));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // =============================
    // DESERIALIZATION & LOADING
    // =============================

    loadCircuit(circuitId) {
        try {
            const circuit = this.getCircuit(circuitId);
            if (!circuit) {
                return { success: false, error: "Circuit not found" };
            }

            // Clear current circuit
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
                // Restore wires
                circuit.wires.forEach(wireData => {
                    window.circuitCalculator.addConnection(
                        wireData.from.gateId,
                        wireData.to.gateId
                    );

                    // Recreate wire in wire system
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

    exportCircuitAsJSON(circuitId) {
        const circuit = this.getCircuit(circuitId);
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

    importCircuitFromJSON(jsonString) {
        try {
            const circuit = JSON.parse(jsonString);
            // Validate circuit structure
            if (!circuit.gates || !circuit.wires) {
                throw new Error("Invalid circuit format");
            }

            // Generate new ID to avoid conflicts
            circuit.id = Date.now();
            circuit.timestamp = new Date().toISOString();

            const saved = this.getAllCircuits();
            saved.push(circuit);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));

            return { success: true, circuit };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getCircuitStats(circuitId) {
        const circuit = this.getCircuit(circuitId);
        if (!circuit) return null;

        const gateTypes = {};
        circuit.gates.forEach(gate => {
            gateTypes[gate.type] = (gateTypes[gate.type] || 0) + 1;
        });

        return {
            totalGates: circuit.gates.length,
            totalWires: circuit.wires.length,
            gateTypes: gateTypes,
            created: new Date(circuit.timestamp).toLocaleString()
        };
    }

    // =============================
    // DATABASE MIGRATION READY
    // =============================

    // When Person 1 has database ready, replace these methods:
    async saveCircuitToDatabase(userId, name, description = "") {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/circuits', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ 
        //         userId, 
        //         circuit: this.serializeCircuit(name, description) 
        //     })
        // });
        // return response.json();

        // For now, use localStorage
        return this.saveCircuit(name, description);
    }

    async getAllCircuitsFromDatabase(userId) {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/circuits?userId=${userId}`);
        // return response.json();

        // For now, use localStorage
        return Promise.resolve(this.getAllCircuits());
    }
}

// ============================================
// UI COMPONENTS
// ============================================

class CircuitStorageUI {
    constructor(storageInstance) {
        this.storage = storageInstance;
    }

    // Show save dialog
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

        // Event listeners
        document.getElementById('btnCancelSave').onclick = () => dialog.remove();
        document.getElementById('btnConfirmSave').onclick = () => this.handleSave(dialog);

        // Allow Enter to save
        document.getElementById('circuitName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSave(dialog);
        });

        // Focus on name input
        document.getElementById('circuitName').focus();
    }

    handleSave(dialog) {
        const name = document.getElementById('circuitName').value.trim();
        const description = document.getElementById('circuitDescription').value.trim();
        const statusDiv = document.getElementById('saveStatus');

        if (!name) {
            statusDiv.innerHTML = '<div class="overlay error">Please enter a circuit name</div>';
            return;
        }

        const result = this.storage.saveCircuit(name, description);

        if (result.success) {
            statusDiv.innerHTML = '<div class="overlay success">✅ Circuit saved successfully!</div>';
            setTimeout(() => dialog.remove(), 1500);
        } else {
            statusDiv.innerHTML = `<div class="overlay error">❌ Save failed: ${result.error}</div>`;
        }
    }

    // Show circuit library
    showCircuitLibrary() {
        const existingLibrary = document.getElementById('circuitLibrary');
        if (existingLibrary) existingLibrary.remove();

        const circuits = this.storage.getAllCircuits();

        const library = document.createElement('div');
        library.id = 'circuitLibrary';
        library.className = 'modal-overlay';
        library.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <h3 class="h2">📚 My Circuit Library</h3>
                <p class="muted">${circuits.length} saved circuit${circuits.length !== 1 ? 's' : ''}</p>
                
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

        // Event listeners
        document.getElementById('btnCloseLibrary').onclick = () => library.remove();
        document.getElementById('btnImportCircuit').onclick = () => this.handleImport();

        // Load and delete buttons for each circuit
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

        return `
            <div class="circuit-card">
                <div class="circuit-card-header">
                    <div>
                        <h4 style="margin: 0; color: var(--accent);">${this.escapeHtml(circuit.name)}</h4>
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

    handleLoad(circuitId, library) {
        const result = this.storage.loadCircuit(circuitId);
        if (result.success) {
            library.remove();
            this.showNotification(`✅ Circuit "${result.circuit.name}" loaded!`, 'success');
        } else {
            this.showNotification(`❌ Failed to load: ${result.error}`, 'error');
        }
    }

    handleDelete(circuitId, library) {
        const circuit = this.storage.getCircuit(circuitId);
        if (!confirm(`Are you sure you want to delete "${circuit.name}"?`)) return;

        const result = this.storage.deleteCircuit(circuitId);
        if (result.success) {
            library.remove();
            this.showCircuitLibrary(); // Refresh library
            this.showNotification('🗑️ Circuit deleted', 'success');
        } else {
            this.showNotification(`❌ Delete failed: ${result.error}`, 'error');
        }
    }

    handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = this.storage.importCircuitFromJSON(event.target.result);
                if (result.success) {
                    this.showNotification(`✅ Circuit "${result.circuit.name}" imported!`, 'success');
                    document.getElementById('circuitLibrary').remove();
                    this.showCircuitLibrary(); // Refresh
                } else {
                    this.showNotification(`❌ Import failed: ${result.error}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    showCircuitStats(circuitId) {
        const stats = this.storage.getCircuitStats(circuitId);
        const circuit = this.storage.getCircuit(circuitId);
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