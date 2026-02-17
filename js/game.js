/**
 * Game Module - Core game logic for Minesweeper
 */

const Game = {
    // Game configuration
    DIFFICULTY_CONFIG: {
        easy: { rows: 9, cols: 9, mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard: { rows: 16, cols: 30, mines: 99 }
    },

    // Game state
    state: {
        board: [],           // 2D array of cell objects
        rows: 0,            // Grid dimensions
        cols: 0,
        totalMines: 0,
        flagsPlaced: 0,
        revealedCount: 0,
        isGameOver: false,
        isPaused: false,
        isFirstClick: true,
        timer: 0,
        timerInterval: null,
        difficulty: 'easy',
        theme: 'classic'
    },

    /**
     * Initialize the game with specified difficulty
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     */
    initialize(difficulty) {
        const config = this.DIFFICULTY_CONFIG[difficulty];

        // Reset state
        this.state = {
            board: [],
            rows: config.rows,
            cols: config.cols,
            totalMines: config.mines,
            flagsPlaced: 0,
            revealedCount: 0,
            isGameOver: false,
            isPaused: false,
            isFirstClick: true,
            timer: 0,
            timerInterval: null,
            difficulty: difficulty,
            theme: this.state.theme
        };

        // Create empty board
        this.createBoard();

        // Update UI
        UI.renderBoard();
        UI.updateMineCounter();
        UI.updateTimer();
        UI.hidePauseOverlay();
    },

    /**
     * Create empty board with cells
     */
    createBoard() {
        this.state.board = [];
        for (let row = 0; row < this.state.rows; row++) {
            const rowArray = [];
            for (let col = 0; col < this.state.cols; col++) {
                rowArray.push({
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    element: null
                });
            }
            this.state.board.push(rowArray);
        }
    },

    /**
     * Place mines after first click (ensures first click is safe)
     * @param {number} excludeRow - Row to avoid (first click)
     * @param {number} excludeCol - Column to avoid (first click)
     */
    placeMines(excludeRow, excludeCol) {
        const totalCells = this.state.rows * this.state.cols;
        const safeZone = []; // Cells around first click that should be safe

        // Add first click and its neighbors to safe zone
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = excludeRow + dr;
                const newCol = excludeCol + dc;
                if (this.isValidCell(newRow, newCol)) {
                    safeZone.push(`${newRow},${newCol}`);
                }
            }
        }

        // Create array of all valid positions
        const positions = [];
        for (let row = 0; row < this.state.rows; row++) {
            for (let col = 0; col < this.state.cols; col++) {
                const key = `${row},${col}`;
                if (!safeZone.includes(key)) {
                    positions.push({ row, col });
                }
            }
        }

        // Fisher-Yates shuffle
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Place mines
        const minePositions = positions.slice(0, this.state.totalMines);
        minePositions.forEach(pos => {
            this.state.board[pos.row][pos.col].isMine = true;
        });

        // Calculate neighbor mine counts
        this.calculateNeighborMines();

        // Start timer on first click
        this.startTimer();
    },

    /**
     * Calculate number of adjacent mines for each cell
     */
    calculateNeighborMines() {
        for (let row = 0; row < this.state.rows; row++) {
            for (let col = 0; col < this.state.cols; col++) {
                if (!this.state.board[row][col].isMine) {
                    this.state.board[row][col].neighborMines = this.countAdjacentMines(row, col);
                }
            }
        }
    },

    /**
     * Count mines adjacent to a cell
     * @param {number} row - Cell row
     * @param {number} col - Cell column
     * @returns {number} Number of adjacent mines
     */
    countAdjacentMines(row, col) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidCell(newRow, newCol) && this.state.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    },

    /**
     * Check if cell coordinates are valid
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} True if valid
     */
    isValidCell(row, col) {
        return row >= 0 && row < this.state.rows && col >= 0 && col < this.state.cols;
    },

    /**
     * Reveal a cell
     * @param {number} row - Cell row
     * @param {number} col - Cell column
     */
    revealCell(row, col) {
        // Don't reveal if game over, paused, already revealed, or flagged
        if (this.state.isGameOver || this.state.isPaused) return;
        if (!this.isValidCell(row, col)) return;

        const cell = this.state.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;

        // Handle first click - place mines
        if (this.state.isFirstClick) {
            this.state.isFirstClick = false;
            this.placeMines(row, col);
            UI.switchToRestartButton();
        }

        // Reveal the cell
        cell.isRevealed = true;
        this.state.revealedCount++;

        // Update UI
        UI.updateCell(row, col);

        // Check if it's a mine
        if (cell.isMine) {
            UI.triggerShakeEffect();
            UI.triggerMineFlash(row, col);
            // Vibrate on mobile if supported
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            this.gameOver(false);
            return;
        }

        // Play reveal sound
        SoundManager.playSound('reveal');

        // If no adjacent mines, reveal neighbors (flood fill)
        if (cell.neighborMines === 0) {
            this.floodFillReveal(row, col);
        }

        // Check for win
        this.checkWin();
    },

    /**
     * Flood fill reveal for cells with no adjacent mines
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     */
    floodFillReveal(row, col) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (this.isValidCell(newRow, newCol)) {
                    const cell = this.state.board[newRow][newCol];

                    if (!cell.isRevealed && !cell.isFlagged) {
                        cell.isRevealed = true;
                        this.state.revealedCount++;
                        UI.updateCell(newRow, newCol);

                        if (cell.isMine) {
                            // Shouldn't happen with proper mine placement
                            this.gameOver(false);
                            return;
                        }

                        if (cell.neighborMines === 0) {
                            this.floodFillReveal(newRow, newCol);
                        }
                    }
                }
            }
        }
    },

    /**
     * Toggle flag on a cell
     * @param {number} row - Cell row
     * @param {number} col - Cell column
     */
    toggleFlag(row, col) {
        if (this.state.isGameOver || this.state.isPaused) return;
        if (!this.isValidCell(row, col)) return;

        const cell = this.state.board[row][col];

        // Can only flag unrevealed cells
        if (cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        this.state.flagsPlaced += cell.isFlagged ? 1 : -1;

        // Handle first click
        if (this.state.isFirstClick) {
            this.state.isFirstClick = false;
            this.placeMines(row, col);
            UI.switchToRestartButton();
        }

        // Update UI
        UI.updateCell(row, col);
        UI.updateMineCounter();

        // Play flag sound
        SoundManager.playSound('flag');
    },

    /**
     * Check if player has won
     */
    checkWin() {
        const totalCells = this.state.rows * this.state.cols;
        const safeCells = totalCells - this.state.totalMines;

        if (this.state.revealedCount === safeCells) {
            this.gameOver(true);
        }
    },

    /**
     * Handle game over (win or lose)
     * @param {boolean} won - Whether the player won
     */
    gameOver(won) {
        // Set game over flag first to prevent any further actions
        this.state.isGameOver = true;

        // Stop timer immediately
        this.stopTimer();

        // Reveal all mines and check for incorrect flags
        this.revealAllMines();

        // Play appropriate sound
        if (won) {
            SoundManager.playSound('victory');
        } else {
            SoundManager.playSound('gameOver');
        }

        // Show game over modal after delay
        setTimeout(() => {
            // Double-check timer is stopped
            this.stopTimer();

            // Check if it's a new record
            let isNewRecord = false;
            if (won) {
                isNewRecord = Storage.saveBestTime(this.state.difficulty, this.state.timer);
            }

            UI.showGameOverModal(won, this.state.timer, isNewRecord);
        }, 1500); // 1.5 second delay to see the board
    },

    /**
     * Reveal all mines and mark incorrect flags
     */
    revealAllMines() {
        for (let row = 0; row < this.state.rows; row++) {
            for (let col = 0; col < this.state.cols; col++) {
                const cell = this.state.board[row][col];

                if (cell.isMine && !cell.isRevealed && !cell.isFlagged) {
                    // Reveal unflagged mines
                    cell.isRevealed = true;
                    UI.updateCell(row, col);
                } else if (!cell.isMine && cell.isFlagged) {
                    // Mark incorrect flags
                    UI.markIncorrectFlag(row, col);
                }
                // Mines that were correctly flagged remain flagged
            }
        }
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        this.state.timerInterval = setInterval(() => {
            this.state.timer++;
            UI.updateTimer();
        }, 1000);
    },

    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.state.isGameOver) return;

        this.state.isPaused = !this.state.isPaused;

        if (this.state.isPaused) {
            this.stopTimer();
            UI.showPauseOverlay();
        } else {
            if (!this.state.isGameOver && !this.state.isFirstClick) {
                this.startTimer();
            }
            UI.hidePauseOverlay();
        }
    },

    /**
     * Set the theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        this.state.theme = theme;
        UI.applyTheme(theme);
    }
};
