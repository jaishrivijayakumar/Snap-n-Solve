/**
 * Puzzle Module - 3x3 puzzle generation and piece management
 */
export class PuzzleGenerator {
    constructor(imageCanvas, gridSize = 3) {
        this.imageCanvas = imageCanvas;
        this.gridSize = gridSize;
        this.pieces = [];
        this.solution = null;
    }

    /**
     * Generate puzzle pieces from a frame region of the camera
     * @param {HTMLCanvasElement} sourceCanvas - full camera frame
     * @param {Object} frameRect - {x, y, width, height} in normalized coords [0-1]
     * @param {number} canvasWidth - puzzle overlay canvas width
     * @param {number} canvasHeight - puzzle overlay canvas height
     */
    generateFromFrame(sourceCanvas, frameRect, canvasWidth, canvasHeight) {
        this.pieces = [];
        const gridSize = this.gridSize;

        // Extract the framed region from the source
        const cropCanvas = document.createElement('canvas');
        const sx = frameRect.x * sourceCanvas.width;
        const sy = frameRect.y * sourceCanvas.height;
        const sw = frameRect.width * sourceCanvas.width;
        const sh = frameRect.height * sourceCanvas.height;

        // Make the crop square-ish for better puzzle pieces
        const cropSize = Math.min(sw, sh);
        cropCanvas.width = cropSize;
        cropCanvas.height = cropSize;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(sourceCanvas, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);

        // Store solution
        try { this.solution = cropCanvas.toDataURL(); } catch (e) { this.solution = null; }

        // Pieces fill the entire canvas
        const pieceW = canvasWidth / gridSize;
        const pieceH = canvasHeight / gridSize;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = cropSize / gridSize;
                pieceCanvas.height = cropSize / gridSize;
                const pCtx = pieceCanvas.getContext('2d');
                pCtx.drawImage(cropCanvas, col * (cropSize / gridSize), row * (cropSize / gridSize), cropSize / gridSize, cropSize / gridSize, 0, 0, cropSize / gridSize, cropSize / gridSize);

                this.pieces.push({
                    id: row * gridSize + col,
                    correctRow: row,
                    correctCol: col,
                    image: pieceCanvas.toDataURL(),
                    correctX: col * pieceW,
                    correctY: row * pieceH,
                    x: 0, y: 0,
                    width: pieceW,
                    height: pieceH,
                    rotation: 0,
                    scale: 1,
                    isPlaced: false,
                    velocity: { x: 0, y: 0 },
                    isDragging: false
                });
            }
        }
        console.log(`Generated ${this.pieces.length} pieces (${gridSize}x${gridSize})`);
        return this.pieces;
    }

    /**
     * Shuffle pieces randomly across the canvas
     */
    shufflePieces(canvasWidth, canvasHeight) {
        if (!this.pieces || this.pieces.length === 0) return;
        this.pieces.forEach((piece) => {
            piece.x = Math.random() * Math.max(0, canvasWidth - piece.width);
            piece.y = Math.random() * Math.max(0, canvasHeight - piece.height);
            piece.rotation = 0;
            piece.scale = 1;
            piece.isPlaced = false;
        });
    }

    /**
     * Snap piece to correct position if close enough
     */
    snapToGrid(piece, snapDist = 25) {
        const dx = Math.abs(piece.x - piece.correctX);
        const dy = Math.abs(piece.y - piece.correctY);
        if (dx < snapDist && dy < snapDist) {
            piece.x = piece.correctX;
            piece.y = piece.correctY;
            piece.rotation = 0;
            piece.scale = 1;
            piece.isPlaced = true;
            return true;
        }
        return false;
    }

    getCompletion() {
        if (!this.pieces || this.pieces.length === 0) return 0;
        return Math.round((this.pieces.filter(p => p && p.isPlaced).length / this.pieces.length) * 100);
    }

    isPuzzleSolved() {
        if (!this.pieces || this.pieces.length === 0) return false;
        // Verify every piece is both flagged as placed AND at its correct position
        return this.pieces.every(p => {
            if (!p || !p.isPlaced) return false;
            return p.x === p.correctX && p.y === p.correctY;
        });
    }

    resetPuzzle(canvasWidth, canvasHeight) {
        if (!this.pieces) return;
        this.pieces.forEach(p => { if (p) { p.isPlaced = false; p.x = Math.random() * Math.max(0, canvasWidth - p.width); p.y = Math.random() * Math.max(0, canvasHeight - p.height); p.rotation = 0; p.scale = 1; } });
    }

    getPieceAtPosition(x, y) {
        if (!this.pieces) return null;
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const p = this.pieces[i];
            if (p && !p.isPlaced && x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) return p;
        }
        return null;
    }
}
