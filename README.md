# Roguelike Web Game (Python Backend)

A real-time roguelike game served with a FastAPI backend and HTML5 Canvas frontend.

## Features
- 3 progressively difficult levels
- 4 enemy types with distinct AI behaviors
- Pixel art sprites (downloaded from Kenney.nl's Character Pack)
- Simple health, scoring, and level progression
- Responsive keyboard controls (arrow keys or WASD)

## Project Structure
```
/app
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
├── download_assets.py    # Script to fetch sprite assets
├── static/
│   ├── index.html
│   ├── style.css
│   └── game.js
├── assets/
│   └── sprites/          # Populated by download_assets.py
└── levels/
    ├── level1.json
    ├── level2.json
    └── level3.json
```

## Setup
1. **Clone** (or copy) this repository.
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download and prepare sprite assets:
   ```bash
   python download_assets.py
   ```
   This will fetch the Kenney Character Pack (CC0) and place PNGs in `assets/sprites/`.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
6. Open your browser to `http://localhost:8000` and play!

## Game Controls
- **Arrow Keys** or **WASD**: Move player
- Survive and defeat all enemies to advance to the next level.
- Clear all three levels to win.

## Notes
- If asset download fails, the game will use colored rectangles as placeholders.
- The game is intentionally simple; feel free to extend with more levels, enemy types, or mechanics.
- Sprites are licensed under CC0 (public domain) via Kenney.nl.

## Credits
- Sprite assets: Kenney.nl (https://kenney.nl)
- Game logic: custom implementation

Enjoy!