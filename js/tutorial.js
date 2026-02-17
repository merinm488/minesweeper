/**
 * Tutorial Module - Interactive first-time user experience
 */

const Tutorial = {
    // Tutorial state
    currentStep: 0,
    isActive: false,
    targetCell: null,

    // Tutorial steps configuration
    steps: [
        {
            title: "Welcome to Minesweeper! 👋",
            message: "Let's learn how to play! Your goal is to reveal all cells without hitting any mines.",
            handEmoji: "💣",
            position: "bottom",
            action: "start"
        },
        {
            title: "Tap to Reveal 👆",
            message: "Tap any cell to reveal what's underneath. Try tapping the highlighted cell!",
            handEmoji: "👆",
            position: "cell",
            action: "click"
        },
        {
            title: "Great job! 🎉",
            message: "Numbers show how many mines are nearby. Use these clues to figure out where mines are hiding!",
            handEmoji: "🔢",
            position: "bottom",
            action: "next"
        },
        {
            title: "Flag the Mines! 🚩",
            message: "Long press on mobile or right-click on desktop to place a flag where you think a mine is hiding. Try it on this cell!",
            handEmoji: "👆",
            position: "cell",
            action: "flag"
        },
        {
            title: "You're ready! 🎮",
            message: "Use numbers to deduce mine locations. Reveal all safe cells to win! Good luck, and have fun!",
            handEmoji: "🍀",
            position: "bottom",
            action: "play"
        }
    ],

    /**
     * Initialize and start tutorial if it's the user's first time
     * @param {boolean} force - Force show tutorial even if completed
     */
    init(force = false) {
        console.log('Tutorial.init called, force:', force);

        // Check if tutorial has been completed (unless forced)
        if (!force && Storage.hasCompletedTutorial()) {
            console.log('Tutorial already completed, skipping');
            return;
        }

        console.log('Starting tutorial in 500ms...');

        // Start tutorial after a short delay to let the game board render
        setTimeout(() => {
            // Verify we're still on the game screen
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen && gameScreen.classList.contains('active')) {
                console.log('Starting tutorial now');
                this.start();
            } else {
                console.log('Game screen not active, not starting tutorial');
            }
        }, 500);
    },

    /**
     * Start the tutorial
     */
    start() {
        if (this.isActive) return;

        this.isActive = true;
        this.currentStep = 0;

        // Show tutorial overlay
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }

        // Setup close button
        const closeBtn = document.getElementById('tutorial-close-btn');
        closeBtn.onclick = () => {
            this.skip();
        };

        // Show first step
        this.showStep(0);
    },

    /**
     * Show a specific tutorial step
     * @param {number} stepIndex - The step index to show
     */
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];

        // Update tooltip content
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-message').textContent = step.message;
        document.getElementById('tutorial-step-count').textContent =
            `Step ${stepIndex + 1} of ${this.steps.length}`;

        const hand = document.getElementById('tutorial-hand');
        hand.textContent = step.handEmoji;
        hand.className = 'tutorial-hand';

        // Setup buttons
        this.setupButtons(step.action);

        // Position tooltip and setup interaction
        if (step.position === 'bottom') {
            this.positionTooltipBottom();
            if (step.action === 'wait') {
                // Auto-advance after 2.5 seconds
                setTimeout(() => {
                    if (this.isActive && this.currentStep === stepIndex) {
                        this.nextStep();
                    }
                }, 2500);
            } else if (step.action === 'start' || step.action === 'next' || step.action === 'play') {
                // Wait for user to click the button - handled in setupButtons
            }
        } else if (step.position === 'cell') {
            if (step.action === 'flag') {
                hand.classList.add('flagging');
            }
            this.setupCellStep(step.action);
        }
    },

    /**
     * Setup buttons for current step
     * @param {string} action - Current step action
     */
    setupButtons(action) {
        const buttonsDiv = document.querySelector('.tutorial-buttons');
        buttonsDiv.innerHTML = ''; // Clear existing buttons

        if (action === 'start') {
            // Add "Let's Play" button
            const playBtn = document.createElement('button');
            playBtn.className = 'btn btn-primary';
            playBtn.textContent = "Let's Play!";
            playBtn.addEventListener('click', () => {
                this.nextStep();
            });
            buttonsDiv.appendChild(playBtn);
        } else if (action === 'next') {
            // Add "Next" button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-primary';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => {
                this.nextStep();
            });
            buttonsDiv.appendChild(nextBtn);
        } else if (action === 'play') {
            // Add "Play!" button to complete tutorial
            const playBtn = document.createElement('button');
            playBtn.className = 'btn btn-primary';
            playBtn.textContent = 'Play!';
            playBtn.addEventListener('click', () => {
                this.complete();
            });
            buttonsDiv.appendChild(playBtn);
        }
        // No skip button at bottom - we have a close button in top right instead
    },

    /**
     * Position tooltip at bottom of screen so board is visible
     */
    positionTooltipBottom() {
        const tooltip = document.querySelector('.tutorial-tooltip');
        const spotlight = document.querySelector('.tutorial-spotlight');

        // Position at bottom center with more margin to avoid top cutoff
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '-10px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.right = 'auto';
        tooltip.style.maxWidth = '';

        // Hide spotlight
        spotlight.style.display = 'none';

        // Clear any target cell highlight
        this.clearTargetHighlight();
    },

    /**
     * Setup a step that highlights a cell (for click or flag actions)
     * @param {string} action - 'click' or 'flag'
     */
    setupCellStep(action) {
        const tooltip = document.querySelector('.tutorial-tooltip');
        const spotlight = document.querySelector('.tutorial-spotlight');

        // Find a suitable cell to highlight
        this.targetCell = this.findTargetCellForAction(action);

        if (!this.targetCell) {
            // If no suitable cell, skip to next step
            this.nextStep();
            return;
        }

        // Get cell position
        const cellRect = this.targetCell.element.getBoundingClientRect();

        // Position spotlight over the cell
        spotlight.style.display = 'block';
        spotlight.style.width = cellRect.width + 'px';
        spotlight.style.height = cellRect.height + 'px';
        spotlight.style.top = cellRect.top + 'px';
        spotlight.style.left = cellRect.left + 'px';

        // Add highlight class to cell
        this.targetCell.element.classList.add('tutorial-target');

        // Position tooltip at bottom to keep board visible
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '-10px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.right = 'auto';
        tooltip.style.maxWidth = '';

        // Wait for the appropriate action
        if (action === 'click') {
            this.waitForClickOnTarget();
        } else if (action === 'flag') {
            this.waitForFlag();
        }
    },

    /**
     * Find a suitable target cell for tutorial based on action
     * @param {string} action - 'click' or 'flag'
     * @returns {Object|null} Cell object or null
     */
    findTargetCellForAction(action) {
        const centerRow = Math.floor(Game.state.rows / 2);
        const centerCol = Math.floor(Game.state.cols / 2);

        if (action === 'click') {
            // For clicking, prefer unrevealed cells in the middle
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const row = centerRow + dr;
                    const col = centerCol + dc;

                    if (Game.isValidCell(row, col)) {
                        const cell = Game.state.board[row][col];
                        if (!cell.isRevealed && !cell.isFlagged) {
                            return cell;
                        }
                    }
                }
            }
        } else if (action === 'flag') {
            // For flagging, find an unrevealed cell that IS a mine
            // Prioritize cells in the TOP portion of the board (away from tooltip at bottom)
            const topSection = Math.floor(Game.state.rows / 2);

            // First, look in top half of board for mines next to revealed cells
            for (let row = 0; row < topSection; row++) {
                for (let col = 0; col < Game.state.cols; col++) {
                    const cell = Game.state.board[row][col];
                    if (cell.isMine && !cell.isRevealed && !cell.isFlagged) {
                        // Check if it's next to a revealed numbered cell
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const nr = row + dr;
                                const nc = col + dc;
                                if (Game.isValidCell(nr, nc)) {
                                    const neighbor = Game.state.board[nr][nc];
                                    if (neighbor.isRevealed && !neighbor.isMine && neighbor.neighborMines > 0) {
                                        return cell;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Fallback: look in top half for any mine
            for (let row = 0; row < topSection; row++) {
                for (let col = 0; col < Game.state.cols; col++) {
                    const cell = Game.state.board[row][col];
                    if (cell.isMine && !cell.isRevealed && !cell.isFlagged) {
                        return cell;
                    }
                }
            }
        }

        // Fallback: any suitable cell
        for (let row = 0; row < Game.state.rows; row++) {
            for (let col = 0; col < Game.state.cols; col++) {
                const cell = Game.state.board[row][col];
                if (action === 'click' && !cell.isRevealed && !cell.isFlagged) {
                    return cell;
                }
                if (action === 'flag' && cell.isMine && !cell.isRevealed && !cell.isFlagged) {
                    return cell;
                }
            }
        }

        return null;
    },

    /**
     * Wait for user to click the specific target cell
     */
    waitForClickOnTarget() {
        const checkInterval = setInterval(() => {
            if (!this.isActive || !this.targetCell) {
                clearInterval(checkInterval);
                return;
            }

            // Check if target cell has been revealed
            if (this.targetCell.isRevealed) {
                clearInterval(checkInterval);

                // Advance to next step after a brief delay
                setTimeout(() => {
                    if (this.isActive) {
                        this.nextStep();
                    }
                }, 1000);
            }
        }, 100);
    },

    /**
     * Wait for user to flag a cell (for flagging step)
     */
    waitForFlag() {
        const checkInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(checkInterval);
                return;
            }

            // Check if target cell has been flagged
            if (this.targetCell && this.targetCell.isFlagged) {
                clearInterval(checkInterval);
                this.targetCell.element.classList.add('tutorial-flag-target');

                // Advance to next step after showing the flag
                setTimeout(() => {
                    if (this.isActive) {
                        this.nextStep();
                    }
                }, 1500);
            }
        }, 100);
    },

    /**
     * Clear target cell highlight
     */
    clearTargetHighlight() {
        if (this.targetCell && this.targetCell.element) {
            this.targetCell.element.classList.remove('tutorial-target');
            this.targetCell.element.classList.remove('tutorial-flag-target');
        }
        this.targetCell = null;
    },

    /**
     * Advance to next step
     */
    nextStep() {
        this.clearTargetHighlight();
        this.showStep(this.currentStep + 1);
    },

    /**
     * Skip the tutorial
     */
    skip() {
        this.cleanup();
        Storage.markTutorialCompleted();
    },

    /**
     * Complete the tutorial successfully
     */
    complete() {
        Storage.markTutorialCompleted();
        this.cleanup();
    },

    /**
     * Clean up tutorial resources
     */
    cleanup() {
        this.isActive = false;
        this.clearTargetHighlight();

        const overlay = document.getElementById('tutorial-overlay');
        overlay.classList.add('hidden');

        const spotlight = document.querySelector('.tutorial-spotlight');
        spotlight.style.display = 'none';
    },

    /**
     * Reset tutorial (for testing purposes)
     */
    reset() {
        localStorage.removeItem(Storage.KEYS.TUTORIAL_COMPLETED);
        console.log('Tutorial has been reset. Refresh the page to see it again.');
    }
};

// Expose reset and force-start functions globally for easy testing
window.resetTutorial = () => Tutorial.reset();
window.startTutorial = () => Tutorial.init(true);
console.log('Tutorial module loaded. Type resetTutorial() to reset, or startTutorial() to force-start the tutorial.');
