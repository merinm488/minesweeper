/**
 * UI Module - Handles rendering and user interface interactions
 */

const UI = {
    // Touch handling
    touchTimer: null,
    touchStartCell: null,

    /**
     * Initialize the UI
     */
    init() {
        // Load saved settings
        const settings = Storage.getSettings();

        // Apply settings
        this.applyTheme(settings.theme);
        Game.setTheme(settings.theme);

        // Set difficulty radio button
        const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
        difficultyRadios.forEach(radio => {
            if (radio.value === settings.difficulty) {
                radio.checked = true;
            }
        });

        // Set sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.checked = settings.soundEnabled;
        SoundManager.toggle(settings.soundEnabled);

        // Add instant theme change listener
        const themeSelect = document.getElementById('theme-select');
        themeSelect.addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
            Game.setTheme(e.target.value);
        });

        // Update best times display
        this.updateBestTimes();

        // Set up event listeners
        this.setupEventListeners();

        // Show main menu
        this.showScreen('main-menu');
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            const settings = Storage.getSettings();
            Game.initialize(settings.difficulty);
            this.showScreen('game-screen');
            // Start tutorial if this is the first time
            Tutorial.init();
        });

        // Guided play button on main menu
        document.getElementById('guided-play-menu-btn').addEventListener('click', () => {
            // Make sure any existing game is properly cleaned up
            if (Game.state.timerInterval) {
                Game.stopTimer();
            }
            GuidedPlay.start();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showModal('settings-modal');
        });

        document.getElementById('how-to-play-btn').addEventListener('click', () => {
            this.showModal('how-to-play-modal');
        });

        // Settings modal
        document.getElementById('close-settings').addEventListener('click', () => {
            this.hideModal('settings-modal');
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // How to play modal
        document.getElementById('close-how-to-play').addEventListener('click', () => {
            this.hideModal('how-to-play-modal');
        });

        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            // Check if guided play demo is active
            if (GuidedPlay.isActive) {
                GuidedPlay.togglePause();
            } else {
                Game.togglePause();
            }
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            // Check if guided play demo is active
            if (GuidedPlay.isActive) {
                GuidedPlay.togglePause();
            } else {
                Game.togglePause();
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            Tutorial.cleanup(); // Clean up tutorial if active
            Game.initialize(Game.state.difficulty);
        });

        document.getElementById('quit-to-menu-btn').addEventListener('click', () => {
            Game.stopTimer();
            Tutorial.cleanup(); // Clean up tutorial if active
            GuidedPlay.stop(); // Clean up guided play if active
            this.updateBestTimes();
            this.showScreen('main-menu');
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            Game.stopTimer();
            Tutorial.cleanup(); // Clean up tutorial if active
            GuidedPlay.stop(); // Clean up guided play if active
            this.updateBestTimes();
            this.showScreen('main-menu');
        });

        // Game over buttons
        document.getElementById('play-again-btn').addEventListener('click', () => {
            Tutorial.cleanup(); // Clean up tutorial if active

            // Check if this is a demo game over
            if (Game.state.isDemoGameOver) {
                // Reset the demo flag
                Game.state.isDemoGameOver = false;

                // Start the demo again
                GuidedPlay.start();
            } else {
                // Normal game - start a new game
                Game.initialize(Game.state.difficulty);
            }
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            Tutorial.cleanup(); // Clean up tutorial if active
            GuidedPlay.stop(); // Clean up guided play if active
            // Reset demo flag if going to main menu
            Game.state.isDemoGameOver = false;
            this.updateBestTimes();
            this.showScreen('main-menu');
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.getElementById('game-screen').classList.contains('active')) {
                e.preventDefault();
                // Check if guided play demo is active
                if (GuidedPlay.isActive) {
                    GuidedPlay.togglePause();
                } else {
                    Game.togglePause();
                }
            }
        });

        // Prevent context menu on right click and long press
        document.getElementById('game-board').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    },

    /**
     * Show a specific screen
     * @param {string} screenId - ID of the screen to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenId).classList.add('active');

        // Initialize audio on first user interaction
        SoundManager.init();
    },

    /**
     * Show a modal
     * @param {string} modalId - ID of the modal to show
     */
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        SoundManager.init();
    },

    /**
     * Hide a modal
     * @param {string} modalId - ID of the modal to hide
     */
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    /**
     * Save settings from the settings modal
     */
    saveSettings() {
        const theme = document.getElementById('theme-select').value;
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const soundEnabled = document.getElementById('sound-toggle').checked;

        const settings = { theme, difficulty, soundEnabled };
        Storage.saveSettings(settings);

        // Apply changes
        this.applyTheme(theme);
        Game.setTheme(theme);
        SoundManager.toggle(soundEnabled);

        this.hideModal('settings-modal');
    },

    /**
     * Apply theme to the document
     * @param {string} themeName - Name of the theme
     */
    applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        document.getElementById('theme-select').value = themeName;
    },

    /**
     * Update best times display on main menu
     */
    updateBestTimes() {
        const bestTimes = Storage.getBestTimes();

        document.getElementById('best-time-easy').textContent = Storage.formatTime(bestTimes.easy);
        document.getElementById('best-time-medium').textContent = Storage.formatTime(bestTimes.medium);
        document.getElementById('best-time-hard').textContent = Storage.formatTime(bestTimes.hard);
    },

    /**
     * Render the game board
     */
    renderBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';

        // Ensure board is interactive (in case guided play left it disabled)
        board.style.pointerEvents = '';

        // Set grid template
        board.style.gridTemplateColumns = `repeat(${Game.state.cols}, 1fr)`;

        // Reset buttons - show quit, hide restart
        document.getElementById('quit-to-menu-btn').classList.remove('hidden');
        document.getElementById('restart-btn').classList.add('hidden');

        // Reset play-again button text to default (in case it was changed by demo)
        document.getElementById('play-again-btn').textContent = 'Play Again';

        // Hide game over buttons
        document.getElementById('game-over-buttons').classList.add('hidden');

        // Remove game-over-active class to reset layout
        document.getElementById('game-screen').querySelector('.game-container').classList.remove('game-over-active');

        // Create cells
        for (let row = 0; row < Game.state.rows; row++) {
            for (let col = 0; col < Game.state.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Store reference
                Game.state.board[row][col].element = cell;

                // Add event listeners
                this.addCellEventListeners(cell, row, col);

                board.appendChild(cell);
            }
        }
    },

    /**
     * Add event listeners to a cell
     * @param {HTMLElement} cell - Cell element
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    addCellEventListeners(cell, row, col) {
        let lastTouchEnd = 0;
        let longPressTriggered = false;
        let touchDidMove = false;
        let lastTouchEvent = 0; // Track when touch last happened

        // Context menu handler (for desktop right-click flagging)
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only toggle flag if not from a touch long press (within last 500ms)
            const now = Date.now();
            if (!longPressTriggered && (now - lastTouchEvent > 500)) {
                Game.toggleFlag(row, col);
            }
            return false;
        });

        // Mouse/trackpad click event
        cell.addEventListener('click', (e) => {
            // Prevent click from firing right after touch end
            const now = Date.now();
            if (now - lastTouchEnd < 350 || longPressTriggered) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if (e.button === 0) { // Left click
                Game.revealCell(row, col);
            }
        });

        // Touch events
        cell.addEventListener('touchstart', (e) => {
            lastTouchEvent = Date.now();
            longPressTriggered = false;
            touchDidMove = false;
            this.touchStartCell = { row, col };
            this.touchTimer = setTimeout(() => {
                // Long press detected - flag the cell
                if (!touchDidMove) {
                    Game.toggleFlag(row, col);
                    longPressTriggered = true;
                    // Provide haptic feedback if supported
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }
                this.touchTimer = null;
                this.touchStartCell = null;
            }, 500); // 500ms for long press
        }, { passive: false });

        cell.addEventListener('touchend', (e) => {
            lastTouchEnd = Date.now();
            lastTouchEvent = Date.now();

            // Prevent default for long presses to stop context menu
            if (longPressTriggered) {
                e.preventDefault();
                if (this.touchTimer) {
                    clearTimeout(this.touchTimer);
                    this.touchTimer = null;
                }
                this.touchStartCell = null;

                // Keep longPressTriggered true longer to prevent contextmenu interference
                // Reset after a longer delay to handle slower browsers
                setTimeout(() => {
                    longPressTriggered = false;
                }, 500);

                return;
            }

            // Clear timer if still running (short tap)
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = null;
            }

            // Only reveal if it was a short tap without movement
            if (this.touchStartCell && this.touchStartCell.row === row && this.touchStartCell.col === col && !touchDidMove) {
                e.preventDefault();
                Game.revealCell(row, col);
            }
            this.touchStartCell = null;
            touchDidMove = false;
        }, { passive: false });

        cell.addEventListener('touchmove', (e) => {
            // Cancel long press if finger moves
            touchDidMove = true;
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = null;
            }
        }, { passive: true });

        cell.addEventListener('touchcancel', (e) => {
            touchDidMove = true;
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = null;
            }
            this.touchStartCell = null;
        });
    },

    /**
     * Update a single cell's appearance
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    updateCell(row, col) {
        const cell = Game.state.board[row][col];

        if (cell.isRevealed) {
            cell.element.classList.add('revealed');

            if (cell.isMine) {
                cell.element.classList.add('mine');
            } else if (cell.neighborMines > 0) {
                cell.element.textContent = cell.neighborMines;
                cell.element.dataset.number = cell.neighborMines;
            }
        }

        if (cell.isFlagged) {
            cell.element.classList.add('flagged');
        } else {
            cell.element.classList.remove('flagged');
        }
    },

    /**
     * Mark an incorrectly flagged cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    markIncorrectFlag(row, col) {
        const cell = Game.state.board[row][col];
        cell.element.classList.add('incorrect-flag');
    },

    /**
     * Update mine counter display
     */
    updateMineCounter() {
        const remaining = Game.state.totalMines - Game.state.flagsPlaced;
        const display = remaining.toString().padStart(3, '0');

        // Handle negative numbers
        if (remaining < 0) {
            document.getElementById('mine-count').textContent = '-' + Math.abs(remaining).toString().padStart(2, '0');
        } else {
            document.getElementById('mine-count').textContent = display;
        }
    },

    /**
     * Update timer display
     */
    updateTimer() {
        const mins = Math.floor(Game.state.timer / 60);
        const secs = Game.state.timer % 60;
        const display = mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        document.getElementById('timer-display').textContent = display;
    },

    /**
     * Show pause overlay
     */
    showPauseOverlay() {
        document.getElementById('pause-overlay').classList.remove('hidden');
    },

    /**
     * Hide pause overlay
     */
    hidePauseOverlay() {
        document.getElementById('pause-overlay').classList.add('hidden');
    },

    /**
     * Show game over modal
     * @param {boolean} won - Whether the player won
     * @param {number} time - Time taken in seconds
     * @param {boolean} isNewRecord - Whether this is a new best time
     */
    showGameOverModal(won, time, isNewRecord) {
        const title = document.getElementById('game-over-result-title');
        const newRecord = document.getElementById('new-record-banner');
        const buttonsSection = document.getElementById('game-over-buttons');
        const playAgainBtn = document.getElementById('play-again-btn');
        const gameContainer = document.getElementById('game-screen').querySelector('.game-container');

        // Add class to change layout for game over
        gameContainer.classList.add('game-over-active');

        // Check if this is a demo game over
        if (Game.state.isDemoGameOver) {
            playAgainBtn.textContent = 'Watch Again';
        } else {
            playAgainBtn.textContent = 'Play Again';
        }

        if (won) {
            title.textContent = 'You Win!';
            title.style.color = 'var(--number-2)';

            if (isNewRecord) {
                newRecord.classList.remove('hidden');
            } else {
                newRecord.classList.add('hidden');
            }
        } else {
            title.textContent = 'Game Over';
            title.style.color = 'var(--number-3)';
            newRecord.classList.add('hidden');
        }

        buttonsSection.classList.remove('hidden');

        // Scroll to show buttons (for easy mode on short screens) - only on mobile/tablet
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                buttonsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    },

    /**
     * Switch from quit button to restart button (after first click)
     */
    switchToRestartButton() {
        document.getElementById('quit-to-menu-btn').classList.add('hidden');
        document.getElementById('restart-btn').classList.remove('hidden');
    },

    /**
     * Trigger shake effect on game board
     */
    triggerShakeEffect() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.classList.add('shake');

        // Remove the class after animation completes
        setTimeout(() => {
            gameBoard.classList.remove('shake');
        }, 500);
    },

    /**
     * Trigger mine flash effect on specific cell
     * @param {number} row - Row of the mine
     * @param {number} col - Column of the mine
     */
    triggerMineFlash(row, col) {
        const cell = Game.state.board[row][col];
        if (cell && cell.element) {
            cell.element.classList.add('mine-exploded');
        }
    }
};

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UI.init());
} else {
    UI.init();
}
