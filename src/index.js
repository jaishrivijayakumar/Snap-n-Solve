/**
 * Main App - Camera-visible puzzle game
 * Flow: Both-hands-pinch to frame → release to capture → pinch-drag to solve
 */
import { CameraManager } from './camera.js';
import { GestureRecognizer } from './gesture.js';
import { PuzzleGenerator } from './puzzle.js';

class PuzzleGameApp {
    constructor() {
        this.video = document.getElementById('video');
        this.handCanvas = document.getElementById('hand-canvas');
        this.frameCanvas = document.getElementById('frame-canvas');
        this.puzzleCanvas = document.getElementById('puzzle-canvas');
        this.flashOverlay = document.getElementById('flash-overlay');
        this.handCursor = document.getElementById('hand-cursor');
        this.statusBar = document.getElementById('status-bar');
        this.timerEl = document.getElementById('timer');
        this.closeBtn = document.getElementById('close-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.puzzleInfo = document.getElementById('puzzle-info');
        this.controlsBar = document.getElementById('controls-bar');
        this.topCenterArea = document.getElementById('top-center-area');
        this.pieceCountEl = document.getElementById('piece-count');
        this.completionEl = document.getElementById('completion');
        this.celebration = document.getElementById('celebration');
        this.loadingText = document.getElementById('loading-text');
        this.solutionImg = document.getElementById('solution-img');
        this.solutionLabel = document.getElementById('solution-label');
        this.solutionContainer = document.getElementById('solution-container');
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.userNameInput = document.getElementById('user-name-input');
        this.saveScoreBtn = document.getElementById('save-score-btn');
        this.leaderboardDisplay = document.getElementById('leaderboard-display');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.howToGuide = document.getElementById('how-to-guide');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.solveGuide = document.getElementById('solve-guide');
        this.gotItBtn = document.getElementById('got-it-btn');

        this.frameCtx = this.frameCanvas ? this.frameCanvas.getContext('2d') : null;
        this.puzzleCtx = this.puzzleCanvas ? this.puzzleCanvas.getContext('2d') : null;

        this.camera = null;
        this.gesture = null;
        this.puzzle = null;

        this.state = 'camera'; // camera | framing | puzzle | solved
        this.captureCanvas = document.createElement('canvas');
        this.selectedPiece = null;
        this.lastPos = { x: 0, y: 0 };
        this.smoothPos = { x: 0, y: 0 };
        this.imageCache = {};
        this.timerStart = null;
        this.timerInterval = null;

        // Frame tracking
        this.isFraming = false;
        this.lastFrameDisplay = null; // mirrored rect for display
        this.lastFrameRaw = null;     // raw rect for capture

        this.init();
    }

    async init() {
        try {
            this.camera = new CameraManager(this.video);
            await this.camera.init();
            await new Promise(r => {
                if (this.video.videoWidth > 0) { r(); return; }
                this.video.addEventListener('loadedmetadata', () => r(), { once: true });
            });
            if (this.loadingText) this.loadingText.style.display = 'none';
            this.resizeCanvases();
            window.addEventListener('resize', () => this.resizeCanvases());

            this.gesture = new GestureRecognizer(this.video, this.handCanvas);
            await this.gesture.init();
            this.puzzle = new PuzzleGenerator(this.captureCanvas, 3);

            this.closeBtn.addEventListener('click', () => this.closePuzzle());
            this.shuffleBtn.addEventListener('click', () => this.shufflePuzzle());
            this.resetBtn.addEventListener('click', () => this.resetPuzzle());
            this.saveScoreBtn.addEventListener('click', () => this.saveScore());
            if (this.startGameBtn) {
                this.startGameBtn.addEventListener('click', () => {
                    if (this.howToGuide) this.howToGuide.style.display = 'none';
                });
            }
            if (this.gotItBtn) {
                this.gotItBtn.addEventListener('click', () => {
                    if (this.solveGuide) this.solveGuide.style.display = 'none';
                    this.startTimer();
                });
            }

            const initialScores = this.loadLeaderboard();
            this.renderLeaderboard(initialScores);

            // Mouse Interaction Support
            this.puzzleCanvas.addEventListener('mousedown', (e) => this.handleMouseInteraction(e, 'down'));
            this.puzzleCanvas.addEventListener('mousemove', (e) => this.handleMouseInteraction(e, 'move'));
            this.puzzleCanvas.addEventListener('mouseup', (e) => this.handleMouseInteraction(e, 'up'));
            this.puzzleCanvas.addEventListener('mouseleave', (e) => this.handleMouseInteraction(e, 'up'));

            this.gameLoop();
        } catch (err) {
            console.error(err);
        }
    }

    resizeCanvases() {
        const w = window.innerWidth, h = window.innerHeight;
        [this.handCanvas, this.frameCanvas].forEach(c => { if (c) { c.width = w; c.height = h; } });
        if (this.puzzleCanvas) { this.puzzleCanvas.width = 500; this.puzzleCanvas.height = 500; }
    }

    setStatus(msg, cls = '') {
        if (this.statusBar) { this.statusBar.textContent = msg; this.statusBar.className = cls || ''; this.statusBar.style.display = msg ? 'block' : 'none'; }
    }

    // ===== GAME LOOP =====
    gameLoop = () => {
        const landmarks = this.gesture ? this.gesture.getLandmarks() : [];

        if (this.state === 'camera' || this.state === 'framing') {
            this.handleCameraState(landmarks);
        } else if (this.state === 'puzzle') {
            this.handlePuzzleState(landmarks);
        }

        requestAnimationFrame(this.gameLoop);
    };

    // ===== CAMERA STATE: fist to frame =====
    handleCameraState(landmarks) {
        // Clear frame canvas
        if (this.frameCtx) {
            this.frameCanvas.width = window.innerWidth;
            this.frameCanvas.height = window.innerHeight;
            this.frameCtx.clearRect(0, 0, this.frameCanvas.width, this.frameCanvas.height);
        }

        if (landmarks.length === 0) {
            this.state = 'camera';
            this.isFraming = false;
            return;
        }

        // Check if any hand is making a fist
        let fistHand = null;
        for (const hand of landmarks) {
            if (this.gesture.detectFist(hand)) {
                fistHand = hand;
                break;
            }
        }

        if (fistHand) {
            this.state = 'framing';
            this.isFraming = true;
            
            const fp = this.gesture.getFistPoint(fistHand);
            if (!fp) return;

            const cw = this.frameCanvas.width, ch = this.frameCanvas.height;
            const boxSize = 350;
            
            // Both display and capture work on mirrored space
            const mx = 1 - fp.x;
            const my = fp.y;
            
            const fx = mx * cw - boxSize / 2;
            const fy = my * ch - boxSize - 60;
            
            // Raw rect for capture matches mirrored display
            const rawX = mx - (boxSize / cw) / 2;
            const rawY = my - (boxSize + 60) / ch;
            this.lastFrameRaw = { x: rawX, y: rawY, width: boxSize / cw, height: boxSize / ch };

            // Draw 3x3 trace
            this.frameCtx.strokeStyle = '#ff2d75';
            this.frameCtx.lineWidth = 2;
            this.frameCtx.strokeRect(fx, fy, boxSize, boxSize);
            
            // Draw grid lines
            this.frameCtx.beginPath();
            this.frameCtx.setLineDash([5, 5]);
            // Verticals
            for (let i = 1; i < 3; i++) {
                const lx = fx + (boxSize / 3) * i;
                this.frameCtx.moveTo(lx, fy);
                this.frameCtx.lineTo(lx, fy + boxSize);
            }
            // Horizontals
            for (let i = 1; i < 3; i++) {
                const ly = fy + (boxSize / 3) * i;
                this.frameCtx.moveTo(fx, ly);
                this.frameCtx.lineTo(fx + boxSize, ly);
            }
            this.frameCtx.stroke();
            this.frameCtx.setLineDash([]);

            // Dim outside
            this.frameCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.frameCtx.fillRect(0, 0, cw, fy);
            this.frameCtx.fillRect(0, fy + boxSize, cw, ch - fy - boxSize);
            this.frameCtx.fillRect(0, fy, fx, boxSize);
            this.frameCtx.fillRect(fx + boxSize, fy, cw - fx - boxSize, boxSize);
        } else {
            if (this.state === 'framing' && this.isFraming) {
                // Released!
                this.captureFrame(this.lastFrameRaw);
                return;
            }
            this.state = 'camera';
            this.isFraming = false;
        }
    }

    // ===== CAPTURE =====
    captureFrame(rawRect) {
        this.state = 'puzzle';
        this.isFraming = false;

        // Flash
        if (this.flashOverlay) {
            this.flashOverlay.classList.add('flash');
            setTimeout(() => this.flashOverlay.classList.remove('flash'), 200);
        }

        // Capture video frame
        this.captureCanvas.width = this.video.videoWidth;
        this.captureCanvas.height = this.video.videoHeight;
        const ctx = this.captureCanvas.getContext('2d');
        ctx.save(); ctx.scale(-1, 1);
        ctx.drawImage(this.video, -this.captureCanvas.width, 0);
        ctx.restore();

        // Generate pieces
        const cw = 450, ch = 450;
        this.puzzleCanvas.width = cw;
        this.puzzleCanvas.height = ch;
        this.puzzle.generateFromFrame(this.captureCanvas, rawRect, cw, ch);
        this.puzzle.shufflePieces(cw, ch);
        this.imageCache = {};

        // Show solution image on the right
        if (this.solutionContainer && this.puzzle.solution) {
            this.solutionImg.src = this.puzzle.solution;
            this.solutionContainer.style.display = 'flex';
        }

        // UI
        this.puzzleCanvas.classList.add('active');
        this.closeBtn.style.display = 'block';
        this.puzzleInfo.style.display = 'flex';
        if (this.topCenterArea) this.topCenterArea.style.display = 'flex';
        this.solutionContainer.style.display = 'flex';
        this.controlsBar.style.display = 'flex';
        if (this.frameCtx) this.frameCtx.clearRect(0, 0, this.frameCanvas.width, this.frameCanvas.height);

        // Show solve guide first
        if (this.solveGuide) this.solveGuide.style.display = 'flex';
        this.updatePuzzleInfo();
        this.redrawPuzzle();
    }

    startTimer() {
        this.timerEl.style.display = 'block';
        this.timerStart = Date.now();
        this.timerInterval = setInterval(() => {
            const s = Math.floor((Date.now() - this.timerStart) / 1000);
            this.timerEl.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        }, 100);
    }

    // ===== PUZZLE STATE =====
    handlePuzzleState(landmarks) {
        this.redrawPuzzle();

        if (landmarks.length === 0) {
            if (this.handCursor) this.handCursor.style.display = 'none';
            if (this.selectedPiece) {
                this.selectedPiece.isDragging = false;
                this.puzzle.snapToGrid(this.selectedPiece);
                this.selectedPiece = null;
                this.updatePuzzleInfo();
            }
            return;
        }

        // Use first hand for interaction
        const hand = landmarks[0];
        const isPinching = this.gesture.detectPinch(hand);
        const indexTip = hand[8];

        // Hand cursor (mirrored X)
        if (indexTip && this.handCursor) {
            const sx = (1 - indexTip.x) * window.innerWidth;
            const sy = indexTip.y * window.innerHeight;
            this.handCursor.style.display = 'block';
            this.handCursor.style.left = sx + 'px';
            this.handCursor.style.top = sy + 'px';
            this.handCursor.classList.toggle('pinching', isPinching);
        }

        // Map pinch to puzzle canvas coords (mirrored X)
        const pinchPt = this.gesture.getPinchPoint(hand);
        if (!pinchPt) return;
        const mirroredX = 1 - pinchPt.x;

        const canvasRect = this.puzzleCanvas.getBoundingClientRect();
        const screenX = mirroredX * window.innerWidth;
        const screenY = pinchPt.y * window.innerHeight;

        // Smooth the screen coordinates to reduce hand jitter
        const smoothing = 0.45; // 0 = no smoothing, 1 = frozen
        this.smoothPos.x = this.smoothPos.x + (screenX - this.smoothPos.x) * (1 - smoothing);
        this.smoothPos.y = this.smoothPos.y + (screenY - this.smoothPos.y) * (1 - smoothing);

        const px = ((this.smoothPos.x - canvasRect.left) / canvasRect.width) * this.puzzleCanvas.width;
        const py = ((this.smoothPos.y - canvasRect.top) / canvasRect.height) * this.puzzleCanvas.height;

        if (isPinching) {
            if (!this.selectedPiece) {
                const piece = this.puzzle.getPieceAtPosition(px, py);
                if (piece) {
                    this.selectedPiece = piece;
                    piece.isDragging = true;
                    // Seed smooth position to current raw pos to avoid initial jump
                    this.smoothPos = { x: screenX, y: screenY };
                    this.lastPos = { x: px, y: py };
                }
            }
            if (this.selectedPiece) {
                this.selectedPiece.x += px - this.lastPos.x;
                this.selectedPiece.y += py - this.lastPos.y;
                this.lastPos = { x: px, y: py };
            }
        } else {
            if (this.selectedPiece) {
                this.selectedPiece.isDragging = false;
                this.puzzle.snapToGrid(this.selectedPiece);
                this.selectedPiece = null;
                this.updatePuzzleInfo();
                if (this.puzzle.isPuzzleSolved()) {
                    this.state = 'solved';
                    clearInterval(this.timerInterval);
                    const finalTime = this.timerEl.textContent;
                    if (this.celebration) this.celebration.classList.add('active');
                    
                    // Show leaderboard modal after a short delay
                    setTimeout(() => {
                        if (this.leaderboardModal) this.leaderboardModal.style.display = 'flex';
                    }, 1500);
                }
            }
        }
    }

    // ===== DRAW PUZZLE =====
    redrawPuzzle() {
        if (!this.puzzleCtx) return;
        const ctx = this.puzzleCtx;
        const cw = this.puzzleCanvas.width, ch = this.puzzleCanvas.height;
        ctx.clearRect(0, 0, cw, ch);
        if (!this.puzzle || !this.puzzle.pieces || this.puzzle.pieces.length === 0) return;

        // Target grid outlines
        ctx.strokeStyle = 'rgba(255, 45, 117, 0.25)';
        ctx.lineWidth = 1;
        this.puzzle.pieces.forEach(p => {
            if (!p.isPlaced) {
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(p.correctX, p.correctY, p.width, p.height);
                ctx.setLineDash([]);
            }
        });

        // Draw pieces
        this.puzzle.pieces.forEach((piece) => {
            if (!piece || !piece.image) return;
            if (!this.imageCache[piece.id]) {
                this.imageCache[piece.id] = new Image();
                this.imageCache[piece.id].src = piece.image;
            }
            const img = this.imageCache[piece.id];
            if (!img.complete) return;

            ctx.save();
            if (piece.isPlaced) {
                ctx.globalAlpha = 1.0;
                ctx.drawImage(img, piece.correctX, piece.correctY, piece.width, piece.height);
                ctx.strokeStyle = 'rgba(255, 133, 161, 0.6)';
                ctx.lineWidth = 2;
                ctx.strokeRect(piece.correctX, piece.correctY, piece.width, piece.height);
            } else {
                ctx.globalAlpha = piece.isDragging ? 0.95 : 0.85;
                ctx.drawImage(img, piece.x, piece.y, piece.width, piece.height);
                ctx.strokeStyle = piece.isDragging ? '#ff2d75' : 'rgba(255, 45, 117, 0.5)';
                ctx.lineWidth = piece.isDragging ? 3 : 2;
                ctx.strokeRect(piece.x, piece.y, piece.width, piece.height);
            }
            ctx.restore();
        });
    }

    updatePuzzleInfo() {
        const placed = this.puzzle.pieces.filter(p => p.isPlaced).length;
        if (this.pieceCountEl) this.pieceCountEl.textContent = placed;
        if (this.completionEl) this.completionEl.textContent = this.puzzle.getCompletion();
    }

    closePuzzle() {
        this.state = 'camera';
        this.isFraming = false;
        this.lastFrameDisplay = null;
        this.lastFrameRaw = null;
        clearInterval(this.timerInterval);
        this.puzzleCanvas.classList.remove('active');
        this.timerEl.style.display = 'none';
        this.closeBtn.style.display = 'none';
        this.puzzleInfo.style.display = 'none';
        this.controlsBar.style.display = 'none';
        if (this.topCenterArea) this.topCenterArea.style.display = 'none';
        if (this.celebration) this.celebration.classList.remove('active');
        if (this.handCursor) this.handCursor.style.display = 'none';
        if (this.solutionContainer) this.solutionContainer.style.display = 'none';
        if (this.leaderboardModal) this.leaderboardModal.style.display = 'none';
        if (this.leaderboardDisplay) this.leaderboardDisplay.style.display = 'none';
        this.selectedPiece = null;
        this.imageCache = {};
    }

    handleMouseInteraction(e, type) {
        if (this.state !== 'puzzle') return;
        
        const rect = this.puzzleCanvas.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * this.puzzleCanvas.width;
        const py = ((e.clientY - rect.top) / rect.height) * this.puzzleCanvas.height;

        if (type === 'down') {
            const piece = this.puzzle.getPieceAtPosition(px, py);
            if (piece) {
                this.selectedPiece = piece;
                piece.isDragging = true;
                this.lastPos = { x: px, y: py };
            }
        } else if (type === 'move') {
            if (this.selectedPiece && this.selectedPiece.isDragging) {
                this.selectedPiece.x += px - this.lastPos.x;
                this.selectedPiece.y += py - this.lastPos.y;
                this.lastPos = { x: px, y: py };
            }
        } else if (type === 'up') {
            if (this.selectedPiece) {
                this.selectedPiece.isDragging = false;
                this.puzzle.snapToGrid(this.selectedPiece);
                this.selectedPiece = null;
                this.updatePuzzleInfo();
                if (this.puzzle.isPuzzleSolved()) {
                    this.state = 'solved';
                    clearInterval(this.timerInterval);
                    if (this.celebration) this.celebration.classList.add('active');
                    setTimeout(() => {
                        if (this.leaderboardModal) this.leaderboardModal.style.display = 'flex';
                    }, 1500);
                }
            }
        }
    }

    shufflePuzzle() {
        if (!this.puzzle) return;
        this.puzzle.shufflePieces(this.puzzleCanvas.width, this.puzzleCanvas.height);
        this.selectedPiece = null;
        this.updatePuzzleInfo();
    }

    resetPuzzle() {
        if (!this.puzzle) return;
        this.puzzle.resetPuzzle(this.puzzleCanvas.width, this.puzzleCanvas.height);
        this.selectedPiece = null;
        if (this.celebration) this.celebration.classList.remove('active');
        this.state = 'puzzle';
        this.updatePuzzleInfo();
    }

    saveScore() {
        const name = this.userNameInput.value.trim() || 'Anonymous';
        const timeStr = this.timerEl.textContent;
        
        // Convert time string "MM:SS" to seconds for sorting
        const [mins, secs] = timeStr.split(':').map(Number);
        const totalSeconds = mins * 60 + secs;

        const scores = this.loadLeaderboard();
        scores.push({ name, time: timeStr, seconds: totalSeconds, date: new Date().toISOString() });
        
        // Sort by seconds (ascending) and keep top 10
        scores.sort((a, b) => a.seconds - b.seconds);
        const topScores = scores.slice(0, 10);

        localStorage.setItem('puzzle_leaderboard', JSON.stringify(topScores));
        
        if (this.leaderboardModal) this.leaderboardModal.style.display = 'none';
        this.renderLeaderboard(topScores);
        if (this.leaderboardDisplay) this.leaderboardDisplay.style.display = 'block';
    }

    loadLeaderboard() {
        const data = localStorage.getItem('puzzle_leaderboard');
        return data ? JSON.parse(data) : [];
    }

    renderLeaderboard(scores) {
        if (!this.leaderboardList) return;
        this.leaderboardList.innerHTML = '';
        
        scores.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name">${score.name}</span>
                <span class="time">${score.time}</span>
            `;
            this.leaderboardList.appendChild(item);
        });
    }

    destroy() {
        clearInterval(this.timerInterval);
        if (this.camera) this.camera.stop();
        if (this.gesture) this.gesture.stopDetection();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new PuzzleGameApp(); });
window.addEventListener('beforeunload', () => { if (window.app) window.app.destroy(); });
