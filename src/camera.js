/**
 * Camera Module - Handles video streaming and frame capture
 */

export class CameraManager {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.stream = null;
        this.isStreaming = false;
        this.constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        };
    }

    /**
     * Initialize camera stream
     */
    async init() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.videoElement.srcObject = this.stream;
            
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    this.isStreaming = true;
                    resolve();
                };
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Camera access denied or unavailable');
        }
    }

    /**
     * Capture current frame as ImageData
     */
    captureFrame(canvas) {
        if (!this.isStreaming) {
            throw new Error('Camera not initialized');
        }
        
        if (!canvas) {
            throw new Error('Canvas element is required');
        }

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context from canvas');
        }
        
        if (!this.videoElement || this.videoElement.videoWidth <= 0) {
            throw new Error('Video element not ready or has invalid dimensions');
        }

        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        // Mirror to match video
        context.scale(-1, 1);
        context.drawImage(this.videoElement, -canvas.width, 0);
        
        return canvas;
    }

    /**
     * Get current video dimensions
     */
    getDimensions() {
        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
    }

    /**
     * Stop camera stream
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.isStreaming = false;
        }
    }

    /**
     * Check if camera is currently streaming
     */
    getStreamingStatus() {
        return this.isStreaming && this.stream !== null;
    }

    /**
     * Get camera stream object
     */
    getStream() {
        return this.stream;
    }
}
