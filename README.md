# Minesweeper

A fully-featured, responsive web-based Minesweeper game with multiple themes, difficulty levels, and sound effects. Built with pure HTML, CSS, and JavaScript - no external dependencies required.

## About This Project

This project was created to showcase modern web development practices and perfect UI/UX design principles. The entire game was built using **Claude Code** - Anthropic's AI-powered CLI tool - demonstrating how AI-assisted development can create polished, production-ready applications.

The game emphasizes:
- **Perfect UI/UX**: Smooth animations, responsive design, and intuitive controls
- **Accessibility**: Keyboard navigation, screen reader support, and clear visual feedback
- **Performance**: Optimized rendering and efficient algorithms
- **Cross-platform**: Seamless experience across desktop, tablet, and mobile devices

## Features

### Core Gameplay
- **3 Difficulty Levels:**
  - Easy: 9×9 grid, 10 mines
  - Medium: 16×16 grid, 40 mines
  - Hard: 16×30 grid, 99 mines
- **Smart Mine Placement:** First click is always safe (mines are placed after your first click)
- **Mine Counter:** Shows remaining mines (can go negative if you over-flag)
- **Timer:** Tracks your completion time
- **Pause Functionality:** Pause the game to take a break (button or spacebar)
- **Best Times:** Your best times are saved locally for each difficulty

### Controls
- **Mouse/Trackpad:**
  - Left Click: Reveal a cell
  - Right Click: Place/remove flag
- **Touch Devices:**
  - Tap: Reveal a cell
  - Long Press (500ms): Place/remove flag
- **Keyboard:**
  - Spacebar: Pause/Resume game

### 5 Themes
1. **Classic** - Traditional Windows gray style with 3D effects
2. **Dark** - Modern dark theme with flat design
3. **Ocean** - Soft, calming light blue theme
4. **Light** - Clean, white theme with soft colors
5. **Rose** - Gentle pink theme with warm accents

### Sound Effects
- Cell reveal sound
- Flag placement sound
- Victory sound
- Game over sound
- Single toggle to enable/disable all sounds

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Touch-friendly cell sizes
- Adapts to different screen sizes
- Scrollable board on small devices

## How to Play

### Objective
Reveal all cells that don't contain mines to win!

### Numbers
Each number indicates how many mines are in the 8 adjacent cells (including diagonals).

### Strategies
- Start by clicking corners or edges
- If a "1" cell has only one unrevealed neighbor, that neighbor is a mine
- If a number's flags equal its value, all other neighbors are safe to click
- Use the mine counter to track how many mines remain
- Flags help you remember where you think mines are

## Installation & Usage

### Local Development
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process or server required!

### Deploy to GitHub Pages
1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select the main branch
4. Your game will be available at `https://username.github.io/minesweeper`

## File Structure
```
minesweeper/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles and themes
├── js/
│   ├── storage.js      # localStorage operations
│   ├── audio.js        # Sound management (Web Audio API)
│   ├── game.js         # Core game logic
│   └── ui.js           # UI rendering and events
└── README.md           # This file
```

## Browser Compatibility
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers (iOS Safari, Chrome Mobile): ✅

## Technical Details

### Technologies Used
- **HTML5** - Structure
- **CSS3** - Styling with CSS variables for theming
- **Vanilla JavaScript (ES6+)** - Game logic and interactivity
- **Web Audio API** - Programmatic sound generation
- **localStorage** - Save best times and settings

### Key Features Implementation
- **CSS Variables** for easy theming
- **Flood fill algorithm** for revealing empty areas
- **Fisher-Yates shuffle** for true randomness in mine placement
- **Touch event handling** with long press detection
- **Responsive CSS Grid** for the game board

## Storage
The game uses localStorage to persist:
- Best times for each difficulty level
- User preferences (theme, difficulty, sound setting)

No data is sent to any server - everything stays local on your device.

## License
This project is open source and available for personal and educational use.

## Credits
Created as a web-based implementation of the classic Minesweeper game.

---

Enjoy playing! 🎮💣
