/**
 * Gesture Module - Hand detection using MediaPipe
 * Both-hands-pinch for frame capture + single-hand pinch for drag
 */
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export class GestureRecognizer {
    constructor(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.context = canvasElement ? canvasElement.getContext('2d') : null;
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
        this.detectionRunning = false;
        this.lastLandmarks = [];
        this.frameCounter = 0;
        this.pinchThreshold = 0.06;
        this.pinchReleaseThreshold = 0.09; // Hysteresis: wider gap needed to release
        this.isPinching = false;
        this.fistPoint = null;
    }

    async init() {
        await this._initializeHands();
        this.startDetection();
        return true;
    }

    async _initializeHands() {
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });
        this.hands.setOptions({ selfieMode: false, maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
        this.hands.onResults((r) => { this.frameCounter++; this.handleResults(r); });
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => { try { if (this.hands && this.detectionRunning) await this.hands.send({ image: this.videoElement }); } catch(e){} },
            width: 1280, height: 720
        });
        this.isInitialized = true;
    }

    handleResults(results) {
        if (!results) return;
        this.lastLandmarks = results.multiHandLandmarks || [];
        if (this.lastLandmarks.length > 0) this.drawHands(this.lastLandmarks);
        else this.clearCanvas();
    }

    startDetection() {
        if (this.detectionRunning) return;
        if (this.videoElement.readyState < 2) {
            this.videoElement.addEventListener('canplay', () => this.startDetection(), { once: true });
            return;
        }
        this.detectionRunning = true;
        if (this.camera) { try { this.camera.start(); } catch(e) { this.detectionRunning = false; } }
    }

    stopDetection() { this.detectionRunning = false; this.clearCanvas(); }
    getLandmarks() { return this.lastLandmarks; }

    /** Detect pinch on a single hand (with hysteresis to prevent flicker) */
    detectPinch(handLandmarks) {
        if (!handLandmarks || handLandmarks.length < 9) {
            this.isPinching = false;
            return false;
        }
        const t = handLandmarks[4], i = handLandmarks[8];
        if (!t || !i) {
            this.isPinching = false;
            return false;
        }
        const dist = Math.sqrt((t.x - i.x) ** 2 + (t.y - i.y) ** 2);

        if (this.isPinching) {
            // Already pinching — need wider distance to release
            if (dist > this.pinchReleaseThreshold) {
                this.isPinching = false;
            }
        } else {
            // Not pinching — need close distance to start
            if (dist < this.pinchThreshold) {
                this.isPinching = true;
            }
        }
        return this.isPinching;
    }

    /** Get pinch midpoint (normalized, NOT mirrored) */
    getPinchPoint(handLandmarks) {
        if (!handLandmarks) return null;
        const t = handLandmarks[4], i = handLandmarks[8];
        if (!t || !i) return null;
        return { x: (t.x + i.x) / 2, y: (t.y + i.y) / 2 };
    }

    /** Detect if hand is making a fist */
    detectFist(handLandmarks) {
        if (!handLandmarks || handLandmarks.length < 21) return false;
        
        // Folded fingers: tip Y > joint Y (since Y increases downwards)
        const indexFolded = handLandmarks[8].y > handLandmarks[6].y;
        const middleFolded = handLandmarks[12].y > handLandmarks[10].y;
        const ringFolded = handLandmarks[16].y > handLandmarks[14].y;
        const pinkyFolded = handLandmarks[20].y > handLandmarks[18].y;
        
        return indexFolded && middleFolded && ringFolded && pinkyFolded;
    }

    /** Get center point of the fist (middle finger MCP joint is a good center) */
    getFistPoint(handLandmarks) {
        if (!handLandmarks || handLandmarks.length < 21) return null;
        return {
            x: handLandmarks[9].x,
            y: handLandmarks[9].y
        };
    }

    drawHands(landmarks) {
        if (!this.context || !this.canvasElement) return;
        this.canvasElement.width = this.canvasElement.clientWidth;
        this.canvasElement.height = this.canvasElement.clientHeight;
        this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        const conns = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
        landmarks.forEach((hl) => {
            if (!hl || hl.length < 21) return;
            this.context.strokeStyle = 'rgba(0,255,127,0.6)';
            this.context.lineWidth = 2;
            conns.forEach(([s, e]) => {
                if (hl[s] && hl[e]) {
                    this.context.beginPath();
                    this.context.moveTo((1 - hl[s].x) * this.canvasElement.width, hl[s].y * this.canvasElement.height);
                    this.context.lineTo((1 - hl[e].x) * this.canvasElement.width, hl[e].y * this.canvasElement.height);
                    this.context.stroke();
                }
            });
            hl.forEach((lm, idx) => {
                const x = (1 - lm.x) * this.canvasElement.width, y = lm.y * this.canvasElement.height;
                this.context.fillStyle = (idx === 4 || idx === 8) ? '#FFFF00' : 'rgba(0,255,127,0.5)';
                this.context.beginPath();
                this.context.arc(x, y, (idx === 4 || idx === 8) ? 6 : 3, 0, 2 * Math.PI);
                this.context.fill();
            });
        });
    }

    clearCanvas() {
        if (this.context && this.canvasElement) {
            try { this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height); } catch(e){}
        }
    }
}
