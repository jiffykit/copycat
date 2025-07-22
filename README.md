# Memory Rhythm Game

A browser-based memory rhythm game inspired by Simon Says, featuring Shepard tones, precise rhythm mechanics, and a beautiful clock-circle interface.

## Features

### Interface
- 12 colored lights arranged in a clock-circle layout
- Each light represents a different note and color
- Responsive design that works on desktop and mobile
- Visual metronome indicator in the center
- Real-time sequence display and rhythm guide

### Gameplay Mechanics
- Progressive difficulty - sequence grows by one item each round
- Players must replicate the exact sequence of lights AND rhythms
- Precise timing required following the 120 BPM metronome
- Hold lights for longer notes, tap quickly for shorter ones

### Supported Rhythms
- **Whole Note** (♩) - 4 beats
- **Half Note** (♪) - 2 beats  
- **Quarter Note** (♫) - 1 beat
- **Eighth Note** (♬) - 0.5 beats
- **Sixteenth Note** (♭) - 0.25 beats
- **Triplet** (♮) - 1/3 beats

### Audio System
- **Shepard Tones**: Creates pitch ambiguity illusions using Web Audio API
- **One-Octave Scale**: 12 distinct notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- **Metronome**: Constant 120 BPM background beat
- **Layered Audio**: Multiple octaves create the characteristic Shepard tone effect

## How to Play

1. **Start the Game**: Click "Start Game" to begin
2. **Watch & Listen**: The game will play a sequence of lights with specific rhythms
3. **Follow the Metronome**: The center indicator shows the beat
4. **Replicate**: Tap the lights in the exact same sequence and rhythm
5. **Hold for Duration**: Hold down lights for longer notes (whole, half notes)
6. **Quick Taps**: Tap quickly for shorter notes (eighth, sixteenth notes)
7. **Progress**: Successfully complete each round to add one more item to the sequence

## Technical Implementation

### Architecture
- **Pure JavaScript**: No external frameworks required
- **Web Audio API**: Advanced Shepard tone synthesis
- **CSS Grid**: Responsive clock layout
- **Event System**: Mouse and touch support

### Audio Engine
```javascript
// Shepard Tone Generation
createShepardTone(frequency, duration) {
    // Layers multiple octaves with bell-curve amplitude
    // Creates pitch ambiguity illusion
}
```

### Rhythm Detection
```javascript
// Precise timing detection
detectRhythm(beats) {
    // Matches player input to closest rhythm pattern
    // Allows for slight timing variations
}
```

### Game State Management
- `stopped`: Game not running
- `playing`: Showing sequence to player  
- `listening`: Waiting for player input
- `waiting`: Processing player input

## File Structure

```
Memory Game/
├── index.html          # Main game interface
├── style.css           # Styling and animations
├── script.js           # Game logic and audio engine
├── README.md           # This file
└── .github/
    └── copilot-instructions.md  # Development guidelines
```

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support with user interaction for audio
- **Mobile**: Touch events supported on all modern browsers

## Future Enhancements

The code is designed for extensibility:

- **Difficulty Levels**: Adjustable BPM, sequence length limits
- **Custom Scales**: Different note sets and Shepard tone configurations  
- **Visual Themes**: Alternative color schemes and layouts
- **Scoring System**: Points based on accuracy and speed
- **Sound Packs**: Different instrument timbres
- **Multiplayer**: Turn-based or competitive modes

## Development

### Running the Game
Simply open `index.html` in any modern web browser. No build process required.

### Customization
Key parameters can be modified in `script.js`:
- `bpm`: Metronome speed (default: 120)
- `rhythms`: Available rhythm patterns
- `notes`: Shepard tone frequencies
- Light colors and positions in `style.css`

### Audio Context
The game automatically handles Web Audio API initialization and browser audio policy restrictions.

## License

This project is open source. Feel free to modify and distribute as needed.

---

**Enjoy the rhythmic memory challenge!** 🎵🎮
