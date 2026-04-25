# Puzzle Game Development Instructions

## Project Overview
Interactive visual puzzle game with:
- Live camera capture using WebRTC
- Two-finger frame selection gesture
- Automatic puzzle piece generation and shuffling
- Hand gesture recognition using MediaPipe
- Pinch-to-grab and drag puzzle pieces
- Physics-based puzzle solving

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js for rendering puzzle pieces
- **Hand Tracking**: MediaPipe Hands API for gesture recognition
- **Camera**: WebRTC getUserMedia API
- **Build Tool**: Webpack for bundling

## Project Structure
```
Puzzle_Game/
├── public/              # Static assets and built files
│   ├── index.html       # Main HTML entry point
│   └── bundle.js        # Bundled JavaScript (generated)
├── src/                 # Source code
│   ├── index.js         # Application entry point
│   ├── camera.js        # Camera capture and frame handling
│   ├── gesture.js       # Hand gesture recognition
│   ├── puzzle.js        # Puzzle logic and generation
│   ├── physics.js       # Physics engine for pieces
│   └── renderer.js      # Three.js rendering
├── package.json         # Dependencies and scripts
├── webpack.config.js    # Webpack configuration
└── README.md            # Documentation
```

## Development Workflow
1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Build for production: `npm run build`

## Key Features to Implement
- [ ] Camera feed streaming and frame capture
- [ ] Two-finger gesture detection for frame selection
- [ ] Puzzle piece generation algorithm
- [ ] Automatic shuffling of pieces
- [ ] Hand pinch detection and piece grabbing
- [ ] Drag and drop with physics
- [ ] Collision detection and piece fitting
- [ ] Puzzle completion detection
