// wireValidator.js - Validation avancée des connexions

class WireValidator {
    constructor() {
        this.rules = {
            // Types de ports compatibles
            compatibleTypes: {
                'output': ['input'],
                'input': ['output']
            },
            
            // Nombre max de connexions par type de port
            maxConnections: {
                'input': 1,   // Une entrée = une seule connexion
                'output': Infinity  // Une sortie peut aller vers plusieurs entrées
            }
        };
    }
    
    validateConnection(fromPort, toPort, existingWires = []) {
        const checks = [
            this.checkSamePort(fromPort, toPort),
            this.checkCompatibleTypes(fromPort, toPort),
            this.checkDuplicateConnection(fromPort, toPort, existingWires),
            this.checkMaxConnections(fromPort, toPort, existingWires),
            this.checkSameGate(fromPort, toPort)
        ];
        
        // Trouver la première erreur
        for (let check of checks) {
            if (!check.valid) {
                return check;
            }
        }
        
        return { valid: true, message: 'Connexion valide' };
    }
    
    checkSamePort(fromPort, toPort) {
        if (fromPort.id === toPort.id) {
            return {
                valid: false,
                reason: 'same_port',
                message: 'Impossible de connecter un port à lui-même'
            };
        }
        return { valid: true };
    }
    
    checkCompatibleTypes(fromPort, toPort) {
        const fromType = fromPort.type;
        const toType = toPort.type;
        
        const compatible = this.rules.compatibleTypes[fromType];
        
        if (!compatible || !compatible.includes(toType)) {
            return {
                valid: false,
                reason: 'incompatible_types',
                message: `Impossible de connecter ${fromType} vers ${toType}`
            };
        }
        
        return { valid: true };
    }
    
    checkDuplicateConnection(fromPort, toPort, existingWires) {
        const exists = existingWires.some(wire => {
            return (
                (wire.from.id === fromPort.id && wire.to.id === toPort.id) ||
                (wire.from.id === toPort.id && wire.to.id === fromPort.id)
            );
        });
        
        if (exists) {
            return {
                valid: false,
                reason: 'duplicate',
                message: 'Cette connexion existe déjà'
            };
        }
        
        return { valid: true };
    }
    
    checkMaxConnections(fromPort, toPort, existingWires) {
        // Vérifier les connexions du port d'entrée
        const inputPort = fromPort.type === 'input' ? fromPort : toPort;
        const maxForInput = this.rules.maxConnections[inputPort.type];
        
        const inputConnections = existingWires.filter(wire => 
            wire.to.id === inputPort.id || wire.from.id === inputPort.id
        );
        
        if (inputConnections.length >= maxForInput) {
            return {
                valid: false,
                reason: 'max_connections',
                message: `Une entrée ne peut avoir qu'une seule connexion (max: ${maxForInput})`
            };
        }
        
        return { valid: true };
    }
    
    checkSameGate(fromPort, toPort) {
        // Empêcher les connexions au sein de la même porte
        if (fromPort.gateId === toPort.gateId) {
            return {
                valid: false,
                reason: 'same_gate',
                message: 'Impossible de connecter les ports d\'une même porte'
            };
        }
        
        return { valid: true };
    }
    
    validateCircuit(wires, gates) {
        // Validation globale du circuit
        const issues = [];
        
        // Vérifier les cycles
        const hasCycle = this.detectCycle(wires, gates);
        if (hasCycle) {
            issues.push({
                type: 'cycle',
                message: 'Le circuit contient une boucle infinie'
            });
        }
        
        // Vérifier les portes déconnectées
        const disconnectedGates = this.findDisconnectedGates(wires, gates);
        if (disconnectedGates.length > 0) {
            issues.push({
                type: 'disconnected',
                message: `${disconnectedGates.length} porte(s) non connectée(s)`,
                gates: disconnectedGates
            });
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
    
    detectCycle(wires, gates) {
        // Algorithme de détection de cycle dans un graphe orienté
        const graph = this.buildGraph(wires, gates);
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycleFrom = (nodeId) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const neighbors = graph[nodeId] || [];
            for (let neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycleFrom(neighbor)) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    return true;
                }
            }
            
            recursionStack.delete(nodeId);
            return false;
        };
        
        for (let gateId in graph) {
            if (!visited.has(gateId)) {
                if (hasCycleFrom(gateId)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    buildGraph(wires, gates) {
        // Construire un graphe d'adjacence : gateId -> [gateIds suivants]
        const graph = {};
        
        gates.forEach(gate => {
            graph[gate.id] = [];
        });
        
        wires.forEach(wire => {
            const fromGateId = wire.from.gateId;
            const toGateId = wire.to.gateId;
            
            if (fromGateId && toGateId && fromGateId !== toGateId) {
                if (!graph[fromGateId].includes(toGateId)) {
                    graph[fromGateId].push(toGateId);
                }
            }
        });
        
        return graph;
    }
    
    findDisconnectedGates(wires, gates) {
        // Trouver les portes sans aucune connexion
        const connectedGateIds = new Set();
        
        wires.forEach(wire => {
            connectedGateIds.add(wire.from.gateId);
            connectedGateIds.add(wire.to.gateId);
        });
        
        return gates.filter(gate => !connectedGateIds.has(gate.id));
    }
    
    getConnectionsForPort(portId, wires) {
        // Récupérer toutes les connexions d'un port spécifique
        return wires.filter(wire => 
            wire.from.id === portId || wire.to.id === portId
        );
    }
    
    canAddWire(fromPort, toPort, existingWires, gates) {
        // Vérifier si on peut ajouter un fil sans créer de problème
        const validation = this.validateConnection(fromPort, toPort, existingWires);
        
        if (!validation.valid) {
            return validation;
        }
        
        // Simuler l'ajout du fil et vérifier le circuit
        const simulatedWires = [...existingWires, {
            from: fromPort,
            to: toPort
        }];
        
        const circuitValidation = this.validateCircuit(simulatedWires, gates);
        
        if (!circuitValidation.valid) {
            // Filtrer seulement les erreurs critiques (cycles)
            const criticalIssues = circuitValidation.issues.filter(
                issue => issue.type === 'cycle'
            );
            
            if (criticalIssues.length > 0) {
                return {
                    valid: false,
                    reason: 'circuit_issue',
                    message: criticalIssues[0].message
                };
            }
        }
        
        return { valid: true };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WireValidator;
}