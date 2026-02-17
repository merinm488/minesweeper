/**
 * Guided Play Module - Deterministic gameplay demonstration
 * Uses a fixed board layout and predetermined actions for a consistent demo
 */

const GuidedPlay = {
    isActive: false,
    isPaused: false,
    currentStep: 0,
    timeoutIds: [],

    // Fixed mine positions - these will ALWAYS be the same
    // Layout for a 9x9 (easy) board
    fixedMines: [
        { row: 0, col: 0 },
        { row: 0, col: 4 },
        { row: 1, col: 1 },
        { row: 2, col: 6 },
        { row: 3, col: 2 },   // The mine we'll FLAG in demo
        { row: 5, col: 7 },
        { row: 6, col: 5 },
        { row: 7, col: 8 },
        { row: 8, col: 7 }
    ],

    // The mine we'll reveal to show game over
    gameOverMine: { row: 0, col: 0 },

    // Demo script with EXACT steps that will always be the same
    demoScript: [
        {
            text: "👆 Click here to start revealing safe cells",
            cell: { row: 4, col: 4 },
            delay: 2500,
            action: 'reveal',
            textPosition: 'top'
        },
        {
            text: "✨ Numbers show nearby mines (this '1' means 1 mine adjacent)",
            cell: { row: 4, col: 3 },
            delay: 3000,
            action: 'pointToNumber',
            textPosition: 'side'
        },
        {
            text: "🚩 This cell MUST be a mine (numbers around it add up correctly)",
            cell: { row: 3, col: 2 },
            delay: 3000,
            action: 'flag',
            textPosition: 'top'
        },
        {
            text: "✓ Flagged! Always use logic to find mines",
            cell: { row: 3, col: 2 },
            delay: 2000,
            action: 'highlightFlag',
            textPosition: 'side'
        },
        {
            text: "💥 If you click a mine... GAME OVER!",
            cell: { row: 0, col: 0 },
            delay: 3000,
            action: 'gameOver',
            textPosition: 'side'
        }
    ],

    /**
     * Start the guided play demo
     */
    start() {
        if (this.isActive) return;

        this.isActive = true;
        this.isPaused = false;
        this.currentStep = 0;
        this.timeoutIds = [];

        // Initialize a new game with fixed board
        this.initializeFixedGame();

        // Switch to game screen
        UI.showScreen('game-screen');

        // Show the overlay
        const overlay = document.getElementById('guided-play-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }

        // Disable board interaction during demo
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.style.pointerEvents = 'none';
        }

        // Make sure overlay itself doesn't block clicks (but board is disabled)
        overlay.style.pointerEvents = 'none';

        // Position cursor off-screen initially
        this.positionCursor(-100, -100);

        // Wait for board to render, then start the demo
        setTimeout(() => {
            this.runStep(0);
        }, 800);
    },

    /**
     * Initialize game with FIXED mine positions for consistent demo
     */
    initializeFixedGame() {
        // Initialize game normally first
        Game.initialize('easy');

        const config = Game.DIFFICULTY_CONFIG.easy;

        // Clear all mines first
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                Game.state.board[row][col].isMine = false;
                Game.state.board[row][col].isRevealed = false;
                Game.state.board[row][col].isFlagged = false;
            }
        }

        // Place the mines in FIXED positions
        this.fixedMines.forEach(pos => {
            if (Game.isValidCell(pos.row, pos.col)) {
                Game.state.board[pos.row][pos.col].isMine = true;
            }
        });

        // Calculate neighbor mine counts
        Game.calculateNeighborMines();

        // Render the board
        UI.renderBoard();
    },

    /**
     * Reveal a specific set of cells for the demo (bypasses normal flood-fill)
     * This ensures the exact pattern we want every time
     */
    revealDemoPattern() {
        // The exact cells that should be revealed when clicking (4,4)
        // Format: { row, col, forceNumber } - forceNumber overrides actual count
        const demoCells = [
            { row: 3, col: 3, number: 1 },
            { row: 3, col: 4, number: 2 },  // Shows 2
            { row: 4, col: 2, number: 1 },
            { row: 4, col: 3, number: 1 },
            { row: 4, col: 4, number: 1 },
            { row: 4, col: 5, number: 2 },
            { row: 5, col: 2, number: 1 },
            { row: 5, col: 3, number: 1 },
            { row: 5, col: 4, number: 3 }   // Shows 3 (5,1 removed)
        ];

        // Reveal each cell and force the number we want
        demoCells.forEach(pos => {
            const cell = Game.state.board[pos.row][pos.col];
            if (cell && !cell.isMine) {
                cell.isRevealed = true;
                // Override the neighbor count to show the exact number we want
                cell.neighborMines = pos.number;
                UI.updateCell(pos.row, pos.col);
            }
        });
    },

    /**
     * Position the demo cursor at a cell
     */
    positionCursorAtCell(row, col) {
        if (row === -1 || col === -1) {
            this.positionCursor(-100, -100);
            return;
        }

        const cell = Game.state.board[row]?.[col];
        if (!cell || !cell.element) return;

        const rect = cell.element.getBoundingClientRect();
        const cursorX = rect.left + rect.width / 2 - 20;
        const cursorY = rect.top + rect.height / 2 - 20;

        this.positionCursor(cursorX, cursorY);
    },

    /**
     * Position the demo cursor at specific pixel coordinates
     */
    positionCursor(x, y) {
        const cursor = document.getElementById('guided-play-cursor');
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    },

    /**
     * Show text bubble near cursor
     */
    showText(text, position = 'top') {
        const bubble = document.getElementById('guided-play-text-bubble');
        bubble.textContent = text;
        bubble.className = 'guided-play-text-bubble';
        bubble.classList.add('visible');
        bubble.classList.add(`position-${position}`);
    },

    /**
     * Hide text bubble
     */
    hideText() {
        const bubble = document.getElementById('guided-play-text-bubble');
        bubble.classList.remove('visible');
    },

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        const pauseIcon = pauseBtn?.querySelector('.pause-icon');
        const cursor = document.getElementById('guided-play-cursor');
        const textBubble = document.getElementById('guided-play-text-bubble');

        if (this.isPaused) {
            if (pauseIcon) pauseIcon.textContent = '▶';
            // Clear all pending timeouts to pause the demo
            this.timeoutIds.forEach(id => clearTimeout(id));
            this.timeoutIds = [];

            // Hide demo cursor and text bubble when paused
            if (cursor) cursor.style.display = 'none';
            if (textBubble) textBubble.style.display = 'none';

            // Show pause overlay
            const pauseOverlay = document.getElementById('pause-overlay');
            if (pauseOverlay) {
                pauseOverlay.classList.remove('hidden');
            }
        } else {
            if (pauseIcon) pauseIcon.textContent = '⏸';

            // Show demo cursor and text bubble again when resumed
            if (cursor) cursor.style.display = '';
            if (textBubble) textBubble.style.display = '';

            // Resume by running the current step again
            this.runStep(this.currentStep);

            // Hide pause overlay
            const pauseOverlay = document.getElementById('pause-overlay');
            if (pauseOverlay) {
                pauseOverlay.classList.add('hidden');
            }
        }
    },

    /**
     * Run a specific demo step
     */
    runStep(stepIndex) {
        if (!this.isActive || this.isPaused) {
            return;
        }

        if (stepIndex >= this.demoScript.length) {
            // Demo finished - clean up demo elements but stay on game over screen
            this.cleanupDemoOnly();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.demoScript[stepIndex];

        // Clear previous highlights
        document.querySelectorAll('.demo-number-highlight, .demo-flag-highlight').forEach(el => {
            el.classList.remove('demo-number-highlight', 'demo-flag-highlight');
        });

        // Move cursor to cell
        if (step.cell) {
            this.positionCursorAtCell(step.cell.row, step.cell.col);
        }

        // Show text with proper positioning
        this.showText(step.text, step.textPosition || 'top');

        // Wait for user to read, then perform action
        const actionDelay = setTimeout(() => {
            if (!this.isActive) return;

            if (step.action === 'reveal' && step.cell) {
                // Highlight and reveal cell using demo pattern
                const cell = Game.state.board[step.cell.row]?.[step.cell.col];
                if (cell && cell.element) {
                    cell.element.classList.add('demo-highlight');
                    // Use the demo pattern instead of normal flood-fill
                    this.revealDemoPattern();
                }
            } else if (step.action === 'flag' && step.cell) {
                // Highlight and flag cell
                const cell = Game.state.board[step.cell.row]?.[step.cell.col];
                if (cell && cell.element) {
                    cell.element.classList.add('demo-highlight');
                    setTimeout(() => {
                        if (this.isActive) {
                            Game.toggleFlag(step.cell.row, step.cell.col);
                            cell.element.classList.add('flagged');
                            cell.element.classList.add('demo-flag-animation');

                            // Add visual emphasis
                            const flagEmphasis = document.createElement('div');
                            flagEmphasis.className = 'demo-flag-emphasis';
                            flagEmphasis.innerHTML = '🚩';
                            flagEmphasis.style.position = 'absolute';
                            flagEmphasis.style.top = '50%';
                            flagEmphasis.style.left = '50%';
                            flagEmphasis.style.transform = 'translate(-50%, -50%)';
                            flagEmphasis.style.fontSize = '2rem';
                            flagEmphasis.style.zIndex = '10';
                            cell.element.appendChild(flagEmphasis);

                            setTimeout(() => {
                                if (flagEmphasis.parentNode) {
                                    flagEmphasis.remove();
                                }
                            }, 2000);
                        }
                    }, 500);
                }
            } else if (step.action === 'pointToNumber' && step.cell) {
                // Highlight the number in the cell
                const cell = Game.state.board[step.cell.row]?.[step.cell.col];
                if (cell && cell.element && cell.isRevealed && cell.neighborMines > 0) {
                    cell.element.classList.add('demo-number-highlight');
                    const numberHighlight = document.createElement('div');
                    numberHighlight.className = 'demo-number-circle';
                    cell.element.appendChild(numberHighlight);
                }
            } else if (step.action === 'highlightFlag' && step.cell) {
                // Add pulsing highlight to flagged cell
                const cell = Game.state.board[step.cell.row]?.[step.cell.col];
                if (cell && cell.element) {
                    cell.element.classList.add('demo-flag-highlight');
                }
            } else if (step.action === 'gameOver' && step.cell) {
                // Reveal a mine to trigger game over
                const cell = Game.state.board[step.cell.row]?.[step.cell.col];
                if (cell && cell.element) {
                    cell.element.classList.add('demo-highlight');

                    setTimeout(() => {
                        if (this.isActive) {
                            // Reveal the mine - this will trigger game over
                            Game.revealCell(step.cell.row, step.cell.col);

                            // Set demo mode flag for UI to know this is a demo game over
                            Game.state.isDemoGameOver = true;

                            // Update the play-again button to show "Watch Again"
                            setTimeout(() => {
                                const playAgainBtn = document.getElementById('play-again-btn');
                                if (playAgainBtn) {
                                    playAgainBtn.textContent = 'Watch Again';
                                }
                            }, 500);
                        }
                    }, 1000);
                }
            }

            // Move to next step after showing result
            const nextDelay = setTimeout(() => {
                if (this.isActive) {
                    this.runStep(stepIndex + 1);
                }
            }, step.delay);
            this.timeoutIds.push(nextDelay);
        }, 2500); // 2.5 seconds to read before action
        this.timeoutIds.push(actionDelay);
    },

    /**
     * Stop the guided play demo
     */
    stop() {
        if (!this.isActive) return;

        this.isActive = false;
        this.isPaused = false;

        // Clear all pending timeouts
        this.timeoutIds.forEach(id => clearTimeout(id));
        this.timeoutIds = [];

        // Clear any demo highlights
        document.querySelectorAll('.demo-highlight, .demo-flag-animation, .demo-number-highlight, .demo-flag-highlight').forEach(el => {
            el.classList.remove('demo-highlight', 'demo-flag-animation', 'demo-number-highlight', 'demo-flag-highlight');
        });

        // Clear added elements (circles, emphasis marks)
        document.querySelectorAll('.demo-number-circle, .demo-flag-emphasis').forEach(el => {
            el.remove();
        });

        // Hide text and position cursor off-screen
        this.hideText();
        this.positionCursor(-100, -100);

        // IMPORTANT: Re-enable board interaction
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.style.pointerEvents = '';
        }

        // Hide the overlay
        const overlay = document.getElementById('guided-play-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }

        // Return to main menu
        if (document.getElementById('game-screen').classList.contains('active')) {
            Game.stopTimer();
            UI.showScreen('main-menu');
        }
    },

    /**
     * Clean up demo elements only (don't return to menu)
     * Used when demo finishes but user stays on game over screen
     */
    cleanupDemoOnly() {
        if (!this.isActive) return;

        this.isActive = false;
        this.isPaused = false;

        // Clear all pending timeouts
        this.timeoutIds.forEach(id => clearTimeout(id));
        this.timeoutIds = [];

        // Clear any demo highlights
        document.querySelectorAll('.demo-highlight, .demo-flag-animation, .demo-number-highlight, .demo-flag-highlight').forEach(el => {
            el.classList.remove('demo-highlight', 'demo-flag-animation', 'demo-number-highlight', 'demo-flag-highlight');
        });

        // Clear added elements (circles, emphasis marks)
        document.querySelectorAll('.demo-number-circle, .demo-flag-emphasis').forEach(el => {
            el.remove();
        });

        // Hide text and position cursor off-screen
        this.hideText();
        this.positionCursor(-100, -100);

        // IMPORTANT: Re-enable board interaction
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.style.pointerEvents = '';
        }

        // Hide the overlay
        const overlay = document.getElementById('guided-play-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }

        // Don't return to main menu - stay on game over screen
        // User can click "Watch Again" or "Main Menu"
    }
};

// Expose globally for easy access
window.GuidedPlay = GuidedPlay;
