// ============================================
// Gates Guide System - Interactive Reference
// Hogwarts Logic Academy
// ============================================

class GatesGuide {
    constructor() {
        this.gates = this.initializeGatesData();
    }

    initializeGatesData() {
        return {
            AND: {
                name: 'AND Gate',
                emoji: '🟢',
                description: 'The AND gate outputs 1 only when BOTH inputs are 1.',
                realWorldExample: 'A light that turns on only when both a switch AND a motion sensor are active.',
                truthTable: [
                    { input1: 0, input2: 0, output: 0 },
                    { input1: 0, input2: 1, output: 0 },
                    { input1: 1, input2: 0, output: 0 },
                    { input1: 1, input2: 1, output: 1 }
                ],
                symbol: '∧',
                formula: 'Output = Input1 AND Input2',
                tips: [
                    '✓ Think of it as "both must be true"',
                    '✓ Used for security systems (both keys needed)',
                    '✓ Used for AND conditions in programming'
                ],
                levels: [1, 4, 6, 7, 8, 10, 11, 12]
            },
            OR: {
                name: 'OR Gate',
                emoji: '🟡',
                description: 'The OR gate outputs 1 when AT LEAST ONE input is 1.',
                realWorldExample: 'A doorbell that rings if you press button A OR button B.',
                truthTable: [
                    { input1: 0, input2: 0, output: 0 },
                    { input1: 0, input2: 1, output: 1 },
                    { input1: 1, input2: 0, output: 1 },
                    { input1: 1, input2: 1, output: 1 }
                ],
                symbol: '∨',
                formula: 'Output = Input1 OR Input2',
                tips: [
                    '✓ Think of it as "at least one must be true"',
                    '✓ Used for emergency systems (any alarm triggers)',
                    '✓ Used for OR conditions in programming'
                ],
                levels: [2, 7, 8, 9, 10, 11]
            },
            NOT: {
                name: 'NOT Gate',
                emoji: '🔴',
                description: 'The NOT gate reverses the input. If input is 1, output is 0, and vice versa.',
                realWorldExample: 'A light that turns OFF when you press the button (instead of ON).',
                truthTable: [
                    { input: 0, output: 1 },
                    { input: 1, output: 0 }
                ],
                symbol: '¬',
                formula: 'Output = NOT Input',
                tips: [
                    '✓ Think of it as "the opposite"',
                    '✓ Used for inverting signals',
                    '✓ Used for NOT conditions in programming'
                ],
                levels: [3, 4, 6, 7, 11, 12]
            },
            XOR: {
                name: 'XOR Gate (Exclusive OR)',
                emoji: '🟣',
                description: 'The XOR gate outputs 1 when EXACTLY ONE input is 1 (but not both).',
                realWorldExample: 'A light controlled by two switches - it turns on if you flip either switch, but turns off if you flip both.',
                truthTable: [
                    { input1: 0, input2: 0, output: 0 },
                    { input1: 0, input2: 1, output: 1 },
                    { input1: 1, input2: 0, output: 1 },
                    { input1: 1, input2: 1, output: 0 }
                ],
                symbol: '⊕',
                formula: 'Output = Input1 XOR Input2',
                tips: [
                    '✓ Think of it as "one or the other, but not both"',
                    '✓ Used for toggle switches',
                    '✓ Used for parity checking in data transmission'
                ],
                levels: [5, 10]
            }
        };
    }

    renderGuide() {
        const modal = document.createElement('div');
        modal.id = 'gatesGuideModal';
        modal.className = 'gates-guide-modal';
        modal.innerHTML = `
            <div class="gates-guide-container">
                <div class="gates-guide-header">
                    <h1>🔮 Logic Gates Guide</h1>
                    <button class="gates-guide-close">✕</button>
                </div>

                <div class="gates-guide-tabs">
                    <button class="gates-guide-tab-btn active" data-gate="AND">🟢 AND</button>
                    <button class="gates-guide-tab-btn" data-gate="OR">🟡 OR</button>
                    <button class="gates-guide-tab-btn" data-gate="NOT">🔴 NOT</button>
                    <button class="gates-guide-tab-btn" data-gate="XOR">🟣 XOR</button>
                </div>

                <div class="gates-guide-content" id="gatesGuideContent">
                    <!-- Content will be dynamically loaded -->
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        document.querySelector('.gates-guide-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.querySelectorAll('.gates-guide-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.gates-guide-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.showGateContent(e.target.dataset.gate);
            });
        });

        // Show first gate
        this.showGateContent('AND');
    }

    showGateContent(gateName) {
        const gate = this.gates[gateName];
        const content = document.getElementById('gatesGuideContent');

        let truthTableHTML = '<table class="truth-table"><thead><tr>';
        
        if (gateName === 'NOT') {
            truthTableHTML += '<th>Input</th><th>Output</th></tr></thead><tbody>';
            gate.truthTable.forEach(row => {
                truthTableHTML += `<tr><td>${row.input}</td><td>${row.output}</td></tr>`;
            });
        } else {
            truthTableHTML += '<th>Input 1</th><th>Input 2</th><th>Output</th></tr></thead><tbody>';
            gate.truthTable.forEach(row => {
                truthTableHTML += `<tr><td>${row.input1}</td><td>${row.input2}</td><td>${row.output}</td></tr>`;
            });
        }
        truthTableHTML += '</tbody></table>';

        content.innerHTML = `
            <div class="gate-detail">
                <div class="gate-header">
                    <div class="gate-emoji">${gate.emoji}</div>
                    <div class="gate-info">
                        <h2>${gate.name}</h2>
                        <p class="gate-formula">${gate.formula}</p>
                    </div>
                </div>

                <div class="gate-section">
                    <h3>📖 Description</h3>
                    <p>${gate.description}</p>
                </div>

                <div class="gate-section">
                    <h3>🌍 Real-World Example</h3>
                    <p>${gate.realWorldExample}</p>
                </div>

                <div class="gate-section">
                    <h3>📊 Truth Table</h3>
                    <p class="truth-table-desc">Shows all possible input combinations and their outputs:</p>
                    ${truthTableHTML}
                </div>

                <div class="gate-section">
                    <h3>💡 Tips & Tricks</h3>
                    <ul class="gate-tips">
                        ${gate.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>

                <div class="gate-section">
                    <h3>🎮 Used in Levels</h3>
                    <div class="gate-levels">
                        ${gate.levels.map(level => `<span class="level-badge">Level ${level}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    open() {
        this.renderGuide();
    }
}

// Add CSS for gates guide
const gatesGuideStyle = document.createElement('style');
gatesGuideStyle.id = 'gatesGuideStyles';
gatesGuideStyle.textContent = `
    .gates-guide-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9000;
        padding: 20px;
    }

    .gates-guide-container {
        background: white;
        border-radius: 16px;
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .gates-guide-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 2px solid #f0f0f0;
        position: sticky;
        top: 0;
        background: white;
    }

    .gates-guide-header h1 {
        margin: 0;
        color: #667eea;
        font-size: 1.8em;
    }

    .gates-guide-close {
        background: transparent;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #999;
        transition: color 0.2s;
    }

    .gates-guide-close:hover {
        color: #333;
    }

    .gates-guide-tabs {
        display: flex;
        gap: 8px;
        padding: 16px 24px;
        border-bottom: 2px solid #f0f0f0;
        background: #f8f9fa;
        flex-wrap: wrap;
    }

    .gates-guide-tab-btn {
        padding: 10px 16px;
        border: 2px solid transparent;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        font-size: 0.95em;
    }

    .gates-guide-tab-btn:hover {
        background: #f0f0f0;
    }

    .gates-guide-tab-btn.active {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }

    .gates-guide-content {
        padding: 24px;
    }

    .gate-detail {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .gate-header {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 12px;
    }

    .gate-emoji {
        font-size: 3em;
    }

    .gate-info h2 {
        margin: 0 0 8px 0;
        color: #333;
    }

    .gate-formula {
        margin: 0;
        color: #667eea;
        font-weight: 600;
        font-family: monospace;
    }

    .gate-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .gate-section h3 {
        margin: 0;
        color: #667eea;
        font-size: 1.1em;
    }

    .gate-section p {
        margin: 0;
        color: #555;
        line-height: 1.6;
    }

    .truth-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
    }

    .truth-table th {
        background: #667eea;
        color: white;
        padding: 12px;
        text-align: center;
        font-weight: 600;
    }

    .truth-table td {
        padding: 12px;
        text-align: center;
        border-bottom: 1px solid #eee;
        font-family: monospace;
        font-weight: 600;
        color: #333;
    }

    .truth-table tr:last-child td {
        border-bottom: none;
    }

    .truth-table tr:nth-child(even) {
        background: #f8f9fa;
    }

    .truth-table-desc {
        margin: 0 0 12px 0;
        color: #666;
        font-size: 0.95em;
    }

    .gate-tips {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .gate-tips li {
        padding: 8px 12px;
        background: #f0f7ff;
        border-left: 4px solid #667eea;
        color: #333;
        border-radius: 4px;
    }

    .gate-levels {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .level-badge {
        display: inline-block;
        padding: 6px 12px;
        background: #667eea;
        color: white;
        border-radius: 20px;
        font-size: 0.85em;
        font-weight: 600;
    }

    @media (max-width: 600px) {
        .gates-guide-container {
            max-height: 95vh;
        }

        .gate-header {
            flex-direction: column;
            text-align: center;
        }

        .gates-guide-tabs {
            gap: 4px;
        }

        .gates-guide-tab-btn {
            padding: 8px 12px;
            font-size: 0.85em;
        }
    }
`;
document.head.appendChild(gatesGuideStyle);

// Create global instance
window.gatesGuide = new GatesGuide();
