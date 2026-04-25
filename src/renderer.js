/**
 * Renderer Module - Three.js rendering for 3D puzzle visualization
 */

import * as THREE from 'three';

export class PuzzleRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.pieces3D = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedPiece = null;
        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x1a1a1a, 1);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Background
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    /**
     * Add piece to 3D scene
     */
    addPiece(piece, texture) {
        const geometry = new THREE.BoxGeometry(1, 1, 0.1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00d4ff });

        // Try to load image texture if available
        if (texture) {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    const textureData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const texture = new THREE.CanvasTexture(canvas);
                    material.map = texture;
                };
                img.src = texture;
            } catch (e) {
                console.log('Could not load texture');
            }
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (piece.x / 500) - 1;
        mesh.position.y = (piece.y / 400) - 1;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = piece;

        this.scene.add(mesh);
        this.pieces3D.push(mesh);
        return mesh;
    }

    /**
     * Update piece position and rotation
     */
    updatePiece(piece, mesh) {
        mesh.position.x = (piece.x / 500) - 1;
        mesh.position.y = (piece.y / 400) - 1;
        mesh.rotation.z = piece.rotation;
        mesh.scale.set(piece.scale, piece.scale, piece.scale);
    }

    /**
     * Handle mouse move
     */
    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        if (this.selectedPiece) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects([this.selectedPiece]);
            
            if (intersects.length > 0) {
                this.selectedPiece.position.copy(intersects[0].point);
            }
        }
    }

    /**
     * Handle mouse down
     */
    onMouseDown(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.pieces3D);

        if (intersects.length > 0) {
            this.selectedPiece = intersects[0].object;
            this.selectedPiece.material.emissive.setHex(0x00ff00);
        }
    }

    /**
     * Handle mouse up
     */
    onMouseUp(event) {
        if (this.selectedPiece) {
            this.selectedPiece.material.emissive.setHex(0x000000);
            this.selectedPiece = null;
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Render scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.render();
    }

    /**
     * Clear scene
     */
    clear() {
        this.pieces3D.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.pieces3D = [];
    }
}
