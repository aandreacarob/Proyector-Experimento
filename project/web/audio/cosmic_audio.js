/**
 * CosmicAudio - Continuous Audio Player
 * Plays ambient space music starting at minute 20.
 * Once triggered by hand movement, plays continuously.
 */
export class CosmicAudio {
    constructor() {
        this.audio = null;
        this.isEnabled = false;
        this.hasStarted = false;
        this.startTime = 20 * 60; // 20 minutes = 1200 seconds
        this.volume = 0.7;

        this.init();
    }

    init() {
        this.audio = new Audio('assets/astronaut_ambient.mp3');
        this.audio.loop = true;
        this.audio.volume = this.volume;

        this.audio.addEventListener('canplaythrough', () => {
            console.log('🎵 Audio loaded');
            this.audio.currentTime = this.startTime;
        });

        this.audio.addEventListener('error', (e) => {
            console.error('❌ Audio error:', this.audio.error);
        });

        console.log('🎵 CosmicAudio ready');
    }

    /**
     * Enable audio (must be called from user click)
     */
    async enable() {
        if (this.isEnabled) return;

        try {
            this.audio.currentTime = this.startTime;
            this.audio.volume = this.volume;
            await this.audio.play();
            this.isEnabled = true;
            this.hasStarted = true;
            console.log('🎵 Audio playing from 20:00');
        } catch (err) {
            console.error('❌ Audio error:', err.message);
        }
    }

    /**
     * Called on hand position update - not used for stopping anymore
     * Audio plays continuously once enabled
     */
    updateHandPositions(leftX, leftY, rightX, rightY) {
        // Audio now plays continuously once enabled
        // No need to start/stop based on movement
    }
}
