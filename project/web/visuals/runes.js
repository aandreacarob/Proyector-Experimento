export class RuneEffect {
    constructor(p) {
        this.p = p;
        this.runes = [];
    }

    spawn(x, y) {
        this.runes.push({
            x: x,
            y: y,
            rotation: 0,
            scale: 0,
            life: 255,
            type: this.p.floor(this.p.random(3))
        });
    }

    update() {
        for (let i = this.runes.length - 1; i >= 0; i--) {
            let r = this.runes[i];
            r.rotation += 0.02;
            r.scale = this.p.min(r.scale + 0.05, 1);
            r.life -= 2;

            if (r.life <= 0) {
                this.runes.splice(i, 1);
            }
        }
    }

    display() {
        for (let r of this.runes) {
            this.p.push();
            this.p.translate(r.x, r.y);
            this.p.rotate(r.rotation);
            this.p.scale(r.scale);

            this.p.noFill();
            this.p.strokeWeight(2);
            this.p.stroke(100, 200, 255, r.life);

            // Draw different rune patterns
            if (r.type === 0) {
                // Circle with inner pattern
                this.p.circle(0, 0, 80);
                this.p.line(-30, 0, 30, 0);
                this.p.line(0, -30, 0, 30);
                this.p.circle(0, 0, 40);
            } else if (r.type === 1) {
                // Hexagon
                this.p.beginShape();
                for (let i = 0; i < 6; i++) {
                    let angle = this.p.TWO_PI / 6 * i;
                    let x = this.p.cos(angle) * 40;
                    let y = this.p.sin(angle) * 40;
                    this.p.vertex(x, y);
                }
                this.p.endShape(this.p.CLOSE);

                // Inner star
                this.p.beginShape();
                for (let i = 0; i < 6; i++) {
                    let angle = this.p.TWO_PI / 6 * i + this.p.PI / 6;
                    let x = this.p.cos(angle) * 20;
                    let y = this.p.sin(angle) * 20;
                    this.p.vertex(x, y);
                }
                this.p.endShape(this.p.CLOSE);
            } else {
                // Triangle with circle
                this.p.triangle(-35, 30, 35, 30, 0, -40);
                this.p.circle(0, 0, 30);
            }

            this.p.pop();
        }
    }
}
