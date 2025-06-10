// lib/audio/celebration-sounds.ts

/**
 * Plays a celebration sound using Web Audio API
 * Creates a fanfare-style chord progression
 */
export const playCelebrationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.1) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        // Play celebration chord sequence - sounds like a fanfare
        const now = audioContext.currentTime;

        // First chord - C Major
        playNote(523.25, now, 0.4);        // C5
        playNote(659.25, now, 0.4);        // E5
        playNote(783.99, now, 0.4);        // G5

        // Second chord - F Major (higher)
        playNote(698.46, now + 0.3, 0.4);  // F5
        playNote(880.00, now + 0.3, 0.4);  // A5
        playNote(1046.5, now + 0.3, 0.4);  // C6

        // Final triumphant note
        playNote(1318.5, now + 0.6, 0.8, 0.15);  // E6 - louder and longer

        console.log('🎵 Celebration sound played!');
        return true;
    } catch (error) {
        console.log('🔇 Audio not available:', error);
        return false;
    }
};

/**
 * Plays a success pick sound (shorter, more subtle)
 */
export const playPickSuccessSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.05) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = audioContext.currentTime;

        // Simple ascending notes for pick success
        playNote(523.25, now, 0.2);        // C5
        playNote(659.25, now + 0.1, 0.2);  // E5

        return true;
    } catch (error) {
        console.log('🔇 Pick success audio not available:', error);
        return false;
    }
};

/**
 * Plays an error sound (descending notes)
 */
export const playErrorSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.08) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sawtooth'; // More harsh sound for errors

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = audioContext.currentTime;

        // Descending notes for error
        playNote(523.25, now, 0.3);        // C5
        playNote(415.30, now + 0.15, 0.3); // G#4

        return true;
    } catch (error) {
        console.log('🔇 Error audio not available:', error);
        return false;
    }
};

/**
 * Plays your turn notification sound
 */
export const playYourTurnSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.06) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'triangle'; // Softer sound for notifications

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = audioContext.currentTime;

        // Two-tone notification
        playNote(659.25, now, 0.2);        // E5
        playNote(783.99, now + 0.2, 0.3);  // G5

        return true;
    } catch (error) {
        console.log('🔇 Turn notification audio not available:', error);
        return false;
    }
};
