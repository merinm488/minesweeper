/**
 * SoundManager Module - Handles sound effects for Minesweeper
 * Uses Web Audio API to generate sounds programmatically
 */

const SoundManager = {
    audioContext: null,
    soundEnabled: true,

    /**
     * Initialize the AudioContext
     * Must be called after user interaction due to browser autoplay policies
     */
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    /**
     * Enable or disable sounds
     * @param {boolean} enabled - Whether sounds should be enabled
     */
    toggle(enabled) {
        this.soundEnabled = enabled;
        if (enabled) {
            this.init();
        }
    },

    /**
     * Play a sound by name
     * @param {string} soundName - Name of the sound to play
     */
    playSound(soundName) {
        if (!this.soundEnabled) return;

        this.init();

        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        switch (soundName) {
            case 'reveal':
                this.playRevealSound();
                break;
            case 'flag':
                this.playFlagSound();
                break;
            case 'gameOver':
                this.playGameOverSound();
                break;
            case 'victory':
                this.playVictorySound();
                break;
        }
    },

    /**
     * Play cell reveal sound (short click/pop)
     */
    playRevealSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            400,
            this.audioContext.currentTime + 0.05
        );

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.05
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    },

    /**
     * Play flag placement sound (ding)
     */
    playFlagSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + 0.1
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    },

    /**
     * Play game over sound (explosion effect)
     */
    playGameOverSound() {
        // Create powerful explosion sound with layered noise
        const duration = 0.8;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Multi-layered noise with exponential decay
            const decay = Math.pow(1 - t, 3);
            data[i] = (Math.random() * 2 - 1) * decay * 0.8;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // Create multiple layers for fuller sound
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + duration);

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start();

        // Add a deep boom sound
        const oscillator = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.4);

        oscGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);

        oscillator.connect(oscGain);
        oscGain.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    },

    /**
     * Play victory sound (ascending arpeggio)
     */
    playVictorySound() {
        const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.50]; // C5, D5, E5, G5, A5, C6

        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);

            gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + index * 0.1 + 0.3
            );

            oscillator.start(this.audioContext.currentTime + index * 0.1);
            oscillator.stop(this.audioContext.currentTime + index * 0.1 + 0.3);
        });
    }
};
