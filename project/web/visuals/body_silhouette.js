export class BodySilhouette {
    constructor(p) {
        this.p = p;
        // Purple/Electric Violet colors
        this.color = p.color(180, 50, 255, 180);
        this.glowColor = p.color(140, 0, 255, 60);
        this.strokeWeight = 1.5; // Thinner lines

        // Define connections for skeleton
        this.connections = [
            // Torso
            ['left_shoulder', 'right_shoulder'],
            ['left_shoulder', 'left_hip'],
            ['right_shoulder', 'right_hip'],
            // ['left_hip', 'right_hip'], // Removed hip connection line

            // Arms
            ['left_shoulder', 'left_elbow'],
            ['left_elbow', 'left_wrist'],
            ['right_shoulder', 'right_elbow'],
            ['right_elbow', 'right_wrist'],

            // Legs
            ['left_hip', 'left_knee'],
            ['left_knee', 'left_ankle'],
            ['right_hip', 'right_knee'],
            ['right_knee', 'right_ankle'],

            // Head connections removed (triangle)
        ];
    }

    display(poseData) {
        if (!poseData) return;

        this.p.push();
        this.p.noFill();
        this.p.blendMode(this.p.ADD);

        // Draw Glow (thicker, transparent)
        this.p.stroke(this.glowColor);
        this.p.strokeWeight(this.strokeWeight * 5);
        this.drawSkeleton(poseData, false);

        // Draw Core (thin, vibrant, with noise)
        this.p.stroke(this.color);
        this.p.strokeWeight(this.strokeWeight);
        this.drawSkeleton(poseData, true);

        // Draw Joints as small energy points
        this.drawJoints(poseData);

        this.p.pop();
    }

    drawSkeleton(pose, addNoise) {
        this.p.beginShape(this.p.LINES);
        for (let [start, end] of this.connections) {
            if (pose[start] && pose[end]) {
                let x1 = pose[start][0] * this.p.width;
                let y1 = pose[start][1] * this.p.height;
                let x2 = pose[end][0] * this.p.width;
                let y2 = pose[end][1] * this.p.height;

                if (addNoise) {
                    // Add subtle electrical vibration
                    const time = this.p.frameCount * 0.2;
                    x1 += this.p.noise(x1 * 0.01, time) * 4 - 2;
                    y1 += this.p.noise(y1 * 0.01, time) * 4 - 2;
                    x2 += this.p.noise(x2 * 0.01, time) * 4 - 2;
                    y2 += this.p.noise(y2 * 0.01, time) * 4 - 2;
                }

                this.p.vertex(x1, y1);
                this.p.vertex(x2, y2);
            }
        }
        this.p.endShape();
    }

    drawJoints(pose) {
        this.p.noStroke();
        this.p.fill(200, 150, 255, 200); // Bright purple joints

        const joints = [
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
            'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'nose'
        ];

        for (let joint of joints) {
            if (pose[joint]) {
                const x = pose[joint][0] * this.p.width;
                const y = pose[joint][1] * this.p.height;

                // Pulsing size
                const pulse = Math.sin(this.p.frameCount * 0.2) * 1.5;
                this.p.circle(x, y, 3 + pulse);
            }
        }
    }
}
