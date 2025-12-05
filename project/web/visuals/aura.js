export class AuraEffect {
    constructor(p) {
        this.p = p;
        this.x = p.width / 2;
        this.y = p.height / 2;
        this.width = 50;
        this.particles = [];
    }

    setBoost(active) {
        this.boostActive = active;
    }

    updatePosition(x, y, width = 50) {
        // Smooth interpolation
        this.x = this.p.lerp(this.x, x, 0.1);
        this.y = this.p.lerp(this.y, y, 0.1);
        this.width = this.p.lerp(this.width, width, 0.1);

        // Flame particles generation
        // Concentrated in the center/chest area
        // Increase spawn count if boosted
        const spawnCount = this.boostActive ? 8 : 3;
        for (let i = 0; i < spawnCount; i++) {
            if (this.p.random() < 0.6) {
                const w = this.width * 0.4; // Keep it contained/small
                this.particles.push({
                    x: this.x + this.p.random(-w, w),
                    y: this.y + this.p.random(-10, 20),
                    vx: this.p.random(-0.5, 0.5),
                    vy: this.p.random(-2, -0.5) * (this.boostActive ? 1.5 : 1), // Upward movement (flame)
                    life: 255,
                    maxLife: 255,
                    size: this.p.random(2, 6) * (this.boostActive ? 1.5 : 1), // Larger if boosted
                    hue: this.p.random(260, 300) // Purple to Magenta range
                });
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx + Math.sin(this.p.frameCount * 0.1 + p.life) * 0.2; // Wavy movement
            p.y += p.vy;
            p.life -= 6; // Fade out
            p.size *= 0.96; // Shrink

            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    display() {
        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.noStroke();
        this.p.colorMode(this.p.HSB);

        // Draw flame particles
        for (let p of this.particles) {
            const alpha = (p.life / p.maxLife);
            this.p.fill(p.hue, 80, 100, alpha);
            this.p.circle(p.x, p.y, p.size);

            // Outer glow for each particle
            this.p.fill(p.hue, 90, 100, alpha * 0.3);
            this.p.circle(p.x, p.y, p.size * 2);
        }

        // Central core glow (small)
        const pulse = Math.sin(this.p.frameCount * 0.1) * 5;
        const coreSize = this.width * 0.5 + pulse;

        this.p.fill(280, 80, 100, 0.2); // Purple glow
        this.p.circle(this.x, this.y, coreSize);

        this.p.colorMode(this.p.RGB);
        this.p.pop();
    }
}
