// Configuration
const GATE_WIDTH = 80;
const GATE_HEIGHT = 80;
const COLLISION_PADDING = 10;

// État du jeu
let placedGates = [];
let draggedGate = null;
let dragOffset = { x: 0, y: 0 };
let gateIdCounter = 0;

// Icônes des portes
const GATE_ICONS = {
    'AND': '⚡',
    'OR': '🌟',
    'NOT': '🔄',
    'XOR': '✨'
};

// Nombres de ports par type de porte
const GATE_PORTS = {
    'AND': { inputs: 2, outputs: 1 },
    'OR': { inputs: 2, outputs: 1 },
    'NOT': { inputs: 1, outputs: 1 },
    'XOR': { inputs: 2, outputs: 1 }
};

// Variables pour les éléments DOM
let canvas;
let paletteItems;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('canvas');
    paletteItems = document.querySelectorAll('.gate-item');

    // Gestion du glisser-déposer depuis la palette
    paletteItems.forEach(item => {
        // Support souris
        item.addEventListener('mousedown', startDragFromPalette);

        // Support tactile
        item.addEventListener('touchstart', startDragFromPalette);
    });

    // Événements globaux
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', endDrag);
});

function startDragFromPalette(e) {
    e.preventDefault();
    const gateType = this.dataset.gateType;
    
    // Créer une nouvelle porte temporaire
    const touch = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    
    draggedGate = {
        id: gateIdCounter++,
        type: gateType,
        x: touch.clientX - rect.left - GATE_WIDTH / 2,
        y: touch.clientY - rect.top - GATE_HEIGHT / 2,
        isNew: true,
        element: null
    };

    // Créer l'élément visuel
    createGateElement(draggedGate);
    dragOffset = { x: GATE_WIDTH / 2, y: GATE_HEIGHT / 2 };
}

function createGateElement(gate) {
    const gateEl = document.createElement('div');
    gateEl.className = 'placed-gate';
    gateEl.style.left = gate.x + 'px';
    gateEl.style.top = gate.y + 'px';
    gateEl.style.width = GATE_WIDTH + 'px';
    gateEl.style.height = GATE_HEIGHT + 'px';
    gateEl.dataset.gateId = gate.id;

    const icon = document.createElement('div');
    icon.className = 'gate-icon';
    icon.textContent = GATE_ICONS[gate.type];
    icon.style.fontSize = '2.5em';

    const name = document.createElement('div');
    name.className = 'gate-name';
    name.textContent = gate.type;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'gate-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = () => deleteGate(gate.id);

    gateEl.appendChild(icon);
    gateEl.appendChild(name);
    gateEl.appendChild(deleteBtn);

    // Ajouter les ports
    addPorts(gateEl, gate.type);

    // Événements de drag pour les portes placées
    gateEl.addEventListener('mousedown', (e) => startDragPlacedGate(e, gate));
    gateEl.addEventListener('touchstart', (e) => startDragPlacedGate(e, gate));

    canvas.appendChild(gateEl);
    gate.element = gateEl;
}

function addPorts(gateEl, gateType) {
    const ports = GATE_PORTS[gateType];
    const height = GATE_HEIGHT;

    // Ports d'entrée
    for (let i = 0; i < ports.inputs; i++) {
        const port = document.createElement('div');
        port.className = 'port input';
        port.style.top = `${(height / (ports.inputs + 1)) * (i + 1) - 6}px`;
        gateEl.appendChild(port);
    }

    // Ports de sortie
    for (let i = 0; i < ports.outputs; i++) {
        const port = document.createElement('div');
        port.className = 'port output';
        port.style.top = `${(height / (ports.outputs + 1)) * (i + 1) - 6}px`;
        gateEl.appendChild(port);
    }
}

function startDragPlacedGate(e, gate) {
    e.stopPropagation();
    const touch = e.touches ? e.touches[0] : e;
    const rect = gate.element.getBoundingClientRect();
    
    draggedGate = gate;
    draggedGate.isNew = false;
    dragOffset = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };

    gate.element.classList.add('dragging');
}

function handleDrag(e) {
    if (!draggedGate) return;

    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();

    let newX = touch.clientX - rect.left - dragOffset.x;
    let newY = touch.clientY - rect.top - dragOffset.y;

    // Garder dans les limites du canvas
    newX = Math.max(0, Math.min(newX, rect.width - GATE_WIDTH));
    newY = Math.max(0, Math.min(newY, rect.height - GATE_HEIGHT));

    draggedGate.x = newX;
    draggedGate.y = newY;

    if (draggedGate.element) {
        draggedGate.element.style.left = newX + 'px';
        draggedGate.element.style.top = newY + 'px';

        // Vérifier les collisions
        const hasCollision = checkCollisions(draggedGate);
        draggedGate.element.classList.toggle('collision', hasCollision);
    }
}

function endDrag(e) {
    if (!draggedGate) return;

    const hasCollision = checkCollisions(draggedGate);

    if (hasCollision) {
        // Annuler le placement
        if (draggedGate.element) {
            draggedGate.element.remove();
        }
    } else {
        // Confirmer le placement
        if (draggedGate.isNew) {
            placedGates.push(draggedGate);
        }
        if (draggedGate.element) {
            draggedGate.element.classList.remove('dragging', 'collision');
        }
    }

    draggedGate = null;
}

function checkCollisions(currentGate) {
    const rect1 = {
        left: currentGate.x,
        top: currentGate.y,
        right: currentGate.x + GATE_WIDTH,
        bottom: currentGate.y + GATE_HEIGHT
    };

    for (let gate of placedGates) {
        if (gate.id === currentGate.id) continue;

        const rect2 = {
            left: gate.x - COLLISION_PADDING,
            top: gate.y - COLLISION_PADDING,
            right: gate.x + GATE_WIDTH + COLLISION_PADDING,
            bottom: gate.y + GATE_HEIGHT + COLLISION_PADDING
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

function deleteGate(gateId) {
    const index = placedGates.findIndex(g => g.id === gateId);
    if (index !== -1) {
        const gate = placedGates[index];
        if (gate.element) {
            gate.element.remove();
        }
        placedGates.splice(index, 1);
    }
}

function clearCanvas() {
    if (confirm('Voulez-vous vraiment effacer toutes les portes ?')) {
        placedGates.forEach(gate => {
            if (gate.element) {
                gate.element.remove();
            }
        });
        placedGates = [];
    }
}

function saveLayout() {
    const data = placedGates.map(gate => ({
        id: gate.id,
        type: gate.type,
        x: gate.x,
        y: gate.y
    }));

    localStorage.setItem('gateLayout', JSON.stringify(data));
    alert('✨ Disposition sauvegardée !');
}

function loadLayout() {
    const saved = localStorage.getItem('gateLayout');
    if (!saved) {
        alert('❌ Aucune sauvegarde trouvée.');
        return;
    }

    clearCanvas();
    const data = JSON.parse(saved);

    data.forEach(gateData => {
        const gate = {
            id: gateData.id,
            type: gateData.type,
            x: gateData.x,
            y: gateData.y,
            element: null
        };

        createGateElement(gate);
        placedGates.push(gate);

        if (gate.id >= gateIdCounter) {
            gateIdCounter = gate.id + 1;
        }
    });

    alert('✨ Disposition chargée !');
}

function exportData() {
    const data = {
        gates: placedGates.map(gate => ({
            id: gate.id,
            type: gate.type,
            position: { x: gate.x, y: gate.y },
            ports: GATE_PORTS[gate.type]
        })),
        canvasSize: {
            width: canvas.offsetWidth,
            height: canvas.offsetHeight
        }
    };

    console.log('📊 Données exportées:', data);
    alert('📊 Données exportées dans la console !');
    return data;
}

// API publique pour l'intégration
window.GateSystem = {
    getGates: () => placedGates,
    addGate: (type, x, y) => {
        const gate = {
            id: gateIdCounter++,
            type: type,
            x: x,
            y: y,
            element: null
        };
        createGateElement(gate);
        placedGates.push(gate);
        return gate;
    },
    removeGate: (id) => deleteGate(id),
    clear: () => clearCanvas(),
    export: () => exportData()
};

