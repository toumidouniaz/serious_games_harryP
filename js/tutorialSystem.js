// ============================================
// Tutorial System - Interactive Game Guide
// Hogwarts Logic Academy
// ============================================

class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.completedTutorial = localStorage.getItem('tutorialCompleted') === 'true';
        this.steps = this.initializeTutorialSteps();
    }

    initializeTutorialSteps() {
        return [
            {
                id: 'welcome',
                title: '🪄 Welcome to Hogwarts Logic Academy',
                description: 'Learn to master the ancient art of magical circuit crafting! This tutorial will teach you the basics.',
                target: null,
                action: 'click-to-continue',
                highlight: false
            },
            {
                id: 'what-is-logic',
                title: '⚡ What is Logic?',
                description: 'Logic gates are the building blocks of digital circuits. They take inputs and produce outputs based on logical rules. Think of them as magical spells that transform energy!',
                target: null,
                action: 'click-to-continue',
                highlight: false
            },
            {
                id: 'gates-overview',
                title: '🔮 The Four Magical Gates',
                description: 'You\'ll learn to use 4 types of gates:\n\n🟢 AND - Both inputs must be active\n🟡 OR - At least one input must be active\n🔴 NOT - Reverses the input\n🟣 XOR - Exactly one input must be active\n\nLet\'s explore each one!',
                target: null,
                action: 'click-to-continue',
                highlight: false
            },
            {
                id: 'level-1-intro',
                title: '🎓 Level 1: The Lumos Charm',
                description: 'Your first challenge! You need to light up the wand using an AND gate. Both magical sources must be active for the spell to work.',
                target: null,
                action: 'click-to-continue',
                highlight: false
            },
            {
                id: 'level-1-gates',
                title: '⚙️ Using Gates',
                description: 'Click the "+ AND" button to add a gate to the canvas. You can place multiple gates and connect them with wires to create complex circuits!',
                target: '#gatePalette',
                action: 'highlight',
                highlight: true
            },
            {
                id: 'level-1-inputs',
                title: '⚡ Magical Inputs',
                description: 'These buttons control the input values. Click them to toggle between ON (1) and OFF (0). Try toggling them to see how the circuit responds!',
                target: '#inputControls',
                action: 'highlight',
                highlight: true
            },
            {
                id: 'level-1-wires',
                title: '🔗 Connecting Wires',
                description: 'Click on a gate\'s port and drag to another gate\'s port to create a connection. Wires carry the magical energy between gates!',
                target: null,
                action: 'click-to-continue',
                highlight: false
            },
            {
                id: 'level-1-check',
                title: '✨ Cast Your Spell',
                description: 'When you think your circuit is correct, click the "✨ Cast Spell" button to verify your solution!',
                target: '#btnCheck',
                action: 'highlight',
                highlight: true
            },
            {
                id: 'congratulations',
                title: '🎉 You\'re Ready!',
                description: 'You now understand the basics! Each level will introduce new concepts. Pay attention to the hints and experiment with different gate combinations. Good luck, young wizard! 🪄',
                target: null,
                action: 'click-to-continue',
                highlight: false
            }
        ];
    }

    start(forceReplay = false) {
        if (this.completedTutorial && !forceReplay) {
            console.log('ℹ️ Tutorial already completed');
            return;
        }
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
    }

    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[this.currentStep];
        this.renderTutorialOverlay(step);
    }

    renderTutorialOverlay(step) {
        // Remove existing overlay if any
        const existing = document.getElementById('tutorialOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'tutorialOverlay';
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-box">
                <div class="tutorial-header">
                    <h2>${step.title}</h2>
                    <button class="tutorial-close" id="tutorialClose">✕</button>
                </div>
                <div class="tutorial-content">
                    <p>${step.description.split('\n').join('<br>')}</p>
                </div>
                <div class="tutorial-footer">
                    <div class="tutorial-progress">
                        Step ${this.currentStep + 1} of ${this.steps.length}
                    </div>
                    <div class="tutorial-buttons">
                        ${this.currentStep > 0 ? '<button class="btn btn-secondary" id="tutorialPrev">← Previous</button>' : ''}
                        <button class="btn btn-primary" id="tutorialNext">
                            ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add highlight if needed
        if (step.highlight && step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                const highlight = document.createElement('div');
                highlight.className = 'tutorial-highlight';
                highlight.style.cssText = `
                    position: fixed;
                    top: ${rect.top - 5}px;
                    left: ${rect.left - 5}px;
                    width: ${rect.width + 10}px;
                    height: ${rect.height + 10}px;
                    border: 3px solid #667eea;
                    border-radius: 8px;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
                    pointer-events: none;
                    z-index: 9998;
                    animation: tutorialPulse 2s infinite;
                `;
                document.body.appendChild(highlight);
            }
        }

        // Event listeners
        document.getElementById('tutorialClose').addEventListener('click', () => this.skip());
        document.getElementById('tutorialNext').addEventListener('click', () => this.nextStep());
        
        const prevBtn = document.getElementById('tutorialPrev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.skip();
        });
    }

    nextStep() {
        this.currentStep++;
        this.showStep();
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    skip() {
        if (confirm('Skip the tutorial? You can restart it anytime from the help menu.')) {
            this.complete();
        }
    }

    complete() {
        localStorage.setItem('tutorialCompleted', 'true');
        this.completedTutorial = true;
        this.isActive = false;
        this.removeTutorialUI();
        console.log('✅ Tutorial completed!');
    }

    removeTutorialUI() {
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) overlay.remove();
        
        const highlight = document.querySelector('.tutorial-highlight');
        if (highlight) highlight.remove();
    }

    reset() {
        localStorage.removeItem('tutorialCompleted');
        this.completedTutorial = false;
        console.log('🔄 Tutorial reset');
    }
}

// Add CSS for tutorial
const tutorialStyle = document.createElement('style');
tutorialStyle.id = 'tutorialStyles';
tutorialStyle.textContent = `
    .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .tutorial-box {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .tutorial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 12px;
    }

    .tutorial-header h2 {
        margin: 0;
        color: #667eea;
        font-size: 1.5em;
    }

    .tutorial-close {
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #667eea;
        transition: color 0.2s;
    }

    .tutorial-close:hover {
        color: #764ba2;
    }

    .tutorial-content {
        margin: 20px 0;
        line-height: 1.6;
        color: #555;
        font-size: 1em;
    }

    .tutorial-content p {
        margin: 0;
        white-space: pre-wrap;
    }

    .tutorial-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 2px solid #f0f0f0;
    }

    .tutorial-progress {
        color: #667eea;
        font-size: 0.9em;
        font-weight: 600;
    }

    .tutorial-buttons {
        display: flex;
        gap: 12px;
    }

    .tutorial-buttons .btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }

    .tutorial-buttons .btn:hover {
        background: #764ba2;
        transform: translateY(-2px);
    }

    .tutorial-buttons .btn:active {
        transform: translateY(0);
    }

    .tutorial-highlight {
        animation: tutorialPulse 2s infinite;
    }

    @keyframes tutorialPulse {
        0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 3px #667eea;
        }
        50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px 3px #667eea;
        }
    }
`;
document.head.appendChild(tutorialStyle);

// Create global instance
window.tutorialSystem = new TutorialSystem();
