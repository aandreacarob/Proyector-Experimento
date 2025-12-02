export class RibbonEffect {
    constructor(p) {
        this.p = p;
        this.ribbons = [];
    }

    addRibbon(x, y) {
        this.ribbons.push({
            points: [{ x, y }],
            hue: this.p.random(360),
            life: 100,
            width: this.p.random(3, 8)
        });
    }

    update(x, y) {
        // Add new point to active ribbons
        for (let ribbon of this.ribbons) {
            if (ribbon.points.length < 30) {
                ribbon.points.push({ x, y });
            } else {
                ribbon.points.shift();
                ribbon.points.push({ x, y });
            }
            ribbon.life -= 0.5;
        }

        // Remove dead ribbons
        this.ribbons = this.ribbons.filter(r => r.life > 0);
    }

    display() {
        this.p.colorMode(this.p.HSB);

        for (let ribbon of this.ribbons) {
            this.p.noFill();

            // Draw multiple layers for glow effect
            for (let layer = 0; layer < 3; layer++) {
                this.p.strokeWeight(ribbon.width + layer * 2);
                this.p.stroke(ribbon.hue, 80, 100, ribbon.life / (layer + 1));

                this.p.beginShape();
                for (let i = 0; i < ribbon.points.length; i++) {
                    let pt = ribbon.points[i];
                    this.p.curveVertex(pt.x, pt.y);
                }
                this.p.endShape();
            }
        }

        this.p.colorMode(this.p.RGB);
    }
}
