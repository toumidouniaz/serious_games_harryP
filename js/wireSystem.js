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
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // MODE SUPPRESSION
        if (this.deleteMode) {
            this.removeWireAtPosition(x, y);
            return;
        }
        
        const clickedPort = this.findPortAtPosition(x, y);
        
        if (!clickedPort) {
            this.cancelWireCreation();
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
    
    findPortAtPosition(x, y) {
        const ports = this.getAllPorts();
        return ports.find(p => Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2)) < 20);
    }
    
    completeWire(endPort) {
        // Validation : types différents et ports différents
        if (this.selectedPort.id !== endPort.id && this.selectedPort.type !== endPort.type) {
            const wire = { 
                id: 'wire_' + Date.now(), 
                from: {...this.selectedPort}, 
                to: {...endPort} 
            };
            this.wires.push(wire);
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

    isPointNearWire(x, y, wire) {
        // Approximation simple pour la suppression : distance au milieu du fil
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
    
    render() { if (this.onRender) this.onRender(this.wires, this.currentWire); }
    getAllPorts() { return []; } 
    getWires() { return this.wires; }
    clearAll() { this.wires = []; this.cancelWireCreation(); }
}