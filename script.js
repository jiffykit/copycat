// Memory Rhythm Game - Main JavaScript File

class MemoryRhythmGame {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.metronomeGain = null;
        this.gameSequence = [];
        this.playerSequence = [];
        this.currentRound = 1;
        this.gameState = 'stopped'; // 'stopped', 'playing', 'listening', 'waiting'
        this.bpm = 60;
        this.beatInterval = null;
        this.sequenceTimeout = null;
        this.playerTimeout = null;
        this.currentBeat = 0;
        this.isPlayerTurn = false;
        this.currentSequenceIndex = 0; // Track which item in sequence player is on
        this.currentTapCount = 0; // Track taps for current item
        this.tapStartTime = 0; // Track when player started tapping current item

        // Rhythm definitions (in beats)
        this.rhythms = {
            whole: { beats: 4, symbol: '♩', name: 'Whole', taps: 1 },
            half: { beats: 2, symbol: '♪', name: 'Half', taps: 1 },
            quarter: { beats: 1, symbol: '♫', name: 'Quarter', taps: 1 },
            eighth: { beats: 0.5, symbol: '♬', name: 'Eighth', taps: 1 },
            sixteenth: { beats: 0.25, symbol: '♭', name: 'Sixteenth', taps: 1 },
            triplet: { beats: 1, symbol: '♮', name: 'Triplet', taps: 3 } // 3 taps in 1 beat
        };

        // Shepard tone frequencies for one octave
        this.notes = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };

        // Color cycling system - Mega Man 5 inspired energy weapon colors
        this.baseColors = [
            ['#ff1744', '#ff5722'], // Energy Red
            ['#ff9800', '#ff6f00'], // Power Orange  
            ['#ffea00', '#ffc107'], // Electric Yellow
            ['#76ff03', '#64dd17'], // Plasma Green
            ['#00e676', '#00c853'], // Neo Green
            ['#00e5ff', '#00bcd4'], // Cyber Cyan
            ['#40c4ff', '#0091ea'], // Mega Blue
            ['#2196f3', '#1976d2'], // Proto Blue
            ['#651fff', '#3f51b5'], // Bass Purple
            ['#e91e63', '#c2185b'], // X Pink
            ['#ff4081', '#ad1457'], // Zero Magenta
            ['#ff6ec7', '#e91e63']  // Sigma Pink
        ];

        // Background theme cycling system
        this.backgroundThemes = [
            {
                name: 'Mega Blue',
                gradient: 'linear-gradient(135deg, #1a237e, #283593, #0d47a1)',
                accent: '#00e5ff',
                secondary: '#0277bd',
                tertiary: '#1565c0'
            },
            {
                name: 'Neo Green',
                gradient: 'linear-gradient(135deg, #1b5e20, #2e7d32, #388e3c)',
                accent: '#00ff88',
                secondary: '#00c853',
                tertiary: '#4caf50'
            },
            {
                name: 'Energy Red',
                gradient: 'linear-gradient(135deg, #b71c1c, #c62828, #d32f2f)',
                accent: '#ff4444',
                secondary: '#f44336',
                tertiary: '#e57373'
            },
            {
                name: 'Solar Orange',
                gradient: 'linear-gradient(135deg, #e65100, #f57c00, #ff9800)',
                accent: '#ffab40',
                secondary: '#ff9800',
                tertiary: '#ffb74d'
            },
            {
                name: 'Cyber Purple',
                gradient: 'linear-gradient(135deg, #4a148c, #6a1b9a, #7b1fa2)',
                accent: '#e040fb',
                secondary: '#9c27b0',
                tertiary: '#ba68c8'
            },
            {
                name: 'Electric Yellow',
                gradient: 'linear-gradient(135deg, #f57f17, #f9a825, #fbc02d)',
                accent: '#ffeb3b',
                secondary: '#ffc107',
                tertiary: '#fff176'
            }
        ];

        this.colorOffset = 0; // Track the color cycling offset
        this.currentThemeIndex = 0; // Track background theme

        this.initializeAudio();
        this.initializeEventListeners();
        this.updateLightColors(); // Initialize light colors
        this.updateBackgroundTheme(); // Initialize background theme
        this.updateDisplay();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);

            this.metronomeGain = this.audioContext.createGain();
            this.metronomeGain.connect(this.masterGain);
            this.metronomeGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        } catch (error) {
            console.error('Error initializing audio:', error);
            alert('Audio initialization failed. Please try refreshing the page.');
        }
    }

    initializeEventListeners() {
        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());

        // Light click events
        document.querySelectorAll('.light').forEach((light, index) => {
            light.addEventListener('mousedown', (e) => this.onLightPress(index, e));
            light.addEventListener('mouseup', (e) => this.onLightRelease(index, e));
            light.addEventListener('mouseleave', (e) => this.onLightRelease(index, e));

            // Touch events for mobile
            light.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onLightPress(index, e);
            });
            light.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.onLightRelease(index, e);
            });
        });
    }

    // Shepard Tone Generator - Enhanced for better audibility
    createShepardTone(frequency, duration, startTime = 0) {
        const oscillators = [];
        const gains = [];
        const octaves = 4; // Reduced octaves for clearer sound

        for (let i = 0; i < octaves; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            // Create frequency for this octave
            const octaveFreq = frequency * Math.pow(2, i - 2); // Center around the base frequency

            // Create Shepard envelope - bell curve across octaves
            const octavePosition = i / (octaves - 1); // 0 to 1
            const bellCurve = Math.exp(-Math.pow((octavePosition - 0.5) * 3, 2));

            osc.frequency.setValueAtTime(octaveFreq, this.audioContext.currentTime + startTime);
            osc.type = 'sine';

            gain.gain.setValueAtTime(0, this.audioContext.currentTime + startTime);
            gain.gain.linearRampToValueAtTime(bellCurve * 0.2, this.audioContext.currentTime + startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + startTime + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(this.audioContext.currentTime + startTime);
            osc.stop(this.audioContext.currentTime + startTime + duration);

            oscillators.push(osc);
            gains.push(gain);
        }

        return { oscillators, gains };
    }

    // Metronome click sound - More audible
    playMetronomeClick() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.type = 'square';

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.metronomeGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);

        // Visual metronome indicator
        const indicator = document.getElementById('metronomeIndicator');
        indicator.classList.add('beat');
        setTimeout(() => indicator.classList.remove('beat'), 150);
    }

    // Start metronome
    startMetronome() {
        if (this.beatInterval) {
            clearInterval(this.beatInterval);
        }

        const beatDuration = (60 / this.bpm) * 1000; // milliseconds per beat
        this.currentBeat = 0;

        this.beatInterval = setInterval(() => {
            this.playMetronomeClick();
            this.currentBeat++;
        }, beatDuration);

        // Play first beat immediately
        this.playMetronomeClick();
    }

    // Stop metronome
    stopMetronome() {
        if (this.beatInterval) {
            clearInterval(this.beatInterval);
            this.beatInterval = null;
        }
    }

    // Generate random sequence item
    generateSequenceItem() {
        const lightIndex = Math.floor(Math.random() * 12);
        const rhythmKeys = Object.keys(this.rhythms);
        const rhythmKey = rhythmKeys[Math.floor(Math.random() * rhythmKeys.length)];
        const light = document.getElementById(`light-${lightIndex}`);
        const note = light.dataset.note;

        return {
            lightIndex,
            note,
            rhythm: rhythmKey,
            rhythmData: this.rhythms[rhythmKey]
        };
    }

    // Start new game
    async startGame() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.gameState = 'playing';
        this.playerSequence = [];
        this.currentRound = 1;
        this.colorOffset = 0; // Reset color cycling for new game
        this.currentThemeIndex = 0; // Reset background theme for new game
        this.updateLightColors(); // Initialize colors for new game
        this.updateBackgroundTheme(); // Initialize background theme for new game

        // Generate first sequence item
        this.gameSequence = [this.generateSequenceItem()];

        this.updateDisplay();
        this.updateSequenceDisplay(); // Add this to show initial sequence
        this.updateControls();
        this.startMetronome();

        setTimeout(() => {
            this.playSequence();
        }, 1000); // Give player time to prepare
    }

    // Stop game
    stopGame() {
        this.gameState = 'stopped';
        this.stopMetronome();
        this.clearAllTimeouts();
        this.clearAllLights();
        this.updateDisplay();
        this.updateControls();
    }

    // Reset game
    resetGame() {
        this.stopGame();
        this.gameSequence = [];
        this.playerSequence = [];
        this.currentRound = 1;
        this.currentSequenceIndex = 0;
        this.currentTapCount = 0;
        this.colorOffset = 0; // Reset color cycling
        this.currentThemeIndex = 0; // Reset background theme
        this.updateLightColors(); // Reset to initial colors
        this.updateBackgroundTheme(); // Reset to initial background theme
        this.updateDisplay();
        this.updateSequenceDisplay();
    }

    // Play the current sequence
    playSequence() {
        this.gameState = 'playing';
        this.updateDisplay();

        let currentTime = 0;
        const beatDuration = 60 / this.bpm; // seconds per beat

        this.gameSequence.forEach((item, index) => {
            setTimeout(() => {
                this.playSequenceItem(item, currentTime);
            }, currentTime * 1000);

            currentTime += item.rhythmData.beats;
        });

        // Switch to listening mode after sequence finishes
        setTimeout(() => {
            this.gameState = 'listening';
            this.isPlayerTurn = true;
            this.playerSequence = [];
            this.currentSequenceIndex = 0;
            this.currentTapCount = 0;
            this.updateDisplay();
        }, (currentTime + 1) * 1000);
    }

    // Play individual sequence item
    playSequenceItem(item, startTime = 0) {
        const light = document.getElementById(`light-${item.lightIndex}`);
        const frequency = this.notes[item.note];
        const beatDuration = 60 / this.bpm; // seconds per beat

        if (item.rhythm === 'triplet') {
            // Play 3 quick beeps within 1 beat
            const tripletDuration = beatDuration / 3; // Each triplet note is 1/3 of a beat

            for (let i = 0; i < 3; i++) {
                const tripletStartTime = startTime + (i * tripletDuration);

                // Visual feedback for each triplet
                setTimeout(() => {
                    light.classList.add('active', 'playing');
                    setTimeout(() => {
                        light.classList.remove('active', 'playing');
                    }, (tripletDuration * 1000) * 0.8); // Slightly shorter than full duration
                }, tripletStartTime * 1000);

                // Audio feedback for each triplet
                this.createShepardTone(frequency, tripletDuration * 0.8, tripletStartTime);
            }
        } else {
            // Regular single note
            const duration = item.rhythmData.beats * beatDuration;

            // Visual feedback
            light.classList.add('active', 'playing');

            // Audio feedback
            this.createShepardTone(frequency, duration, startTime);

            // Remove visual feedback after duration
            setTimeout(() => {
                light.classList.remove('active', 'playing');
            }, duration * 1000);
        }
    }

    // Handle light press
    onLightPress(lightIndex, event) {
        if (!this.isPlayerTurn) return;

        const expectedItem = this.gameSequence[this.currentSequenceIndex];
        if (!expectedItem) return;

        // Check if this is the correct light
        if (lightIndex !== expectedItem.lightIndex) {
            this.gameOver();
            return;
        }

        const light = document.getElementById(`light-${lightIndex}`);
        const note = light.dataset.note;
        const frequency = this.notes[note];

        // Start playing the note
        light.classList.add('active');
        this.currentPlayerNote = this.createShepardTone(frequency, 0.5); // Short beep for each tap

        // If this is the first tap for this sequence item, record start time
        if (this.currentTapCount === 0) {
            this.tapStartTime = Date.now();
        }

        this.currentTapCount++;

        // Check if we've completed the required taps for this item
        const requiredTaps = expectedItem.rhythmData.taps;
        if (this.currentTapCount >= requiredTaps) {
            // Calculate timing for rhythm validation
            const totalTime = (Date.now() - this.tapStartTime) / 1000; // seconds
            const beatDuration = 60 / this.bpm; // seconds per beat
            const expectedDuration = expectedItem.rhythmData.beats;

            // For triplets, check if all 3 taps happened within 1 beat
            let timingCorrect = true;
            if (expectedItem.rhythm === 'triplet') {
                timingCorrect = totalTime <= beatDuration * 1.2; // Allow 20% tolerance
            } else {
                // For other rhythms, use the existing rhythm detection
                const rhythmBeats = totalTime / beatDuration;
                const detectedRhythm = this.detectRhythm(rhythmBeats);
                timingCorrect = detectedRhythm === expectedItem.rhythm;
            }

            if (timingCorrect) {
                // Add to player sequence
                this.playerSequence.push({
                    lightIndex,
                    note,
                    rhythm: expectedItem.rhythm,
                    rhythmData: expectedItem.rhythmData,
                    tapCount: this.currentTapCount
                });

                // Move to next sequence item
                this.currentSequenceIndex++;
                this.currentTapCount = 0;

                // Check if player has completed the entire sequence
                if (this.currentSequenceIndex >= this.gameSequence.length) {
                    this.nextRound();
                }
            } else {
                this.gameOver();
            }
        }

        // Record press time for rhythm detection
        this.playerPressTime = Date.now();
        this.playerPressedLight = lightIndex;
    }

    // Handle light release
    onLightRelease(lightIndex, event) {
        if (!this.isPlayerTurn || this.playerPressedLight !== lightIndex) return;

        const light = document.getElementById(`light-${lightIndex}`);
        light.classList.remove('active');

        // Stop the current note
        if (this.currentPlayerNote) {
            this.currentPlayerNote.oscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // Oscillator might already be stopped
                }
            });
        }

        this.playerPressedLight = null;
    }

    // Detect rhythm based on duration
    detectRhythm(beats) {
        const rhythmEntries = Object.entries(this.rhythms);
        let closestRhythm = 'quarter';
        let smallestDiff = Infinity;

        // Don't auto-detect triplets, they're handled separately
        rhythmEntries.forEach(([key, data]) => {
            if (key === 'triplet') return;
            const diff = Math.abs(beats - data.beats);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestRhythm = key;
            }
        });

        return closestRhythm;
    }

    // Advance to next round - Simon Says style
    nextRound() {
        this.currentRound++;

        // Advance background theme every round
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.backgroundThemes.length;

        // Advance color cycle - use a more interesting pattern
        // Every 3 rounds, shift by 3, otherwise shift by 1
        // This creates a nice varied pattern: 1, 2, 5, 6, 9, 10, 1, 2, 5...
        const cycleIncrement = (this.currentRound % 3 === 0) ? 3 : 1;
        this.colorOffset = (this.colorOffset + cycleIncrement) % this.baseColors.length;

        // Add a brief flash effect to highlight the color change
        const lights = document.querySelectorAll('.light');
        lights.forEach(light => {
            light.style.filter = 'brightness(1.5) saturate(1.5)';
        });

        setTimeout(() => {
            this.updateLightColors();
            this.updateBackgroundTheme(); // Update background theme
            // Reset filter after color update
            setTimeout(() => {
                lights.forEach(light => {
                    light.style.filter = '';
                });
            }, 100);
        }, 200);

        // Add ONE new item to the existing sequence (Simon Says behavior)
        this.gameSequence.push(this.generateSequenceItem());

        // Reset player sequence for the new round
        this.playerSequence = [];
        this.currentSequenceIndex = 0;
        this.currentTapCount = 0;
        this.isPlayerTurn = false;

        this.updateDisplay();

        // Update sequence display after a brief delay to show new colors
        setTimeout(() => {
            this.updateSequenceDisplay(); // This will now show updated colors in sequence
        }, 300);

        // Brief pause before playing the ENTIRE sequence again
        setTimeout(() => {
            this.playSequence();
        }, 1500);
    }

    // Game over
    gameOver() {
        this.gameState = 'stopped';
        this.isPlayerTurn = false;
        this.stopMetronome();
        this.updateDisplay();
        this.updateControls();

        alert(`Game Over! You reached round ${this.currentRound}`);
    }

    // Update display elements
    updateDisplay() {
        document.getElementById('round').textContent = this.currentRound;

        const colorCycleElement = document.getElementById('colorCycle');
        const currentTheme = this.backgroundThemes[this.currentThemeIndex];
        const newColorText = `� ${currentTheme.name}`;

        // Add pulse effect when color cycle changes
        if (colorCycleElement.textContent !== newColorText) {
            colorCycleElement.style.transform = 'scale(1.3)';
            colorCycleElement.style.textShadow = `0 0 10px ${currentTheme.accent}`;
            setTimeout(() => {
                colorCycleElement.style.transform = '';
                colorCycleElement.style.textShadow = '';
            }, 400);
        }
        colorCycleElement.textContent = newColorText;

        document.getElementById('bpm').textContent = this.bpm;

        let status = 'Ready';
        if (this.gameState === 'playing') status = 'Playing Sequence';
        else if (this.gameState === 'listening') status = 'Your Turn';
        else if (this.gameState === 'stopped') status = 'Stopped';

        document.getElementById('status').textContent = status;
    }

    // Update control buttons
    updateControls() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (this.gameState === 'stopped') {
            startBtn.disabled = false;
            stopBtn.disabled = true;
        } else {
            startBtn.disabled = true;
            stopBtn.disabled = false;
        }
    }

    // Update sequence display
    updateSequenceDisplay() {
        const container = document.getElementById('sequenceItems');
        container.innerHTML = '';

        this.gameSequence.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'sequence-item';
            div.style.borderLeftColor = this.getLightColor(item.lightIndex);

            div.innerHTML = `
                <div class="light-indicator" style="background: ${this.getLightColor(item.lightIndex)}"></div>
                <span>Light ${item.lightIndex + 1} - ${item.note}</span>
                <span>${item.rhythmData.symbol} ${item.rhythmData.name} (${item.rhythmData.beats} beats)</span>
            `;

            container.appendChild(div);
        });
    }

    // Get light color for display
    getLightColor(index) {
        const cycledIndex = (index + this.colorOffset) % this.baseColors.length;
        const [color1, color2] = this.baseColors[cycledIndex];
        return color1; // Return primary color for simple displays
    }

    // Update light colors based on current color offset
    updateLightColors() {
        const lights = document.querySelectorAll('.light');
        lights.forEach((light, index) => {
            const cycledIndex = (index + this.colorOffset) % this.baseColors.length;
            const [color1, color2] = this.baseColors[cycledIndex];
            light.style.background = `linear-gradient(45deg, ${color1}, ${color2})`;
        });
    }

    // Update background theme based on current theme index
    updateBackgroundTheme() {
        const theme = this.backgroundThemes[this.currentThemeIndex];
        const body = document.body;

        // Update main background
        body.style.background = theme.gradient;

        // Update UI elements with theme colors
        const gameInfoDivs = document.querySelectorAll('.game-info > div');
        gameInfoDivs.forEach(div => {
            div.style.background = `linear-gradient(45deg, ${theme.secondary}, ${theme.tertiary})`;
            div.style.borderColor = theme.accent;
        });

        // Update control panels
        const controlPanels = document.querySelectorAll('.rhythm-controls, .scale-controls');
        controlPanels.forEach(panel => {
            panel.style.background = `linear-gradient(135deg, ${theme.secondary}, ${theme.tertiary})`;
            panel.style.borderColor = theme.accent;
        });

        // Update buttons
        const primaryBtns = document.querySelectorAll('.btn.primary');
        primaryBtns.forEach(btn => {
            btn.style.background = `linear-gradient(45deg, ${theme.secondary}, ${theme.tertiary})`;
        });

        // Update footer
        const footer = document.querySelector('.game-footer');
        if (footer) {
            footer.style.background = `linear-gradient(135deg, ${theme.secondary}, ${theme.tertiary})`;
            footer.style.borderColor = theme.accent;
        }

        // Add theme transition effect
        body.style.transition = 'background 1.2s ease-in-out';
        setTimeout(() => {
            body.style.transition = '';
        }, 1200);
    }

    // Clear all timeouts
    clearAllTimeouts() {
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
            this.sequenceTimeout = null;
        }
        if (this.playerTimeout) {
            clearTimeout(this.playerTimeout);
            this.playerTimeout = null;
        }
    }

    // Clear all light effects
    clearAllLights() {
        document.querySelectorAll('.light').forEach(light => {
            light.classList.remove('active', 'playing');
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryRhythmGame();
});
