export class TrailEffect {
    constructor(p, colorScheme = 'cyan') {
        this.p = p;
        this.history = [];
        this.maxPoints = 180; // 3 seconds at 60 FPS
        this.noiseOffset = 0;
        this.colorScheme = colorScheme;
        this.currentGesture = null; // Track current gesture
    }

    setGesture(gesture) {
        this.currentGesture = gesture;
    }

    updateTarget(x, y) {
        // Calculate velocity from previous position
        let velocity = 0;
        if (this.history.length > 0) {
            const last = this.history[0];
            const dx = x - last.x;
            const dy = y - last.y;
            velocity = Math.sqrt(dx * dx + dy * dy);

            // Stronger smoothing for more fluid curves
            x = this.p.lerp(last.x, x, 0.4);
            y = this.p.lerp(last.y, y, 0.4);
        }

        // Get current color palette based on gesture
        const currentColors = this.getColorsForGesture(this.currentGesture);

        // Add new point with age 0, velocity, and current color palette
        this.history.unshift({
            x,
            y,
            age: 0,
            initialX: x,
            initialY: y,
            velocity: velocity,
            colors: currentColors  // Store the color palette for this point
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

    getColorsForGesture(gesture) {
        // Determine color palette based on hand (colorScheme) and gesture
        // Left hand (cyan scheme) = COLD colors (blues, purples, greens)
        // Right hand (magenta scheme) = WARM colors (reds, oranges, yellows)

        const isColdHand = this.colorScheme === 'cyan';

        if (gesture === 'fist') {
            if (isColdHand) {
                // Cold fist: Deep blue/purple
                return [
                    this.p.color(0, 0, 150, 3),
                    this.p.color(20, 0, 180, 5),
                    this.p.color(40, 0, 200, 8),
                    this.p.color(60, 50, 220, 12),
                    this.p.color(80, 100, 240, 20),
                    this.p.color(120, 150, 255, 40),
                    this.p.color(180, 200, 255, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            } else {
                // Warm fist: Red/Orange
                return [
                    this.p.color(150, 0, 0, 3),
                    this.p.color(200, 30, 0, 5),
                    this.p.color(255, 60, 0, 8),
                    this.p.color(255, 100, 0, 12),
                    this.p.color(255, 150, 0, 20),
                    this.p.color(255, 200, 50, 40),
                    this.p.color(255, 230, 150, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            }
        } else if (gesture === 'pointing') {
            if (isColdHand) {
                // Cold pointing: Cyan/Turquoise
                return [
                    this.p.color(0, 100, 120, 3),
                    this.p.color(0, 130, 150, 5),
                    this.p.color(0, 160, 180, 8),
                    this.p.color(0, 200, 220, 12),
                    this.p.color(50, 230, 255, 20),
                    this.p.color(100, 240, 255, 40),
                    this.p.color(180, 250, 255, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            } else {
                // Warm pointing: Yellow/Gold
                return [
                    this.p.color(150, 120, 0, 3),
                    this.p.color(180, 150, 0, 5),
                    this.p.color(210, 180, 0, 8),
                    this.p.color(240, 210, 0, 12),
                    this.p.color(255, 240, 50, 20),
                    this.p.color(255, 250, 120, 40),
                    this.p.color(255, 255, 200, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            }
        } else if (gesture === 'open_palm') {
            if (isColdHand) {
                // Cold palm: Green/Emerald
                return [
                    this.p.color(0, 100, 80, 3),
                    this.p.color(0, 130, 100, 5),
                    this.p.color(0, 160, 120, 8),
                    this.p.color(20, 200, 150, 12),
                    this.p.color(50, 230, 180, 20),
                    this.p.color(100, 250, 200, 40),
                    this.p.color(180, 255, 230, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            } else {
                // Warm palm: Orange/Coral
                return [
                    this.p.color(180, 80, 0, 3),
                    this.p.color(220, 100, 20, 5),
                    this.p.color(255, 120, 40, 8),
                    this.p.color(255, 150, 80, 12),
                    this.p.color(255, 180, 120, 20),
                    this.p.color(255, 210, 160, 40),
                    this.p.color(255, 235, 200, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            }
        } else if (gesture === 'bunny') {
            if (isColdHand) {
                // Cold bunny: Purple/Violet
                return [
                    this.p.color(100, 0, 150, 3),
                    this.p.color(130, 20, 180, 5),
                    this.p.color(160, 50, 210, 8),
                    this.p.color(180, 80, 240, 12),
                    this.p.color(200, 120, 255, 20),
                    this.p.color(220, 160, 255, 40),
                    this.p.color(240, 200, 255, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            } else {
                // Warm bunny: Pink/Magenta
                return [
                    this.p.color(180, 0, 100, 3),
                    this.p.color(220, 20, 130, 5),
                    this.p.color(255, 50, 160, 8),
                    this.p.color(255, 100, 180, 12),
                    this.p.color(255, 140, 200, 20),
                    this.p.color(255, 180, 220, 40),
                    this.p.color(255, 220, 240, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            }
        } else {
            // Default colors based on hand
            if (isColdHand) {
                // Cold default: Cyan/Blue
                return [
                    this.p.color(0, 50, 150, 3),
                    this.p.color(0, 80, 180, 5),
                    this.p.color(0, 120, 210, 8),
                    this.p.color(0, 160, 240, 12),
                    this.p.color(50, 200, 255, 20),
                    this.p.color(120, 220, 255, 40),
                    this.p.color(180, 240, 255, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            } else {
                // Warm default: Magenta/Red
                return [
                    this.p.color(150, 0, 80, 3),
                    this.p.color(180, 0, 100, 5),
                    this.p.color(210, 0, 120, 8),
                    this.p.color(240, 50, 150, 12),
                    this.p.color(255, 100, 180, 20),
                    this.p.color(255, 150, 210, 40),
                    this.p.color(255, 200, 235, 100),
                    this.p.color(255, 255, 255, 255)
                ];
            }
        }
    }

    display() {
        if (this.history.length < 4) return;

        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.noStroke();

        // Draw layers with corresponding widths
        const widths = [80, 60, 45, 30, 20, 12, 6, 2];
        for (let i = 0; i < widths.length; i++) {
            this.drawRibbon(widths[i], i);
        }

        this.p.pop();
    }

    drawRibbon(baseWidth, colorIndex) {
        this.p.beginShape(this.p.TRIANGLE_STRIP);

        for (let i = 0; i < this.history.length - 1; i++) {
            const p1 = this.history[i];
            const p2 = this.history[i + 1];

            // Skip if point doesn't have colors
            if (!p1.colors || !p1.colors[colorIndex]) continue;

            // Calculate direction vector
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // Calculate normal vector (perpendicular)
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;

            const nx = -dy / len;
            const ny = dx / len;

            // Balanced width expansion based on age
            const ageRatio = p1.age / this.maxPoints;
            const expansion = 1 + (ageRatio * 1.2);

            // Velocity-based thickness modulation (INVERTED: slow = thick, fast = thin)
            const velocityMultiplier = this.p.map(
                this.p.constrain(p1.velocity, 0, 50),
                0, 50,
                1.3, 0.6
            );

            const w = baseWidth * expansion * velocityMultiplier;

            // Smooth fade with less extreme easing
            const alphaFade = 1 - ageRatio;

            // Subtle width variation
            const noiseVar = this.p.noise(p1.x * 0.01, p1.y * 0.01, this.noiseOffset);
            const widthVar = w * (0.85 + noiseVar * 0.3);

            // Progressive color interpolation
            // If there's a next point with different colors, interpolate
            let finalColor = p1.colors[colorIndex];

            if (i < this.history.length - 2 && p2.colors && p2.colors[colorIndex]) {
                const currentColor = p1.colors[colorIndex];
                const nextColor = p2.colors[colorIndex];

                // Check if colors are different (gesture changed)
                const isDifferent =
                    this.p.red(currentColor) !== this.p.red(nextColor) ||
                    this.p.green(currentColor) !== this.p.green(nextColor) ||
                    this.p.blue(currentColor) !== this.p.blue(nextColor);

                if (isDifferent) {
                    // Smooth interpolation factor (0-1) based on position between points
                    const interpFactor = 0.5; // Blend 50/50 between adjacent points

                    finalColor = this.p.lerpColor(currentColor, nextColor, interpFactor);
                }
            }

            // Apply alpha fade
            const c = this.p.color(
                this.p.red(finalColor),
                this.p.green(finalColor),
                this.p.blue(finalColor),
                this.p.alpha(finalColor) * alphaFade
            );
            this.p.fill(c);

            // Add two vertices for the strip
            this.p.vertex(p1.x + nx * widthVar, p1.y + ny * widthVar);
            this.p.vertex(p1.x - nx * widthVar, p1.y - ny * widthVar);
        }

        this.p.endShape();
    }
}
