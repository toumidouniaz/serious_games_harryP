// main.js - Exemple d'intégration du système de fils

document.addEventListener('DOMContentLoaded', () => {
    // Récupérer le canvas
    const canvas = document.getElementById('wireCanvas');
    
    // Initialiser les systèmes
    const wireSystem = new WireSystem(canvas);
    const wireRenderer = new WireRenderer(canvas);
    const wireValidator = new WireValidator();
    
    // Connecter le rendu au système de fils
    wireSystem.onRender = (wires, currentWire) => {
        // Calculer l'état de chaque fil (actif/inactif)
        const wireStates = calculateWireStates(wires);
        wireRenderer.drawAllWires(wires, currentWire, wireStates);
    };
    
    // Démarrer l'animation
    wireRenderer.startAnimation();
    
    // Écouter les événements de création/suppression de fils
    canvas.addEventListener('wireCreated', (e) => {
        console.log('Fil créé:', e.detail);
        showMessage('Connexion créée !', 'success');
        
        // Notifier le calculateur de circuit (Personne 4)
        if (window.circuitCalculator) {
            window.circuitCalculator.updateCircuit();
        }
    });
    
    canvas.addEventListener('wireRemoved', (e) => {
        console.log('Fil supprimé:', e.detail);
        showMessage('Connexion supprimée', 'error');
        
        // Notifier le calculateur de circuit
        if (window.circuitCalculator) {
            window.circuitCalculator.updateCircuit();
        }
    });
    
    // Bouton pour effacer tous les fils
    const clearBtn = document.getElementById('clearWiresBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            wireSystem.clearAll();
            showMessage('Tous les fils ont été effacés', 'error');
        });
    }
    
    // Bouton pour basculer le mode suppression
    let deleteMode = false;
    const deleteBtn = document.getElementById('deleteWireBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteMode = !deleteMode;
            canvas.classList.toggle('deleting-wire', deleteMode);
            deleteBtn.classList.toggle('active', deleteMode);
            
            if (deleteMode) {
                wireSystem.cancelWireCreation();
            }
        });
    }
    
    // Clic pour supprimer un fil en mode suppression
    canvas.addEventListener('click', (e) => {
        if (deleteMode) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const removed = wireSystem.removeWireAtPosition(x, y);
            if (removed) {
                showMessage('Fil supprimé', 'error');
            }
        }
    });
    
    // Mettre à jour le compteur de fils
    function updateWireCounter() {
        const counter = document.getElementById('wireCounter');
        if (counter) {
            const count = wireSystem.getWires().length;
            counter.textContent = `Fils: ${count}`;
        }
    }
    
    // Mettre à jour le compteur à chaque changement
    canvas.addEventListener('wireCreated', updateWireCounter);
    canvas.addEventListener('wireRemoved', updateWireCounter);
    
    // Fonction pour calculer l'état des fils
    function calculateWireStates(wires) {
        // Cette fonction devrait être connectée au calculateur de circuit
        // Pour l'instant, retourner un état par défaut
        const states = {};
        
        if (window.circuitCalculator) {
            // Utiliser le calculateur de circuit de la Personne 4
            const activeWires = window.circuitCalculator.getActiveWires();
            
            wires.forEach(wire => {
                states[wire.id] = activeWires.includes(wire.id) ? 'active' : 'inactive';
            });
        } else {
            // Mode démo: alterner les états
            wires.forEach((wire, index) => {
                states[wire.id] = index % 2 === 0 ? 'active' : 'inactive';
            });
        }
        
        return states;
    }
    
    // Afficher un message à l'utilisateur
    function showMessage(text, type = 'info') {
        const existingMsg = document.querySelector('.wire-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        const message = document.createElement('div');
        message.className = `wire-message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
    
    // Exposer le système globalement pour les autres modules
    window.wireSystem = wireSystem;
    window.wireRenderer = wireRenderer;
    window.wireValidator = wireValidator;
    
    console.log('Système de fils initialisé ✓');
});

// Fonction utilitaire pour obtenir tous les ports (à adapter)
function getAllPortsFromGates() {
    // Cette fonction doit récupérer tous les ports depuis le système de portes
    // Exemple de structure de port:
    /*
    {
        id: 'port_1',
        gateId: 'gate_1',
        type: 'input' ou 'output',
        x: 100,
        y: 150,
        value: 0 ou 1
    }
    */
    
    if (window.gateSystem && window.gateSystem.getAllPorts) {
        return window.gateSystem.getAllPorts();
    }
    
    // Retourner des ports de démonstration
    return [
        { id: 'port_1', gateId: 'gate_1', type: 'input', x: 100, y: 100, value: 0 },
        { id: 'port_2', gateId: 'gate_1', type: 'output', x: 200, y: 100, value: 0 },
        { id: 'port_3', gateId: 'gate_2', type: 'input', x: 300, y: 100, value: 0 },
    ];
}