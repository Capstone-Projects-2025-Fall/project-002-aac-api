# Connect 4 - Voice Controlled Game

A standalone Connect 4 game that uses voice input to play. Players say numbers 1-7 to choose which column to drop their chip.

## Features

- 🎤 Voice-controlled gameplay using `aac-speech-recognition` npm package
- 🎨 Beautiful, modern UI with animations
- 🔴 Red vs 🟡 Yellow player turns
- ✅ Win detection (horizontal, vertical, diagonal)
- 📊 Confidence score display
- 🎯 Click-to-play fallback option

## How to Run

### Prerequisites

1. **Start the Speech Recognition API Server:**
   ```bash
   cd Initial_API
   npm start
   ```
   The server should be running on `http://localhost:8080`

2. **Open the Game:**
   - Simply open `connect4-game.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python3 -m http.server 3000
     # Then open http://localhost:3000/connect4-game.html
     
     # Or using Node.js http-server
     npx http-server -p 3000
     ```

## How to Play

1. **Click "🎤 Start Listening"** button
2. **Say a number from 1 to 7** (representing the column)
3. The chip will drop in that column
4. Players alternate: Red goes first, then Yellow
5. **First to get 4 in a row wins!** (horizontal, vertical, or diagonal)

## Voice Input

The game recognizes:
- **Numbers**: "1", "2", "3", "4", "5", "6", "7"
- **Words**: "one", "two", "three", "four", "five", "six", "seven"

The game will:
- Show confidence score from the speech recognition API
- Display which API was used (Whisper, Google, or Sphinx)
- Show the last recognized input

## Manual Play

You can also click directly on a column to drop a chip manually.

## Game Rules

- Red player always goes first
- Chips drop to the lowest available position in the column
- Win by getting 4 chips in a row (any direction)
- Game ends when someone wins or the board is full (draw)

## Troubleshooting

**"Error connecting to speech recognition server"**
- Make sure the API server is running: `cd Initial_API && npm start`
- Check that it's running on `http://localhost:8080`

**Microphone not working**
- Allow microphone access in your browser
- Check browser permissions for the page

**Not recognizing numbers**
- Speak clearly: "one", "two", "three", etc.
- Or say the digit: "1", "2", "3", etc.
- Check the confidence score - if it's low, try speaking again

## Technical Details

- Uses `aac-speech-recognition` npm package (v1.1.0)
- Connects to API at `http://localhost:8080/upload`
- Records 3 seconds of audio for transcription
- Displays confidence scores and selected API

