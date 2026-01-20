class CircuitCalculator {
    constructor() {
        this.gates = new Map();
        this.connections = [];
        this.cache = new Map();
        this.gateCounter = 0;
    }

    addGate(type, value = null, id = null) {
        const gateId = id || `gate_${this.gateCounter++}`;
        this.gates.set(gateId, { id: gateId, type: type, value: value });
        this.clearCache();
        return gateId;
    }

    removeGate(gateId) {
        this.gates.delete(gateId);
        this.connections = this.connections.filter(
            conn => conn.from !== gateId && conn.to !== gateId
        );
        this.clearCache();
    }

    setGateValue(gateId, value) {
        const gate = this.gates.get(gateId);
        if (gate) {
            gate.value = value;
            this.clearCache();
        }
    }

    addConnection(fromGateId, toGateId) {
        this.connections.push({ from: fromGateId, to: toGateId });
        this.clearCache();
    }

    removeConnection(fromGateId, toGateId) {
        this.connections = this.connections.filter(
            conn => !(conn.from === fromGateId && conn.to === toGateId)
        );
        this.clearCache();
    }

    clearCache() {
        this.cache.clear();
    }

    calculateAND(inputs) {
        if (inputs.length === 0) return 0;
        return inputs.every(val => val === 1) ? 1 : 0;
    }

    calculateOR(inputs) {
        if (inputs.length === 0) return 0;
        return inputs.some(val => val === 1) ? 1 : 0;
    }

    calculateXOR(inputs) {
        if (inputs.length === 0) return 0;
        return inputs.reduce((acc, val) => acc ^ val, 0);
    }

    calculateNOT(inputs) {
        if (inputs.length === 0) return 0;
        return inputs[0] === 1 ? 0 : 1;
    }

    calculateGateValue(gate, inputValues) {
        switch (gate.type) {
            case 'AND': return this.calculateAND(inputValues);
            case 'OR': return this.calculateOR(inputValues);
            case 'XOR': return this.calculateXOR(inputValues);
            case 'NOT': return this.calculateNOT(inputValues);
            case 'INPUT': return gate.value !== null ? gate.value : 0;
            case 'OUTPUT': return inputValues.length > 0 ? inputValues[0] : 0;
            default: return 0;
        }
    }

    getInputGates(gateId) {
        return this.connections
            .filter(conn => conn.to === gateId)
            .map(conn => conn.from);
    }

    calculateGateRecursive(gateId, visitStack = new Set()) {
        if (this.cache.has(gateId)) {
            return this.cache.get(gateId);
        }

        const gate = this.gates.get(gateId);
        if (!gate) return 0;

        if (gate.type === 'INPUT') {
            const value = gate.value !== null ? gate.value : 0;
            this.cache.set(gateId, value);
            return value;
        }

        if (visitStack.has(gateId)) {
            console.warn(`Cycle detected at ${gateId}`);
            return 0;
        }

        visitStack.add(gateId);
        const inputGates = this.getInputGates(gateId);

        if (inputGates.length === 0 && gate.type !== 'INPUT') {
            this.cache.set(gateId, 0);
            visitStack.delete(gateId);
            return 0;
        }

        const inputValues = inputGates.map(inputGateId =>
            this.calculateGateRecursive(inputGateId, new Set(visitStack))
        );

        const output = this.calculateGateValue(gate, inputValues);
        this.cache.set(gateId, output);
        visitStack.delete(gateId);

        return output;
    }

    calculateAll() {
        this.clearCache();
        const result = {
            outputs: new Map(),
            allGates: new Map(),
        };

        for (const [gateId, gate] of this.gates) {
            const value = this.calculateGateRecursive(gateId);
            result.allGates.set(gateId, value);

            if (gate.type === 'OUTPUT') {
                result.outputs.set(gateId, value);
            }
        }

        return result;
    }

    reset() {
        this.gates.clear();
        this.connections = [];
        this.cache.clear();
        this.gateCounter = 0;
    }
}