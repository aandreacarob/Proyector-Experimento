export class ParticleSystem {
    constructor(p) {
        this.p = p;
        this.particles = [];
    }

    emitBurst(x, y, intensity) {
        const count = Math.floor(intensity * 10); // Slightly fewer particles to reduce clutter
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * intensity * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 255,
                size: this.p.random(2, 6),
                // Neon palette: Cyan (180), Magenta (300), Purple (270)
                hue: this.p.random() > 0.5 ? this.p.random(170, 200) : this.p.random(260, 320)
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // Low gravity for "floating" feel
            p.vx *= 0.96; // Drag
            p.life -= 3;
            p.size *= 0.97;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    display() {
        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.colorMode(this.p.HSB);
        this.p.noStroke();

        for (let p of this.particles) {
            // Draw Glow
            this.p.fill(p.hue, 80, 100, p.life / 255 * 0.5); // Low alpha
            this.p.circle(p.x, p.y, p.size * 4);

            // Draw Core
            this.p.fill(p.hue, 20, 100, p.life / 255); // Almost white
            this.p.circle(p.x, p.y, p.size);
        }

        this.p.colorMode(this.p.RGB);
        this.p.pop();
    }
}
