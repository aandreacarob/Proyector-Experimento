export class NightSky {
    constructor(p) {
        this.p = p;
        this.stars = [];
        this.warpStars = [];          // Warp speed starfield effect
        this.stardust = [];           // Floating dust particles
        this.shootingStars = [];
        this.constellations = [];
        this.milkyWayParticles = [];
        // Nebula clouds removed - was rendering as rings

        // Center point for warp effect
        this.centerX = p.width / 2;
        this.centerY = p.height / 2;

        this.initStars();
        this.initWarpStars();
        this.initStardust();
        this.initMilkyWay();
        // this.initNebulaClouds(); // Disabled
        this.initConstellations();
    }

    initStars() {
        const starCount = 800;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: this.p.random(this.p.width),
                y: this.p.random(this.p.height),
                baseSize: this.p.random(0.5, 3.5),
                baseBrightness: this.p.random(100, 255),
                twinkleSpeed: this.p.random(0.02, 0.08),
                twinkleOffset: this.p.random(100),
                sizeSpeed: this.p.random(0.01, 0.04),
                sizeOffset: this.p.random(100),
                baseHue: this.p.random(1) < 0.2 ? this.p.random(180, 280) : 0,
                colorIntensity: this.p.random(0.3, 1.0)
            });
        }
    }

    // Classic Processing warp starfield - stars fly towards viewer
    initWarpStars() {
        const count = 400;
        for (let i = 0; i < count; i++) {
            this.warpStars.push(this.createWarpStar());
        }
    }

    createWarpStar() {
        return {
            x: this.p.random(-this.p.width, this.p.width),
            y: this.p.random(-this.p.height, this.p.height),
            z: this.p.random(this.p.width),
            pz: 0, // Previous z for trail
            speed: this.p.random(2, 8),
            color: this.p.random(1) < 0.3
                ? this.p.color(this.p.random(150, 200), this.p.random(180, 220), 255, 200)
                : this.p.color(255, 255, 255, 200)
        };
    }

    // Floating stardust particles with trails
    initStardust() {
        const count = 150;
        for (let i = 0; i < count; i++) {
            this.stardust.push({
                x: this.p.random(this.p.width),
                y: this.p.random(this.p.height),
                vx: this.p.random(-0.3, 0.3),
                vy: this.p.random(-0.5, -0.1), // Slowly drifting upward
                size: this.p.random(1, 3),
                alpha: this.p.random(50, 150),
                trail: [],
                trailLength: this.p.floor(this.p.random(5, 15)),
                hue: this.p.random(180, 280),
                wobbleSpeed: this.p.random(0.01, 0.03),
                wobbleAmp: this.p.random(0.5, 2)
            });
        }
    }

    // Perlin noise nebula clouds
    initNebulaClouds() {
        const count = 5;
        for (let i = 0; i < count; i++) {
            this.nebulaClouds.push({
                x: this.p.random(this.p.width),
                y: this.p.random(this.p.height),
                size: this.p.random(200, 500),
                noiseOffset: this.p.random(1000),
                hue: this.p.random(1) < 0.5
                    ? this.p.random(200, 260) // Blue/Purple
                    : this.p.random(280, 320), // Pink/Magenta
                speed: this.p.random(0.001, 0.003),
                alpha: this.p.random(10, 25)
            });
        }
    }

    initMilkyWay() {
        const particleCount = 2500;
        for (let i = 0; i < particleCount; i++) {
            const t = this.p.random(1);
            const spreadMain = this.p.randomGaussian(0, 0.08);
            const spreadSecondary = this.p.randomGaussian(0, 0.15);
            const spread = this.p.random() < 0.7 ? spreadMain : spreadSecondary;

            const curveOffset = Math.sin(t * Math.PI * 2) * 0.1;

            const x = this.p.lerp(-0.1 * this.p.width, 1.1 * this.p.width, t)
                + (spread + curveOffset) * this.p.width * 0.5;
            const y = this.p.lerp(1.1 * this.p.height, -0.1 * this.p.height, t)
                + (spread - curveOffset * 0.5) * this.p.height * 0.5;

            let baseR, baseG, baseB, baseAlpha;
            const colorVar = this.p.random(1);

            if (colorVar < 0.3) {
                baseR = this.p.random(15, 50);
                baseG = this.p.random(20, 70);
                baseB = this.p.random(100, 180);
                baseAlpha = this.p.random(25, 60);
            } else if (colorVar < 0.5) {
                baseR = this.p.random(120, 200);
                baseG = this.p.random(30, 80);
                baseB = this.p.random(150, 220);
                baseAlpha = this.p.random(15, 40);
            } else if (colorVar < 0.7) {
                baseR = this.p.random(20, 60);
                baseG = this.p.random(100, 180);
                baseB = this.p.random(150, 220);
                baseAlpha = this.p.random(10, 35);
            } else {
                baseR = this.p.random(200, 255);
                baseG = this.p.random(200, 255);
                baseB = 255;
                baseAlpha = this.p.random(40, 100);
            }

            this.milkyWayParticles.push({
                x, y,
                originalX: x,
                originalY: y,
                size: this.p.random(1, 5),
                baseR, baseG, baseB, baseAlpha,
                pulseSpeed: this.p.random(0.01, 0.03),
                pulseOffset: this.p.random(100),
                driftAngle: this.p.random(this.p.TWO_PI)
            });
        }
    }

    initConstellations() {
        const brightStars = this.stars.filter(s => s.baseBrightness > 200 && s.baseSize > 2.0);
        for (let i = 0; i < brightStars.length; i++) {
            if (this.p.random() > 0.4) continue;
            const starA = brightStars[i];
            let nearest = null;
            let minDist = 120;
            for (let j = 0; j < brightStars.length; j++) {
                if (i === j) continue;
                const starB = brightStars[j];
                const d = this.p.dist(starA.x, starA.y, starB.x, starB.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = starB;
                }
            }
            if (nearest) {
                this.constellations.push({ start: starA, end: nearest });
            }
        }
    }

    spawnShootingStar() {
        let startX, startY;
        if (this.p.random() < 0.5) {
            startX = this.p.random(this.p.width);
            startY = -50;
        } else {
            startX = -50;
            startY = this.p.random(this.p.height / 2);
        }

        this.shootingStars.push({
            x: startX,
            y: startY,
            vx: this.p.random(10, 20),
            vy: this.p.random(5, 15),
            life: 1.0,
            length: this.p.random(50, 150)
        });
    }

    update() {
        // Spawn shooting stars
        if (this.p.random() < 0.008) {
            this.spawnShootingStar();
        }

        // Update shooting stars
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const s = this.shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.02;

            if (s.life <= 0 || s.x > this.p.width + 200 || s.y > this.p.height + 200) {
                this.shootingStars.splice(i, 1);
            }
        }

        // Update warp stars (flying towards viewer)
        for (let star of this.warpStars) {
            star.pz = star.z;
            star.z -= star.speed;

            if (star.z < 1) {
                star.x = this.p.random(-this.p.width, this.p.width);
                star.y = this.p.random(-this.p.height, this.p.height);
                star.z = this.p.width;
                star.pz = star.z;
            }
        }

        // Update stardust
        for (let dust of this.stardust) {
            // Add current position to trail
            dust.trail.unshift({ x: dust.x, y: dust.y });
            if (dust.trail.length > dust.trailLength) {
                dust.trail.pop();
            }

            // Wobble movement
            const wobble = Math.sin(this.p.frameCount * dust.wobbleSpeed) * dust.wobbleAmp;
            dust.x += dust.vx + wobble * 0.1;
            dust.y += dust.vy;

            // Wrap around
            if (dust.y < -10) {
                dust.y = this.p.height + 10;
                dust.x = this.p.random(this.p.width);
                dust.trail = [];
            }
            if (dust.x < -10) dust.x = this.p.width + 10;
            if (dust.x > this.p.width + 10) dust.x = -10;
        }

        // Update Milky Way particles
        for (let p of this.milkyWayParticles) {
            p.driftAngle += 0.001;
            p.x = p.originalX + Math.cos(p.driftAngle + this.p.frameCount * 0.0005) * 3;
            p.y = p.originalY + Math.sin(p.driftAngle + this.p.frameCount * 0.0005) * 3;
        }
    }

    display() {
        // 1. Deep space gradient background
        const ctx = this.p.drawingContext;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.p.height);
        gradient.addColorStop(0, '#020508');
        gradient.addColorStop(0.3, '#050D18');
        gradient.addColorStop(0.6, '#030A12');
        gradient.addColorStop(1, '#000003');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.p.width, this.p.height);

        // 2. Nebula clouds (Perlin noise)
        // this.displayNebulaClouds(); // Disabled - was rendering as rings

        // 3. Milky Way
        this.displayMilkyWay();

        // 4. Warp starfield (depth effect)
        this.displayWarpStars();

        // 5. Static stars with twinkle
        this.displayStars();

        // 6. Stardust with trails
        this.displayStardust();

        // 7. Constellation lines
        this.p.stroke(255, 255, 255, 25);
        this.p.strokeWeight(0.5);
        for (let c of this.constellations) {
            this.p.line(c.start.x, c.start.y, c.end.x, c.end.y);
        }

        // 8. Shooting stars
        this.displayShootingStars();
    }

    displayNebulaClouds() {
        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.noStroke();

        for (let cloud of this.nebulaClouds) {
            const time = this.p.frameCount * cloud.speed;

            // Draw multiple layers of the cloud
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * this.p.TWO_PI;
                const noiseVal = this.p.noise(
                    cloud.noiseOffset + Math.cos(angle) * 0.5 + time,
                    cloud.noiseOffset + Math.sin(angle) * 0.5,
                    time * 0.5
                );

                const radius = cloud.size * noiseVal * 0.8;
                const x = cloud.x + Math.cos(angle + time * 0.2) * radius * 0.5;
                const y = cloud.y + Math.sin(angle + time * 0.1) * radius * 0.5;

                // HSB to RGB approximation
                const hue = cloud.hue + noiseVal * 40;
                let r, g, b;
                if (hue < 240) { // Blue range
                    r = 50 + noiseVal * 50;
                    g = 80 + noiseVal * 60;
                    b = 180 + noiseVal * 75;
                } else if (hue < 300) { // Purple range
                    r = 120 + noiseVal * 80;
                    g = 50 + noiseVal * 40;
                    b = 180 + noiseVal * 75;
                } else { // Pink range
                    r = 180 + noiseVal * 75;
                    g = 50 + noiseVal * 40;
                    b = 150 + noiseVal * 60;
                }

                const size = 20 + noiseVal * 60;
                const alpha = cloud.alpha * noiseVal;

                this.p.fill(r, g, b, alpha);
                this.p.circle(x, y, size);
            }
        }
        this.p.pop();
    }

    displayMilkyWay() {
        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.noStroke();

        for (let p of this.milkyWayParticles) {
            const pulse = this.p.sin(this.p.frameCount * p.pulseSpeed + p.pulseOffset);
            const size = p.size * (0.8 + pulse * 0.3);
            const alpha = p.baseAlpha * (0.7 + pulse * 0.3);

            this.p.fill(p.baseR, p.baseG, p.baseB, alpha);
            this.p.circle(p.x, p.y, size);
        }
        this.p.pop();
    }

    displayWarpStars() {
        this.p.push();
        this.p.noStroke();

        for (let star of this.warpStars) {
            // Map 3D position to 2D screen
            const sx = this.p.map(star.x / star.z, 0, 1, this.centerX, this.p.width);
            const sy = this.p.map(star.y / star.z, 0, 1, this.centerY, this.p.height);

            // Previous position for trail
            const px = this.p.map(star.x / star.pz, 0, 1, this.centerX, this.p.width);
            const py = this.p.map(star.y / star.pz, 0, 1, this.centerY, this.p.height);

            // Size based on depth
            const r = this.p.map(star.z, 0, this.p.width, 4, 0);

            // Draw trail line
            const alpha = this.p.map(star.z, 0, this.p.width, 255, 50);
            this.p.stroke(this.p.red(star.color), this.p.green(star.color), this.p.blue(star.color), alpha * 0.5);
            this.p.strokeWeight(r * 0.5);
            this.p.line(px, py, sx, sy);

            // Draw star
            this.p.noStroke();
            this.p.fill(this.p.red(star.color), this.p.green(star.color), this.p.blue(star.color), alpha);
            this.p.circle(sx, sy, r);
        }
        this.p.pop();
    }

    displayStars() {
        this.p.push();
        this.p.noStroke();

        for (let s of this.stars) {
            const twinkle = this.p.sin(this.p.frameCount * s.twinkleSpeed + s.twinkleOffset);
            const brightness = this.p.map(twinkle, -1, 1, s.baseBrightness * 0.3, s.baseBrightness);
            const sizePulse = this.p.sin(this.p.frameCount * s.sizeSpeed + s.sizeOffset);
            const size = s.baseSize * (0.7 + sizePulse * 0.4);

            let r = 255, g = 255, b = 255;
            if (s.baseHue > 0) {
                const hue = s.baseHue;
                if (hue < 220) {
                    r = 150; g = 180; b = 255;
                } else if (hue < 260) {
                    r = 200; g = 150; b = 255;
                } else {
                    r = 255; g = 180; b = 220;
                }
            }

            // Glow for bright stars
            if (s.baseBrightness > 180 && size > 2) {
                this.p.fill(r, g, b, brightness * 0.15);
                this.p.circle(s.x, s.y, size * 4);
            }

            this.p.fill(r, g, b, brightness);
            this.p.circle(s.x, s.y, size);
        }
        this.p.pop();
    }

    displayStardust() {
        this.p.push();
        this.p.blendMode(this.p.ADD);

        for (let dust of this.stardust) {
            // Draw trail
            this.p.noFill();
            for (let i = 0; i < dust.trail.length; i++) {
                const t = dust.trail[i];
                const alpha = this.p.map(i, 0, dust.trail.length, dust.alpha, 0);
                const size = this.p.map(i, 0, dust.trail.length, dust.size, dust.size * 0.3);

                // Convert hue to RGB
                const hueNorm = (dust.hue - 180) / 100;
                const r = 100 + hueNorm * 100;
                const g = 150 + hueNorm * 50;
                const b = 255;

                this.p.noStroke();
                this.p.fill(r, g, b, alpha * 0.5);
                this.p.circle(t.x, t.y, size);
            }

            // Draw main particle with glow
            const hueNorm = (dust.hue - 180) / 100;
            const r = 150 + hueNorm * 105;
            const g = 180 + hueNorm * 75;
            const b = 255;

            // Outer glow
            this.p.fill(r, g, b, dust.alpha * 0.3);
            this.p.circle(dust.x, dust.y, dust.size * 3);

            // Core
            this.p.fill(r, g, b, dust.alpha);
            this.p.circle(dust.x, dust.y, dust.size);
        }
        this.p.pop();
    }

    displayShootingStars() {
        for (let s of this.shootingStars) {
            // Bright head
            this.p.strokeWeight(3);
            this.p.stroke(255, 255, 255, s.life * 255);
            this.p.line(s.x, s.y, s.x - s.vx * 2, s.y - s.vy * 2);

            // Medium trail
            this.p.strokeWeight(2);
            this.p.stroke(200, 220, 255, s.life * 150);
            this.p.line(s.x, s.y, s.x - s.vx * 6, s.y - s.vy * 6);

            // Long faint trail
            this.p.strokeWeight(1);
            this.p.stroke(150, 180, 255, s.life * 50);
            this.p.line(s.x, s.y, s.x - s.vx * 15, s.y - s.vy * 15);
        }
    }
}
