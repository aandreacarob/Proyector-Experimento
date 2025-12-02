export class NightSky {
    constructor(p) {
        this.p = p;
        this.stars = [];
        this.shootingStars = [];
        this.constellations = [];
        this.milkyWayParticles = [];
        this.landscape = null;

        this.initStars();
        this.initMilkyWay();
        this.initConstellations();
        this.initLandscape();
    }

    initStars() {
        const starCount = 1000;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: this.p.random(this.p.width),
                y: this.p.random(this.p.height),
                size: this.p.random(0.5, 3.0),
                baseBrightness: this.p.random(100, 255),
                twinkleSpeed: this.p.random(0.01, 0.05),
                twinkleOffset: this.p.random(100)
            });
        }
    }

    initMilkyWay() {
        const particleCount = 2000;
        for (let i = 0; i < particleCount; i++) {
            const t = this.p.random(1);
            const spread = this.p.randomGaussian(0, 0.12);

            // Diagonal band from bottom-left to top-right
            const x = this.p.lerp(-0.2 * this.p.width, 1.2 * this.p.width, t) + spread * this.p.width * 0.5;
            const y = this.p.lerp(1.2 * this.p.height, -0.2 * this.p.height, t) + spread * this.p.height * 0.5;

            let r, g, b, alpha;
            const colorVar = this.p.random(1);
            if (colorVar < 0.4) { // Deep Blue/Purple
                r = this.p.random(10, 40);
                g = this.p.random(10, 60);
                b = this.p.random(80, 150);
                alpha = this.p.random(20, 50);
            } else if (colorVar < 0.7) { // Pink/Magenta highlights
                r = this.p.random(100, 180);
                g = this.p.random(20, 60);
                b = this.p.random(100, 180);
                alpha = this.p.random(10, 30);
            } else { // Bright stars/dust
                r = 200;
                g = 200;
                b = 255;
                alpha = this.p.random(30, 80);
            }

            this.milkyWayParticles.push({
                x, y,
                size: this.p.random(1, 5),
                color: this.p.color(r, g, b, alpha)
            });
        }
    }

    initConstellations() {
        const brightStars = this.stars.filter(s => s.baseBrightness > 200 && s.size > 2.0);
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

    initLandscape() {
        this.landscape = this.p.createGraphics(this.p.width, this.p.height);
        const pg = this.landscape;

        // Draw ground
        pg.noStroke();
        pg.fill(5, 5, 10); // Almost black

        pg.beginShape();
        pg.vertex(0, pg.height);
        for (let x = 0; x <= pg.width; x += 10) {
            // Noise for rolling hills
            const y = pg.height - 50 - this.p.noise(x * 0.005) * 100;
            pg.vertex(x, y);
        }
        pg.vertex(pg.width, pg.height);
        pg.endShape(this.p.CLOSE);

        // Draw Trees
        const treeCount = 40;
        for (let i = 0; i < treeCount; i++) {
            const x = this.p.random(pg.width);
            // Find ground y at this x
            const groundY = pg.height - 50 - this.p.noise(x * 0.005) * 100;
            const treeHeight = this.p.random(50, 150);
            const treeWidth = treeHeight * 0.4;

            // Tree silhouette
            pg.fill(2, 2, 5); // Darker than ground
            pg.triangle(x, groundY - treeHeight, x - treeWidth / 2, groundY + 10, x + treeWidth / 2, groundY + 10);
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
        if (this.p.random() < 0.01) {
            this.spawnShootingStar();
        }

        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const s = this.shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.02;

            if (s.life <= 0 || s.x > this.p.width + 200 || s.y > this.p.height + 200) {
                this.shootingStars.splice(i, 1);
            }
        }
    }

    display() {
        // 1. Gradient Background
        const ctx = this.p.drawingContext;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.p.height);
        gradient.addColorStop(0, '#050B14'); // Dark Blue top
        gradient.addColorStop(0.5, '#0F1B33'); // Slightly lighter middle
        gradient.addColorStop(1, '#000000'); // Black bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.p.width, this.p.height);

        // 2. Milky Way (Additive)
        this.p.push();
        this.p.blendMode(this.p.ADD);
        this.p.noStroke();
        for (let p of this.milkyWayParticles) {
            this.p.fill(p.color);
            this.p.circle(p.x, p.y, p.size);
        }
        this.p.pop();

        // 3. Stars
        this.p.noStroke();
        for (let s of this.stars) {
            const twinkle = this.p.sin(this.p.frameCount * s.twinkleSpeed + s.twinkleOffset);
            const brightness = this.p.map(twinkle, -1, 1, s.baseBrightness * 0.5, s.baseBrightness);
            this.p.fill(255, 255, 255, brightness);
            this.p.circle(s.x, s.y, s.size);
        }

        // 4. Constellations
        this.p.stroke(255, 255, 255, 40);
        this.p.strokeWeight(1);
        for (let c of this.constellations) {
            this.p.line(c.start.x, c.start.y, c.end.x, c.end.y);
        }

        // 5. Shooting Stars
        for (let s of this.shootingStars) {
            this.p.strokeWeight(2);
            this.p.stroke(255, 255, 255, s.life * 255);
            this.p.line(s.x, s.y, s.x - s.vx * 3, s.y - s.vy * 3);

            this.p.strokeWeight(1);
            this.p.stroke(255, 255, 255, s.life * 100);
            this.p.line(s.x, s.y, s.x - s.vx * 10, s.y - s.vy * 10);
        }

        // 6. Landscape (Foreground)
        if (this.landscape) {
            this.p.image(this.landscape, 0, 0);
        }
    }
}
