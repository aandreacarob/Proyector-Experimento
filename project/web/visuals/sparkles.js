export class SparkleEffect {
    constructor(p) {
        this.p = p;
        this.sparkles = [];
    }

    emit(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.sparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 255,
                size: this.p.random(2, 6),
                hue: this.p.random(180, 280)
            });
        }
    }

    update() {
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            let s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.95;
            s.vy *= 0.95;
            s.life -= 8;
            s.size *= 0.96;

            if (s.life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    display() {
        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.colorMode(this.p.HSB);
        this.p.noStroke();

        for (let s of this.sparkles) {
            // Outer glow
            this.p.fill(s.hue, 80, 100, s.life / 255 * 0.3);
            this.p.circle(s.x, s.y, s.size * 3);

            // Core
            this.p.fill(s.hue, 20, 100, s.life / 255);
            this.p.circle(s.x, s.y, s.size);
        }

        this.p.colorMode(this.p.RGB);
        this.p.pop();
    }
}
