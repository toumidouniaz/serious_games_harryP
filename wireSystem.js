class WireSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.wires = [];
        this.currentWire = null;
        this.selectedPort = null;
        this.deleteMode = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const container = this.canvas.parentElement;
        container.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelWireCreation();
        });
    }

    setDeleteMode(active) {
        this.deleteMode = active;
        if (active) this.cancelWireCreation();
    }

    handleClick(e) {
        // Check if we clicked on a port first
        const clickedPort = e.target.classList.contains('port') ?
            this.findPortFromElement(e.target) : null;

        if (!clickedPort) {
            // Not a port, so cancel wire creation
            this.cancelWireCreation();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.deleteMode) {
            this.removeWireAtPosition(x, y);
            return;
        }

        if (!this.selectedPort) {
            this.selectedPort = clickedPort;
            if (clickedPort.element) clickedPort.element.classList.add('selected');
            this.currentWire = { from: clickedPort, to: { x, y }, preview: true };
        } else {
            this.completeWire(clickedPort);
        }
    }

    handleMouseMove(e) {
        if (!this.currentWire) return;
        const rect = this.canvas.getBoundingClientRect();
        this.currentWire.to = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        this.render();
    }
    findPortFromElement(portElement) {
        const rect = this.canvas.getBoundingClientRect();
        const portRect = portElement.getBoundingClientRect();

        return {
            id: `${portElement.dataset.gateId}_${portElement.dataset.portType}_${portElement.dataset.portIndex}`,
            gateId: portElement.dataset.gateId,
            type: portElement.dataset.portType,
            index: parseInt(portElement.dataset.portIndex),
            x: portRect.left + portRect.width / 2 - rect.left,
            y: portRect.top + portRect.height / 2 - rect.top,
            element: portElement
        };
    }

    findPortAtPosition(x, y) {
        if (!window.gateSystem) return null;
        const ports = window.gateSystem.getAllPorts();
        return ports.find(p => Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2)) < 20);
    }

    completeWire(endPort) {
        // Validation: different types and different ports
        if (this.selectedPort.id !== endPort.id &&
            this.selectedPort.type !== endPort.type &&
            this.selectedPort.gateId !== endPort.gateId) {

            const wire = {
                id: 'wire_' + Date.now(),
                from: { ...this.selectedPort },
                to: { ...endPort }
            };

            this.wires.push(wire);

            // Notify circuit calculator
            if (window.circuitCalculator) {
                // Connect from output to input
                const fromGateId = this.selectedPort.type === 'output' ?
                    this.selectedPort.gateId : endPort.gateId;
                const toGateId = this.selectedPort.type === 'input' ?
                    this.selectedPort.gateId : endPort.gateId;

                window.circuitCalculator.addConnection(fromGateId, toGateId);
            }

            this.canvas.dispatchEvent(new CustomEvent('wireCreated', { detail: wire }));
        }
        this.cancelWireCreation();
    }

    removeWireAtPosition(x, y) {
        const initialLength = this.wires.length;
        this.wires = this.wires.filter(wire => !this.isPointNearWire(x, y, wire));

        if (this.wires.length < initialLength) {
            this.canvas.dispatchEvent(new CustomEvent('wireRemoved'));
            this.render();
        }
    }

    removeGateWires(gateId) {
        this.wires = this.wires.filter(wire =>
            wire.from.gateId !== gateId && wire.to.gateId !== gateId
        );
        this.render();
    }

    updateGatePosition(gateId) {
        if (!window.gateSystem) return;

        const ports = window.gateSystem.getAllPorts(); // Get fresh port data

        this.wires.forEach(wire => {
            if (wire.from.gateId === gateId) {
                const newPort = ports.find(p =>
                    p.gateId === wire.from.gateId &&
                    p.type === wire.from.type &&
                    p.index === wire.from.index
                );
                if (newPort) {
                    wire.from.x = newPort.x;
                    wire.from.y = newPort.y;
                }
            }
            if (wire.to.gateId === gateId) {
                const newPort = ports.find(p =>
                    p.gateId === wire.to.gateId &&
                    p.type === wire.to.type &&
                    p.index === wire.to.index
                );
                if (newPort) {
                    wire.to.x = newPort.x;
                    wire.to.y = newPort.y;
                }
            }
        });

        this.render();
    }
    isPointNearWire(x, y, wire) {
        const midX = (wire.from.x + wire.to.x) / 2;
        const midY = (wire.from.y + wire.to.y) / 2;
        return Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2)) < 30;
    }

    cancelWireCreation() {
        if (this.selectedPort?.element) this.selectedPort.element.classList.remove('selected');
        this.selectedPort = null;
        this.currentWire = null;
        this.render();
    }

    render() {
        if (this.onRender) {
            this.onRender(this.wires, this.currentWire);
        }
    }

    getWires() { return this.wires; }

    clearAll() {
        this.wires = [];
        this.cancelWireCreation();
        this.render();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CircuitCalculator, GateSystem, WireSystem };
}