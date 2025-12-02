export class TrailEffect {
    constructor(p, colorScheme = 'cyan') {
        this.p = p;
        this.history = [];
        this.maxPoints = 180; // 3 seconds at 60 FPS
        this.noiseOffset = 0;
        this.colorScheme = colorScheme;
    }

    updateTarget(x, y) {
        // Stronger smoothing for more fluid curves
        if (this.history.length > 0) {
            const last = this.history[0];
            x = this.p.lerp(last.x, x, 0.4); // Stronger smoothing (was 0.7)
            y = this.p.lerp(last.y, y, 0.4);
        }

        // Add new point with age 0
        this.history.unshift({
            x,
            y,
            age: 0,
            initialX: x,
            initialY: y
        });

        // Prune old points
        if (this.history.length > this.maxPoints) {
            this.history.pop();
        }

        // Update existing points with very subtle drift
        for (let i = 0; i < this.history.length; i++) {
            const pt = this.history[i];
            pt.age++;

            // Much more subtle turbulence for smoother appearance
            const noiseScale = 0.002; // Reduced from 0.004
            const timeScale = 0.01;   // Reduced from 0.015
            const driftSpeed = 0.2 + (pt.age * 0.015); // Reduced from 0.4

            const nX = this.p.noise(pt.initialX * noiseScale, pt.age * timeScale, this.noiseOffset);
            const nY = this.p.noise(pt.initialY * noiseScale, pt.age * timeScale, this.noiseOffset + 100);

            pt.x += (nX - 0.5) * driftSpeed;
            pt.y += (nY - 0.5) * driftSpeed - 0.2; // Reduced upward drift
        }

        this.noiseOffset += 0.005; // Slower noise evolution
    }

    display() {
        if (this.history.length < 4) return;

        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.noStroke();

        // Define color schemes
        let colors;
        if (this.colorScheme === 'magenta') {
            // Magenta/Pink scheme for right hand
            colors = [
                this.p.color(255, 0, 200, 3),   // Very wide, very faint magenta
                this.p.color(255, 0, 180, 5),   // Wide magenta haze
                this.p.color(255, 0, 150, 8),   // Mid magenta
                this.p.color(255, 100, 200, 12), // Pink outer glow
                this.p.color(255, 150, 220, 20), // Pink mid glow
                this.p.color(255, 180, 255, 40), // Bright pink
                this.p.color(255, 200, 255, 100), // Near-white pink
                this.p.color(255, 255, 255, 255)  // White core
            ];
        } else {
            // Cyan scheme for left hand (default)
            colors = [
                this.p.color(200, 0, 255, 3),   // Very wide, very faint purple
                this.p.color(180, 0, 255, 5),   // Wide purple haze
                this.p.color(150, 0, 255, 8),   // Mid purple
                this.p.color(0, 180, 255, 12),  // Cyan outer glow
                this.p.color(0, 220, 255, 20),  // Cyan mid glow
                this.p.color(0, 255, 255, 40),  // Bright cyan
                this.p.color(200, 230, 255, 100), // Near-white inner
                this.p.color(255, 255, 255, 255)  // White core
            ];
        }

        // Draw layers with corresponding widths
        const widths = [80, 60, 45, 30, 20, 12, 6, 2];
        for (let i = 0; i < colors.length; i++) {
            this.drawRibbon(widths[i], colors[i]);
        }

        this.p.pop();
    }

    drawRibbon(baseWidth, baseColor) {
        this.p.beginShape(this.p.TRIANGLE_STRIP);

        for (let i = 0; i < this.history.length - 1; i++) {
            const p1 = this.history[i];
            const p2 = this.history[i + 1];

            // Calculate direction vector
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // Calculate normal vector (perpendicular)
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;

            const nx = -dy / len;
            const ny = dx / len;

            // Balanced width expansion
            const ageRatio = p1.age / this.maxPoints;
            const expansion = 1 + (ageRatio * 1.2);
            const w = baseWidth * expansion;

            // Smooth fade with less extreme easing
            const alphaFade = 1 - ageRatio;

            // Subtle width variation
            const noiseVar = this.p.noise(p1.x * 0.01, p1.y * 0.01, this.noiseOffset);
            const widthVar = w * (0.85 + noiseVar * 0.3);

            // Set color with faded alpha
            const c = this.p.color(
                this.p.red(baseColor),
                this.p.green(baseColor),
                this.p.blue(baseColor),
                this.p.alpha(baseColor) * alphaFade
            );
            this.p.fill(c);

            // Add two vertices for the strip
            this.p.vertex(p1.x + nx * widthVar, p1.y + ny * widthVar);
            this.p.vertex(p1.x - nx * widthVar, p1.y - ny * widthVar);
        }

        this.p.endShape();
    }
}
