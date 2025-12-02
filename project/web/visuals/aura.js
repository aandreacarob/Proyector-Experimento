export class AuraEffect {
    constructor(p) {
        this.p = p;
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.baseSize = 100;
        this.pulse = 0;
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setBoost(active) {
        this.active = active;
    }

    display() {
        this.pulse += 0.05;
        const size = this.baseSize + Math.sin(this.pulse) * 20;
        const alpha = this.active ? 100 : 30;

        this.p.noStroke();

        // Layered aura
        this.p.fill(150, 0, 255, alpha);
        this.p.ellipse(this.x, this.y, size * 2, size * 2);

        this.p.fill(100, 0, 200, alpha + 20);
        this.p.ellipse(this.x, this.y, size * 1.5, size * 1.5);
    }
}
