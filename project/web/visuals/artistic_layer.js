export class ArtisticLayer {
    constructor(p) {
        this.p = p;
        this.currentImage = null;
        this.nextImage = null;
        this.fade = 0;
        this.lastCheck = 0;
        this.images = []; // Cache of recent images
    }

    checkForNewImages() {
        // In a real production app, we'd use a WebSocket message to trigger this.
        // For this prototype, we'll poll the server or rely on the socket message to tell us a new file is ready.
        // However, since we can't easily read the file system from JS without a server endpoint listing files,
        // we will rely on the WebSocket "status" message or a specific "new_texture" message.

        // Actually, the best way is for the server to send the filename when ready.
        // But we didn't implement that in the backend yet (we just saved the file).
        // Let's assume we implement a simple polling for "latest_art_bg.png" if we overwrite it,
        // OR we just try to load the timestamped file if the server told us.

        // Hack for prototype: Poll for a known "latest" file if we implemented overwriting,
        // OR just try to load a new image every 10 seconds blindly? No, that's bad.

        // Better: We will modify the client to listen for a "texture_ready" message.
        // Since we didn't add that to backend yet, let's just try to load a new image 
        // if we see a status update, or just simulate it for now if we can't change backend again easily.

        // Wait, I can change the backend easily. I should have added a broadcast there.
        // But let's write this class to accept a URL.
        pass
    }

    loadImage(url) {
        this.p.loadImage(url, (img) => {
            if (!this.currentImage) {
                this.currentImage = img;
            } else {
                this.nextImage = img;
                this.fade = 0;
            }
        });
    }

    display() {
        this.p.push();
        this.p.imageMode(this.p.CENTER);
        this.p.translate(this.p.width / 2, this.p.height / 2);

        // Scale to cover
        let scale = 1;
        if (this.currentImage) {
            scale = Math.max(this.p.width / this.currentImage.width, this.p.height / this.currentImage.height);
        }

        if (this.currentImage) {
            this.p.tint(255, 255);
            this.p.image(this.currentImage, 0, 0, this.currentImage.width * scale, this.currentImage.height * scale);
        }

        if (this.nextImage) {
            this.fade = Math.min(this.fade + 5, 255);
            this.p.tint(255, this.fade);
            this.p.image(this.nextImage, 0, 0, this.nextImage.width * scale, this.nextImage.height * scale);

            if (this.fade >= 255) {
                this.currentImage = this.nextImage;
                this.nextImage = null;
                this.fade = 0;
            }
        }

        // Apply a subtle "breathing" overlay or shader effect
        // Simple overlay for now
        this.p.noStroke();
        this.p.fill(0, 0, 0, 50 + Math.sin(this.p.frameCount * 0.02) * 20);
        this.p.rect(-this.p.width / 2, -this.p.height / 2, this.p.width, this.p.height);

        this.p.pop();
    }
}
