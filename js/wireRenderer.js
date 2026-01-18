class WireRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationTime = 0;
        this.colors = { active: '#FFD700', preview: '#87CEEB', glow: '#FFA500' };
    }
    
    drawAllWires(wires, currentWire) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        wires.forEach(w => this.drawMagicWire(w.from.x, w.from.y, w.to.x, w.to.y));
        if (currentWire) this.drawPreview(currentWire.from.x, currentWire.from.y, currentWire.to.x, currentWire.to.y);
    }
    
    drawPreview(x1, y1, x2, y2) {
        this.ctx.save();
        this.ctx.strokeStyle = this.colors.preview;
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    drawMagicWire(x1, y1, x2, y2) {
        this.ctx.save();
        const cx = (x1 + x2) / 2;
        const cy = Math.min(y1, y2) - 40;
        
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.colors.glow;
        this.ctx.strokeStyle = this.colors.active;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.quadraticCurveTo(cx, cy, x2, y2);
        this.ctx.stroke();
        
        // Particules fluides
        for (let i = 0; i < 4; i++) {
            const t = ((this.animationTime / 1500 + i / 4) % 1);
            const px = Math.pow(1-t,2)*x1 + 2*(1-t)*t*cx + Math.pow(t,2)*x2;
            const py = Math.pow(1-t,2)*y1 + 2*(1-t)*t*cy + Math.pow(t,2)*y2;
            this.ctx.fillStyle = "#FFF";
            this.ctx.shadowBlur = 5;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2.5, 0, Math.PI*2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    animate() {
        this.animationTime += 16;
        if (window.wireSystem) window.wireSystem.render();
        requestAnimationFrame(() => this.animate());
    }
    startAnimation() { this.animate(); }
}