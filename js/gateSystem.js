class GateSystem {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.placedGates = [];
        this.draggedGate = null;
        this.dragOffset = { x: 0, y: 0 };
        this.gateIdCounter = 0;
        this.GATE_WIDTH = 80;
        this.GATE_HEIGHT = 80;
        this.COLLISION_PADDING = 10;

        this.GATE_ICONS = {
            'AND': '⚡',
            'OR': '🌟',
            'NOT': '🔄',
            'XOR': '✨',
            'INPUT': '🔮',
            'OUTPUT': '🎯'
        };

        this.GATE_PORTS = {
            'AND': { inputs: 2, outputs: 1 },
            'OR': { inputs: 2, outputs: 1 },
            'NOT': { inputs: 1, outputs: 1 },
            'XOR': { inputs: 2, outputs: 1 },
            'INPUT': { inputs: 0, outputs: 1 },
            'OUTPUT': { inputs: 1, outputs: 0 }
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Use event delegation for better performance
        this.canvas.addEventListener('mousedown', (e) => this.startDragPlacedGate(e));
        this.canvas.addEventListener('touchstart', (e) => this.startDragPlacedGate(e));

        // Use capture phase to ensure we get the event
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
        document.addEventListener('touchmove', (e) => this.handleDrag(e), { passive: false });
        document.addEventListener('touchend', (e) => this.endDrag(e));
    }

    addGate(type, x = null, y = null, id = null) {
        const gateId = id || `gate_${this.gateIdCounter++}`;

        // If no position specified, find a good spot
        let finalX = x;
        let finalY = y;

        if (x === null || y === null) {
            // Find a position that doesn't overlap with existing gates
            const gridSize = 100;
            const padding = 20;

            // Try different positions in a grid pattern
            for (let attempt = 0; attempt < 10; attempt++) {
                const tryX = 300 + (attempt % 3) * gridSize;
                const tryY = 200 + Math.floor(attempt / 3) * gridSize;

                const overlapping = this.placedGates.some(gate =>
                    Math.abs(gate.x - tryX) < this.GATE_WIDTH + padding &&
                    Math.abs(gate.y - tryY) < this.GATE_HEIGHT + padding
                );

                if (!overlapping) {
                    finalX = tryX;
                    finalY = tryY;
                    break;
                }
            }

            // If all positions are taken, use default
            if (finalX === null) {
                finalX = 300;
                finalY = 200;
            }
        }

        const gate = {
            id: gateId,
            type: type,
            x: finalX,
            y: finalY,
            element: null,
            value: type === 'INPUT' ? 0 : null
        };

        this.createGateElement(gate);
        this.placedGates.push(gate);

        // Notify circuit calculator with the same ID
        if (window.circuitCalculator) {
            window.circuitCalculator.addGate(type, gate.value, gateId);
        }

        return gate;
    }

    createGateElement(gate) {
        const gateEl = document.createElement('div');
        gateEl.className = 'placed-gate';
        gateEl.style.left = gate.x + 'px';
        gateEl.style.top = gate.y + 'px';
        gateEl.style.width = this.GATE_WIDTH + 'px';
        gateEl.style.height = this.GATE_HEIGHT + 'px';
        gateEl.dataset.gateId = gate.id;
        gateEl.draggable = true; // Make it draggable

        const icon = document.createElement('div');
        icon.className = 'gate-icon';
        icon.textContent = this.GATE_ICONS[gate.type];
        icon.style.fontSize = '2.5em';

        const name = document.createElement('div');
        name.className = 'gate-name';
        name.textContent = gate.type;

        // Only add delete button for non-fixed gates
        if (gate.type !== 'INPUT' && gate.type !== 'OUTPUT') {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'gate-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteGate(gate.id);
            };
            gateEl.appendChild(deleteBtn);
        }

        gateEl.appendChild(icon);
        gateEl.appendChild(name);

        // Add ports
        this.addPorts(gateEl, gate.type, gate.id);

        this.canvas.appendChild(gateEl);
        gate.element = gateEl;
    }

    addPorts(gateEl, gateType, gateId) {
        const ports = this.GATE_PORTS[gateType];
        const height = this.GATE_HEIGHT;

        // Input ports
        for (let i = 0; i < ports.inputs; i++) {
            const port = document.createElement('div');
            port.className = 'port input';
            port.dataset.portType = 'input';
            port.dataset.portIndex = i;
            port.dataset.gateId = gateId;
            port.style.top = `${(height / (ports.inputs + 1)) * (i + 1) - 6}px`;
            gateEl.appendChild(port);
        }

        // Output ports
        for (let i = 0; i < ports.outputs; i++) {
            const port = document.createElement('div');
            port.className = 'port output';
            port.dataset.portType = 'output';
            port.dataset.portIndex = i;
            port.dataset.gateId = gateId;
            port.style.top = `${(height / (ports.outputs + 1)) * (i + 1) - 6}px`;
            gateEl.appendChild(port);
        }
    }

    startDragPlacedGate(e) {
        // Allow clicking anywhere on the gate EXCEPT delete buttons and ports
        if (e.target.classList.contains('gate-delete') ||
            e.target.closest('.gate-delete')) {
            return;
        }

        // Check if we're clicking on a port - DON'T start drag if so
        if (e.target.classList.contains('port')) {
            return; // Let wire system handle port clicks
        }

        // Check if we're inside a gate (including ports area but not the ports themselves)
        const target = e.target.closest('.placed-gate');
        if (!target) return;

        const gateId = target.dataset.gateId;
        const gate = this.placedGates.find(g => g.id === gateId);
        if (!gate) return;

        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches ? e.touches[0] : e;
        const rect = gate.element.getBoundingClientRect();

        this.draggedGate = gate;
        this.draggedGate.isNew = false;
        this.dragOffset = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };

        gate.element.classList.add('dragging');
        gate.element.style.zIndex = '1000';
        gate.element.style.cursor = 'grabbing';

        document.body.style.userSelect = 'none';
    }

    handleDrag(e) {
        if (!this.draggedGate) return;

        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();

        let newX = touch.clientX - rect.left - this.dragOffset.x;
        let newY = touch.clientY - rect.top - this.dragOffset.y;

        // Keep within canvas bounds with some padding
        const padding = 10;
        newX = Math.max(padding, Math.min(newX, rect.width - this.GATE_WIDTH - padding));
        newY = Math.max(padding, Math.min(newY, rect.height - this.GATE_HEIGHT - padding));

        this.draggedGate.x = newX;
        this.draggedGate.y = newY;

        if (this.draggedGate.element) {
            this.draggedGate.element.style.left = newX + 'px';
            this.draggedGate.element.style.top = newY + 'px';
            this.draggedGate.element.style.transform = 'translate(0, 0)'; // Remove any transforms
        }

        // Update wire positions if wireSystem exists
        if (window.wireSystem) {
            window.wireSystem.updateGatePosition(this.draggedGate.id);
        }
    }

    endDrag(e) {
        if (!this.draggedGate) return;

        if (this.draggedGate.element) {
            this.draggedGate.element.classList.remove('dragging', 'collision');
            this.draggedGate.element.style.zIndex = ''; // Reset z-index
        }

        this.draggedGate = null;

        // Restore text selection
        document.body.style.userSelect = '';
    }

    checkCollisions(currentGate) {
        const rect1 = {
            left: currentGate.x,
            top: currentGate.y,
            right: currentGate.x + this.GATE_WIDTH,
            bottom: currentGate.y + this.GATE_HEIGHT
        };

        for (let gate of this.placedGates) {
            if (gate.id === currentGate.id) continue;

            const rect2 = {
                left: gate.x - this.COLLISION_PADDING,
                top: gate.y - this.COLLISION_PADDING,
                right: gate.x + this.GATE_WIDTH + this.COLLISION_PADDING,
                bottom: gate.y + this.GATE_HEIGHT + this.COLLISION_PADDING
            };

            if (!(rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom)) {
                return true;
            }
        }

        return false;
    }

    deleteGate(gateId) {
        const index = this.placedGates.findIndex(g => g.id === gateId);
        if (index !== -1) {
            const gate = this.placedGates[index];
            if (gate.element) {
                gate.element.remove();
            }
            this.placedGates.splice(index, 1);

            // Notify wire system
            if (window.wireSystem) {
                window.wireSystem.removeGateWires(gateId);
            }

            // Notify circuit calculator
            if (window.circuitCalculator) {
                window.circuitCalculator.removeGate(gateId);
            }
        }
    }

    getAllPorts() {
        const ports = [];
        const canvasRect = this.canvas.getBoundingClientRect();

        this.placedGates.forEach(gate => {
            const portElements = gate.element.querySelectorAll('.port');
            portElements.forEach(portEl => {
                const rect = portEl.getBoundingClientRect();

                ports.push({
                    id: `${portEl.dataset.gateId}_${portEl.dataset.portType}_${portEl.dataset.portIndex}`,
                    gateId: portEl.dataset.gateId,
                    type: portEl.dataset.portType,
                    index: parseInt(portEl.dataset.portIndex),
                    x: rect.left + rect.width / 2 - canvasRect.left,
                    y: rect.top + rect.height / 2 - canvasRect.top,
                    element: portEl
                });
            });
        });

        return ports;
    }

    getGate(gateId) {
        return this.placedGates.find(g => g.id === gateId);
    }

    clearAll() {
        this.placedGates.forEach(gate => {
            if (gate.element) {
                gate.element.remove();
            }
        });
        this.placedGates = [];
    }
}
