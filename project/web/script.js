import { ParticleSystem } from './visuals/particles.js';
import { TrailEffect } from './visuals/trails.js';
import { AuraEffect } from './visuals/aura.js';
import { SparkleEffect } from './visuals/sparkles.js';
import { RibbonEffect } from './visuals/ribbons.js';
import { RuneEffect } from './visuals/runes.js';
import { ArtisticLayer } from './visuals/artistic_layer.js';
import { NightSky } from './visuals/night_sky.js';

// Configuration
const WS_URL = 'ws://localhost:8765';

// State
let socket;
let lastPose = null;
let particles, trails, trailsRight, aura, sparkles, ribbons, runes, artisticLayer, nightSky;
let statusEl, fpsEl, loadingEl, debugPanel;
let canvas;
let lastSparkleTime = 0;

// Audio control
let cosmicAudio = null;
let lastBodyPos = null;  // Track body center instead of hands
let targetVolume = 0;
let currentVolume = 0;
let lastMovementTime = 0;
let movementHistory = [];
const MOVEMENT_THRESHOLD = 15;   // Pixels for body center (lowered)
const SILENCE_DELAY = 500;       // 0.5 seconds before fade out
const MAX_VOLUME = 0.7;
const HISTORY_LENGTH = 10;

// Global p5 instance mode or global mode? 
// Let's use global mode for simplicity as it's common with p5, 
// but since we are in a module, we need to attach to window or use instance mode.
// Instance mode is cleaner for modules.

const sketch = (p) => {

    p.setup = () => {
        canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent(document.body); // Attach to body or main
        p.frameRate(60);
        p.noCursor();

        // Initialize Effects
        nightSky = new NightSky(p);
        particles = new ParticleSystem(p);
        trails = new TrailEffect(p, 'cyan');     // Left hand - cyan/purple
        trailsRight = new TrailEffect(p, 'magenta'); // Right hand - magenta/pink
        aura = new AuraEffect(p);
        sparkles = new SparkleEffect(p);
        ribbons = new RibbonEffect(p);
        runes = new RuneEffect(p);
        artisticLayer = new ArtisticLayer(p);

        // UI Elements
        statusEl = document.getElementById('status');
        fpsEl = document.getElementById('fps');
        loadingEl = document.getElementById('loading');
        debugPanel = document.getElementById('debug-panel');

        // Get audio element
        cosmicAudio = document.getElementById('cosmic-audio');

        // Connect WS
        connectWebSocket();
    };

    p.draw = () => {
        // Draw Night Sky Background (Opaque)
        nightSky.update();
        nightSky.display();

        // Draw Artistic Background - DISABLED
        // artisticLayer.display();

        // Update Effects
        if (lastPose) {
            // Map normalized coordinates (0-1) to screen dimensions
            // Right hand
            const rightX = lastPose.right_index[0] * p.width;
            const rightY = lastPose.right_index[1] * p.height;

            // Left hand
            const leftX = lastPose.left_index[0] * p.width;
            const leftY = lastPose.left_index[1] * p.height;

            const shoulderX = (lastPose.left_shoulder[0] + lastPose.right_shoulder[0]) / 2 * p.width;
            const shoulderY = (lastPose.left_shoulder[1] + lastPose.right_shoulder[1]) / 2 * p.height;

            // Update both trails
            trails.updateTarget(leftX, leftY);        // Left hand - cyan
            trailsRight.updateTarget(rightX, rightY); // Right hand - magenta

            aura.updatePosition(shoulderX, shoulderY);

            // Use body center for audio control (more stable than hands)
            updateAudioVolume(shoulderX, shoulderY);

            // ribbons.update(rightX, rightY); // DISABLED - was causing double trail

            // Emit sparkles periodically while moving
            if (p.millis() - lastSparkleTime > 100) {
                sparkles.emit(rightX, rightY, 3);
                sparkles.emit(leftX, leftY, 3);
                lastSparkleTime = p.millis();
            }
        }

        // Update and display all effects
        aura.display();
        // ribbons.display(); // DISABLED - was causing double trail when combined with sparkles
        trails.display();        // Left hand trail (cold colors)
        trailsRight.display();   // Right hand trail (warm colors)
        particles.update();
        particles.display();
        sparkles.update();
        sparkles.display();
        // runes.update();       // DISABLED - pentagrams in center
        // runes.display();      // DISABLED - pentagrams in center

        // FPS
        if (p.frameCount % 30 === 0) {
            fpsEl.innerText = Math.round(p.frameRate());
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
    };

    p.keyPressed = () => {
        if (p.key === 'd') {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    };
};

// Start p5
new p5(sketch);

function connectWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        statusEl.innerText = 'Connected';
        statusEl.style.color = '#0f0';
        loadingEl.style.display = 'none';
    };

    socket.onclose = () => {
        statusEl.innerText = 'Disconnected';
        statusEl.style.color = '#f00';
        setTimeout(connectWebSocket, 3000);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
            handleUpdate(data);
        } else if (data.type === 'texture_ready') {
            console.log("New texture received:", data.url);
            artisticLayer.loadImage(data.url);
        } else if (data.type === 'status') {
            statusEl.innerText = data.message;
        }
    };
}

function handleUpdate(data) {
    lastPose = data.pose;
    const commands = data.commands;
    const handsData = data.hands;

    // Update trail colors based on hand gestures
    if (handsData && handsData.hands) {
        handsData.hands.forEach(hand => {
            if (hand.hand === 'Left') {
                trails.setGesture(hand.gesture);
            } else if (hand.hand === 'Right') {
                trailsRight.setGesture(hand.gesture);
            }
        });
    }

    if (commands && particles && aura) {
        commands.forEach(cmd => {
            if (cmd.command === 'burst') {
                // Convert normalized to screen
                const x = cmd.params.x * window.innerWidth;
                const y = cmd.params.y * window.innerHeight;
                particles.emitBurst(x, y, cmd.params.intensity);
                sparkles.emit(x, y, 10);
            } else if (cmd.command === 'aura_boost') {
                aura.setBoost(cmd.params.active);
                if (cmd.params.active) {
                    // Spawn rune when aura is boosted
                    const x = (lastPose.left_shoulder[0] + lastPose.right_shoulder[0]) / 2 * window.innerWidth;
                    const y = (lastPose.left_shoulder[1] + lastPose.right_shoulder[1]) / 2 * window.innerHeight;
                    runes.spawn(x, y);
                }
            } else if (cmd.command === 'generate_texture') {
                // Add ribbon when generating texture
                ribbons.addRibbon(
                    cmd.params.x * window.innerWidth,
                    cmd.params.y * window.innerHeight
                );
            }
        });
    }
}

/**
 * Smooth audio volume control based on body center movement
 */
function updateAudioVolume(bodyX, bodyY) {
    if (!cosmicAudio || cosmicAudio.paused) return;

    // Initialize volume on first run
    if (currentVolume === 0 && cosmicAudio.volume > 0) {
        currentVolume = cosmicAudio.volume;
        targetVolume = MAX_VOLUME;
        lastMovementTime = Date.now();
    }

    const now = Date.now();
    let dist = 0;

    // Check body center movement
    if (lastBodyPos) {
        dist = Math.hypot(bodyX - lastBodyPos.x, bodyY - lastBodyPos.y);
    }

    // Update last position
    lastBodyPos = { x: bodyX, y: bodyY };

    // Add to movement history
    movementHistory.push(dist);
    if (movementHistory.length > HISTORY_LENGTH) {
        movementHistory.shift();
    }

    // Average movement over history
    const avgMovement = movementHistory.reduce((a, b) => a + b, 0) / movementHistory.length;
    const movementDetected = avgMovement > MOVEMENT_THRESHOLD;

    // Update movement time
    if (movementDetected) {
        lastMovementTime = now;
        targetVolume = MAX_VOLUME;
    } else if (now - lastMovementTime > SILENCE_DELAY) {
        targetVolume = 0;
    }

    // Smooth volume transition
    const fadeSpeed = 0.03;
    if (currentVolume < targetVolume) {
        currentVolume = Math.min(currentVolume + fadeSpeed, targetVolume);
    } else if (currentVolume > targetVolume) {
        currentVolume = Math.max(currentVolume - fadeSpeed, targetVolume);
    }

    cosmicAudio.volume = currentVolume;

    // Debug log
    if (Math.random() < 0.02) {
        console.log(`🎵 Vol: ${currentVolume.toFixed(2)} | Avg: ${avgMovement.toFixed(0)} | Moving: ${movementDetected}`);
    }
}
