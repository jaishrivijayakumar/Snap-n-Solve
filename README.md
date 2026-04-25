# Interactive Visual Puzzle Game

A real-time interactive puzzle game that captures live camera frames and converts them into shuffled puzzle pieces. Use hand gestures to manipulate and solve the puzzle!

## Features

✨ **Core Features**
- 🎥 **Live Camera Capture** - Real-time video streaming with WebRTC
- 🖼️ **Frame-to-Puzzle Conversion** - Automatically convert camera frames into puzzle pieces
- ✋ **Hand Gesture Recognition** - MediaPipe-powered hand detection and gesture tracking
- 🤌 **Pinch-and-Drag Control** - Grab and move puzzle pieces intuitively
- 🧩 **Physics Engine** - Realistic piece movement, gravity, and collision detection
- 🎮 **Auto-Snap** - Pieces automatically snap to their correct positions
- 📊 **Progress Tracking** - Real-time completion percentage
- 🎯 **Solution Preview** - View the complete image at any time

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js (for advanced visualization)
- **Hand Tracking**: MediaPipe Hands API
- **Camera API**: WebRTC getUserMedia
- **Build Tool**: Webpack 5
- **Dev Server**: Webpack Dev Server

## Project Structure

```
Puzzle_Game/
├── public/
│   ├── index.html           # Main HTML file
│   └── bundle.js            # Bundled JavaScript (generated)
├── src/
│   ├── index.js             # Application entry point & main logic
│   ├── camera.js            # Camera capture & frame management
│   ├── gesture.js           # Hand gesture recognition
│   ├── puzzle.js            # Puzzle generation & piece management
│   ├── physics.js           # Physics engine for pieces
│   └── renderer.js          # Three.js 3D rendering (optional)
├── package.json             # Dependencies
├── webpack.config.js        # Webpack configuration
└── README.md                # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support
- Camera access permissions

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080`

3. **Build for production**
   ```bash
   npm run build
   ```

## How to Play

### Game Flow

1. **Allow Camera Access**
   - Grant camera permissions when prompted
   - You'll see your live video feed on the left side

2. **Capture a Frame**
   - Click the "📷 Capture Frame" button or use hand gesture
   - Your current camera frame is frozen and converted to puzzle pieces

3. **Start the Puzzle**
   - Click "🔀 Shuffle Pieces" to randomize the pieces
   - The pieces will appear on the right side

4. **Solve the Puzzle**
   - **Mouse**: Click and drag pieces to move them
   - **Touch**: Tap and drag on mobile devices
   - **Pinch Gesture**: Use two-finger pinch (detected by hand tracking)

5. **Auto-Snap Feature**
   - Pieces automatically snap to their correct position when close enough
   - A green border indicates the selected piece

6. **Complete!**
   - When all pieces are in place, you'll see "🎉 Puzzle Solved!"
   - Click "📷 Capture Frame" again to start with a new image

## Controls

### Keyboard
- **F** - Toggle fullscreen mode

### Mouse
- **Left Click + Drag** - Move the selected piece
- **Release** - Drop the piece

### Touch
- **Single Tap + Drag** - Move piece on touchscreen devices

### Hand Gestures (MediaPipe)
- **Open Hand** - Select/highlight mode
- **Pinch** - Grab and move pieces
- **Release Pinch** - Drop piece

### UI Buttons
- **📷 Capture Frame** - Capture current camera frame as puzzle
- **🔀 Shuffle Pieces** - Randomize puzzle piece positions
- **🔄 Reset Puzzle** - Reset pieces to shuffled state
- **✓ Show Solution** - Display the original complete image

## Customization

### Grid Size
Edit `src/index.js` and change the `gridSize` parameter (default is 4x4):
```javascript
this.gridSize = 4; // Change to 3, 5, 6, etc.
```

### Physics Parameters
Edit `src/physics.js` to adjust:
```javascript
this.gravity = 0.5;      // Gravity strength
this.friction = 0.95;    // Air friction
this.elasticity = 0.7;   // Bounce elasticity
```

### Display Dimensions
Edit `src/physics.js` → `setBoundaries()`:
```javascript
this.setBoundaries(0, 1000, 0, 800); // Adjust play area
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support for all features |
| Firefox | ✅ Full | Excellent support |
| Safari | ⚠️ Partial | May need permission requests |
| Edge | ✅ Full | Chromium-based, good support |
| Mobile Chrome | ✅ Full | Touch support included |
| Mobile Safari | ⚠️ Limited | Some gesture features unavailable |

## API Keys & External Resources

- **MediaPipe**: Uses CDN-hosted models (no key needed)
- **Three.js**: Cached locally via npm
- **No backend required** - Runs entirely in the browser

## Performance Tips

1. **Lower grid size** for better performance on slower devices
2. **Close other browser tabs** for more resources
3. **Use a high-quality camera** feed for better results
4. **Disable hand tracking** if not needed in `gesture.js`

## Troubleshooting

### Camera not working
- Check browser permissions: Settings → Camera
- Ensure HTTPS or localhost is being used
- Try a different browser

### Hand detection not working
- Check browser console (F12) for hand detection logs
- **Neon green visualization** shows:
  - 🟢 Large green circle = Wrist (joint 0)
  - 🟢 Medium green circles = Finger tips (joints 4, 8, 12, 16, 20)
  - 🟢 Small green circles = Other joints
  - 🟢 Green lines = Bone connections
  - 🟢 Dashed box = Hand bounding box
  - At top: "Hands Detected: X" and hand confidence level

- **Calibrating pinch detection:**
  - Open browser console (F12)
  - Look for logs like: "Hand Pinch Distance (Tip): 0.048, (PIP): 0.056"
  - Pinch your fingers and watch the distance values
  - Current threshold: `0.06` (in `src/gesture.js` → `detectPinch()`)
  - If pinch isn't detected, try lowering the threshold value
  - If false positives occur, try raising it

- **Lighting conditions matter:**
  - Ensure good lighting (avoid shadows on hands)
  - Try different backgrounds (plain wall works best)
  - Keep hands in front of camera, not at extreme angles

- **Camera position:**
  - Camera should be at chest/face level
  - Keep hands 30-90cm from camera
  - Avoid pointing camera upward at extreme angles

### Low performance
- Reduce grid size (smaller puzzle)
- Close other applications
- Check browser hardware acceleration is enabled

### Pieces not snapping
- Lower the snap tolerance in `puzzle.js` → `snapToGrid()`
- Ensure pieces are close to correct position

## Hand Detection & Gesture Recognition

### Hand Landmark Points (21 total per hand)

The hand detection system tracks 21 key points:

```
Thumb:    0 (wrist) → 1 → 2 → 3 → 4 (tip)
Index:    0 (wrist) → 5 → 6 → 7 → 8 (tip)
Middle:   0 (wrist) → 9 → 10 → 11 → 12 (tip)
Ring:     0 (wrist) → 13 → 14 → 15 → 16 (tip)
Pinky:    0 (wrist) → 17 → 18 → 19 → 20 (tip)
```

### Pinch Gesture Detection

The app detects a pinch gesture when:
- Thumb tip (joint 4) is close to Index tip (joint 8)
- Distance between them is < 0.06 (adjustable threshold)
- Currently logged to browser console for debugging

### Neon Green Visualization

When hand detection is active, you'll see:
- **Neon Green (#00FF7F)** lines = Bone connections
- **Bright Green (#39FF14)** circles = Key joints
- **Joint numbers** labeled on each point
- **Hand bounding box** with dashed outline
- **Confidence level** displayed
- **Real-time hand count** at top of screen

This visualization helps debug why gestures might not be detected.

## API Reference

### CameraManager
```javascript
await cameraManager.init()              // Initialize camera
cameraManager.captureFrame(canvas)      // Capture frame
cameraManager.stop()                    // Stop camera stream
cameraManager.getDimensions()           // Get camera dimensions
```

### GestureRecognizer
```javascript
await gestureRecognizer.init()          // Initialize hand tracking
await gestureRecognizer.detectHands()   // Detect hands in frame
gestureRecognizer.detectPinch(landmarks)// Detect pinch gesture
gestureRecognizer.drawLandmarks(landmarks) // Visualize hands
```

### PuzzleGenerator
```javascript
puzzleGenerator.generatePieces(canvas, gridSize) // Create pieces
puzzleGenerator.shufflePieces()         // Shuffle pieces
puzzleGenerator.snapToGrid(piece)       // Snap piece to position
puzzleGenerator.getCompletion()         // Get % completed
puzzleGenerator.isPuzzleSolved()        // Check if solved
```

### PhysicsEngine
```javascript
physicsEngine.updatePiece(piece)        // Update physics
physicsEngine.setPieceDragging(piece, isDragging) // Drag control
physicsEngine.dragPiece(piece, dx, dy)  // Move dragged piece
physicsEngine.updateAll(pieces)         // Update all physics
```

## Future Enhancements

- [ ] Multi-player mode with WebSockets
- [ ] Difficulty settings (more pieces, time limit)
- [ ] Leaderboard system
- [ ] Sound effects and music
- [ ] Animation transitions
- [ ] AR mode for real-world placement
- [ ] Custom image upload
- [ ] Hint system
- [ ] Puzzle timer
- [ ] Mobile app wrapper

## License

MIT License - Feel free to use and modify!

## Contributing

Pull requests are welcome! Please ensure:
- Code follows ES6+ standards
- Features are well-documented
- Changes are tested before submission

## Support

For issues or feature requests, please open an issue in the repository.

---

**Enjoy solving puzzles! 🧩✨**
