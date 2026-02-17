/**
 * Storage Module - Handles localStorage operations for Minesweeper
 */

const Storage = {
    // Storage keys
    KEYS: {
        BEST_TIMES: 'minesweeper_best_times',
        SETTINGS: 'minesweeper_settings',
        TUTORIAL_COMPLETED: 'minesweeper_tutorial_completed'
    },

    /**
     * Get best times for all difficulties
     * @returns {Object} Object with easy, medium, hard times in seconds
     */
    getBestTimes() {
        try {
            const data = localStorage.getItem(this.KEYS.BEST_TIMES);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error reading best times:', error);
        }
        return {
            easy: null,
            medium: null,
            hard: null
        };
    },

    /**
     * Save a best time for a specific difficulty
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     * @param {number} time - Time in seconds
     * @returns {boolean} True if this is a new best time
     */
    saveBestTime(difficulty, time) {
        try {
            const bestTimes = this.getBestTimes();
            const currentTime = bestTimes[difficulty];

            // Save if it's the first time or better than existing
            if (currentTime === null || time < currentTime) {
                bestTimes[difficulty] = time;
                localStorage.setItem(this.KEYS.BEST_TIMES, JSON.stringify(bestTimes));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving best time:', error);
            return false;
        }
    },

    /**
     * Format time for display
     * @param {number|null} seconds - Time in seconds or null
     * @returns {string} Formatted time string (mm:ss or --:--)
     */
    formatTime(seconds) {
        if (seconds === null) return '--:--';

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Get saved settings
     * @returns {Object} Settings object with theme, difficulty, soundEnabled
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error reading settings:', error);
        }
        // Default settings
        return {
            theme: 'classic',
            difficulty: 'easy',
            soundEnabled: true
        };
    },

    /**
     * Save settings
     * @param {Object} settings - Settings object to save
     * @returns {boolean} True if save was successful
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    /**
     * Check if tutorial has been completed
     * @returns {boolean} True if tutorial was completed
     */
    hasCompletedTutorial() {
        try {
            return localStorage.getItem(this.KEYS.TUTORIAL_COMPLETED) === 'true';
        } catch (error) {
            console.error('Error reading tutorial status:', error);
            return false;
        }
    },

    /**
     * Mark tutorial as completed
     */
    markTutorialCompleted() {
        try {
            localStorage.setItem(this.KEYS.TUTORIAL_COMPLETED, 'true');
        } catch (error) {
            console.error('Error saving tutorial status:', error);
        }
    }
};
