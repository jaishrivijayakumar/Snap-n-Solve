/**
 * Physics Module - Simple physics engine for puzzle pieces
 */

export class PhysicsEngine {
    constructor() {
        this.gravity = 0;  // NO GRAVITY - pieces stay in place
        this.friction = 0.95;
        this.elasticity = 0.7;
        this.boundaries = {
            left: 0,
            right: 700,
            top: 0,
            bottom: 700
        };
    }

    /**
     * Update physics for a piece
     */
    updatePiece(piece, deltaTime = 16) {
        if (!piece) return;
        
        if (!piece.velocity) {
            piece.velocity = { x: 0, y: 0 };
        }

        if (!piece.isDragging) {
            // Pieces stay exactly where they are unless dragged
            // Zero out any residual velocity
            piece.velocity.x = 0;
            piece.velocity.y = 0;
        }
    }

    /**
     * Set piece as dragging
     */
    setPieceDragging(piece, isDragging) {
        if (!piece) return;
        piece.isDragging = isDragging;
        if (isDragging) {
            piece.velocity = { x: 0, y: 0 };
        }
    }

    /**
     * Move dragged piece
     */
    dragPiece(piece, dx, dy) {
        if (!piece) return;
        piece.x += dx;
        piece.y += dy;
        piece.velocity = { x: dx, y: dy };
    }

    /**
     * Release dragged piece (impart velocity)
     */
    releasePiece(piece, velocityX = 0, velocityY = 0) {
        piece.isDragging = false;
        piece.velocity = { 
            x: velocityX * 0.5, 
            y: velocityY * 0.5 
        };
    }

    /**
     * Check collision between two pieces
     */
    checkCollision(piece1, piece2) {
        return !(piece1.x + piece1.width < piece2.x ||
                 piece1.x > piece2.x + piece2.width ||
                 piece1.y + piece1.height < piece2.y ||
                 piece1.y > piece2.y + piece2.height);
    }

    /**
     * Handle piece-to-piece collision
     */
    resolveCollision(piece1, piece2) {
        // Simple elastic collision response
        const overlap = this.getOverlapArea(piece1, piece2);
        if (overlap > 0) {
            // Push pieces apart
            const dx = piece2.x - piece1.x;
            const dy = piece2.y - piece1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const pushX = (dx / distance) * 2;
                const pushY = (dy / distance) * 2;
                
                if (!piece1.isDragging) {
                    piece1.x -= pushX;
                    piece1.y -= pushY;
                }
                if (!piece2.isDragging) {
                    piece2.x += pushX;
                    piece2.y += pushY;
                }
            }
        }
    }

    /**
     * Calculate overlap area between two pieces
     */
    getOverlapArea(piece1, piece2) {
        const overlapX = Math.max(0, 
            Math.min(piece1.x + piece1.width, piece2.x + piece2.width) -
            Math.max(piece1.x, piece2.x)
        );
        const overlapY = Math.max(0,
            Math.min(piece1.y + piece1.height, piece2.y + piece2.height) -
            Math.max(piece1.y, piece2.y)
        );
        return overlapX * overlapY;
    }

    /**
     * Update all pieces
     */
    updateAll(pieces, deltaTime = 16) {
        if (!pieces || pieces.length === 0) return;
        
        // Only update the piece being dragged - all others stay fixed
        pieces.forEach(piece => {
            if (piece && piece.isDragging) {
                this.updatePiece(piece, deltaTime);
            }
        });

        // No collision detection - pieces should stay fixed in their shuffled positions
    }

    /**
     * Set boundaries for pieces
     */
    setBoundaries(left, right, top, bottom) {
        this.boundaries = { left, right, top, bottom };
    }
}
